import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterLink }      from '@angular/router';
import { doc, setDoc }     from 'firebase/firestore';
import { AuthService }     from '../../core/services/auth.service';
import { ArtistsService }  from '../../core/services/artists.service';
import { ToastService }    from '../../core/services/toast.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { Artist, Work, ALBANIA_CITIES } from '../../core/models';

type Tab = 'overview' | 'artists' | 'works' | 'settings';

@Component({
  selector:    'app-profile',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl:    './profile.component.scss',
})
export class ProfileComponent implements OnInit {
    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }
}
