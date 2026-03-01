import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, collectionData, docData } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from } from 'rxjs';
import { Artist, Work } from '../models/artist.model';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private fs      = inject(Firestore);
  private storage = inject(Storage);

  // ── Artists ──────────────────────────────────────────────────
  async getArtistsByCity(cityId: string): Promise<Artist[]> {
    const q = query(collection(this.fs, 'artistet'), where('qyteti', '==', cityId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Artist));
  }

  async getArtist(id: string): Promise<Artist | null> {
    const snap = await getDoc(doc(this.fs, 'artistet', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Artist : null;
  }

  async addArtist(artist: Omit<Artist, 'id'>, photoFile?: File): Promise<string> {
    let fotoUrl = '';
    if (photoFile) {
      const storRef = ref(this.storage, `artistet/${Date.now()}_${photoFile.name}`);
      await uploadBytes(storRef, photoFile);
      fotoUrl = await getDownloadURL(storRef);
    }
    const docRef = await addDoc(collection(this.fs, 'artistet'), {
      ...artist, fotoUrl, vepraNr: 0, krijuarMe: serverTimestamp()
    });
    return docRef.id;
  }

  async updateArtist(id: string, data: Partial<Artist>): Promise<void> {
    await updateDoc(doc(this.fs, 'artistet', id), { ...data });
  }

  async deleteArtist(id: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'artistet', id));
  }

  async getCityCount(cityId: string): Promise<number> {
    const snap = await getDocs(query(collection(this.fs, 'artistet'), where('qyteti', '==', cityId)));
    return snap.size;
  }

  // ── Works ─────────────────────────────────────────────────────
  async getWorks(artistId: string): Promise<Work[]> {
    const snap = await getDocs(collection(this.fs, 'artistet', artistId, 'veprat'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Work));
  }

  async addWork(artistId: string, work: Omit<Work,'id'>, imageFiles: File[]): Promise<void> {
    const imazhet: string[] = [];
    for (const file of imageFiles) {
      const storRef = ref(this.storage, `veprat/${artistId}/${Date.now()}_${file.name}`);
      await uploadBytes(storRef, file);
      imazhet.push(await getDownloadURL(storRef));
    }
    await addDoc(collection(this.fs, 'artistet', artistId, 'veprat'), {
      ...work, imazhet, krijuarMe: serverTimestamp()
    });
    const current = (await getDoc(doc(this.fs, 'artistet', artistId))).data();
    await updateDoc(doc(this.fs, 'artistet', artistId), {
      vepraNr: (current?.['vepraNr'] ?? 0) + 1
    });
  }
}
