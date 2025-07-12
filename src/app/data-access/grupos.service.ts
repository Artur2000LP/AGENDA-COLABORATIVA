// import { inject, Injectable } from '@angular/core';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { Observable, switchMap, of } from 'rxjs';

// import {
//     Firestore,
//     collection,
//     addDoc,
//     collectionData,
//     doc,
//     updateDoc,
//     deleteDoc,
//     query,
//     where
// } from '@angular/fire/firestore';
// import { Auth, authState } from '@angular/fire/auth';
// import { serverTimestamp } from 'firebase/firestore';

// export interface Grupo {
//     id: string;
//     nombre: string;
//     ownerUid: string;
//     miembros: string[];        // UIDs de los miembros
//     timestamp?: any;
// }

// export type crearGrupo = Omit<Grupo, 'id' | 'timestamp' | 'ownerUid'>;

// const PATH = 'grupos';

// @Injectable({ providedIn: 'root' })
// export class GruposService {
//     private firestore = inject(Firestore);
//     private auth = inject(Auth);
//     private user$ = authState(this.auth);

//     /** 📜 Señal con los grupos de los que soy miembro */
//     misGrupos = toSignal(
//         this.user$.pipe(
//             switchMap(user => {
//                 if (!user) return of<Grupo[]>([]);
//                 const ref = query(
//                     collection(this.firestore, PATH),
//                     where('miembros', 'array-contains', user.uid)
//                 );
//                 return collectionData(ref, { idField: 'id' }) as Observable<Grupo[]>;
//             })
//         ),
//         { initialValue: [] as Grupo[] }
//     );

//     /** ➕ Crear un nuevo grupo, con owner e invitados */
//     async createGrupo(data: crearGrupo) {
//         const user = this.auth.currentUser;
//         if (!user) throw new Error('Usuario no autenticado');
//         return addDoc(collection(this.firestore, PATH), {
//             ...data,
//             ownerUid: user.uid,
//             miembros: [user.uid, ...data.miembros],
//             timestamp: serverTimestamp()
//         });
//     }

//     /** ✏️ Renombrar grupo (solo name) */
//     updateNombre(id: string, nuevoNombre: string) {
//         const ref = doc(this.firestore, PATH, id);
//         return updateDoc(ref, { nombre: nuevoNombre, timestamp: serverTimestamp() });
//     }

//     /** 👥 Añadir un miembro (arrayUnion) */
//     addMiembro(id: string, nuevoUid: string) {
//         const ref = doc(this.firestore, PATH, id);
//         return updateDoc(ref, {
//             miembros: [...( /* Firestore.arrayUnion */[] as string[]), nuevoUid],
//             timestamp: serverTimestamp()
//         });
//     }

//     /** 👤 Quitar un miembro (arrayRemove) */
//     removeMiembro(id: string, uid: string) {
//         const ref = doc(this.firestore, PATH, id);
//         return updateDoc(ref, {
//             miembros: ( /* Firestore.arrayRemove */[] as string[]),
//             timestamp: serverTimestamp()
//         });
//     }

//     /** 🗑️ Eliminar grupo completo */
//     deleteGrupo(id: string) {
//         const ref = doc(this.firestore, PATH, id);
//         return deleteDoc(ref);
//     }

//     getAuth() {
//         return this.auth; // ✅ este es el que faltaba
//     }
// }


import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of, map, combineLatest } from 'rxjs';


import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  getDocs,
  CollectionReference, // ✅ <- aquí,
  doc,
  docData,
  updateDoc,
  deleteDoc,
  arrayRemove,
  query,
  where
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { serverTimestamp } from 'firebase/firestore';
import { arrayUnion } from 'firebase/firestore';

export interface Grupo {
  id: string;
  nombre: string;
  ownerUid: string;
  miembros: string[]; // UIDs de los miembros
  timestamp?: any;
}

export type crearGrupo = Omit<Grupo, 'id' | 'timestamp' | 'ownerUid'>;

const PATH = 'gruposCreados';

@Injectable({ providedIn: 'root' })
export class GruposService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private user$ = authState(this.auth);

  /** 📜 Señal reactiva con los grupos del usuario */
  misGrupos = toSignal(
    this.user$.pipe(
      switchMap(user => {
        if (!user) return of<Grupo[]>([]);
        const ref = query(
          collection(this.firestore, PATH),
          where('miembros', 'array-contains', user.uid)
        );
        return collectionData(ref, { idField: 'id' }) as Observable<Grupo[]>;
      })
    ),
    { initialValue: [] as Grupo[] }
  );

  // /** ➕ Crear un nuevo grupo con owner e invitados */
  // async createGrupo(data: crearGrupo) {
  //   const user = this.auth.currentUser;
  //   if (!user) throw new Error('Usuario no autenticado');
  //   return addDoc(collection(this.firestore, PATH), {
  //     ...data,
  //     ownerUid: user.uid,
  //     miembros: [user.uid, ...data.miembros],
  //     timestamp: serverTimestamp()
  //   });
  // }

  /** ➕ Crear un nuevo grupo con owner e invitados */
  async createGrupo(data: crearGrupo) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    return addDoc(collection(this.firestore, PATH), {
      ...data,
      ownerUid: user.uid,
      miembros: data.miembros,  // ✅ ya viene limpio desde el componente
      timestamp: serverTimestamp()
    });
  }

  /** ✏️ Renombrar un grupo */
  updateNombre(id: string, nuevoNombre: string) {
    const ref = doc(this.firestore, PATH, id);
    return updateDoc(ref, { nombre: nuevoNombre, timestamp: serverTimestamp() });
  }

  /** 👥 Añadir un miembro (mejor usar arrayUnion en producción) */
  // addMiembro(id: string, nuevoUid: string) {
  //   const ref = doc(this.firestore, PATH, id);
  //   return updateDoc(ref, {
  //     miembros: [...([] as string[]), nuevoUid], 
  //     timestamp: serverTimestamp()
  //   });
  // }

  /** 👥 Añadir un miembro (con arrayUnion) */
  addMiembro(id: string, nuevoUid: string) {
    const ref = doc(this.firestore, PATH, id);
    return updateDoc(ref, {
      miembros: arrayUnion(nuevoUid),
      timestamp: serverTimestamp()
    });
  }
  /** 👤 Quitar un miembro (mejor usar arrayRemove en producción) */

  removeMiembro(id: string, uid: string) {
    const ref = doc(this.firestore, PATH, id);
    return updateDoc(ref, {
      miembros: arrayRemove(uid),
      timestamp: serverTimestamp()
    });
  }

  /** 🗑️ Eliminar un grupo */
  deleteGrupo(id: string) {
    const ref = doc(this.firestore, PATH, id);
    return deleteDoc(ref);
  }

  /** 🔑 Obtener referencia al Auth actual */
  getAuth() {
    return this.auth;
  }

  /** 🔍 Buscar usuarios por nombre o correo para agregarlos al grupo */
  // buscarUsuariosPorNombreOCorreo(termino: string): Observable<any[]> {
  //   const usuariosRef = collection(this.firestore, 'usuarios');
  //   const q = query(usuariosRef); // No se puede usar OR directo en Firestore

  //   return collectionData(q, { idField: 'uid' }).pipe(
  //     map((usuarios: any[]) =>
  //       usuarios.filter(u =>
  //         u.displayName?.toLowerCase().includes(termino.toLowerCase()) ||
  //         u.email?.toLowerCase().includes(termino.toLowerCase())
  //       )
  //     )
  //   );
  // }

  buscarUsuariosPorNombreOCorreo(termino: string): Observable<any[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef); // sin filtros aún, ya que filtramos en memoria

    // ⚠️ No uses collectionData estático, sino getDocs cada vez
    return new Observable<any[]>(observer => {
      getDocs(q).then(snapshot => {
        const usuarios: any[] = [];
        snapshot.forEach(doc => usuarios.push({ uid: doc.id, ...doc.data() }));

        const filtrados = usuarios.filter(u =>
          u.displayName?.toLowerCase().includes(termino.toLowerCase()) ||
          u.email?.toLowerCase().includes(termino.toLowerCase())
        );

        observer.next(filtrados);
        observer.complete();
      }).catch(err => {
        observer.error(err);
      });
    });
  }


  /** 🔍 Obtener un Observable con los datos de un grupo concreto */
  getGrupoById(id: string) {
    const ref = doc(this.firestore, PATH, id);
    // docData devuelve un Observable<DocumentData>; pasamos idField para mapear el campo ‘id’
    return docData(ref, { idField: 'id' }) as Observable<Grupo>;
  }


  getUsuario(uid: string) {
    const ref = doc(this.firestore, 'usuarios', uid);
    return docData(ref).pipe(
      map((data: any) => ({
        uid,
        displayName: data.displayName,
        email: data.email
      }))
    );
  }

  getMiembros(grupoId: string): Observable<{ uid: string; nombre: string }[]> {
    const grupoRef = doc(this.firestore, `gruposCreados/${grupoId}`);

    return docData(grupoRef).pipe(
      switchMap((grupo: any) => {
        const uids: string[] = grupo.miembros || [];
        if (uids.length === 0) return of([]);

        // Mapear cada UID a su documento en 'usuarios'
        const observables = uids.map(uid => {
          const userRef = doc(this.firestore, `usuarios/${uid}`);
          return docData(userRef).pipe(
            map((user: any) => ({
              uid,
              nombre: user?.displayName || 'Desconocido'
            }))
          );
        });

        // Combinar todos los observables en uno solo
        return combineLatest(observables);
      })
    );
  }

}
