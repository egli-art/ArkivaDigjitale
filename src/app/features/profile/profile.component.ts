import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
    Firestore, doc, updateDoc, getDocs,
    collection, query, where
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

import { AuthService }   from '../../core/services/auth.service';
import { ArtistService } from '../../core/services/artist.service';
import { ToastService }  from '../../core/services/toast.service';
import {
    Artist, Work, UserProfile,
    ALBANIA_CITIES, ARTIST_TYPES
} from '../../core/models/artist.model';

export type Tab = 'overview' | 'artists' | 'works' | 'settings';
export type ViewerTab = 'gallery' | 'settings';

export interface WorkWithArtist extends Work {
    artistName?: string;
    artistId?:   string;
    artistPhoto?: string;
}

export interface GalleryItem {
    src:        string;
    titulli:    string;
    artistName: string;
    artistId:   string;
    medium?:    string;
    viti?:      string;
}

@Component({
    selector:    'app-profile',
    standalone:  true,
    imports:     [CommonModule, FormsModule, RouterLink],
    templateUrl: './profile.component.html',
    styleUrl:    './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {

    /* ── services ─────────────────────────────────────────── */
    readonly authSvc   = inject(AuthService);
    private artistSvc  = inject(ArtistService);
    private toastSvc   = inject(ToastService);
    private storage    = inject(Storage);
    private firestore  = inject(Firestore);
    private router     = inject(Router);

    /* ── page state ───────────────────────────────────────── */
    loading     = signal(true);
    dataLoading = signal(false);

    /* ARTIST tabs */
    tab = signal<Tab>('overview');
    /* VIEWER tabs */
    viewerTab = signal<ViewerTab>('gallery');

    profile = signal<UserProfile | null>(null);

    /* ── ARTIST data (my uploads) ─────────────────────────── */
    artists = signal<Artist[]>([]);
    works   = signal<WorkWithArtist[]>([]);

    artistCount = computed(() => this.artists().length);
    workCount   = computed(() => this.works().length);
    cityCount   = computed(() => new Set(this.artists().map(a => a.qyteti)).size);

    /* ── VIEWER data (all artists gallery) ───────────────── */
    allArtists  = signal<Artist[]>([]);
    gallery     = signal<GalleryItem[]>([]);
    galleryLoading = signal(false);

    /* lightbox */
    lightbox: GalleryItem | null = null;

    /* ── avatar ───────────────────────────────────────────── */
    avatarUrl      = signal<string | null>(null);
    avatarSaving   = false;
    uploadProgress = signal<number | null>(null);

    avatarInitials = computed(() => {
        const p = this.profile();
        if (!p) return '?';
        return `${p.emri?.[0] ?? ''}${p.mbiemri?.[0] ?? ''}`.toUpperCase();
    });

    /* ── settings ─────────────────────────────────────────── */
    editEmri       = '';
    editMbiemri    = '';
    editBio        = '';
    settingsSaving = false;

    /* ── Add Artist modal ─────────────────────────────────── */
    showArtistModal = false;
    artistSaving    = false;
    artistTypes     = ARTIST_TYPES;
    cities          = ALBANIA_CITIES;
    artistForm = { emri:'', mbiemri:'', lloji:'Piktor', lindja:'', bio:'', qyteti:'tirane' };
    artistPhoto:   File | null = null;
    artistPreview: string      = '';

    /* ── social login ─────────────────────────────────────── */
    googleLoading = false;
    appleLoading  = false;

    private subs: Subscription[] = [];

    /* ═══════════════════════════════════════════════════════
       LIFECYCLE
    ═══════════════════════════════════════════════════════ */
    async ngOnInit() {
        // Keep avatar in sync with AuthService stream (shared with navbar)
        const avatarSub = this.authSvc.avatarUrl$.subscribe(url => {
            this.avatarUrl.set(url);
        });
        this.subs.push(avatarSub);

        let firstLoad = true;
        const sub = this.authSvc.profile$.subscribe(async (profile) => {
            this.profile.set(profile);
            if (profile) {
                // Only seed edit fields on first load — don't overwrite user's in-progress edits
                if (firstLoad) {
                    this.editEmri    = profile.emri;
                    this.editMbiemri = profile.mbiemri;
                    this.editBio     = (profile as any).bio ?? '';
                    firstLoad = false;
                }

                if (profile.roli === 'artist') {
                    await this.loadArtistData(profile);
                } else {
                    await this.loadViewerData();
                }
            }
            this.loading.set(false);
        });
        this.subs.push(sub);
    }

    ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

    /* ═══════════════════════════════════════════════════════
       LOAD — ARTIST: my artists + their works
    ═══════════════════════════════════════════════════════ */
    async loadArtistData(profile: UserProfile) {
        this.dataLoading.set(true);
        try {
            // NOTE: where + orderBy requires a composite index in Firestore.
            // We query by shtuesId only and sort in memory to avoid index errors.
            const q = query(
                collection(this.firestore, 'artistet'),
                where('shtuesId', '==', profile.uid)
            );
            const snap = await getDocs(q);
            const myArtists = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Artist))
                .sort((a: any, b: any) =>
                    (b.krijuarMe?.seconds ?? 0) - (a.krijuarMe?.seconds ?? 0)
                );
            this.artists.set(myArtists);

            const allWorks: WorkWithArtist[] = [];
            await Promise.all(
                myArtists.map(async (artist) => {
                    const ws = await this.artistSvc.getWorks(artist.id!);
                    ws.forEach(w => allWorks.push({
                        ...w,
                        artistName:  `${artist.emri} ${artist.mbiemri}`,
                        artistId:    artist.id,
                        artistPhoto: artist.fotoUrl,
                    }));
                })
            );
            allWorks.sort((a: any, b: any) =>
                (b.krijuarMe?.seconds ?? 0) - (a.krijuarMe?.seconds ?? 0)
            );
            this.works.set(allWorks);
        } catch (e) {
            console.error('loadArtistData error:', e);
        }
        this.dataLoading.set(false);
    }

    /* ═══════════════════════════════════════════════════════
       LOAD — VIEWER: ALL artists + gallery from all works
    ═══════════════════════════════════════════════════════ */
    async loadViewerData() {
        this.galleryLoading.set(true);
        try {
            // Fetch ALL artists — no orderBy to avoid needing a Firestore index
            const snap = await getDocs(collection(this.firestore, 'artistet'));
            const all = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Artist))
                .sort((a: any, b: any) =>
                    (b.krijuarMe?.seconds ?? 0) - (a.krijuarMe?.seconds ?? 0)
                );
            this.allArtists.set(all);

            // Build gallery from works of all artists (limit to first 40 artists for perf)
            const items: GalleryItem[] = [];
            await Promise.all(
                all.slice(0, 40).map(async (artist) => {
                    const ws = await this.artistSvc.getWorks(artist.id!);
                    ws.forEach(w => {
                        (w.imazhet ?? []).forEach(src => {
                            items.push({
                                src,
                                titulli:    w.titulli,
                                artistName: `${artist.emri} ${artist.mbiemri}`,
                                artistId:   artist.id!,
                                medium:     w.medium,
                                viti:       w.viti,
                            });
                        });
                    });
                })
            );
            this.gallery.set(items);
        } catch (e) {
            console.error('loadViewerData error:', e);
        }
        this.galleryLoading.set(false);
    }

    /* ═══════════════════════════════════════════════════════
       TAB NAVIGATION
    ═══════════════════════════════════════════════════════ */
    setTab(t: Tab)             { this.tab.set(t); }
    isTab(t: Tab)              { return this.tab() === t; }
    setViewerTab(t: ViewerTab) { this.viewerTab.set(t); }
    isViewerTab(t: ViewerTab)  { return this.viewerTab() === t; }

    /* ═══════════════════════════════════════════════════════
       LIGHTBOX
    ═══════════════════════════════════════════════════════ */
    openLightbox(item: GalleryItem) { this.lightbox = item; }
    closeLightbox()                 { this.lightbox = null; }

    /* ═══════════════════════════════════════════════════════
       AVATAR UPLOAD
    ═══════════════════════════════════════════════════════ */
    onAvatarChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file || !this.authSvc.currentUser) return;

        // Show local preview IMMEDIATELY — no waiting for upload
        const localUrl = URL.createObjectURL(file);
        this.avatarUrl.set(localUrl);
        this.authSvc.updateAvatarUrl(localUrl); // navbar sees it instantly too

        this.avatarSaving = true;
        this.uploadProgress.set(10);

        const uid     = this.authSvc.currentUser.uid;
        const storRef = ref(this.storage, `avatars/${uid}/${Date.now()}_${file.name}`);

        // Use uploadBytes (simple promise) — same as working artist.service.ts
        uploadBytes(storRef, file, { contentType: file.type })
            .then(() => {
                this.uploadProgress.set(80);
                return getDownloadURL(storRef);
            })
            .then(async (url) => {
                this.uploadProgress.set(100);
                await updateDoc(doc(this.firestore, 'perdoruesit', uid), { avatarUrl: url });
                // Replace blob URL with permanent Firebase URL
                this.avatarUrl.set(url);
                this.authSvc.updateAvatarUrl(url);
                this.toastSvc.success('Foto e profilit u ndryshua!');
            })
            .catch((err) => {
                console.error('Avatar upload error:', err);
                this.toastSvc.error('Gabim gjatë ngarkimit. Kontrollo rregullat e Firebase Storage.');
                // Revert to previous avatar on error
                const prev = this.authSvc.currentAvatar;
                this.avatarUrl.set(prev);
                this.authSvc.updateAvatarUrl(prev);
            })
            .finally(() => {
                this.avatarSaving = false;
                this.uploadProgress.set(null);
                (event.target as HTMLInputElement).value = '';
            });
    }

    /* ═══════════════════════════════════════════════════════
       SAVE SETTINGS
    ═══════════════════════════════════════════════════════ */
    async saveSettings() {
        const user = this.authSvc.currentUser;
        if (!user) return;
        if (!this.editEmri.trim() || !this.editMbiemri.trim()) {
            this.toastSvc.error('Emri dhe mbiemri janë të detyrueshme.'); return;
        }
        this.settingsSaving = true;
        try {
            const emri      = this.editEmri.trim();
            const mbiemri   = this.editMbiemri.trim();
            const bio       = this.editBio.trim();
            const emriPlote = `${emri} ${mbiemri}`;

            // 1. Persist to Firestore
            await updateDoc(doc(this.firestore, 'perdoruesit', user.uid), {
                emri, mbiemri, emriPlote, bio,
            });

            // 2. Push to AuthService stream → navbar displayName + hero name update instantly
            await this.authSvc.updateDisplayName(emri, mbiemri, bio);

            // 3. Update local profile signal so hero name refreshes right now
            const curr = this.profile();
            if (curr) this.profile.set({ ...curr, emri, mbiemri, emriPlote });

            this.toastSvc.success('Profili u ruajt me sukses!');
        } catch (e) {
            this.toastSvc.error('Ndodhi një gabim. Provo përsëri.');
        }
        this.settingsSaving = false;
    }

    /* ═══════════════════════════════════════════════════════
       ADD ARTIST
    ═══════════════════════════════════════════════════════ */
    openArtistModal() {
        this.artistForm    = { emri:'', mbiemri:'', lloji:'Piktor', lindja:'', bio:'', qyteti:'tirane' };
        this.artistPhoto   = null;
        this.artistPreview = '';
        this.showArtistModal = true;
    }

    closeArtistModal() { this.showArtistModal = false; }

    onArtistPhoto(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        this.artistPhoto   = file;
        this.artistPreview = URL.createObjectURL(file);
    }

    removeArtistPhoto() { this.artistPhoto = null; this.artistPreview = ''; }

    get selectedCityName(): string {
        return this.cities.find(c => c.id === this.artistForm.qyteti)?.name ?? '';
    }

    async saveArtist() {
        const user = this.authSvc.currentUser;
        if (!user) return;
        if (!this.artistForm.emri.trim() || !this.artistForm.mbiemri.trim()) {
            this.toastSvc.error('Emri dhe mbiemri janë të detyrueshme.'); return;
        }
        this.artistSaving = true;
        try {
            const city = this.cities.find(c => c.id === this.artistForm.qyteti);
            await this.artistSvc.addArtist(
                {
                    emri:       this.artistForm.emri.trim(),
                    mbiemri:    this.artistForm.mbiemri.trim(),
                    lloji:      this.artistForm.lloji,
                    lindja:     this.artistForm.lindja,
                    bio:        this.artistForm.bio,
                    qyteti:     this.artistForm.qyteti,
                    qytetiEmri: city?.name ?? '',
                    shtuesId:   user.uid,
                    shtuesEmri: this.authSvc.currentProfile?.emriPlote ?? '',
                    vepraNr:    0,
                    fotoUrl:    '',
                },
                this.artistPhoto ?? undefined
            );
            this.toastSvc.success('Artisti u shtua me sukses!');
            this.showArtistModal = false;
            await this.loadArtistData(this.profile()!);
        } catch (e) {
            this.toastSvc.error('Gabim gjatë shtimit të artistit.');
        }
        this.artistSaving = false;
    }

    /* ═══════════════════════════════════════════════════════
       SOCIAL / LOGOUT
    ═══════════════════════════════════════════════════════ */
    async loginWithGoogle() {
        this.googleLoading = true;
        try { await this.authSvc.loginWithGoogle(); this.toastSvc.success('U kyçët me Google!'); }
        catch (e: any) { this.toastSvc.error(this.authSvc.mapError(e.code ?? '')); }
        this.googleLoading = false;
    }

    async loginWithApple() {
        this.appleLoading = true;
        try { await this.authSvc.loginWithApple(); this.toastSvc.success('U kyçët me Apple!'); }
        catch (e: any) { this.toastSvc.error(this.authSvc.mapError(e.code ?? '')); }
        this.appleLoading = false;
    }

    async logout() {
        await this.authSvc.logout();
        this.router.navigate(['/auth']);
    }

    /* ═══════════════════════════════════════════════════════
       HELPERS
    ═══════════════════════════════════════════════════════ */
    get isArtist():     boolean { return this.profile()?.roli === 'artist'; }
    get displayName():  string  { return this.profile()?.emriPlote ?? ''; }
    get displayEmail(): string  { return this.authSvc.currentUser?.email ?? ''; }
    get roleBadge():    string  { return this.isArtist ? '🎨 Artist & Autor' : '👁 Shikues'; }

    getArtistInitials(a: Artist): string {
        return `${a.emri?.[0] ?? ''}${a.mbiemri?.[0] ?? ''}`.toUpperCase();
    }

    getWorkThumb(w: Work): string { return w.imazhet?.[0] ?? ''; }

    getCityName(id: string): string {
        return ALBANIA_CITIES.find(c => c.id === id)?.name ?? id;
    }

    trackById(_: number, item: any) { return item.id; }
    trackBySrc(_: number, item: GalleryItem) { return item.src; }
}
