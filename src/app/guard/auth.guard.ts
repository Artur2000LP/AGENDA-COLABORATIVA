// src/app/auth.guard.ts
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { user } from 'rxfire/auth';
import { firstValueFrom } from 'rxjs';

// Permite solo si el usuario está autenticado
export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const currentUser = await firstValueFrom(user(auth));

  if (currentUser) return true;

  router.navigate(['/login/inicio-sesion']);
  return false;
};

// Bloquea el acceso a rutas de login si ya está logeado
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const currentUser = await firstValueFrom(user(auth));

  if (!currentUser) return true;

  router.navigate(['/recordatorios']);
  return false;
};
