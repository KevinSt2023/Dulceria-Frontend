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
  <aside class="w-64 bg-slate-900 text-white flex flex-col">

    <div class="p-6 text-2xl font-bold border-b border-slate-700">
      🍰 DulcesERP
    </div>

    <nav class="flex-1 p-4 space-y-4">

      <!-- INVENTARIO -->
      <div>
        <div class="text-sm text-gray-400 mb-2">INVENTARIO</div>

        <div
          class="cursor-pointer p-2 rounded hover:bg-slate-700"
          (click)="toggle('inv')"
        >
          📦 Gestión
        </div>

        <div *ngIf="openMenu === 'inv'" class="ml-3 mt-2 space-y-1">
          <a routerLink="/app/productos" class="block p-2 rounded hover:bg-slate-700">Productos</a>
          <a routerLink="/app/categorias" class="block p-2 rounded hover:bg-slate-700">Categorias</a>
          <a routerLink="/app/tipos_productos" class="block p-2 rounded hover:bg-slate-700">Origen de Productos</a>
          <a routerLink="/app/unidades" class="block p-2 rounded hover:bg-slate-700">Unidades de Medida</a>
        </div>
      </div>

      <!-- CONFIG -->
      <div>
        <div class="text-sm text-gray-400 mb-2">CONFIGURACIÓN</div>

        <div
          class="cursor-pointer p-2 rounded hover:bg-slate-700"
          (click)="toggle('conf')"
        >
          ⚙️ Sistema
        </div>

        <div *ngIf="openMenu === 'conf'" class="ml-3 mt-2 space-y-1">
          <a routerLink="/app/usuarios" class="block p-2 rounded hover:bg-slate-700">Usuarios</a>
          <a routerLink="/app/roles" class="block p-2 rounded hover:bg-slate-700">Rol de usuarios</a>
        </div>
      </div>

    </nav>

    <div class="p-4 border-t border-slate-700 text-sm text-gray-400">
      v1.0 ERP
    </div>

  </aside>

  <!-- MAIN -->
  <div class="flex-1 flex flex-col">

    <!-- HEADER -->
    <header class="bg-white shadow-md px-6 py-4 flex justify-between items-center">

      <h1 class="text-lg font-semibold text-gray-700">
        Panel de Control
      </h1>

      <div class="flex items-center gap-4">
        <span class="text-gray-600">Admin</span>

        <button
          (click)="logout()"
          class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
        >
          Salir
        </button>
      </div>

    </header>

    <!-- CONTENT -->
    <main class="p-6 flex-1 overflow-auto">

      <div class="bg-white rounded-xl shadow p-6">
        <router-outlet></router-outlet>
      </div>

    </main>

  </div>

</div>
`
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