

import { Component, inject, signal, computed, ViewEncapsulation, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { creartarea, TareasService, Tarea } from '../../data-access/tareaspersonales.service';
import { effect } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ChatGeneralComponent } from '../chat-general/chat-general.component';
import { ChatService } from '../../data-access/chat.service';
import { Auth } from '@angular/fire/auth';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recordatoriopersonal',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    CommonModule,
    MatIconModule,
    DragDropModule,
    MatDatepickerModule,
    ChatGeneralComponent
  ],
  templateUrl: './recordatoriopersonal.component.html',
  styleUrls: ['./recordatoriopersonal.component.css', 'movilerecordatoriopersonal.component.css'],
  encapsulation: ViewEncapsulation.None
})
export default class RecordatoriopersonalComponent {
  private _tareasService = inject(TareasService);
  fechaActual: Date = new Date();

  mostrarFormulario = false;
  tareas = this._tareasService.optenerTarea;

  mostrarModalNombre = false;

  tareasInicio = computed(() =>
    this.tareas()
      .filter(t => t.estado === 'inicio')
      .sort((a, b) =>
        (a.timestamp?.toMillis() ?? 0) - (b.timestamp?.toMillis() ?? 0)
      )
  );

  tareasProceso = computed(() =>
    this.tareas()
      .filter(t => t.estado === 'proceso')
      .sort((a, b) =>
        (a.timestamp?.toMillis() ?? 0) - (b.timestamp?.toMillis() ?? 0)
      )
  );

  tareasFinalizado = computed(() =>
    this.tareas()
      .filter(t => t.estado === 'finalizado')
      .sort((a, b) =>
        (a.timestamp?.toMillis() ?? 0) - (b.timestamp?.toMillis() ?? 0)
      )
  );



  nuevaTarea: creartarea = {
    titulo: '',
    descripcion: '',
    fecha: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '', // ✅ Añadido
    estado: 'inicio'
  };

  tareaEditandoId: string | null = null;
  tareaSeleccionada: Tarea | null = null;
  loading = signal(false);
  auth = inject(Auth);
  isMobile = signal(window.innerWidth < 600);

  mostrarModalTareas = signal(false);
  tareasSeleccionadas: Tarea[] = [];
  fechaSeleccionada: string = '';

  // Style element guard
  private styleEl?: HTMLStyleElement;
  tooltipTareasEl?: HTMLDivElement; // 👈 ✅ AGREGA ESTA LÍNEA

  constructor(private chatService: ChatService) {
    effect(() => {
      const tareas = this.tareas();
      this.pintarFechaDeTareasPersonal(tareas);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 600);
  }

  onVaciarChat() {
    if (confirm('¿Estás seguro de que deseas vaciar todo el chat?')) {
      this.chatService.clearAllMessages().then(() => {
        console.log('Chat vaciado con éxito');
      });
    }
  }




  nombreUsuario() {
    return this.auth.currentUser?.displayName ?? 'Usuario';
  }

  private reaplicarEventosEnCeldas() {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    document.querySelectorAll<HTMLButtonElement>('button.mat-calendar-body-cell').forEach(btn => {
      const aria = btn.getAttribute('aria-label');
      if (!aria) return;
      const [dStr, , mEsp, , yStr] = aria.split(' ');
      const dia = dStr.padStart(2, '0');
      const mesIdx = meses.indexOf(mEsp.toLowerCase());
      const mes = String(mesIdx + 1).padStart(2, '0');
      const key = `${dia}-${mes}-${yStr}`;
      // const tareasDelDia = this._tareasService.optenerTarea().filter(t => (t.fecha || t.fechaFin) === key);
      const tareasDelDia = this.tareas()   // ← usa la señal filtrada
        .filter(t => (t.fecha || t.fechaFin) === key);


      if (!tareasDelDia.length) return;

      const lines = tareasDelDia.map(t0 => {
        const hora = t0.horaInicio ?? t0.horaFin ?? '';
        return `• [${t0.estado.toUpperCase()}] ${t0.titulo}` + (hora ? ` @ ${hora}` : '');
      }).join('<br>');

      if (!this.isMobile()) {
        btn.addEventListener('pointerenter', (e: PointerEvent) => {
          // Solo ratón
          if (e.pointerType !== 'mouse' || !this.tooltipTareasEl) return;
          this.tooltipTareasEl.innerHTML = `<strong>🗓️ Tareas:</strong><br>${lines}`;
          const rect = btn.getBoundingClientRect();
          this.tooltipTareasEl.style.top = `${rect.top + window.scrollY + rect.height}px`;
          this.tooltipTareasEl.style.left = `${rect.left + window.scrollX}px`;
          this.tooltipTareasEl.style.display = 'block';
        });

        btn.addEventListener('pointerleave', (e: PointerEvent) => {
          if (e.pointerType !== 'mouse' || !this.tooltipTareasEl) return;
          this.tooltipTareasEl.style.display = 'none';
        });
      }

      btn.onclick = () => {
        this.fechaSeleccionada = key;
        this.tareasSeleccionadas = tareasDelDia;
        this.mostrarModalTareas.set(true);
      };
    });
  }


  /** Inyecta CSS, tooltips y manejo de click para abrir modal de tareas (componente personal) */
  private pintarFechaDeTareasPersonal(tareas: Tarea[]) {
    // 1) Limpia únicamente el <style> que inyectamos antes
    if (this.styleEl) {
      document.head.removeChild(this.styleEl);
      this.styleEl = undefined;
    }

    // 2) Datos de meses y colores
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const colores: Record<string, string> = {
      inicio: '#0c8b7e',
      proceso: '#f5a623',
      finalizado: '#536dfe'
    };

    // 3) Agrupa tareas por fecha y sus estados
    const mapPorFecha = new Map<string, Tarea[]>();
    const estadosPorFecha = new Map<string, Set<string>>();
    tareas.forEach(t => {
      const key = t.fecha || t.fechaFin;
      if (!key) return;
      if (!mapPorFecha.has(key)) {
        mapPorFecha.set(key, []);
        estadosPorFecha.set(key, new Set());
      }
      mapPorFecha.get(key)!.push(t);
      estadosPorFecha.get(key)!.add(t.estado);
    });

    // 4) Calcula la fecha de hoy en formato "dd-mm-yyyy"
    const hoy = new Date();
    const dh = String(hoy.getDate()).padStart(2, '0');
    const mh = String(hoy.getMonth() + 1).padStart(2, '0');
    const yh = hoy.getFullYear();
    const claveHoy = `${dh}-${mh}-${yh}`;

    // 5) Construye las reglas CSS dinámicas, prefijadas con .calendario-personal
    const reglas: string[] = [];
    mapPorFecha.forEach((_, key) => {
      const [dStr, mStr, yStr] = key.split('-');
      const d = Number(dStr), m = Number(mStr), y = Number(yStr);
      const estados = Array.from(estadosPorFecha.get(key)!);
      let styleStr = '';

      if (estados.length === 1) {
        styleStr = `background-color: ${colores[estados[0]]} !important;`;
      } else {
        const pct = 100 / estados.length;
        const stops = estados
          .map((e, i) => `${colores[e]} ${i * pct}% ${(i + 1) * pct}%`)
          .join(', ');
        styleStr = `background: conic-gradient(${stops}) !important;`;
      }

      if (key === claveHoy) {
        styleStr += ' box-shadow: inset 0 0 0 4px #304ffe !important;';
      }

      const label = `${d} de ${meses[m - 1]} de ${y}`;
      reglas.push(
        `.calendario-personal button.mat-calendar-body-cell[aria-label="${label}"] .mat-calendar-body-cell-content { ${styleStr} }`
      );
    });

    // 6) Inyecta el <style> marcado como “personal”
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-owner', 'personal');
    this.styleEl.textContent = reglas.join('\n');
    document.head.appendChild(this.styleEl);

    // 7) Tooltips y manejo de click
    setTimeout(() => {
      const tooltip = document.createElement('div');
      tooltip.style.position = 'fixed';
      tooltip.style.zIndex = '1000';
      tooltip.style.background = 'white';
      tooltip.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
      tooltip.style.borderRadius = '8px';
      tooltip.style.padding = '8px';
      tooltip.style.fontSize = '13px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
      this.tooltipTareasEl = tooltip;

      this.reaplicarEventosEnCeldas();
      this.observarCalendario();
    }, 0);
  }
  ngOnDestroy() {
    if (this.styleEl) {
      document.head.removeChild(this.styleEl);
    }
    if (this.tooltipTareasEl) {
      document.body.removeChild(this.tooltipTareasEl);
    }
  }

  cerrarModalTareas() {
    this.mostrarModalTareas.set(false);
    this.tareasSeleccionadas = [];
  }

  private observarCalendario() {
    const calendarioBody = document.querySelector('.mat-calendar-body');

    if (!calendarioBody) return;

    const observer = new MutationObserver(() => {
      this.reaplicarEventosEnCeldas();
    });

    observer.observe(calendarioBody, { childList: true, subtree: true });
  }

  async crearTarea() {

    if (!this.nuevaTarea.titulo) {
      alert("El título debe ser ingresado.");
      return;
    }

    if (this.nuevaTarea.fecha && this.nuevaTarea.fechaFin) {
      const fechaInicioDate = new Date(this.nuevaTarea.fecha);
      const fechaFinDate = new Date(this.nuevaTarea.fechaFin);

      if (fechaFinDate < fechaInicioDate) {
        alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
        return;
      }
    }

    try {

      if (!this.nuevaTarea.fecha && !this.nuevaTarea.fechaFin) {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const año = hoy.getFullYear();
        this.nuevaTarea.fecha = `${año}-${mes}-${dia}`;
        this.nuevaTarea.fechaFin = '';
      }

      const fechaFormateada = this.nuevaTarea.fecha
        ? (() => {
          const partes = this.nuevaTarea.fecha.split('-');
          if (partes.length === 3) {
            const [y, m, d] = partes;
            return `${d}-${m}-${y}`;
          }
          return '';
        })()
        : '';

      const fechaFinFormateada = this.nuevaTarea.fechaFin
        ? (() => {
          const partes = this.nuevaTarea.fechaFin.split('-');
          if (partes.length === 3) {
            const [yf, mf, df] = partes;
            return `${df}-${mf}-${yf}`;
          }
          return '';
        })()
        : '';

      let horaFormateada = '';
      if (this.nuevaTarea.horaInicio && this.nuevaTarea.horaInicio.includes(':')) {
        const [hourStr, minute] = this.nuevaTarea.horaInicio.split(':');
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        horaFormateada = `${hour}:${minute} ${ampm}`;
      }

      let horaFinFormateada = '';
      if (this.nuevaTarea.horaFin && this.nuevaTarea.horaFin.includes(':')) {
        const [hourStrFin, minuteFin] = this.nuevaTarea.horaFin.split(':');
        let hourFin = parseInt(hourStrFin, 10);
        const ampmFin = hourFin >= 12 ? 'PM' : 'AM';
        hourFin = hourFin % 12 || 12;
        horaFinFormateada = `${hourFin}:${minuteFin} ${ampmFin}`;
      }



      const tareaFormateada: creartarea = {
        titulo: this.nuevaTarea.titulo,
        descripcion: this.nuevaTarea.descripcion,
        fecha: fechaFormateada,
        fechaFin: fechaFinFormateada,
        horaInicio: horaFormateada,
        horaFin: horaFinFormateada,
        estado: this.nuevaTarea.estado
      };

      this.loading.set(true);

      if (this.tareaEditandoId) {
        await this._tareasService.updateTarea(this.tareaEditandoId, tareaFormateada);
      } else {
        await this._tareasService.create(tareaFormateada);
      }

    } catch (error) {
      alert("Ocurrió un error al guardar la tarea");
      console.error(error);
    } finally {
      this.loading.set(false);
    }

    this.cerrarFormulario();
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.nuevaTarea = {
      titulo: '',
      descripcion: '',
      fecha: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: '',
      estado: 'inicio'
    };
    this.tareaEditandoId = null;
  }


  editarTarea(tarea: Tarea) {
    let fechaInicioInput = '';
    let fechaFinInput = '';

    if (tarea.fecha) {
      const [d, m, y] = tarea.fecha.split('-');
      fechaInicioInput = `${y}-${m}-${d}`;
    }

    if (tarea.fechaFin) {
      const [df, mf, yf] = tarea.fechaFin.split('-');
      fechaFinInput = `${yf}-${mf}-${df}`;
    }

    let hora24 = '';
    if (tarea.horaInicio && tarea.horaInicio.includes(':')) {
      const [time, ampm] = tarea.horaInicio.split(' ');
      let [h, mm] = time.split(':').map(x => parseInt(x, 10));
      if (!isNaN(h) && !isNaN(mm)) {
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        const hh = h < 10 ? '0' + h : '' + h;
        const m2 = mm < 10 ? '0' + mm : '' + mm;
        hora24 = `${hh}:${m2}`;
      }
    }

    let horaFin24 = '';
    if (tarea.horaFin && tarea.horaFin.includes(':')) {
      const [time, ampm] = tarea.horaFin.split(' ');
      let [h, mm] = time.split(':').map(x => parseInt(x, 10));
      if (!isNaN(h) && !isNaN(mm)) {
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        const hh = h < 10 ? '0' + h : '' + h;
        const m2 = mm < 10 ? '0' + mm : '' + mm;
        horaFin24 = `${hh}:${m2}`;
      }
    }

    this.nuevaTarea = {
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fecha: fechaInicioInput,
      fechaFin: fechaFinInput,
      horaInicio: hora24,
      horaFin: horaFin24,
      estado: tarea.estado
    };

    this.tareaEditandoId = tarea.id;
    this.mostrarFormulario = true;
  }

  async eliminarTarea(id: string) {
    // 1) Obtener la tarea para ver su estado
    const tarea = this.tareas().find(t => t.id === id);
    // 2) Si es estado "inicio", pedir confirmación
    if (tarea?.estado === 'inicio') {
      if (!confirm('¿Deseas eliminar esta tarea?')) {
        return;
      }
    }

    try {
      await this._tareasService.deleteTarea(id);
    } catch (error) {
      alert("No se pudo eliminar la tarea");
      console.error(error);
    }
  }

  tareaProxima = computed((): Tarea | null => {
    const now = Date.now();

    const inicio = this.tareas().filter(t => t.estado === 'inicio');

    const lista = inicio.map(t => {
      let fechaBase: Date;

      const fechaStr = t.fecha || t.fechaFin || '';
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        const [d, m, y] = partes;
        fechaBase = new Date(Number(y), Number(m) - 1, Number(d));
      } else {
        fechaBase = new Date();
        fechaBase.setHours(0, 0, 0, 0);
      }

      const parse12h = (h12: string) => {
        const [time, ampm] = h12.split(' ');
        const [hh, mm] = time.split(':').map(n => parseInt(n, 10));
        let h24 = hh % 12;
        if (ampm === 'PM') h24 += 12;
        return { h: h24, m: mm };
      };

      let h = 0, mnt = 0;
      if (t.horaInicio?.includes(':')) {
        ({ h, m: mnt } = parse12h(t.horaInicio));
      } else if (t.horaFin?.includes(':')) {
        ({ h, m: mnt } = parse12h(t.horaFin));
      }

      fechaBase.setHours(h, mnt, 0, 0);

      return { tarea: t, ts: fechaBase.getTime() };
    });

    const vencidas = lista.filter(x => x.ts < now);
    const futuras = lista.filter(x => x.ts >= now);

    if (vencidas.length) {
      vencidas.sort((a, b) => (now - b.ts) - (now - a.ts));
      return vencidas[0].tarea;
    }

    if (futuras.length) {
      futuras.sort((a, b) => a.ts - b.ts);
      return futuras[0].tarea;
    }

    return null;
  });

  get mensajeTareaProxima(): string {
    const t = this.tareaProxima();
    if (!t) return 'No hay tareas próximas.';

    let base: Date;

    const fechaStr = t.fecha || t.fechaFin || '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const [d, m, y] = partes;
      base = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      base = new Date();
      base.setHours(0, 0, 0, 0);
    }

    const parse12h = (h12: string): { h: number; m: number } => {
      const [time, ampm] = h12.split(' ');
      const [hh, mm] = time.split(':').map(n => parseInt(n, 10));
      let h24 = hh % 12;
      if (ampm === 'PM') h24 += 12;
      return { h: h24, m: mm };
    };

    let h = 0, mn = 0;
    if (t.horaInicio?.includes(':')) {
      ({ h, m: mn } = parse12h(t.horaInicio));
    } else if (t.horaFin?.includes(':')) {
      ({ h, m: mn } = parse12h(t.horaFin));
    }
    base.setHours(h, mn, 0, 0);

    const now = Date.now();
    const diffMs = base.getTime() - now;

    if (diffMs >= 0) {
      return `Tu próxima tarea es <strong>“${t.titulo}”</strong>.`;

    } else {
      let totalMin = Math.floor(-diffMs / 60000);
      const dias = Math.floor(totalMin / 1440);
      totalMin %= 1440;
      const horas = Math.floor(totalMin / 60);
      const minutos = totalMin % 60;

      let retrasoStr = '';
      if (dias > 0) {
        retrasoStr = `${dias} día${dias > 1 ? 's' : ''}` +
          (horas > 0 ? ` y ${horas} hora${horas > 1 ? 's' : ''}` : '');
      } else {
        retrasoStr = `${horas} hora${horas !== 1 ? 's' : ''}` +
          (minutos > 0 ? ` y ${minutos} minuto${minutos > 1 ? 's' : ''}` : '');
      }

      return `La tarea <strong>“${t.titulo}”</strong> lleva <strong>${retrasoStr}</strong> de retraso y debería estar en <em>“Proceso”</em>.`;

    }
  }

  drop(event: CdkDragDrop<Tarea[]>, nuevoEstado: string) {
    const tareaArrastrada = event.item.data as Tarea;
    if (tareaArrastrada.estado !== nuevoEstado) {
      this._tareasService.updateEstado(tareaArrastrada.id, nuevoEstado);
    }
  }


  seleccionarTarea(tarea: Tarea) {
    this.tareaSeleccionada = tarea;
  }



  async cambiarEstado(tarea: Tarea, direccion: 'siguiente' | 'anterior') {
    const estados = ['inicio', 'proceso', 'finalizado'];
    const idx = estados.indexOf(tarea.estado);
    let nuevoIdx = direccion === 'siguiente' ? idx + 1 : idx - 1;
    nuevoIdx = Math.max(0, Math.min(estados.length - 1, nuevoIdx));
    const nuevoEstado = estados[nuevoIdx];

    if (nuevoEstado !== tarea.estado) {
      await this._tareasService.updateEstado(tarea.id, nuevoEstado);
    }
  }

}
