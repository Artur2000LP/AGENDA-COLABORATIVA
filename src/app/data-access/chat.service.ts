

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
