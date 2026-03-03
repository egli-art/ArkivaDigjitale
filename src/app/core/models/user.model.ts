import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'artist' | 'shikues';

export interface AppUser {
  uid: string;
  emri: string;
  mbiemri: string;
  emriPlote: string;
  email: string;
  roli: UserRole;
  krijuarMe?: Timestamp;
}
