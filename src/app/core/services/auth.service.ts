import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile } from '../models/artist.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth    = inject(Auth);
  private firestore = inject(Firestore);

  private _user$    = new BehaviorSubject<User | null>(null);
  private _profile$ = new BehaviorSubject<UserProfile | null>(null);

  readonly user$    = this._user$.asObservable();
  readonly profile$ = this._profile$.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this._user$.next(user);
      if (user) {
        const snap = await getDoc(doc(this.firestore, 'perdoruesit', user.uid));
        this._profile$.next(snap.exists() ? snap.data() as UserProfile : null);
      } else {
        this._profile$.next(null);
      }
    });
  }

  get currentUser(): User | null { return this._user$.value; }
  get currentProfile(): UserProfile | null { return this._profile$.value; }
  get isArtist(): boolean { return this._profile$.value?.roli === 'artist'; }
  get isAuthenticated(): boolean { return !!this._user$.value; }

  async register(emri: string, mbiemri: string, email: string, password: string, roli: 'artist' | 'shikues') {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: `${emri} ${mbiemri}` });
    const profile: UserProfile = {
      uid: cred.user.uid,
      emri, mbiemri, email, roli,
      emriPlote: `${emri} ${mbiemri}`,
      krijuarMe: serverTimestamp()
    };
    await setDoc(doc(this.firestore, 'perdoruesit', cred.user.uid), profile);
    this._profile$.next(profile);
  }

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    await signOut(this.auth);
  }

  async resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  mapError(code: string): string {
    const m: Record<string,string> = {
      'auth/email-already-in-use': 'Ky email është tashmë i regjistruar.',
      'auth/invalid-email':        'Adresë emaili e pavlefshme.',
      'auth/weak-password':        'Fjalëkalimi duhet të ketë të paktën 6 karaktere.',
      'auth/user-not-found':       'Nuk u gjet llogari me këtë email.',
      'auth/wrong-password':       'Fjalëkalim i pasaktë.',
      'auth/too-many-requests':    'Shumë tentativa. Provo më vonë.',
      'auth/invalid-credential':   'Kredenciale të pasakta.',
      'auth/network-request-failed': 'Problem me rrjetin.',
    };
    return m[code] ?? 'Ndodhi një gabim i papritur. Provo përsëri.';
  }
}
