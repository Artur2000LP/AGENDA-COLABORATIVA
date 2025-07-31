

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



  async createGrupo(data: crearGrupo) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    return addDoc(collection(this.firestore, PATH), {
      ...data,
      ownerUid: user.uid,
      miembros: data.miembros,  
      timestamp: serverTimestamp()
    });
  }


  updateNombre(id: string, nuevoNombre: string) {
    const ref = doc(this.firestore, PATH, id);
    return updateDoc(ref, { nombre: nuevoNombre, timestamp: serverTimestamp() });
  }



  addMiembro(id: string, nuevoUid: string) {
    const ref = doc(this.firestore, PATH, id);
    return updateDoc(ref, {
      miembros: arrayUnion(nuevoUid),
      timestamp: serverTimestamp()
    });
  }

  removeMiembro(id: string, uid: string) {
    const ref = doc(this.firestore, PATH, id);
    return updateDoc(ref, {
      miembros: arrayRemove(uid),
      timestamp: serverTimestamp()
    });
  }


  deleteGrupo(id: string) {
    const ref = doc(this.firestore, PATH, id);
    return deleteDoc(ref);
  }

  
  getAuth() {
    return this.auth;
  }


  buscarUsuariosPorNombreOCorreo(termino: string): Observable<any[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef); 

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


  getGrupoById(id: string) {
    const ref = doc(this.firestore, PATH, id);
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
