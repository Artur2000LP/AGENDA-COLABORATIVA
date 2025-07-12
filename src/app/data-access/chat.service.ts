
// import { Injectable, inject } from '@angular/core';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { Observable } from 'rxjs';
// import {
//   Firestore,
//   collection,
//   collectionData,
//   addDoc,
//   doc,
//   updateDoc,
//   deleteDoc,
//   Timestamp,
//   getDocs
// } from '@angular/fire/firestore';

// export interface ChatMessage {
//   id?: string;
//   senderName: string;
//   message: string;
//   type: 'text';
//   timestamp: any;
// }

// const PATH = 'chatGeneral';

// @Injectable({
//   providedIn: 'root',
// })
// export class ChatService {
//   private _firestore = inject(Firestore);
//   private _collection = collection(this._firestore, PATH);

//   mensajesSignal = toSignal(
//     collectionData(this._collection, { idField: 'id' }) as Observable<ChatMessage[]>,
//     { initialValue: [] }
//   );

//   getMessages(): Observable<ChatMessage[]> {
//     return collectionData(this._collection, { idField: 'id' }) as Observable<ChatMessage[]>;
//   }

//   sendTextMessage(senderName: string, message: string) {
//     const msg: ChatMessage = {
//       senderName,
//       message,
//       type: 'text',
//       timestamp: Timestamp.now()
//     };
//     return addDoc(this._collection, msg);
//   }

//   updateMessage(id: string, updatedMessage: string) {
//     const docRef = doc(this._firestore, `${PATH}/${id}`);
//     return updateDoc(docRef, { message: updatedMessage });
//   }

//   deleteMessage(id: string) {
//     const docRef = doc(this._firestore, `${PATH}/${id}`);
//     return deleteDoc(docRef);
//   }

//   clearAllMessages() {
//   return getDocs(this._collection).then(snapshot => {
//     const deletions = snapshot.docs.map(doc => deleteDoc(doc.ref));
//     return Promise.all(deletions);
//   });
// }
// }

import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  CollectionReference,
  getDocs,             // ← IMPORTAR getDocs aquí
} from '@angular/fire/firestore';

export interface ChatMessage {
  id?: string;
  senderName: string;
  message: string;
  type: 'text';
  timestamp: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private firestore = inject(Firestore);
  private collectionRef?: CollectionReference;

  // señal que contiene los mensajes del grupo actual
  private _mensajes = signal<ChatMessage[]>([]);
  mensajesSignal = this._mensajes;    // ← exponemos la señal directamente

  setGrupoId(grupoId: string) {
    const grupoDoc = doc(this.firestore, `gruposChat/${grupoId}`);
    this.collectionRef = collection(grupoDoc, 'chat');

    // escucha en tiempo real
    collectionData(this.collectionRef, { idField: 'id' })
      .subscribe({
        next: msgs => this._mensajes.set(msgs as ChatMessage[]),
        error: err => {
          console.error('Error chat realtime', err);
          this._mensajes.set([]);
        }
      });
  }

  sendTextMessage(senderName: string, message: string) {
    if (!this.collectionRef) throw new Error('ChatService: grupo no inicializado');
    return addDoc(this.collectionRef, {
      senderName,
      message,
      type: 'text',
      timestamp: Timestamp.now()
    });
  }

  updateMessage(id: string, updatedMessage: string) {
    if (!this.collectionRef) throw new Error('ChatService: grupo no inicializado');
    return updateDoc(doc(this.collectionRef, id), { message: updatedMessage });
  }

  deleteMessage(id: string) {
    if (!this.collectionRef) throw new Error('ChatService: grupo no inicializado');
    return deleteDoc(doc(this.collectionRef, id));
  }

  clearAllMessages() {
    if (!this.collectionRef) throw new Error('ChatService: grupo no inicializado');
    return getDocs(this.collectionRef).then((snap: any) => {
      const deletions = snap.docs.map((d: any) => deleteDoc(d.ref));
      return Promise.all(deletions);
    });
  }
}
