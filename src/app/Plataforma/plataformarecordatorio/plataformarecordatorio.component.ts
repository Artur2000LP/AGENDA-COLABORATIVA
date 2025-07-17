
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DocumentReference } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { doc, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlataformarecordatorioService } from '../../data-access/plataformarecordatorio.service';
import { GruposService, Grupo } from '../../data-access/grupos.service';
import { ChatService } from '../../data-access/chat.service';
import { TareasService } from '../../data-access/tareasgrupales.service';

@Component({
  selector: 'app-plataformarecordatorio',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, MatTooltipModule,],
  templateUrl: './plataformarecordatorio.component.html',
  styleUrls: ['./plataformarecordatorio.component.css']
})
export default class PlataformarecordatorioComponent implements OnInit {
  private servicio = inject(PlataformarecordatorioService);
  private gruposService = inject(GruposService);
  private chatService = inject(ChatService);
  private tareasService = inject(TareasService);
  private router = inject(Router);

  usuario$ = this.servicio.obtenerUsuario();
  misGrupos = this.gruposService.misGrupos;

  menuAbierto = false;
  colapsada = false;
  isMobile = false;
  tituloActual = 'Recordatorios personales';
  opcionActiva: string = 'recordatorio'; // Inicialmente marcado como activo

  modoAgregarMiembros = false;
  grupoIdActual: string = '';
  nombreGrupoActual: string = '';

  modalCrearGrupoAbierto = false;
  nombreNuevoGrupo = '';
  terminoBusqueda = '';
  resultadosBusqueda: any[] = [];
  miembrosSeleccionados: any[] = [];
  miembrosAbiertos = new Map<string, boolean>();
  miembroEmailAbierto = new Map<string, boolean>();
  usuariosCache: Record<string, { displayName: string; email: string }> = {};
  usuarioActualUid: string = '';

  usuarioActual: { uid: string; displayName: string; email: string } | null = null;

  constructor() { }

  ngOnInit() {
    this.colapsada = true;
    this.checkViewport();
    this.usuario$.pipe(take(1)).subscribe(user => {
      this.usuarioActual = user;
      this.usuarioActualUid = user?.uid || '';
    });



  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  private checkViewport() {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) this.colapsada = false;
  }

  toggleColapsada() {
    if (!this.isMobile) this.colapsada = !this.colapsada;
  }

  toggleMenuMobile() {
    if (this.isMobile) this.menuAbierto = !this.menuAbierto;
  }


  closeMobileMenu() {
    if (this.isMobile) this.menuAbierto = false;
  }

  irAPersonales() {
    this.tituloActual = 'Recordatorios personales';
    this.router.navigate(['']);
    this.closeMobileMenu();

  }

  irAGrupo(grupoId: string, nombre: string) {
    this.tituloActual = nombre;
    this.router.navigate(['recordatorios', 'grupal', grupoId]);
    this.opcionActiva = grupoId;
    this.closeMobileMenu();
  }

  setOpcionActiva(opcion: string) {
    this.opcionActiva = opcion;
  }

  crearGrupo() {
    this.modalCrearGrupoAbierto = true;
    this.nombreNuevoGrupo = '';
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
    this.miembrosSeleccionados = [];
    this.closeMobileMenu();
  }

  abrirModalAgregarMiembros(grupoId: string, nombreGrupo: string) {
    this.modoAgregarMiembros = true;
    this.modalCrearGrupoAbierto = true;
    this.grupoIdActual = grupoId;
    this.nombreGrupoActual = nombreGrupo;
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
    this.miembrosSeleccionados = [];

  }

  cerrarModalGrupo() {
    this.modalCrearGrupoAbierto = false;
    this.nombreNuevoGrupo = '';
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
    this.miembrosSeleccionados = [];
    this.modoAgregarMiembros = false;
    this.grupoIdActual = '';
    this.nombreGrupoActual = '';
  }


  // buscarUsuarios() {
  //   const termino = this.terminoBusqueda.trim();
  //   if (!termino) {
  //     this.resultadosBusqueda = [];
  //     return;
  //   }

  //   this.usuario$.pipe(take(1)).subscribe(usuarioActual => {
  //     if (!usuarioActual || !usuarioActual.uid) return;

  //     this.gruposService.buscarUsuariosPorNombreOCorreo(termino)
  //       .pipe(take(1))
  //       .subscribe(usuarios => {
  //         this.resultadosBusqueda = usuarios.filter(u =>
  //           u.uid !== usuarioActual.uid &&
  //           !this.miembrosSeleccionados.some(sel => sel.uid === u.uid)
  //         );
  //       });
  //   });
  // }

  buscarUsuarios() {
    const termino = this.terminoBusqueda.trim();
    if (!termino) {
      this.resultadosBusqueda = [];
      return;
    }

    this.usuario$.pipe(take(1)).subscribe(usuarioActual => {
      if (!usuarioActual || !usuarioActual.uid) return;

      this.gruposService.buscarUsuariosPorNombreOCorreo(termino)
        .pipe(take(1))
        .subscribe(usuarios => {
          const miembrosGrupoActual = this.grupoIdActual
            ? this.misGrupos().find(g => g.id === this.grupoIdActual)?.miembros || []
            : [];

          this.resultadosBusqueda = usuarios.filter(u =>
            u.uid !== usuarioActual.uid &&
            !this.miembrosSeleccionados.some(sel => sel.uid === u.uid) &&
            !miembrosGrupoActual.includes(u.uid)
          );
        });
    });
  }



  agregarMiembro(usuario: any) {
    this.miembrosSeleccionados.push(usuario);
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
  }

  // quitarMiembro(grupoId: string, uid: string) {
  //   const confirmacion = confirm('¿Estás seguro de quitar a este miembro del grupo?');
  //   if (!confirmacion) return;

  //   this.gruposService.removeMiembro(grupoId, uid)
  //     .then(() => {
  //       delete this.usuariosCache[uid];

  //       this.toggleMiembros(grupoId);
  //       setTimeout(() => this.toggleMiembros(grupoId), 200);
  //     })
  //     .catch(err => {
  //       console.error('Error al quitar miembro:', err);
  //     });
  // }

  quitarMiembro(grupoId: string, uid: string) {
    // Determina si es yo mismo
    const esMiMismo = uid === this.usuarioActualUid;

    // Elige el mensaje adecuado
    const mensaje = esMiMismo
      ? '¿Estás seguro de que deseas salir del grupo?'
      : '¿Estás seguro de expulsar a este miembro del grupo?';

    // Muestra la confirmación
    if (!confirm(mensaje)) return;

    // Llama al servicio
    this.gruposService.removeMiembro(grupoId, uid)
      .then(() => {
        // Si salgo yo mismo, redirige a personal
        if (esMiMismo) {
          this.router.navigate(['']);
        }
        // Limpia caché y refresca la lista
        delete this.usuariosCache[uid];
        this.toggleMiembros(grupoId);
        setTimeout(() => this.toggleMiembros(grupoId), 200);
      })
      .catch(err => {
        console.error('Error al quitar miembro:', err);
      });
  }



  removerMiembro(usuario: any) {
    this.miembrosSeleccionados = this.miembrosSeleccionados.filter(u => u.uid !== usuario.uid);
  }
  abrirModalAgregarMiembro(grupoId: string) {
    this.nombreGrupoActual = this.misGrupos().find(g => g.id === grupoId)?.nombre || 'Grupo';
    this.grupoIdActual = grupoId;
    this.modalCrearGrupoAbierto = true;
    this.modoAgregarMiembros = true;
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
    this.miembrosSeleccionados = [];
  }

  confirmarCrearGrupo() {
    const nombre = this.nombreNuevoGrupo.trim();

    if (this.modoAgregarMiembros && this.grupoIdActual) {
      const nuevosUsuarios = this.miembrosSeleccionados;

      const grupo = this.misGrupos().find(g => g.id === this.grupoIdActual);
      if (grupo && grupo.nombre !== this.nombreGrupoActual) {
        this.gruposService.updateNombre(this.grupoIdActual, this.nombreGrupoActual);
      }

      nuevosUsuarios.forEach(user => {
        this.gruposService.addMiembro(this.grupoIdActual!, user.uid)
          .then(() => {
            this.usuariosCache[user.uid] = {
              displayName: user.displayName || user.uid,
              email: user.email || ''
            };
          })
          .catch(err => console.error('Error al añadir miembro:', err));
      });

      // setTimeout(() => this.toggleMiembros(this.grupoIdActual!), 300);
      this.cerrarModalGrupo();
      return;
    }

    if (!nombre) return;

    this.usuario$
      .pipe(take(1))
      .subscribe(usuario => {
        if (!usuario?.email || !usuario.uid) return;

        const selectedUids = this.miembrosSeleccionados.map(u => u.uid);
        const allUids = Array.from(new Set([usuario.uid, ...selectedUids]));

        this.gruposService.createGrupo({ nombre, miembros: allUids })
          .then((docRef: DocumentReference) => {
            this.cerrarModalGrupo();
            this.tituloActual = nombre;
            this.router.navigate(['recordatorios', 'grupal', docRef.id]);
          })
          .catch(err => console.error('Error al crear grupo:', err));
      });
  }


  async cerrarSesion() {
    await this.servicio.cerrarSesion();
    this.closeMobileMenu();
  }

  toggleMiembros(grupoId: string) {
    const yaEstabaAbierto = this.miembrosAbiertos.get(grupoId) ?? false;
    this.miembrosAbiertos.clear();

    if (!yaEstabaAbierto) {
      this.miembrosAbiertos.set(grupoId, true);
      const grupo = this.misGrupos().find((g: Grupo) => g.id === grupoId);
      if (grupo) {
        grupo.miembros.forEach(uid => {
          if (!this.usuariosCache[uid]) {
            this.gruposService.getUsuario(uid)
              .pipe(take(1))
              .subscribe(user => {
                this.usuariosCache[uid] = {
                  displayName: user.displayName || '',
                  email: user.email || ''
                };
              });
          }
        });
      }
    }
  }


  isAbierto(grupoId: string): boolean {
    return this.miembrosAbiertos.get(grupoId) ?? false;
  }

  toggleEmail(uid: string) {
    const abierto = this.miembroEmailAbierto.get(uid) ?? false;
    this.miembroEmailAbierto.set(uid, !abierto);
  }

  isEmailOpen(uid: string): boolean {
    return this.miembroEmailAbierto.get(uid) ?? false;
  }

  getNombreMiembro(uid: string): string {
    return this.usuariosCache[uid]?.displayName || uid;
  }

  getEmailMiembro(uid: string): string {
    return this.usuariosCache[uid]?.email || '';
  }

  onMiembroClick(uid: string) {
    const user = this.usuariosCache[uid];
    if (user) {
      alert(`Perfil de ${user.displayName}\nCorreo: ${user.email}`);
    }
  }

  async eliminarGrupo(grupoId: string) {
    const confirmado = confirm('¿Eliminar grupo y todos sus datos?');
    if (!confirmado) return;

    try {
      this.chatService.setGrupoId(grupoId);
      await this.chatService.clearAllMessages();
      this.tareasService.setGrupoId(grupoId);
      const snapshot = await getDocs(collection(doc(this.tareasService['firestore'], `tareasgrupales/${grupoId}`), 'tareas'));
      for (const tarea of snapshot.docs) {
        await deleteDoc(tarea.ref);
      }

      await this.gruposService.deleteGrupo(grupoId);
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
    }
  }

  esCreador(grupo: Grupo): boolean {
    return grupo.ownerUid === this.usuarioActualUid;
  }
  get grupoActual(): Grupo | undefined {
    return this.misGrupos().find(g => g.id === this.grupoIdActual);
  }

  // Estado del drag
  posX = 0;
  posY = 0;
  private dragging = false;
  private startX = 0;
  private startY = 0;

  // Cuando comienzas a arrastrar
  startDrag(event: PointerEvent) {
    if (this.menuAbierto) return;         // solo cuando está en 'menu'
    this.dragging = true;
    // registra el punto de inicio relativo al botón
    this.startX = event.clientX - this.posX;
    this.startY = event.clientY - this.posY;
    event.preventDefault();
  }

  // Mientras arrastras
  onDrag(event: PointerEvent) {
    if (!this.dragging) return;
    // calcula nueva posición
    this.posX = event.clientX - this.startX;
    this.posY = event.clientY - this.startY;
    // opcional: límites dentro de la ventana
    const maxX = window.innerWidth - 48; // 3rem ≈ 48px
    const maxY = window.innerHeight - 48;
    this.posX = Math.max(0, Math.min(this.posX, maxX));
    this.posY = Math.max(0, Math.min(this.posY, maxY));
  }

  // Al soltar
  endDrag() {
    this.dragging = false;
  }

}
