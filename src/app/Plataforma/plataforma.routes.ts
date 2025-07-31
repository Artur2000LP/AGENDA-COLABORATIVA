

import { Routes } from '@angular/router';
import { authGuard } from '../guard/auth.guard';
import { perteneceAlGrupoGuard } from '../guard/pertenece-al-grupo.guard';

export default [
  {
    path: '',
    canActivate: [authGuard], //  Protege toda esta ruta y sus hijos
    loadComponent: () =>
      import('./plataformarecordatorio/plataformarecordatorio.component').then(m => m.default),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./recordatoriopersonal/recordatoriopersonal.component').then(m => m.default),
      },
      {
        path: 'grupal',
        loadComponent: () =>
          import('./recordatoriogrupal/recordatoriogrupal.component').then(m => m.default),
      },
      // {
      //   path: 'grupal/:grupoId', //  ruta dinámica protegida también
      //   loadComponent: () =>
      //     import('./recordatoriogrupal/recordatoriogrupal.component'),
      // },
      {
        path: 'grupal/:grupoId',
        loadComponent: () =>
          import('./recordatoriogrupal/recordatoriogrupal.component'),
          // canActivate: [authGuard, perteneceAlGrupoGuard], //  Agregado
      },
      {
        path: 'ayuda',
        loadComponent: () =>
          import('./ayuda/ayuda.component'),
      }
    ],
  },
] as Routes;
