import {
    Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {
    Firestore, collection, getDocs, doc,
    updateDoc, deleteDoc, query, serverTimestamp, writeBatch
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {ToastService} from "../../../core/services/toast.service";
import {AuthService} from "../../../core/services/auth.service";
import {UserProfile} from "../../../core/models/artist.model";


type Tab = 'pending' | 'users' | 'artists' | 'stats';

interface AdminUser extends UserProfile {
    uid:          string;
    approved?:    boolean;
    banned?:      boolean;
    avatarUrl?:   string;
    bio?:         string;
    adminNote?:   string;
    approvedAt?:  any;
    krijuarMe?:   any;
}

interface AdminArtist {
    id:          string;
    emri:        string;
    mbiemri:     string;
    lloji:       string;
    qytetiEmri:  string;
    fotoUrl?:    string;
    shtuesEmri?: string;
    shtuesId?:   string;
    vepraNr?:    number;
    krijuarMe?:  any;
}

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './admin.component.html',
    styleUrl:    './admin.component.scss',
})
export class AdminComponent implements OnInit {

    private fs      = inject(Firestore);
    private fns     = inject(Functions);
    private auth    = inject(AuthService);
    private toast   = inject(ToastService);
    private router  = inject(Router);

    tab     = signal<Tab>('pending');
    loading = signal(true);

    allUsers   = signal<AdminUser[]>([]);
    allArtists = signal<AdminArtist[]>([]);

    // Filter / search
    userSearch   = '';
    artistSearch = '';
    roleFilter: 'all' | 'artist' | 'shikues' | 'admin' = 'all';

    // Bulk selection
    selectedUids = signal<Set<string>>(new Set());

    // Detail drawer
    drawerUser = signal<AdminUser | null>(null);
    drawerNote = '';

    // Confirm modal
    confirmModal: { open: boolean; title: string; message: string; action: () => Promise<void> } =
        { open: false, title: '', message: '', action: async () => {} };

    // Resend loading
    resendingUid = '';

    // ── Computed ─────────────────────────────────────────────────

    pendingUsers = computed(() => this.allUsers().filter(u => !u.approved && !u.banned));

    filteredUsers = computed(() => {
        let list = this.allUsers();
        if (this.roleFilter !== 'all') list = list.filter(u => u.roli === this.roleFilter);
        const s = this.userSearch.toLowerCase().trim();
        if (s) list = list.filter(u =>
            u.emriPlote?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s)
        );
        return list;
    });

    filteredArtists = computed(() => {
        const s = this.artistSearch.toLowerCase().trim();
        if (!s) return this.allArtists();
        return this.allArtists().filter(a =>
            `${a.emri} ${a.mbiemri}`.toLowerCase().includes(s) ||
            a.shtuesEmri?.toLowerCase().includes(s) ||
            a.qytetiEmri?.toLowerCase().includes(s)
        );
    });

    stats = computed(() => {
        const u = this.allUsers();
        const byRole = { artist: 0, shikues: 0, admin: 0 };
        let banned = 0, approved = 0, pending = 0;
        u.forEach(usr => {
            if ((usr as any).roli === 'artist') byRole.artist++;
            else if ((usr as any).roli === 'shikues') byRole.shikues++;
            else if ((usr as any).roli === 'admin') byRole.admin++;
            if (usr.banned) banned++;
            if (usr.approved) approved++;
            if (!usr.approved && !usr.banned) pending++;
        });
        return {
            total:    u.length,
            pending,
            approved,
            banned,
            byRole,
            artists:  this.allArtists().length,
        };
    });

    // ── Lifecycle ────────────────────────────────────────────────

    async ngOnInit() { await this.loadAll(); }

    async loadAll() {
        this.loading.set(true);
        try {
            const [uSnap, aSnap] = await Promise.all([
                getDocs(query(collection(this.fs, 'perdoruesit'))),
                getDocs(query(collection(this.fs, 'artistet'))),
            ]);
            this.allUsers.set(
                uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AdminUser))
                    .sort((a: any, b: any) => (b.krijuarMe?.seconds ?? 0) - (a.krijuarMe?.seconds ?? 0))
            );
            this.allArtists.set(
                aSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminArtist))
                    .sort((a: any, b: any) => (b.krijuarMe?.seconds ?? 0) - (a.krijuarMe?.seconds ?? 0))
            );
        } catch (e) {
            this.toast.error('Gabim gjatë ngarkimit të të dhënave.');
        }
        this.loading.set(false);
    }

    // ── Approve ──────────────────────────────────────────────────

    async approveUser(user: AdminUser) {
        try {
            await updateDoc(doc(this.fs, 'perdoruesit', user.uid), {
                approved: true, approvedAt: serverTimestamp(),
                approvedBy: this.auth.currentUser?.uid ?? '',
            });
            this.allUsers.update(l => l.map(u => u.uid === user.uid ? { ...u, approved: true } : u));
            this.toast.success(`${user.emriPlote} u aprovua! Email u dërgua automatikisht.`);
        } catch { this.toast.error('Gabim gjatë aprovimit.'); }
    }

    async bulkApprove() {
        const uids = [...this.selectedUids()];
        if (!uids.length) return;
        const batch = writeBatch(this.fs);
        uids.forEach(uid => {
            batch.update(doc(this.fs, 'perdoruesit', uid), {
                approved: true, approvedAt: serverTimestamp(),
                approvedBy: this.auth.currentUser?.uid ?? '',
            });
        });
        try {
            await batch.commit();
            this.allUsers.update(l => l.map(u => uids.includes(u.uid) ? { ...u, approved: true } : u));
            this.selectedUids.set(new Set());
            this.toast.success(`${uids.length} llogari u aprovuan!`);
        } catch { this.toast.error('Gabim gjatë aprovimit masiv.'); }
    }

    // ── Resend approval email ────────────────────────────────────

    async resendApprovalEmail(user: AdminUser) {
        this.resendingUid = user.uid;
        try {
            const fn = httpsCallable(this.fns, 'sendApprovalEmail');
            await fn({ targetUid: user.uid });
            this.toast.success(`Email u ridërgua tek ${user.email}`);
        } catch (err: any) {
            console.error('Email error:', err);
            this.toast.error(`Email dështoi: ${err?.message ?? 'E panjohur'}`);
        }
        this.resendingUid = '';
    }

    // ── Reject / delete ──────────────────────────────────────────

    rejectUser(user: AdminUser) {
        this.confirmModal = {
            open: true,
            title: 'Refuzo & Fshi Llogarinë',
            message: `Jeni të sigurt që doni të fshini llogarinë e ${user.emriPlote}?`,
            action: async () => {
                try {
                    await deleteDoc(doc(this.fs, 'perdoruesit', user.uid));
                    this.allUsers.update(l => l.filter(u => u.uid !== user.uid));
                    this.toast.success(`Llogaria e ${user.emriPlote} u fshi.`);
                } catch { this.toast.error('Gabim gjatë fshirjes.'); }
            }
        };
    }

    // ── Change role ──────────────────────────────────────────────

    async changeRole(user: AdminUser, role: string) {
        try {
            await updateDoc(doc(this.fs, 'perdoruesit', user.uid), { roli: role });
            this.allUsers.update(l => l.map(u => u.uid === user.uid ? { ...u, roli: role as any } : u));
            this.toast.success(`Roli i ${user.emriPlote} u ndryshua në ${role}.`);
        } catch { this.toast.error('Gabim.'); }
    }

    // ── Ban / unban ──────────────────────────────────────────────

    async toggleBan(user: AdminUser) {
        const newBanned = !user.banned;
        try {
            await updateDoc(doc(this.fs, 'perdoruesit', user.uid), { banned: newBanned });
            this.allUsers.update(l => l.map(u => u.uid === user.uid ? { ...u, banned: newBanned } : u));
            this.toast.success(newBanned ? `${user.emriPlote} u bllokua.` : `${user.emriPlote} u zhbllokua.`);
        } catch { this.toast.error('Gabim.'); }
    }

    // ── Admin note ───────────────────────────────────────────────

    openDrawer(user: AdminUser) {
        this.drawerUser.set(user);
        this.drawerNote = user.adminNote ?? '';
    }

    closeDrawer() { this.drawerUser.set(null); }

    async saveNote() {
        const user = this.drawerUser();
        if (!user) return;
        try {
            await updateDoc(doc(this.fs, 'perdoruesit', user.uid), { adminNote: this.drawerNote });
            this.allUsers.update(l => l.map(u => u.uid === user.uid ? { ...u, adminNote: this.drawerNote } : u));
            this.drawerUser.set({ ...user, adminNote: this.drawerNote });
            this.toast.success('Shënimi u ruajt.');
        } catch { this.toast.error('Gabim.'); }
    }

    // ── Delete artist ────────────────────────────────────────────

    deleteArtist(artist: AdminArtist) {
        this.confirmModal = {
            open: true,
            title: 'Fshi Artistin',
            message: `Jeni të sigurt që doni të fshini ${artist.emri} ${artist.mbiemri}?`,
            action: async () => {
                try {
                    await deleteDoc(doc(this.fs, 'artistet', artist.id));
                    this.allArtists.update(l => l.filter(a => a.id !== artist.id));
                    this.toast.success('Artisti u fshi.');
                } catch { this.toast.error('Gabim gjatë fshirjes.'); }
            }
        };
    }

    // ── Bulk selection ───────────────────────────────────────────

    toggleSelect(uid: string) {
        this.selectedUids.update(s => {
            const n = new Set(s);
            n.has(uid) ? n.delete(uid) : n.add(uid);
            return n;
        });
    }

    isSelected(uid: string): boolean { return this.selectedUids().has(uid); }

    selectAllPending() {
        const uids = new Set(this.pendingUsers().map(u => u.uid));
        this.selectedUids.set(uids);
    }

    clearSelection() { this.selectedUids.set(new Set()); }

    // ── Export CSV ───────────────────────────────────────────────

    exportUsersCSV() {
        const rows = ['Emri,Email,Roli,Aprovuar,Bllokuar,Regjistruar'];
        this.allUsers().forEach(u => {
            rows.push([
                u.emriPlote, u.email, u.roli,
                u.approved ? 'Po' : 'Jo',
                u.banned   ? 'Po' : 'Jo',
                this.formatDate(u.krijuarMe),
            ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `arkiva-users-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
    }

    // ── Confirm modal ────────────────────────────────────────────

    async runConfirm() { await this.confirmModal.action(); this.confirmModal.open = false; }
    closeConfirm() { this.confirmModal.open = false; }

    // ── Helpers ──────────────────────────────────────────────────

    setTab(t: Tab) { this.tab.set(t); }
    isTab(t: Tab)  { return this.tab() === t; }

    formatDate(ts: any): string {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
        return d.toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    initials(name: string): string {
        const p = (name ?? '').trim().split(' ');
        return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : (name[0] ?? '?').toUpperCase();
    }

    async logout() { await this.auth.logout(); this.router.navigate(['/auth']); }
}
