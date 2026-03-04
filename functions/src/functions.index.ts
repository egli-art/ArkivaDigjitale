import {setGlobalOptions} from "firebase-functions";
import {onDocumentUpdated, onDocumentCreated} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
setGlobalOptions({maxInstances: 10, region: "europe-west1"});

const db = admin.firestore();
const fireAuth = admin.auth();

// ─── Transporter ────────────────────────────────────────────────
function getTransporter() {
  const user = process.env.GMAIL_USER ?? "";
  const pass = (process.env.GMAIL_PASS ?? "").replace(/\s+/g, "");
  if (!user || !pass) {
    throw new Error("GMAIL_USER ose GMAIL_PASS mungon");
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {user, pass},
  });
}

async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const user = process.env.GMAIL_USER ?? "";
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Arkiva Digjitale" <${user}>`,
    to,
    subject,
    html,
  });
  console.log(`✉ Email dërguar → ${to}`);
}

// ═══════════════════════════════════════════════════════════════
// 1. REGJISTRIM I RI
// ═══════════════════════════════════════════════════════════════
export const onUserRegistered = onDocumentCreated(
  {document: "perdoruesit/{uid}", secrets: ["GMAIL_USER", "GMAIL_PASS"]},
  async (event) => {
    const data = event.data?.data() as any;
    if (!data?.email) return;
    const name = (data.emriPlote ?? "").trim() || data.email;
    try {
      if (data.roli === "artist") {
        await sendMail(
          data.email,
          "⏳ Regjistrimi juaj u pranua — Arkiva Digjitale",
          pendingArtistHtml(name)
        );
      } else {
        await sendMail(
          data.email,
          "🎉 Mirë se vini në Arkiva Digjitale!",
          welcomeShikuesHtml(name)
        );
      }
    } catch (e: any) {
      console.error("onUserRegistered email error:", e.message);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// 2. APROVIM (approved: false → true)
// ═══════════════════════════════════════════════════════════════
export const onUserApproved = onDocumentUpdated(
  {document: "perdoruesit/{uid}", secrets: ["GMAIL_USER", "GMAIL_PASS"]},
  async (event) => {
    const before = event.data?.before.data() as any;
    const after = event.data?.after.data() as any;
    if (!before || !after) return;
    if (!!before.approved === !!after.approved) return;
    if (!after.approved) return;
    if (after.roli !== "artist") return;
    if (!after.email) return;
    try {
      await sendMail(
        after.email,
        "🎨 Llogaria juaj u aprovua — Arkiva Digjitale",
        approvalHtml(after.emriPlote ?? after.email)
      );
    } catch (e: any) {
      console.error("onUserApproved email error:", e.message);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// 3. BLLOKUAR / ZHBLLOKUAR
// ═══════════════════════════════════════════════════════════════
export const onUserBanned = onDocumentUpdated(
  {document: "perdoruesit/{uid}", secrets: ["GMAIL_USER", "GMAIL_PASS"]},
  async (event) => {
    const before = event.data?.before.data() as any;
    const after = event.data?.after.data() as any;
    if (!before || !after) return;
    const uid = event.params.uid;
    const name = (after.emriPlote ?? "").trim() || (after.email ?? "");

    if (!before.banned && after.banned) {
      try {
        await fireAuth.updateUser(uid, {disabled: true});
      } catch (e) {
        console.warn("Could not disable auth user:", e);
      }
      if (after.email) {
        try {
          await sendMail(
            after.email,
            "⛔ Llogaria juaj u bllokua — Arkiva Digjitale",
            bannedHtml(name)
          );
        } catch (e: any) {
          console.error("Ban email error:", e.message);
        }
      }
    }

    if (before.banned && !after.banned) {
      try {
        await fireAuth.updateUser(uid, {disabled: false});
      } catch (e) {
        console.warn("Could not re-enable auth user:", e);
      }
      if (after.email) {
        try {
          await sendMail(
            after.email,
            "✅ Llogaria juaj u zhbllokua — Arkiva Digjitale",
            unbannedHtml(name)
          );
        } catch (e: any) {
          console.error("Unban email error:", e.message);
        }
      }
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// 4. CALLABLE: Ridërgo email aprovimi
// ═══════════════════════════════════════════════════════════════
export const sendApprovalEmail = onCall(
  {region: "europe-west1", secrets: ["GMAIL_USER", "GMAIL_PASS"]},
  async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError("unauthenticated", "Not authenticated");
    }
    const callerSnap = await db
      .collection("perdoruesit")
      .doc(callerUid)
      .get();
    if (callerSnap.data()?.roli !== "admin") {
      throw new HttpsError("permission-denied", "Admins only");
    }
    const {targetUid} = request.data as {targetUid: string};
    if (!targetUid) {
      throw new HttpsError("invalid-argument", "targetUid required");
    }
    const userSnap = await db
      .collection("perdoruesit")
      .doc(targetUid)
      .get();
    const user = userSnap.data() as any;
    if (!user?.email) {
      throw new HttpsError("not-found", "Email not found");
    }
    try {
      await sendMail(
        user.email,
        "🎨 Llogaria juaj u aprovua — Arkiva Digjitale",
        approvalHtml(user.emriPlote ?? user.email)
      );
    } catch (e: any) {
      console.error("sendApprovalEmail error:", e.message);
      throw new HttpsError("internal", e.message ?? "Email dërgimi dështoi");
    }
    return {success: true, sentTo: user.email};
  }
);

// ═══════════════════════════════════════════════════════════════
// 5. CALLABLE: Statusi i përdoruesit
// ═══════════════════════════════════════════════════════════════
export const checkUserStatus = onCall(
  {region: "europe-west1"},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Not authenticated");
    const snap = await db.collection("perdoruesit").doc(uid).get();
    const data = snap.data() as any;
    return {
      banned: data?.banned ?? false,
      approved: data?.approved ?? false,
      roli: data?.roli ?? "shikues",
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════
function wrap(body: string): string {
  const yr = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="sq"><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#07070f;font-family:Georgia,serif}
.w{max-width:600px;margin:0 auto;padding:2rem 1rem}
.c{background:#0e0e1c;border:1px solid rgba(201,168,76,.25);border-radius:20px;overflow:hidden}
.h{padding:1.75rem 2.5rem;text-align:center;background:linear-gradient(160deg,#0e0e1c,#141428);border-bottom:1px solid rgba(201,168,76,.12)}
.logo{font-size:1.1rem;letter-spacing:.12em;color:#e8c97a;font-style:italic}
.b{padding:2.5rem}
h1{font-size:1.5rem;font-weight:400;color:#f0ece2;margin-bottom:.9rem;line-height:1.3}
p{font-size:.9rem;line-height:1.85;color:#9494b0;margin-bottom:.8rem;font-family:sans-serif}
strong{color:#e8c97a;font-weight:600}
a.btn{display:inline-block;margin:1rem 0;padding:.8rem 2rem;border-radius:10px;background:linear-gradient(135deg,#e8c97a,#c9a84c);color:#07070f!important;font-family:sans-serif;font-size:.9rem;font-weight:700;text-decoration:none}
.badge{display:inline-block;padding:.22rem .72rem;border-radius:99px;font-family:sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.ok{color:#6dbf72;background:rgba(109,191,114,.12);border:1px solid rgba(109,191,114,.28)}
.warn{color:#e8c97a;background:rgba(232,201,122,.1);border:1px solid rgba(201,168,76,.28)}
.err{color:#e07070;background:rgba(224,112,112,.1);border:1px solid rgba(224,112,112,.28)}
.hr{height:1px;background:rgba(201,168,76,.08);margin:1.4rem 0}
.step{display:flex;gap:.75rem;margin-bottom:.7rem;align-items:flex-start}
.dot{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:.68rem;font-weight:700;margin-top:.1rem}
.d-ok{background:rgba(109,191,114,.12);border:1px solid rgba(109,191,114,.28);color:#6dbf72}
.d-ac{background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.28);color:#e8c97a}
.d-dm{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#6e6e8a}
.st{font-size:.85rem;color:#b8b4a8;line-height:1.65;font-family:sans-serif}
.ft{padding:1.2rem 2.5rem;text-align:center;border-top:1px solid rgba(201,168,76,.07)}
.ft p{font-size:.7rem;color:#3a3a52;font-family:sans-serif}
</style></head><body><div class="w"><div class="c">
<div class="h"><div class="logo">Arkiva Digjitale</div></div>
<div class="b">${body}</div>
<div class="ft"><p>© ${yr} Arkiva Digjitale · 3VisionStudio<br>Email automatik.</p></div>
</div></div></body></html>`;
}

function welcomeShikuesHtml(name: string): string {
  return wrap(`<span class="badge ok">✓ Llogari e re</span>
<h1 style="margin-top:.85rem">Mirë se vini, ${name}!</h1>
<p>Llogaria juaj si <strong>Shikues</strong> u krijua me sukses.</p>
<br><a href="https://arkiva-digjitale.web.app" class="btn">Hap Arkivën →</a>`);
}

function pendingArtistHtml(name: string): string {
  return wrap(`<span class="badge warn">⏳ Në pritje</span>
<h1 style="margin-top:.85rem">Faleminderit, ${name}!</h1>
<p>Regjistrimi juaj si <strong>Artist / Autor</strong> u pranua.</p>
<p>Do të merrni email konfirmimi brenda <strong>24–48 orëve</strong>.</p>
<div class="hr"></div>
<div class="step"><div class="dot d-ok">✓</div>
<div class="st"><strong style="color:#6dbf72">Regjistrim i kryer</strong></div></div>
<div class="step"><div class="dot d-ac">2</div>
<div class="st"><strong style="color:#e8c97a">Shqyrtim nga administratori</strong></div></div>
<div class="step"><div class="dot d-dm">3</div>
<div class="st">Akses i plotë</div></div>`);
}

function approvalHtml(name: string): string {
  return wrap(`<span class="badge ok">🎨 Aprovuar</span>
<h1 style="margin-top:.85rem">Urime, ${name}!</h1>
<p>Llogaria juaj si <strong>Artist / Autor</strong> u aprovua.</p>
<br><a href="https://arkiva-digjitale.web.app" class="btn">Hyr në Platformë →</a>`);
}

function bannedHtml(name: string): string {
  return wrap(`<span class="badge err">⛔ Bllokuar</span>
<h1 style="margin-top:.85rem">Llogaria juaj u bllokua</h1>
<p>Mirëdita ${name}, llogaria juaj u bllokua nga administratori.</p>`);
}

function unbannedHtml(name: string): string {
  return wrap(`<span class="badge ok">✅ Aktive</span>
<h1 style="margin-top:.85rem">Llogaria u aktivizua, ${name}!</h1>
<p>Bllokimi u hoq. Tani mund të hyni sërish normalisht.</p>
<br><a href="https://arkiva-digjitale.web.app" class="btn">Hyr →</a>`);
}
