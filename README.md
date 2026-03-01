# Arkiva Digjitale — Angular + Firebase

## Quick Start

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200)

## Firebase Setup

1. Enable **Authentication → Email/Password** in Firebase Console
2. Create **Firestore Database** (start in test mode)
3. Enable **Firebase Storage**
4. Your credentials are already set in `src/environments/environment.ts`

## Deploy Firebase rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

## Deploy to Firebase Hosting

```bash
ng build
firebase deploy
```

## Project Structure

```
src/app/
├── core/
│   ├── guards/         auth.guard.ts
│   ├── models/         artist.model.ts (Artist, Work, City, UserProfile)
│   └── services/       auth.service.ts, artist.service.ts, toast.service.ts
├── features/
│   ├── auth/           Login + Register (tabs), Password Reset
│   ├── map/            Interactive Leaflet map of Albania
│   ├── city/           Artist grid per city + Add Artist modal (artist role)
│   └── artist/
│       └── artist-detail/  Profile, Works gallery, Edit + Add Work (artist role)
└── shared/
    ├── navbar/         Fixed top navbar with role badge + logout
    └── toast/          Notification toasts
```

## Roles

| Feature           | Shikues (Viewer) | Artist / Autor |
|-------------------|:----------------:|:--------------:|
| Browse map        | ✅               | ✅             |
| View profiles     | ✅               | ✅             |
| View works        | ✅               | ✅             |
| Add artist        | ❌               | ✅             |
| Upload works      | ❌               | ✅             |
| Edit profile      | ❌               | ✅             |
