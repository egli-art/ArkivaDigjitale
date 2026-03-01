import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth,      Auth }            from 'firebase/auth';
import { getFirestore, Firestore }       from 'firebase/firestore';
import { getStorage,   FirebaseStorage } from 'firebase/storage';
import { environment }                   from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app:     FirebaseApp;
  readonly auth:    Auth;
  readonly db:      Firestore;
  readonly storage: FirebaseStorage;

  constructor() {
    this.app     = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.auth    = getAuth(this.app);
    this.db      = getFirestore(this.app);
    this.storage = getStorage(this.app);
  }
}
