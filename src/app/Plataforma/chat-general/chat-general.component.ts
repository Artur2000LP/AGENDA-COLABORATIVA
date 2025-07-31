

import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  AfterViewInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  Renderer2,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ChatService, ChatMessage } from '../../data-access/chat.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-chat-general',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './chat-general.component.html',
  styleUrls: ['./chat-general.component.css']
})
export class ChatGeneralComponent implements OnInit, AfterViewInit, AfterViewChecked {
  // Inyectamos servicios y utilidades
  private chatService = inject(ChatService);
  private auth = inject(Auth);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  // Señales y estado
  mensajes = this.chatService.mensajesSignal;
  mensajeTexto = signal('');

  mensajeEditandoId = signal<string | null>(null);
  mensajeEditandoTexto = signal('');
  private menuAbiertoId = signal<string | null>(null);

  // Scroll automático
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef<HTMLDivElement>;
  private shouldScroll = false;

  // Ref al textarea
  @ViewChild('mensajeInput') mensajeInput!: ElementRef<HTMLTextAreaElement>;

  // Colores de usuario
  private userColorMap = new Map<string, string>();
  private usedColors = new Set<string>();

  // Getters/Setters
  get mensajeTextoValue(): string {
    return this.mensajeTexto();
  }
  set mensajeTextoValue(val: string) {
    this.mensajeTexto.set(val);
  }

  get nombreUsuario(): string {
    return this.auth.currentUser?.displayName ?? 'Invitado';
  }

  // Inicialización
  ngOnInit() {
    // Cerramos el menú contextual si clic fuera
    this.renderer.listen('document', 'click', (e: MouseEvent) => this.cerrarMenuSiClickFuera(e));
  }

  ngAfterViewInit() {
    // No autofocus aquí: dejamos la apertura del teclado solo al tocar
  }

  // Solo al tocar el textarea abrimos el teclado
  onTextareaClick() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.mensajeInput.nativeElement.focus();
      }, 0);
    });
  }

  // Envío de mensaje: limpiamos el textarea *antes* de llamar al servicio
  enviarMensaje() {
    const texto = this.mensajeTextoValue.trim();
    if (!texto) return;

    // Limpia el ngModel → vacía el textarea al instante
    this.mensajeTexto.set('');

    // Envío usando la variable local
    this.chatService.sendTextMessage(this.nombreUsuario, texto)
      .catch(err => console.error(err));
  }

  // Orden y scroll
  mensajesOrdenados = computed(() => {
    const sorted = [...this.mensajes()].sort(
      (a, b) => (a.timestamp?.seconds ?? 0) - (b.timestamp?.seconds ?? 0)
    );
    this.shouldScroll = true;
    return sorted;
  });

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      const el = this.chatMessagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  // Menú contextual, edición y eliminación (igual que antes)
  toggleMenu(id?: string) {
    this.menuAbiertoId.set(this.menuAbiertoId() === id ? null : id || null);
  }

  isMenuOpen(id?: string): boolean {
    return this.menuAbiertoId() === id;
  }

  private cerrarMenuSiClickFuera(event: MouseEvent) {
    const id = this.menuAbiertoId();
    if (!id) return;
    const clicked = event.target as HTMLElement;
    const btn = document.querySelector(`button.menu-button[data-id="${id}"]`);
    const opciones = document.querySelector('div.menu-options');
    if (btn?.contains(clicked) || opciones?.contains(clicked)) return;
    this.menuAbiertoId.set(null);
  }

  iniciarEdicion(msg: ChatMessage) {
    this.menuAbiertoId.set(null);
    this.mensajeEditandoId.set(msg.id || null);
    this.mensajeEditandoTexto.set(msg.message);
  }

  guardarEdicion() {
    const id = this.mensajeEditandoId();
    const nuevoTexto = this.mensajeEditandoTexto().trim();
    if (!id || !nuevoTexto) {
      alert('El mensaje no puede quedar vacío');
      return;
    }
    this.chatService.updateMessage(id, nuevoTexto)
      .then(() => {
        this.mensajeEditandoId.set(null);
        this.mensajeEditandoTexto.set('');
      })
      .catch(err => console.error(err));
  }

  cancelarEdicion() {
    this.mensajeEditandoId.set(null);
    this.mensajeEditandoTexto.set('');
  }

  eliminarMensaje(msg: ChatMessage) {
    this.menuAbiertoId.set(null);
    if (msg.id) {
      this.chatService.deleteMessage(msg.id).catch(err => console.error(err));
    }
  }

  // Generación de color único
  private generateRandomColor(): string {
    let color: string;
    do {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(70 + Math.random() * 30);
      const l = Math.floor(35 + Math.random() * 20);
      color = `hsl(${h}, ${s}%, ${l}%)`;
    } while (this.usedColors.has(color));
    this.usedColors.add(color);
    return color;
  }

  getUserColor(name: string): string {
    if (!this.userColorMap.has(name)) {
      this.userColorMap.set(name, this.generateRandomColor());
    }
    return this.userColorMap.get(name)!;
  }
}
