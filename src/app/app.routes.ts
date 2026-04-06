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
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/usuarios')
            .then(m => m.UsuarioComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles')
            .then(m => m.RolesComponent)
      },
      {
        path: 'sucursales',
        loadComponent: () =>
          import('./features/sucursales/sucursales')
            .then(m => m.SucursalesComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'almacenes',
        loadComponent: () =>
          import('./features/almacenes/almacenes')
            .then(m => m.AlmacenesComponent)
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/inventario/inventario')
            .then(m => m.InventarioComponent)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes')
            .then(m => m.CLienteComponent)
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