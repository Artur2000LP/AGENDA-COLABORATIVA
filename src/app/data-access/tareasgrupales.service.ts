

import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Firestore,
  doc,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
} from '@angular/fire/firestore';
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
  timestamp?: any;
  assignedToName: string;
}

export type creartarea = Omit<Tarea, 'id' | 'timestamp'>;

@Injectable({
  providedIn: 'root',
})
export class TareasService {
  private firestore = inject(Firestore);
  private _coleccionRef?: CollectionReference;

  // señal que contendrá las tareas en tiempo real
  private _tareasSignal = signal<Tarea[]>([]);
  optenerTarea = this._tareasSignal;

  /**
   * Debe llamarse desde el componente, pasándole el mismo grupoId
   * que usas en GruposService y ChatService.
   */
  setGrupoId(grupoId: string) {
    // 1) Referencia al documento del grupo en la colección 'tareasgrupales'
    const grupoDoc = doc(this.firestore, `tareasgrupales/${grupoId}`);
    // 2) Subcolección 'tareas' dentro de dicho documento
    this._coleccionRef = collection(grupoDoc, 'tareas');

    // 3) Escuchar en tiempo real y volcar en la señal
    collectionData(this._coleccionRef, { idField: 'id' })
      .subscribe({
        next: tareas => this._tareasSignal.set(tareas as Tarea[]),
        error: err => {
          console.error('Error al obtener tareas:', err);
          this._tareasSignal.set([]);
        }
      });
  }


  /** Crea una tarea en tareasgrupales/{grupoId}/tareas */
  create(tarea: creartarea) {
    if (!this._coleccionRef) throw new Error('TareasService: grupo no inicializado');
    return addDoc(this._coleccionRef, {
      ...tarea,
      timestamp: serverTimestamp()
    });
  }

  /** Actualiza sólo el estado y timestamp */
  updateEstado(id: string, nuevoEstado: string) {
    if (!this._coleccionRef) throw new Error('TareasService: grupo no inicializado');
    const ref = doc(this._coleccionRef, id);
    return updateDoc(ref, {
      estado: nuevoEstado,
      timestamp: serverTimestamp()
    });
  }


  /** Actualiza el resto de campos de la tarea */
  updateTarea(id: string, datos: creartarea) {
    if (!this._coleccionRef) throw new Error('TareasService: grupo no inicializado');
    const ref = doc(this._coleccionRef, id);
    return updateDoc(ref, { ...datos });
  }

  /** Elimina la tarea */
  deleteTarea(id: string) {
    if (!this._coleccionRef) throw new Error('TareasService: grupo no inicializado');
    const ref = doc(this._coleccionRef, id);
    return deleteDoc(ref);
  }

}
