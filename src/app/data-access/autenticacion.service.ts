

// import { Injectable, inject } from '@angular/core';
// import {
//   Auth,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   sendPasswordResetEmail,
//   GoogleAuthProvider,
//   signInWithPopup
// } from '@angular/fire/auth';

// export interface User {
//   name: string;
//   email: string;
//   password: string;
// }

// @Injectable({ providedIn: 'root' })
// export class AutenticacionService {
//   private auth = inject(Auth);

//   register(email: string, password: string) {
//     return createUserWithEmailAndPassword(this.auth, email, password);
//   }

//   login(email: string, password: string) {
//     return signInWithEmailAndPassword(this.auth, email, password);
//   }

//   resetPassword(email: string) {
//     return sendPasswordResetEmail(this.auth, email);
//   }

//   // 🔑 Iniciar sesión con Google
//   loginWithGoogle() {
//     const provider = new GoogleAuthProvider();
//     return signInWithPopup(this.auth, provider);
//   }
// }


import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';

import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore'; // 👈 Importa Firestore

export interface User {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private auth = inject(Auth);
  private firestore = inject(Firestore); // 👈 Añade Firestore

  // register(email: string, password: string) {
  //   return createUserWithEmailAndPassword(this.auth, email, password)
  //     .then((cred) => {
  //       this.guardarUsuarioFirestore(cred.user); // 👈 Guardar en Firestore
  //       return cred;
  //     });
  // }

  // register(email: string, password: string) {
  //   return createUserWithEmailAndPassword(this.auth, email, password);
  // }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(cred => {
        return this.guardarUsuarioFirestore(cred.user).then(() => cred);
      });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  // 🔑 Iniciar sesión con Google
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((cred) => {
        this.guardarUsuarioFirestore(cred.user); // 👈 Guardar en Firestore
        return cred;
      });
  }

  // // ✅ Guardar datos mínimos del usuario en Firestore
  // async guardarUsuarioFirestore(user: any) {
  //   const ref = doc(this.firestore, 'usuarios', user.uid);
  //   return setDoc(ref, {
  //     displayName: user.displayName || 'Sin nombre',
  //     email: user.email || '',
  //   }, { merge: true });
  // }


  async guardarUsuarioFirestore(user: any) {
    const ref = doc(this.firestore, 'usuarios', user.uid);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      // Ya hay un usuario: solo actualiza email si falta, no tocamos el displayName
      return setDoc(ref, {
        email: user.email || '',
      }, { merge: true });
    }

    // Usuario nuevo: guardamos su nombre y correo
    return setDoc(ref, {
      displayName: user.displayName || 'Sin nombre',
      email: user.email || '',
    });
  }

}
