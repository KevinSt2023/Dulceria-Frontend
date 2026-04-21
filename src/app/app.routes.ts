import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/guard';
import { MainLayout } from './layout/main-layout';

export const routes: Routes = [
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
    children: [

      // ── DASHBOARD — todos los roles ──
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then(m => m.DashboardComponent)
      },

      // ── INVENTARIO — Admin y SuperAdmin ──
      {
        path: 'productos',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/productos/productos')
            .then(m => m.ProductosComponent)
      },
      {
        path: 'inventario',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/inventario/inventario')
            .then(m => m.InventarioComponent)
      },
      {
        path: 'categorias',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/categorias/categorias')
            .then(m => m.CategoriasComponent)
      },
      {
        path: 'tipos_productos',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/tipos_productos/tipos_productos')
            .then(m => m.TiposComponent)
      },
      {
        path: 'unidades',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/unidades/unidades')
            .then(m => m.UnidadesComponent)
      },
      {
        path: 'catalogo-sede',
        canActivate: [roleGuard([1])], // solo Admin
        loadComponent: () =>
          import('./features/producto-sucursal/producto-sucursal')
            .then(m => m.ProductoSucursalComponent)
      },

      // ── VENTAS — Admin, SuperAdmin y Cajero ──
      {
        path: 'pos',
        canActivate: [roleGuard([0, 1, 4])],
        loadComponent: () =>
          import('./features/pos/pos')
            .then(m => m.PosComponent)
      },
      {
        path: 'comprobantes',
        canActivate: [roleGuard([0, 1, 4])],
        loadComponent: () =>
          import('./features/comprobantes/comprobantes')
            .then(m => m.ComprobantesComponent)
      },

      // ── PEDIDOS — Admin, SuperAdmin y Vendedor ──
      {
        path: 'pedidos',
        canActivate: [roleGuard([0, 1, 2])],
        loadComponent: () =>
          import('./features/pedidos/pedidos')
            .then(m => m.PedidosComponent)
      },
      {
        path: 'catalogo',
        canActivate: [roleGuard([1, 2])], // Admin, Vendedor
        loadComponent: () =>
          import('./features/catalogos/catalogo')
            .then(m => m.CatalogoComponent)
      },

      // ── PRODUCCIÓN — Admin, SuperAdmin y Producción ──
      {
        path: 'seguimiento',
        canActivate: [roleGuard([0, 1, 3])],
        loadComponent: () =>
          import('./features/seguimiento/seguimiento')
            .then(m => m.SeguimientoComponent)
      },

      // ── DISTRIBUCIÓN — Admin, SuperAdmin y Distribuidor ──
      {
        path: 'distribucion',
        canActivate: [roleGuard([0, 1, 5])],
        loadComponent: () =>
          import('./features/distribucion/distribucion')
            .then(m => m.DistribucionComponent)
      },

      // ── CONFIGURACIÓN — Admin y SuperAdmin ──
      {
        path: 'usuarios',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/usuarios/usuarios')
            .then(m => m.UsuarioComponent)
      },
      {
        path: 'clientes',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/clientes/clientes')
            .then(m => m.CLienteComponent)
      },
      {
        path: 'roles',
        canActivate: [roleGuard([0])], // solo SuperAdmin
        loadComponent: () =>
          import('./features/roles/roles')
            .then(m => m.RolesComponent)
      },
      {
        path: 'sucursales',
        canActivate: [roleGuard([0])], // solo SuperAdmin
        loadComponent: () =>
          import('./features/sucursales/sucursales')
            .then(m => m.SucursalesComponent)
      },
      {
        path: 'almacenes',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/almacenes/almacenes')
            .then(m => m.AlmacenesComponent)
      },
      {
        path: 'configuracion-pago',
        canActivate: [roleGuard([0, 1])],
        loadComponent: () =>
          import('./features/configuracion-pago/configuracion-pago')
            .then(m => m.ConfiguracionPagoComponent)
      },
      {
        path: 'configuracion-negocio',
        canActivate: [roleGuard([0])], // solo SuperAdmin
        loadComponent: () =>
          import('./features/configuracion-negocio/configuracion-negocio')
            .then(m => m.ConfiguracionNegocioComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: '',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login)
  },
  { path: '**', redirectTo: '' }
];