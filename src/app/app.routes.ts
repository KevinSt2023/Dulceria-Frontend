import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/guard';
import { MainLayout } from './layout/main-layout';

// rol_id:
// 1 = Administrador
// 2 = Vendedor
// 3 = Produccion
// 4 = Cajero
// 5 = Distribuidor

export const routes: Routes = [
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],   // ← mínimo: estar logueado
    children: [

      // Dashboard — todos los roles
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },

      // Inventario — solo Administrador
      {
        path: 'productos',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/productos/productos').then(m => m.ProductosComponent)
      },
      {
        path: 'inventario',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/inventario/inventario').then(m => m.InventarioComponent)
      },
      {
        path: 'categorias',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/categorias/categorias').then(m => m.CategoriasComponent)
      },
      {
        path: 'tipos_productos',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/tipos_productos/tipos_productos').then(m => m.TiposComponent)
      },
      {
        path: 'unidades',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/unidades/unidades').then(m => m.UnidadesComponent)
      },
      {
        path: 'roles',
        canActivate: [roleGuard([0])],
        loadComponent: () => import('./features/roles/roles').then(m => m.RolesComponent)
      },

      // Ventas — Administrador y Cajero
      //{
        //path: 'pos',
       // canActivate: [roleGuard([1, 4])],
        //loadComponent: () => import('./features/ventas/pos.component').then(m => m.PosComponent)
      //},
      //{
       // path: 'comprobantes',
       // canActivate: [roleGuard([1, 4])],
       // loadComponent: () => import('./features/ventas/comprobantes.component').then(m => m.ComprobantesComponent)
      //},

      // Pedidos — Administrador y Vendedor
      {
        path: 'pedidos',
        canActivate: [roleGuard([1, 2,3,0])],
        loadComponent: () => import('./features/pedidos/pedidos').then(m => m.PedidosComponent)
      },

      // Seguimiento — Administrador, Produccion y Distribuidor
      //{
      //  path: 'seguimiento',
       // canActivate: [roleGuard([1, 3, 5])],
       // loadComponent: () => import('./features/pedidos/seguimiento.component').then(m => m.SeguimientoComponent)
    //  },

      // Configuración — solo Administrador
      {
        path: 'usuarios',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/usuarios/usuarios').then(m => m.UsuarioComponent)
      },
      {
        path: 'sucursales',
        canActivate: [roleGuard([0])],
        loadComponent: () => import('./features/sucursales/sucursales').then(m => m.SucursalesComponent)
      },
      {
        path: 'almacenes',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/almacenes/almacenes').then(m => m.AlmacenesComponent)
      },
      {
        path: 'clientes',
        canActivate: [roleGuard([1,0])],
        loadComponent: () => import('./features/clientes/clientes').then(m => m.CLienteComponent)
      },
      
      {
        path: 'seguimiento',
        loadComponent: () =>
          import('./features/seguimiento/seguimiento')
            .then(m => m.SeguimientoComponent)
      },

      {
        path: 'catalogo-sede',
        loadComponent: () =>
          import('./features/producto-sucursal/producto-sucursal')
            .then(m => m.ProductoSucursalComponent)
      },

      {
        path: 'distribucion',
        loadComponent: () =>
          import('./features/distribucion/distribucion')
            .then(m => m.DistribucionComponent)
      },

      {
        path: 'configuracion-pago',
        loadComponent: () =>
          import('./features/configuracion-pago/configuracion-pago')
            .then(m => m.ConfiguracionPagoComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { path: '**', redirectTo: '' }
];
