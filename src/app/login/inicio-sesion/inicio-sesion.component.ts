// // inicio-sesion.component.ts
// import { Component } from '@angular/core';
// import { RouterModule, Router } from '@angular/router';
// import { FormsModule, NgForm } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-inicio-sesion',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './inicio-sesion.component.html',
//   styleUrls: ['./inicio-sesion.component.css']
// })
// export default class InicioSesionComponent {
//   showPassword = false;
//   mensaje = '';

//   usuariosValidos = [
//     { email: 'usuario@ejemplo.com', password: '123456' },
//     { email: 'admin@correo.com', password: 'admin123' }
//   ];

//   constructor(private router: Router) {}

//   toggleShowPassword(): void {
//     this.showPassword = !this.showPassword;
//   }

//   onSubmit(form: NgForm) {
//     const { email, password } = form.value;

//     const usuarioEncontrado = this.usuariosValidos.find(
//       u => u.email === email && u.password === password
//     );

//     this.mensaje = usuarioEncontrado
//       ? '✅ Inicio de sesión exitoso'
//       : '❌ Correo o contraseña incorrectos';

//     if (!usuarioEncontrado) {
//       form.resetForm();
//     }
//   }

//   loginConGoogle(): void {
//     console.log('Iniciando sesión con Google...');
//     this.mensaje = '🔐 Inicio de sesión con Google simulado';
//   }
// }

// // inicio-sesion.component.ts
// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { FormsModule, NgForm } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { AutenticacionService } from '../../data-access/autenticacion.service';

// @Component({
//   selector: 'app-inicio-sesion',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './inicio-sesion.component.html',
//   styleUrls: ['./inicio-sesion.component.css']
// })
// export default class InicioSesionComponent {
//   showPassword = false;
//   mensaje = '';

//   constructor(
//     private router: Router,
//     private authService: AutenticacionService
//   ) {}

//   toggleShowPassword(): void {
//     this.showPassword = !this.showPassword;
//   }

//   /**
//    * Inicia sesión con Firebase
//    */
//   async onSubmit(form: NgForm) {
//     const { email, password } = form.value;

//     try {
//       const cred = await this.authService.login(email, password);
//       console.log('Inicio de sesión exitoso:', cred.user);

//       this.mensaje = '✅ Inicio de sesión exitoso';
//       this.router.navigate(['/recordatorios']); // redirige a tu plataforma

//     } catch (error: any) {
//       console.error('Error al iniciar sesión:', error);

//       switch (error.code) {
//         case 'auth/user-not-found':
//           this.mensaje = '❌ Usuario no registrado';
//           break;
//         case 'auth/wrong-password':
//           this.mensaje = '❌ Contraseña incorrecta';
//           break;
//         case 'auth/invalid-email':
//           this.mensaje = '❌ Correo inválido';
//           break;
//         default:
//           this.mensaje = '❌ Error al iniciar sesión';
//       }

//       form.resetForm();
//     }
//   }

//   loginConGoogle(): void {
//     console.log('Iniciando sesión con Google... (no implementado todavía)');
//     this.mensaje = '🔐 Inicio de sesión con Google simulado';
//   }
// }


import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AutenticacionService } from '../../data-access/autenticacion.service';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export default class InicioSesionComponent {
  showPassword = false;
  mensaje = '';

  constructor(
    private router: Router,
    private authService: AutenticacionService
  ) {}

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Inicia sesión con correo y contraseña usando Firebase
   */
  async onSubmit(form: NgForm) {
    const { email, password } = form.value;

    try {
      const cred = await this.authService.login(email, password);
      console.log('Inicio de sesión exitoso:', cred.user);

      this.mensaje = '✅ Inicio de sesión exitoso';
      this.router.navigate(['/recordatorios']);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      switch (error.code) {
        case 'auth/user-not-found':
          this.mensaje = '❌ Usuario no registrado';
          break;
        case 'auth/wrong-password':
          this.mensaje = '❌ Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          this.mensaje = '❌ Correo inválido';
          break;
        default:
          this.mensaje = '❌ Error al iniciar sesión';
      }

      form.resetForm();
    }
  }

  /**
   * Inicia sesión con Google usando Firebase
   */
  async loginConGoogle() {
    try {
      const cred = await this.authService.loginWithGoogle();
      console.log('Usuario con Google:', cred.user);

      this.mensaje = `✅ ¡Hola ${cred.user?.displayName || 'usuario'}!`;
      this.router.navigate(['/recordatorios']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      this.mensaje = '❌ No se pudo iniciar sesión con Google';
    }
  }
}
