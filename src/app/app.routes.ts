// import { Routes } from '@angular/router';

// export const routes: Routes = [
//     {
//         path: 'login',
//         loadChildren: ()=> import('./login/login.routes'),
//     },
//     {
//         path: 'recordatorios',
//         loadChildren: ()=> import('./plataforma.routes'),
//     },
//     {
//         path: '**',
//         redirectTo: 'recordatorios',
//     }

// ];


import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.routes'),
  },
  {
    path: 'recordatorios',
    loadChildren: () => import('./Plataforma/plataforma.routes'),
  },
  {
    path: '**',
    redirectTo: 'recordatorios',
  },
];
