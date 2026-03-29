import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
<div class="flex h-screen bg-gray-100">

  <!-- SIDEBAR -->
  <aside class="w-64 bg-slate-900 text-white flex flex-col shadow-lg">

    <!-- LOGO -->
    <div class="p-6 text-2xl font-bold border-b border-slate-700 tracking-wide">
      🍰 DulcesERP
    </div>

    <nav class="flex-1 p-4 space-y-6 text-sm">

      <!-- PRINCIPAL -->
      <div>
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">
          Dashboard
        </div>

        <a routerLink="/app/dashboard" class="block p-2 rounded hover:bg-slate-700">
          📊 Dashboard
        </a>
      </div>   

      <!-- INVENTARIO -->
      <div>
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">
          Inventario
        </div>

        <button (click)="toggle('inv')" class="menu-btn">
          📦 Gestión
        </button>

        <div *ngIf="openMenu === 'inv'" class="submenu">
          <a routerLink="/app/productos">Productos</a>
          <a routerLink="/app/inventario">Inventario</a>
          <a routerLink="/app/categorias">Categorías</a>
          <a routerLink="/app/tipos_productos">Tipos</a>
          <a routerLink="/app/unidades">Unidades</a>
        </div>
      </div>

      <!-- VENTAS -->
      <div>
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">
          Ventas
        </div>

        <button (click)="toggle('ventas')" class="menu-btn">
          💰 Facturación
        </button>

        <div *ngIf="openMenu === 'ventas'" class="submenu">
          <a routerLink="/app/pos">Punto de Venta</a>
          <a routerLink="/app/comprobantes">Comprobantes</a>
          <a routerLink="/app/historial">Historial</a>
        </div>
      </div>

      <!-- PEDIDOS -->
      <div>
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">
          Pedidos
        </div>

        <button (click)="toggle('pedidos')" class="menu-btn">
          🛵 Órdenes
        </button>

        <div *ngIf="openMenu === 'pedidos'" class="submenu">
          <a routerLink="/app/pedidos">Pedidos</a>
          <a routerLink="/app/seguimiento">Seguimiento</a>
        </div>
      </div>

      <!-- CONFIG -->
      <div>
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">
          Configuración
        </div>

        <button (click)="toggle('conf')" class="menu-btn">
          ⚙️ Sistema
        </button>

        <div *ngIf="openMenu === 'conf'" class="submenu">
          <a routerLink="/app/usuarios">Usuarios</a>
          <a routerLink="/app/roles">Roles</a>
          <a routerLink="/app/sucursales">Sucursales</a>
          <a routerLink="/app/almacenes">Almacenes</a>
        </div>
      </div>

    </nav>

    <div class="p-4 border-t border-slate-700 text-xs text-gray-400 text-center">
      v1.0 ERP
    </div>

  </aside>

  <!-- MAIN -->
  <div class="flex-1 flex flex-col">

    <!-- HEADER -->
    <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">

      <h1 class="text-lg font-semibold text-gray-700">
        Panel de Control
      </h1>

      <div class="flex items-center gap-4">
        <span class="text-gray-600 font-medium">Admin</span>

        <button
          (click)="logout()"
          class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition text-sm"
        >
          Salir
        </button>
      </div>

    </header>

    <!-- CONTENT -->
    <main class="p-6 flex-1 overflow-auto">

      <div class="bg-white rounded-xl shadow p-6 min-h-full">
        <router-outlet></router-outlet>
      </div>

    </main>

  </div>

</div>
`,
styles: [`
.menu-btn {
  width: 100%;
  text-align: left;
  padding: 8px;
  border-radius: 6px;
  transition: 0.2s;
}
.menu-btn:hover {
  background: #334155;
}

.submenu a {
  display: block;
  padding: 6px 10px;
  border-radius: 6px;
  transition: 0.2s;
  color: #cbd5f5;
}
.submenu a:hover {
  background: #334155;
  color: white;
}
`]

})
export class MainLayout {

  openMenu: string | null = null;

  toggle(menu: string) {
    this.openMenu = this.openMenu === menu ? null : menu;
  }

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
}