import { Component, inject, signal, computed, ViewEncapsulation, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { creartarea, TareasService, Tarea } from '../../data-access/tareasgrupales.service';
import { effect } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ChatGeneralComponent } from '../chat-general/chat-general.component';
import { ChatService } from '../../data-access/chat.service';
import { Timestamp } from 'firebase/firestore';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { GruposService } from '../../data-access/grupos.service';
import { AutenticacionService } from '../../data-access/autenticacion.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

import { ViewChild, TemplateRef, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-recordatoriogrupal',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    CommonModule, MatIconModule,
    DragDropModule,
    MatDatepickerModule,
    // ← aquí
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    ChatGeneralComponent
  ],
  templateUrl: './recordatoriogrupal.component.html',
  styleUrls: ['./recordatoriogrupal.component.css', './plataforma.adaptableMovil.css'],
  encapsulation: ViewEncapsulation.None
})
export default class RecordatoriogrupalComponent {
  private _tareasService = inject(TareasService);
  fechaActual: Date = new Date();

  mostrarFormulario = false;
  tareas = this._tareasService.optenerTarea;

  mostrarModalNombre = false;

  usuarioUid: string = '';
  ownerUidGrupo: string = '';


  // 1) Referencia al template de diálogo
  @ViewChild('dialogAsignar') dialogAsignarTpl!: TemplateRef<any>;

  // 2) Array para guardar los miembros del grupo
  miembrosDelGrupo: { uid: string; nombre: string }[] = [];

  private dialog = inject(MatDialog);

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
    estado: 'inicio',
    assignedToNames: []
  };

  tareaEditandoId: string | null = null;
  tareaSeleccionada: Tarea | null = null;
  loading = signal(false);
  // nombreUsuario: string = '';
  auth = inject(Auth);
  isMobile = signal(window.innerWidth < 600);

  mostrarModalTareas = signal(false);
  tareasSeleccionadas: Tarea[] = [];
  fechaSeleccionada: string = '';
  responsableSeleccionado: string = '';

  // Style element guard
  private styleEl?: HTMLStyleElement;
  tooltipTareasEl?: HTMLDivElement; // 👈 ✅ AGREGA ESTA LÍNEA


  grupoId: string = '';
  grupoNombre = signal<string>('Cargando...');
  accesoPermitido = signal<boolean>(false);


  constructor(private chatService: ChatService,
    private route: ActivatedRoute,
    private router: Router,
    private gruposService: GruposService,
    private authService: AutenticacionService) {
    // effect(() => {
    //   this.tareas().forEach(t => {
    //     console.log(`ID: ${t.id}, Título: ${t.titulo}`);
    //   });
    // });
    // Efecto reactivo para recalcular sets e inyectar CSS
    effect(() => {
      const tareas = this.tareas();
      this.pintarFechaDeTareasGrupal(tareas);
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

  // ngOnInit() {
  //   this.route.paramMap.subscribe(params => {
  //     const id = params.get('grupoId');
  //     if (id) {
  //       const grupoId = params.get('grupoId')!;
  //       this._tareasService.setGrupoId(grupoId);
  //       this.chatService.setGrupoId(grupoId);

  //     }
  //   });

  // }

  // ngOnInit() {
  //   this.route.paramMap.subscribe(params => {
  //     const grupoId = params.get('grupoId');
  //     if (!grupoId) return;

  //     this._tareasService.setGrupoId(grupoId);
  //     this.chatService.setGrupoId(grupoId);

  //     // ← Aquí cargas los miembros del grupo
  //     this.gruposService.getMiembros(grupoId)
  //       .subscribe((lista: { uid: string; nombre: string }[]) => this.miembrosDelGrupo = lista);

  //   });
  // }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const grupoId = params.get('grupoId');
      if (!grupoId) return;

      this._tareasService.setGrupoId(grupoId);
      this.chatService.setGrupoId(grupoId);

      this.grupoId = grupoId;

      // 1. Obtener miembros del grupo
      this.gruposService.getMiembros(grupoId).subscribe((lista: { uid: string; nombre: string }[]) => {
        this.miembrosDelGrupo = lista;
      });

      // 2. Obtener datos del grupo (incluye el ownerUid)
      this.gruposService.getGrupoById(grupoId).subscribe(grupo => {
        this.ownerUidGrupo = grupo.ownerUid;
      });

      // 3. Obtener el UID del usuario actual
      this.auth.onAuthStateChanged(user => {
        if (user) {
          this.usuarioUid = user.uid;
        }
      });
    });
  }


  nombreUsuario() {
    return this.auth.currentUser?.displayName ?? 'Usuario';
  }

  abrirDialogAsignar() {
    this.dialog.open(this.dialogAsignarTpl, { width: '280px' });
  }


  // seleccionarResponsable(nombre: string) {
  //   this.nuevaTarea.assignedToName = nombre;
  //   this.dialog.closeAll();
  // }

  // seleccionarResponsable(nombre: string) {
  //   this.responsableSeleccionado = nombre;
  //   this.nuevaTarea.assignedToName = nombre; // <-- Esto guarda el nombre en el objeto que irá a Firebase
  //   this.dialog.closeAll();
  // }

  seleccionarResponsable(nombre: string) {
    const arr = this.nuevaTarea.assignedToNames;
    const idx = arr.indexOf(nombre);
    if (idx === -1) {
      arr.push(nombre);        // si no estaba, lo añade
    } else {
      arr.splice(idx, 1);      // si ya estaba, lo quita
    }
    this.dialog.closeAll();
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
      const tareasDelDia = this._tareasService.optenerTarea().filter(t => (t.fecha || t.fechaFin) === key);

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



  /** Inyecta CSS, tooltips y manejo de click para abrir modal de tareas (componente grupal) */
  private pintarFechaDeTareasGrupal(tareas: Tarea[]) {
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

    // 3) Agrupa tareas por fecha
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

    // 4) Clave de hoy ("dd-mm-yyyy")
    const hoy = new Date();
    const dh = String(hoy.getDate()).padStart(2, '0');
    const mh = String(hoy.getMonth() + 1).padStart(2, '0');
    const yh = hoy.getFullYear();
    const claveHoy = `${dh}-${mh}-${yh}`;

    // 5) Construye reglas CSS prefijadas con .calendario-grupal
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
        `.calendario-grupal button.mat-calendar-body-cell[aria-label="${label}"] .mat-calendar-body-cell-content { ${styleStr} }`
      );
    });

    // 6) Inyecta el <style> marcado como “grupal”
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-owner', 'grupal');
    this.styleEl.textContent = reglas.join('\n');
    document.head.appendChild(this.styleEl);

    // 7) Tooltips y eventos de click/anotaciones
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
    if (!this.nuevaTarea.horaInicio &&
      !this.nuevaTarea.horaFin &&
      !this.nuevaTarea.fecha &&
      !this.nuevaTarea.fechaFin) {
      alert("Debes ingresar al menos una hora: inicio o fin.");
      return;
    }

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
        estado: this.nuevaTarea.estado,
        // assignedToName: this.nuevaTarea.assignedToName || ''
        assignedToNames: [...this.nuevaTarea.assignedToNames]
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
      estado: 'inicio',
      assignedToNames: []
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
      estado: tarea.estado,
      // assignedToName: tarea.assignedToName || ''
      assignedToNames: [...(tarea.assignedToNames || [])]
    };

    this.tareaEditandoId = tarea.id;
    this.mostrarFormulario = true;
  }


  async eliminarTarea(id: string) {
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
