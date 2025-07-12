// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class TareaspersonalesService {

//   constructor() { }
// }


// import { Injectable, inject } from '@angular/core';
// import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, query, where, collectionData } from '@angular/fire/firestore';
// import { Auth, authState } from '@angular/fire/auth';
// import { Observable, switchMap, of } from 'rxjs';
// import { serverTimestamp } from 'firebase/firestore';

// export interface Tarea {
//   id: string;
//   titulo: string;
//   descripcion: string;
//   fecha: string;
//   fechaFin: string;
//   horaInicio: string;
//   horaFin: string;
//   estado: string;
//   uid: string;
//   timestamp?: any;
// }

// export type NuevaTarea = Omit<Tarea, 'id' | 'timestamp' | 'uid'>;

// const PATH = 'tareas-personales';

// @Injectable({
//   providedIn: 'root'
// })
// export class TareaspersonalesService {

//   private firestore = inject(Firestore);
//   private auth = inject(Auth);
//   private user$ = authState(this.auth);

//   constructor() { }

//   // ✅ Obtener tareas del usuario autenticado
//   obtenerTareas(): Observable<Tarea[]> {
//     return this.user$.pipe(
//       switchMap(user => {
//         if (!user) return of([]);
//         const ref = query(
//           collection(this.firestore, PATH),
//           where('uid', '==', user.uid)
//         );
//         return collectionData(ref, { idField: 'id' }) as Observable<Tarea[]>;
//       })
//     );
//   }

//   // ✅ Crear nueva tarea
//   async crearTarea(tarea: NuevaTarea) {
//     const user = this.auth.currentUser;
//     if (!user) throw new Error('Usuario no autenticado');

//     return addDoc(collection(this.firestore, PATH), {
//       ...tarea,
//       uid: user.uid,
//       timestamp: serverTimestamp()
//     });
//   }

//   // ✅ Actualizar tarea existente
//   async actualizarTarea(id: string, datosActualizados: NuevaTarea) {
//     const ref = doc(this.firestore, `${PATH}/${id}`);
//     return updateDoc(ref, {
//       ...datosActualizados,
//       timestamp: serverTimestamp()
//     });
//   }

//   // ✅ Cambiar estado
//   async cambiarEstado(id: string, nuevoEstado: string) {
//     const ref = doc(this.firestore, `${PATH}/${id}`);
//     return updateDoc(ref, {
//       estado: nuevoEstado,
//       timestamp: serverTimestamp()
//     });
//   }

//   // ✅ Eliminar tarea
//   async eliminarTarea(id: string) {
//     const ref = doc(this.firestore, `${PATH}/${id}`);
//     return deleteDoc(ref);
//   }
// }


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
