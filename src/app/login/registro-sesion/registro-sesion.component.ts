

// registro-sesion.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// Importa el servicio y funciones de Firebase
import { AutenticacionService } from '../../data-access/autenticacion.service';
import { updateProfile } from 'firebase/auth';

@Component({
  selector: 'app-registro-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro-sesion.component.html',
  styleUrls: ['./registro-sesion.component.css']
})
export default class RegistroSesionComponent {
  showPassword = false;
  showPasswordConfirm = false;
  mensaje = '';

  constructor(
    private authService: AutenticacionService,
    private router: Router
  ) { }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowPasswordConfirm(): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }

  /**
   * Maneja el submit del formulario de registro usando async/await
   */
  async onSubmit(form: NgForm) {
    const { nombre, email, password, confirmPassword } = form.value;

    // Validación de contraseñas
    if (password !== confirmPassword) {
      this.mensaje = '❌ Las contraseñas no coinciden';
      return;
    }

    try {
      const cred = await this.authService.register(email, password);
      console.log('Usuario registrado en Firebase:', cred.user);

      // Actualiza displayName usando función modular
      if (cred.user) {
        await updateProfile(cred.user, { displayName: nombre });
                // 👈 GUARDA después de actualizar el nombre
        await this.authService.guardarUsuarioFirestore(cred.user);
        console.log('Nombre asignado:', nombre);
      }

      this.mensaje = '✅ Registro exitoso. Redirigiendo...';
      this.router.navigate(['/recordatorios']);
      // setTimeout(() => this.router.navigate(['/login/inicio-sesion']), 1500);

    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.mensaje = '❌ Este correo ya está registrado';
          break;
        case 'auth/invalid-email':
          this.mensaje = '❌ Correo inválido';
          break;
        case 'auth/weak-password':
          this.mensaje = '❌ La contraseña es muy débil';
          break;
        default:
          this.mensaje = '❌ Error en el registro';
      }
    }
  }
}
