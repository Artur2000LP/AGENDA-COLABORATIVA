
// import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
// import { provideRouter } from '@angular/router';

// import { routes } from './app.routes';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// import { getStorage, provideStorage } from '@angular/fire/storage'; // ✅ AGREGADO

// import { BrowserModule } from '@angular/platform-browser';
// import { DragDropModule } from '@angular/cdk/drag-drop';
// import { provideAnimations } from '@angular/platform-browser/animations';
// import { provideHttpClient } from '@angular/common/http';
// import { importProvidersFrom } from '@angular/core';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatNativeDateModule } from '@angular/material/core';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideZoneChangeDetection({ eventCoalescing: true }),
//     provideRouter(routes),

//     provideFirebaseApp(() =>
//       initializeApp({
//         projectId: 'recordatorio-personal-dd9a4',
//         appId: '1:335779941522:web:ad32b8c9578b1ba63faa4b',
//         storageBucket: 'recordatorio-personal-dd9a4.appspot.com', // ⚠️ también corregido `.app` por `.appspot.com`
//         apiKey: 'AIzaSyALM7itg3B1RJJNpMl9x5U3oa1RLJZ_tUk',
//         authDomain: 'recordatorio-personal-dd9a4.firebaseapp.com',
//         messagingSenderId: '335779941522',
//         measurementId: 'G-F2DWDDR4EV',
//       })
//     ),

//     provideFirestore(() => getFirestore()),
//     provideStorage(() => getStorage()), // ✅ AGREGADO

//     importProvidersFrom(BrowserModule, DragDropModule),
//     provideHttpClient(),
//     provideAnimations(),
//     provideAnimationsAsync(),
//     importProvidersFrom(BrowserModule, DragDropModule, MatDatepickerModule, MatNativeDateModule),
//     { provide: LOCALE_ID, useValue: 'es-ES' }
//   ],
// };


// config.ts
import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

// Angular modules
import { BrowserModule } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// HTTP & Animations
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection optimizado
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Rutas de la aplicación
    provideRouter(routes),

    // Inicialización de Firebase
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'recordatorio-personal-dd9a4',
        appId: '1:335779941522:web:ad32b8c9578b1ba63faa4b',
        storageBucket: 'recordatorio-personal-dd9a4.appspot.com',
        apiKey: 'AIzaSyALM7itg3B1RJJNpMl9x5U3oa1RLJZ_tUk',
        authDomain: 'recordatorio-personal-dd9a4.firebaseapp.com',
        messagingSenderId: '335779941522',
        measurementId: 'G-F2DWDDR4EV',
      })
    ),

    // Auth, Firestore, Storage
    provideAuth(() => getAuth()),        // <-- Añadido Auth
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),

    // Módulos de Angular importados
    importProvidersFrom(
      BrowserModule,
      DragDropModule,
      MatDatepickerModule,
      MatNativeDateModule
    ),

    // HTTP y animaciones
    provideHttpClient(),
    provideAnimations(),
    provideAnimationsAsync(),

    // Localización
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ],
};
