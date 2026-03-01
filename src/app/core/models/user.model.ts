import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'shikues' | 'artist';

export interface AppUser {
  uid: string;
  emri: string;
  mbiemri: string;
  emriPlote: string;
  email: string;
  roli: UserRole;
  krijuarMe?: Timestamp;
}
