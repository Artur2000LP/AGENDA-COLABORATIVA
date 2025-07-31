

import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of } from 'rxjs';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { serverTimestamp } from 'firebase/firestore';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  uid: string;
  timestamp?: any;
}

export type creartarea = Omit<Tarea, 'id' | 'timestamp' | 'uid'>;

const PATH = 'recordatoriopersonal';

@Injectable({
  providedIn: 'root',
})
export class TareasService {
  private _firestore = inject(Firestore);
  private auth       = inject(Auth);

  // Stream de usuario autenticado
  private user$ = authState(this.auth);

  // Señal que solo emite las tareas cuyo uid coincide con el usuario actual
  optenerTarea = toSignal(
    this.user$.pipe(
      switchMap(user => {
        if (!user) return of<Tarea[]>([]);
        const ref = query(
          collection(this._firestore, PATH),
          where('uid', '==', user.uid)
        );
        return collectionData(ref, { idField: 'id' }) as Observable<Tarea[]>;
      })
    ),
    { initialValue: [] as Tarea[] }
  );

  /** Crea tarea y añade uid + timestamp */
  create(tarea: creartarea) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    return addDoc(collection(this._firestore, PATH), {
      ...tarea,
      uid: user.uid,
      timestamp: serverTimestamp()
    });
  }

  /** Actualiza solo el estado y refresca timestamp */
  updateEstado(id: string, nuevoEstado: string) {
    const docRef = doc(this._firestore, `${PATH}/${id}`);
    return updateDoc(docRef, {
      estado: nuevoEstado,
      timestamp: serverTimestamp()
    });
  }

  /** Actualiza el resto de campos (no modifica uid) */
  updateTarea(id: string, datosActualizados: creartarea) {
    const docRef = doc(this._firestore, `${PATH}/${id}`);
    return updateDoc(docRef, {
      ...datosActualizados,
      timestamp: serverTimestamp()
    });
  }

  /** Elimina la tarea */
  deleteTarea(id: string) {
    const docRef = doc(this._firestore, `${PATH}/${id}`);
    return deleteDoc(docRef);
  }
}
