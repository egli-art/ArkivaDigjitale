import { Injectable } from '@angular/core';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FirebaseService } from './firebase.service';
import { Artist, Work }    from '../models';

@Injectable({ providedIn: 'root' })
export class ArtistsService {

  constructor(private fb: FirebaseService) {}

  private upload(path: string, file: File): Promise<string> {
    const ref  = sRef(this.fb.storage, path);
    const task = uploadBytesResumable(ref, file, { contentType: file.type });
    return new Promise((res, rej) => task.on('state_changed', undefined, rej, () => getDownloadURL(ref).then(res)));
  }

  async getArtistsByCity(cityId: string): Promise<Artist[]> {
    const snap = await getDocs(query(
      collection(this.fb.db, 'artistet'),
      where('qyteti', '==', cityId), orderBy('emri'),
    ));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Artist));
  }

  async getArtist(id: string): Promise<Artist | null> {
    const snap = await getDoc(doc(this.fb.db, 'artistet', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Artist) : null;
  }

  async countByCity(cityId: string): Promise<number> {
    const snap = await getDocs(query(collection(this.fb.db, 'artistet'), where('qyteti', '==', cityId)));
    return snap.size;
  }

  async addArtist(
    data: Omit<Artist, 'id'|'vepraNr'|'fotoUrl'|'krijuarMe'>,
    photoFile?: File,
  ): Promise<string> {
    const fotoUrl = photoFile ? await this.upload(`artistet/${Date.now()}_${photoFile.name}`, photoFile) : '';
    const ref = await addDoc(collection(this.fb.db, 'artistet'),
      { ...data, fotoUrl, vepraNr: 0, krijuarMe: serverTimestamp() });
    return ref.id;
  }

  async updateArtist(id: string, data: Partial<Artist>): Promise<void> {
    await updateDoc(doc(this.fb.db, 'artistet', id), { ...data });
  }

  async getWorks(artistId: string): Promise<Work[]> {
    const snap = await getDocs(query(
      collection(this.fb.db, 'artistet', artistId, 'veprat'),
      orderBy('krijuarMe', 'desc'),
    ));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Work));
  }

  async addWork(
    artistId: string,
    data: Omit<Work, 'id'|'imazhet'|'krijuarMe'>,
    imageFiles: File[],
  ): Promise<void> {
    const imazhet = await Promise.all(
      imageFiles.map((f, i) => this.upload(`veprat/${artistId}/${Date.now()}_${i}_${f.name}`, f)),
    );
    await addDoc(collection(this.fb.db, 'artistet', artistId, 'veprat'),
      { ...data, imazhet, krijuarMe: serverTimestamp() });
    const artist = await this.getArtist(artistId);
    await updateDoc(doc(this.fb.db, 'artistet', artistId), { vepraNr: (artist?.vepraNr ?? 0) + 1 });
  }
}
