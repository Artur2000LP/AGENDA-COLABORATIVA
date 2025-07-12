// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-recuperar-acceso',
//   standalone: true,
//   imports: [],
//   templateUrl: './recuperar-acceso.component.html',
//   styleUrl: './recuperar-acceso.component.css'
// })
// export class RecuperarAccesoComponent {

// }



// // recuperar-acceso.component.ts
// import { Component } from '@angular/core';
// import { NgForm } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule, Router } from '@angular/router';

// @Component({
//   selector: 'app-recuperar-acceso',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './recuperar-acceso.component.html',
//   styleUrls: ['./recuperar-acceso.component.css']
// })
// export default class RecuperarAccesoComponent {
//   mensaje = '';

//   constructor(private router: Router) {}

//   onSubmit(form: NgForm) {
//     const { email } = form.value;

//     // Simulación: aquí llamarías a tu servicio de recuperación
//     this.mensaje = '📧 Recibirás un mensaje en ~24 h';

//     setTimeout(() => {
//       this.router.navigate(['/login/inicio-sesion']);
//     }, 3000);
//   }
// }


// // recuperar-acceso.component.ts
// import { Component } from '@angular/core';
// import { NgForm } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule, Router } from '@angular/router';
// import { AutenticacionService } from '../../data-access/autenticacion.service';

// @Component({
//   selector: 'app-recuperar-acceso',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './recuperar-acceso.component.html',
//   styleUrls: ['./recuperar-acceso.component.css']
// })
// export default class RecuperarAccesoComponent {
//   mensaje = '';

//   constructor(
//     private authService: AutenticacionService,
//     private router: Router
//   ) {}

//   async onSubmit(form: NgForm) {
//     const { email } = form.value;

//     try {
//       await this.authService.resetPassword(email);
//       this.mensaje = '📧 Revisa tu correo(spam) para restablecer la contraseña';
//       setTimeout(() => this.router.navigate(['/login/inicio-sesion']), 3000);
//     } catch (error: any) {
//       console.error('Error al enviar el correo:', error);
//       switch (error.code) {
//         case 'auth/user-not-found':
//           this.mensaje = '❌ Este correo no está registrado';
//           break;
//         case 'auth/invalid-email':
//           this.mensaje = '❌ Correo inválido';
//           break;
//         default:
//           this.mensaje = '❌ Error al enviar el enlace';
//       }
//     }
//   }
// }
// recuperar-acceso.component.ts
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AutenticacionService } from '../../data-access/autenticacion.service';

@Component({
  selector: 'app-recuperar-acceso',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recuperar-acceso.component.html',
  styleUrls: ['./recuperar-acceso.component.css']
})
export default class RecuperarAccesoComponent {
  mensaje = '';

  constructor(
    private authService: AutenticacionService,
    private router: Router
  ) {}

  async onSubmit(form: NgForm) {
    const { email } = form.value;

    try {
      await this.authService.resetPassword(email);

      // Mensaje neutral y seguro
      this.mensaje = '📧 Link enviado, revisa tu correo(spam)';

      // Redirige tras 3 segundos
      setTimeout(() => this.router.navigate(['/login/inicio-sesion']), 5000);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      this.mensaje = '❌ No se pudo enviar el enlace. Intenta nuevamente.';
    }
  }
}
