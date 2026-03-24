import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { MainLayout } from './layout/main-layout';
import { authGuard } from './core/guards/guard';

export const routes: Routes = [

  // LOGIN
  {
    path: '',
    component: Login
  },

  // ERP PROTEGIDO
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/productos')
            .then(m => m.ProductosComponent)
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/categorias/categorias')
            .then(m => m.CategoriasComponent)
      },
      {
        path: 'tipos_productos',
        loadComponent: () =>
          import('./features/tipos_productos/tipos_productos')
            .then(m => m.TiposComponent)
      },
      {
        path: 'unidades',
        loadComponent: () =>
          import('./features/unidades/unidades')
            .then(m => m.UnidadesComponent)
      },
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home')
          .then(m => m.HomeComponent)
      }
    ]
  },

  // fallback
  {
    path: '**',
    redirectTo: ''
  }
];