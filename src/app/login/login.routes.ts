

import { Routes } from '@angular/router';
import { guestGuard } from '../guard/auth.guard'; // importa el guard

export default [
  {
    path: 'inicio-sesion',
    loadComponent: () => import('./inicio-sesion/inicio-sesion.component'),
    canActivate: [guestGuard],
  },
  {
    path: 'registro-sesion',
    loadComponent: () => import('./registro-sesion/registro-sesion.component'),
    canActivate: [guestGuard],
  },
  {
    path: 'recuperar-acceso',
    loadComponent: () => import('./recuperar-acceso/recuperar-acceso.component'),
    canActivate: [guestGuard],
  },
] as Routes;
