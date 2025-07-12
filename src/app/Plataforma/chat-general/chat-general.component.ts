
import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../data-access/chat.service';
import { Auth } from '@angular/fire/auth';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-general',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerModule, MatIconModule],
  templateUrl: './chat-general.component.html',
  styleUrls: ['./chat-general.component.css']
})
export class ChatGeneralComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private renderer = inject(Renderer2);

  mensajes = this.chatService.mensajesSignal;
  private auth = inject(Auth);

  // ← ELIMINAMOS la señal interna de nombreUsuario
  mensajeTexto = signal('');

  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef<HTMLDivElement>;
  private shouldScroll = false;
  emojiPickerAbierto: boolean = false;

  mensajeEditandoId = signal<string | null>(null);
  mensajeEditandoTexto = signal('');

  private menuAbiertoId = signal<string | null>(null);

  private userColorMap = new Map<string, string>();
  // Conjunto para llevar control de colores ya usados
  private usedColors = new Set<string>();

  get mensajeTextoValue(): string {
    return this.mensajeTexto();
  }
  set mensajeTextoValue(val: string) {
    this.mensajeTexto.set(val);
  }

  /** ← NUEVO getter: siempre lee el nombre actualizado de localStorage */
  get nombreUsuario(): string {
    return this.auth.currentUser?.displayName ?? 'Invitado';
  }

  ngOnInit() {
    // Listener global para clicks fuera del menú
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      this.cerrarMenuSiClickFuera(event);
    });
  }

  // estamos modificandoa qui 
  /** Genera un color hexadecimal aleatorio, evita blanco y duplicados */
  // private generateRandomColor(): string {
  //   let color: string;
  //   do {
  //     // Genera un valor H between 0–360, S=50–100%, L=40–60% para tonos vivos
  //     const h = Math.floor(Math.random() * 360);
  //     const s = Math.floor(50 + Math.random() * 50);
  //     const l = Math.floor(40 + Math.random() * 20);
  //     color = `hsl(${h}, ${s}%, ${l}%)`;
  //     // Convertir HSL a HEX si lo prefieres:
  //     // color = this.hslToHex(h, s, l);
  //   } while (this.usedColors.has(color));
  //   this.usedColors.add(color);
  //   return color;
  // }

  private generateRandomColor(): string {
    let color: string;
    do {
      // Tono aleatorio (0–360), saturación alta (70–100%), luminosidad más baja (35–55%)
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(70 + Math.random() * 30); // Saturación viva
      const l = Math.floor(35 + Math.random() * 20); // Luminosidad moderada

      color = `hsl(${h}, ${s}%, ${l}%)`;
    } while (this.usedColors.has(color));

    this.usedColors.add(color);
    return color;
  }

  /** Devuelve (y asigna) un color para un remitente */
  getUserColor(name: string): string {
    if (!this.userColorMap.has(name)) {
      this.userColorMap.set(name, this.generateRandomColor());
    }
    return this.userColorMap.get(name)!;
  }

  // Si quieres HEX en lugar de HSL, añade este helper:
  private hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  toggleEmojiPicker() {
    this.emojiPickerAbierto = !this.emojiPickerAbierto;
  }

  agregarEmoji(event: any) {
    const emoji = event.emoji.native;
    this.mensajeTextoValue += emoji;
  }

  enviarMensaje() {
    const texto = this.mensajeTextoValue.trim();
    if (texto.length === 0) return;

    // ← AHORA USAMOS nombreUsuario sin paréntesis
    this.chatService.sendTextMessage(this.nombreUsuario, texto)
      .then(() => this.mensajeTexto.set(''));
  }

  mensajesOrdenados = computed(() => {
    const sorted = [...this.mensajes()].sort((a, b) =>
      (a.timestamp?.seconds ?? 0) - (b.timestamp?.seconds ?? 0)
    );
    this.shouldScroll = true;
    return sorted;
  });

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    try {
      const el = this.chatMessagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {
      // ignore
    }
  }

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
    const opciones = document.querySelector(`div.menu-opciones[data-id="${id}"]`);

    if (btn?.contains(clicked) || opciones?.contains(clicked)) {
      return;
    }
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
}
