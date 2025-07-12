

import { Injectable, inject } from '@angular/core';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlataformarecordatorioService {
  private auth = inject(Auth);
  private router = inject(Router);
  obtenerUsuario() {
    return authState(this.auth).pipe(
      map(user => user ? {
        uid: user.uid, // ✅ necesario
        displayName: user.displayName || '',
        email: user.email || ''
      } : null)
    );
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login/inicio-sesion']);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

}

