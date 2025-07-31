
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
