import { Injectable, inject } from '@angular/core';
import {
    Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail,
    sendEmailVerification, applyActionCode,
    GoogleAuthProvider, OAuthProvider, signInWithPopup, User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from '@angular/fire/firestore';
import { BehaviorSubject, } from 'rxjs';
import { UserProfile } from '../models/artist.model';
import Unsubscribe = firebase.Unsubscribe;
import firebase from "firebase/compat/app";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private auth      = inject(Auth);
    private firestore = inject(Firestore);

    private _user$      = new BehaviorSubject<User | null>(null);
    private _profile$   = new BehaviorSubject<UserProfile | null>(null);
    private _avatarUrl$ = new BehaviorSubject<string | null>(null);

    /** Emits true when user is actively banned and must be blocked */
    private _banned$    = new BehaviorSubject<boolean>(false);

    readonly user$      = this._user$.asObservable();
    readonly profile$   = this._profile$.asObservable();
    readonly avatarUrl$ = this._avatarUrl$.asObservable();
    readonly banned$    = this._banned$.asObservable();

    /** Unsubscribe function for Firestore real-time listener */
    private _profileUnsub: Unsubscribe | null = null;

    constructor() {
        onAuthStateChanged(this.auth, async (user) => {
            this._user$.next(user);

            // Tear down previous listener
            if (this._profileUnsub) { this._profileUnsub(); this._profileUnsub = null; }

            if (user) {
                // Real-time listener on user profile — detects mid-session bans instantly
                this._profileUnsub = onSnapshot(
                    doc(this.firestore, 'perdoruesit', user.uid),
                    (snap) => {
                        const profile = snap.exists() ? snap.data() as UserProfile : null;
                        this._profile$.next(profile);
                        this._avatarUrl$.next((profile as any)?.avatarUrl ?? null);

                        const banned = !!(profile as any)?.banned;
                        this._banned$.next(banned);

                        // Force sign-out if banned mid-session
                        if (banned) {
                            signOut(this.auth).catch(() => {});
                        }
                    }
                );
            } else {
                this._profile$.next(null);
                this._avatarUrl$.next(null);
                this._banned$.next(false);
            }
        });
    }

    get currentUser():    User | null        { return this._user$.value; }
    get currentProfile(): UserProfile | null { return this._profile$.value; }
    get currentAvatar():  string | null      { return this._avatarUrl$.value; }
    get isArtist():       boolean            { return this._profile$.value?.roli === 'artist'; }
    get isAdmin():        boolean            { return this._profile$.value?.roli === 'admin'; }
    get isBanned():       boolean            { return this._banned$.value; }
    get isAuthenticated(): boolean           { return !!this._user$.value; }

    // ── Reactive update methods ────────────────────────────────────

    updateAvatarUrl(url: string | null) {
        this._avatarUrl$.next(url);
        const curr = this._profile$.value;
        if (curr) this._profile$.next({ ...curr, ...({ avatarUrl: url } as any) });
    }

    async updateDisplayName(emri: string, mbiemri: string, bio: string): Promise<void> {
        const emriPlote = `${emri} ${mbiemri}`.trim();
        if (this._user$.value) {
            try { await updateProfile(this._user$.value, { displayName: emriPlote }); } catch {}
        }
        const curr = this._profile$.value;
        if (curr) this._profile$.next({ ...curr, emri, mbiemri, emriPlote, ...({ bio } as any) });
    }

    // ── Auth methods ───────────────────────────────────────────────

    async register(
        emri: string, mbiemri: string, email: string,
        password: string, roli: 'artist' | 'shikues' | 'admin'
    ) {
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        await updateProfile(cred.user, { displayName: `${emri} ${mbiemri}` });
        const profile: UserProfile = {
            uid: cred.user.uid, emri, mbiemri, email, roli,
            emriPlote: `${emri} ${mbiemri}`,
            krijuarMe: serverTimestamp(),
            approved: roli === 'shikues', // artists wait for admin approval
            banned:   false,
        } as any;
        await setDoc(doc(this.firestore, 'perdoruesit', cred.user.uid), profile);
        this._profile$.next(profile);
        // Dërgo email verifikimi menjëherë pas regjistrimit
        try {
            await sendEmailVerification(cred.user, {
                url: 'https://arkiva-digjitale.web.app/auth?verified=true',
            });
        } catch (e) { console.warn('Verification email failed:', e); }
    }

    async login(email: string, password: string) {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        // Check banned immediately after login
        await this._checkBannedAndThrow(cred.user.uid);
        return cred;
    }

    async loginWithGoogle(): Promise<void> {
        const provider = new GoogleAuthProvider();
        provider.addScope('email'); provider.addScope('profile');
        const result = await signInWithPopup(this.auth, provider);
        await this._checkBannedAndThrow(result.user.uid);
        await this._upsertSocialProfile(result.user);
    }

    async loginWithApple(): Promise<void> {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email'); provider.addScope('name');
        const result = await signInWithPopup(this.auth, provider);
        await this._checkBannedAndThrow(result.user.uid);
        await this._upsertSocialProfile(result.user);
    }

    /** Reads Firestore directly and throws if user is banned */
    private async _checkBannedAndThrow(uid: string): Promise<void> {
        const snap = await getDoc(doc(this.firestore, 'perdoruesit', uid));
        if (snap.exists() && (snap.data() as any)?.banned) {
            await signOut(this.auth);
            throw { code: 'auth/user-banned' };
        }
    }

    private async _upsertSocialProfile(user: User): Promise<void> {
        const ref  = doc(this.firestore, 'perdoruesit', user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            const parts   = (user.displayName ?? '').split(' ');
            const emri    = parts[0] ?? '';
            const mbiemri = parts.slice(1).join(' ') || '';
            const profile: any = {
                uid: user.uid, emri, mbiemri,
                email: user.email ?? '',
                emriPlote: user.displayName ?? '',
                roli: 'shikues',
                krijuarMe: serverTimestamp(),
                approved: true,
                banned:   false,
            };
            await setDoc(ref, profile);
            this._profile$.next(profile as UserProfile);
        } else {
            const profile = snap.data() as UserProfile;
            this._profile$.next(profile);
            this._avatarUrl$.next((profile as any)?.avatarUrl ?? null);
        }
    }

    async logout() {
        if (this._profileUnsub) { this._profileUnsub(); this._profileUnsub = null; }
        await signOut(this.auth);
    }

    async resetPassword(email: string) { return sendPasswordResetEmail(this.auth, email); }

    async sendVerificationEmail(): Promise<void> {
        const user = this._user$.value;
        if (user && !user.emailVerified) {
            await sendEmailVerification(user, {
                url: 'https://arkiva-digjitale.web.app/auth?verified=true',
            });
        }
    }

    async applyVerificationCode(oobCode: string): Promise<void> {
        await applyActionCode(this.auth, oobCode);
        if (this._user$.value) await this._user$.value.reload();
        this._user$.next(this.auth.currentUser);
    }

    get isEmailVerified(): boolean { return !!this._user$.value?.emailVerified; }

    mapError(code: string): string {
        const m: Record<string, string> = {
            'auth/email-already-in-use':   'Ky email është tashmë i regjistruar.',
            'auth/invalid-email':          'Adresë emaili e pavlefshme.',
            'auth/weak-password':          'Fjalëkalimi duhet të ketë të paktën 6 karaktere.',
            'auth/user-not-found':         'Nuk u gjet llogari me këtë email.',
            'auth/wrong-password':         'Fjalëkalim i pasaktë.',
            'auth/too-many-requests':      'Shumë tentativa. Provo më vonë.',
            'auth/invalid-credential':     'Kredenciale të pasakta.',
            'auth/network-request-failed': 'Problem me rrjetin.',
            'auth/popup-closed-by-user':   'Dritarja u mbyll. Provo përsëri.',
            'auth/popup-blocked':          'Popup u bllokua. Lejo popups për këtë faqe.',
            'auth/user-disabled':          'Llogaria juaj është bllokuar nga administratori.',
            'auth/user-banned':            'Llogaria juaj është bllokuar. Kontaktoni administratorin.',
            'auth/account-exists-with-different-credential': 'Ky email është lidhur me metodë tjetër hyrjeje.',
        };
        return m[code] ?? 'Ndodhi një gabim i papritur. Provo përsëri.';
    }
}
