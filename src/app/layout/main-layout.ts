import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
<div class="flex h-screen bg-slate-50 overflow-hidden">

  <!-- OVERLAY móvil -->
  <div *ngIf="sidebarOpen"
       (click)="sidebarOpen = false"
       class="fixed inset-0 bg-black/40 z-20 lg:hidden">
  </div>

  <!-- ══ SIDEBAR ══ -->
  <aside class="fixed lg:static inset-y-0 left-0 z-30
                flex flex-col w-60 bg-slate-900
                transition-transform duration-300"
         [ngClass]="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">

    <!-- Header sidebar -->
    <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
      <img src="assets/images/sophitech.jpeg"
           alt="SophiTech"
           class="h-10 w-auto rounded"
           onerror="this.style.display='none'"/>
      <div>
        <p class="text-white font-bold text-sm">
          Sophi<span class="text-cyan-400">Tech</span>
        </p>
        <p class="text-slate-500 text-xs">ERP · SaaS</p>
      </div>
    </div>

    <!-- NAV -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">

      <!-- PRINCIPAL — todos los roles -->
      <div class="pt-2">
        <p class="section-label">Principal</p>
        <a routerLink="/app/dashboard"
           routerLinkActive="bg-slate-800 text-white"
           class="nav-item">
          <img src="assets/icon/reporte.png"
               class="w-5 h-5"
               style="filter: brightness(0) invert(1) opacity(0.6)"/>
          Dashboard
        </a>
      </div>

      <!-- INVENTARIO — solo Admin y SuperAdmin -->
      <div *ngIf="isAdminOrSuper()" class="pt-4">
        <p class="section-label">Inventario</p>

        <button (click)="toggle('inv')"
                class="nav-item w-full justify-between">
          <span class="flex items-center gap-2">
            <img src="assets/icon/inventario.png"
                 class="w-5 h-5"
                 style="filter: brightness(0) invert(1) opacity(0.6)"/>
            Gestión
          </span>
          <span class="text-xs text-slate-500"
                [ngClass]="openMenu === 'inv' ? 'rotate-90' : ''"
                style="transition: transform 0.2s">▶</span>
        </button>

        <div *ngIf="openMenu === 'inv'" class="pl-4 space-y-0.5 mt-0.5">
          <a routerLink="/app/productos"
             routerLinkActive="text-cyan-400" class="sub-item">
            Productos
          </a>
          <a routerLink="/app/inventario"
             routerLinkActive="text-cyan-400" class="sub-item">
            Inventario
          </a>
          <a routerLink="/app/categorias"
             routerLinkActive="text-cyan-400" class="sub-item">
            Categorías
          </a>
          <a routerLink="/app/tipos_productos"
             routerLinkActive="text-cyan-400" class="sub-item">
            Tipos
          </a>
          <a routerLink="/app/unidades"
             routerLinkActive="text-cyan-400" class="sub-item">
            Unidades
          </a>
          <!-- Mi catálogo solo para Admin (no SuperAdmin) -->
          <a *ngIf="isAdmin()"
             routerLink="/app/catalogo-sede"
             routerLinkActive="text-cyan-400" class="sub-item">
            Mi catálogo
          </a>
        </div>
      </div>

      <!-- VENTAS — Admin, SuperAdmin y Cajero -->
      <div *ngIf="isAdminOrSuper() || isCajero()" class="pt-4">
        <p class="section-label">Ventas</p>

        <button (click)="toggle('ventas')"
                class="nav-item w-full justify-between">
          <span class="flex items-center gap-2">
            <img src="assets/icon/venta.png"
                 class="w-5 h-5"
                 style="filter: brightness(0) invert(1) opacity(0.6)"/>
            Facturación
          </span>
          <span class="text-xs text-slate-500"
                [ngClass]="openMenu === 'ventas' ? 'rotate-90' : ''"
                style="transition: transform 0.2s">▶</span>
        </button>

        <div *ngIf="openMenu === 'ventas'" class="pl-4 space-y-0.5 mt-0.5">
          <a routerLink="/app/pos"
             routerLinkActive="text-cyan-400" class="sub-item">
            Punto de Venta
          </a>
          <a routerLink="/app/comprobantes"
             routerLinkActive="text-cyan-400" class="sub-item">
            Comprobantes
          </a>
        </div>
      </div>

      <!-- PEDIDOS — Vendedor, Admin, SuperAdmin -->
      <div *ngIf="isAdminOrSuper() || isVendedor()" class="pt-4">
        <p class="section-label">Pedidos</p>

        <button (click)="toggle('pedidos')"
                class="nav-item w-full justify-between">
          <span class="flex items-center gap-2">
            <img src="assets/icon/pedido.png"
                 class="w-5 h-5"
                 style="filter: brightness(0) invert(1) opacity(0.6)"/>
            Órdenes
          </span>
          <span class="text-xs text-slate-500"
                [ngClass]="openMenu === 'pedidos' ? 'rotate-90' : ''"
                style="transition: transform 0.2s">▶</span>
        </button>

        <div *ngIf="openMenu === 'pedidos'" class="pl-4 space-y-0.5 mt-0.5">
          <a routerLink="/app/pedidos"
             routerLinkActive="text-cyan-400" class="sub-item">
            Mis pedidos
          </a>
          <!-- Catálogo disponible — vendedor y admin -->
          <a routerLink="/app/catalogo"
             routerLinkActive="text-cyan-400" class="sub-item">
            Catálogo disponible
          </a>
        </div>
      </div>

      <!-- PRODUCCIÓN — solo rol Producción -->
      <div *ngIf="isProduccion() || isAdminOrSuper()" class="pt-4">
        <p class="section-label">Producción</p>

        <button (click)="toggle('prod')"
                class="nav-item w-full justify-between">
          <span class="flex items-center gap-2">
            <img src="assets/icon/inventario.png"
                 class="w-5 h-5"
                 style="filter: brightness(0) invert(1) opacity(0.6)"/>
            Cola
          </span>
          <span class="text-xs text-slate-500"
                [ngClass]="openMenu === 'prod' ? 'rotate-90' : ''"
                style="transition: transform 0.2s">▶</span>
        </button>

        <div *ngIf="openMenu === 'prod'" class="pl-4 space-y-0.5 mt-0.5">
          <a routerLink="/app/seguimiento"
             routerLinkActive="text-cyan-400" class="sub-item">
            Cola de producción
          </a>
        </div>
      </div>

      <!-- DISTRIBUCIÓN — solo rol Distribuidor -->
      <div *ngIf="isDistribuidor() || isAdminOrSuper()" class="pt-4">
        <p class="section-label">Distribución</p>

        <button (click)="toggle('dist')"
                class="nav-item w-full justify-between">
          <span class="flex items-center gap-2">
            <img src="assets/icon/pedido.png"
                 class="w-5 h-5"
                 style="filter: brightness(0) invert(1) opacity(0.6)"/>
            Entregas
          </span>
          <span class="text-xs text-slate-500"
                [ngClass]="openMenu === 'dist' ? 'rotate-90' : ''"
                style="transition: transform 0.2s">▶</span>
        </button>

        <div *ngIf="openMenu === 'dist'" class="pl-4 space-y-0.5 mt-0.5">
          <a routerLink="/app/distribucion"
             routerLinkActive="text-cyan-400" class="sub-item">
            Panel de distribución
          </a>
        </div>
      </div>

      <!-- CONFIGURACIÓN — Admin y SuperAdmin -->
      <div *ngIf="isAdminOrSuper()" class="pt-4">
        <p class="section-label">Configuración</p>

        <button (click)="toggle('conf')"
                class="nav-item w-full justify-between">
          <span class="flex items-center gap-2">
            <img src="assets/icon/config.png"
                 class="w-5 h-5"
                 style="filter: brightness(0) invert(1) opacity(0.6)"/>
            Sistema
          </span>
          <span class="text-xs text-slate-500"
                [ngClass]="openMenu === 'conf' ? 'rotate-90' : ''"
                style="transition: transform 0.2s">▶</span>
        </button>

        <div *ngIf="openMenu === 'conf'" class="pl-4 space-y-0.5 mt-0.5">
          <a routerLink="/app/usuarios"
             routerLinkActive="text-cyan-400" class="sub-item">
            Usuarios
          </a>
          <a routerLink="/app/clientes"
             routerLinkActive="text-cyan-400" class="sub-item">
            Clientes
          </a>
          <a routerLink="/app/roles"
             routerLinkActive="text-cyan-400" class="sub-item">
            Roles
          </a>
          <a routerLink="/app/sucursales"
             routerLinkActive="text-cyan-400" class="sub-item">
            Sucursales
          </a>
          <a routerLink="/app/almacenes"
             routerLinkActive="text-cyan-400" class="sub-item">
            Almacenes
          </a>
          <a routerLink="/app/configuracion-pago"
             routerLinkActive="text-cyan-400" class="sub-item">
            Métodos de pago
          </a>
          <!-- Config empresa solo SuperAdmin -->
          <a *ngIf="isSuperAdmin()"
             routerLink="/app/configuracion-negocio"
             routerLinkActive="text-cyan-400" class="sub-item">
            Config. Empresa
          </a>
        </div>
      </div>

    </nav>

    <!-- Footer sidebar -->
    <div class="px-5 py-3 border-t border-slate-800">
      <p class="text-slate-600 text-xs">v1.0 SophiTech ERP</p>
    </div>

  </aside>

  <!-- ══ CONTENIDO ══ -->
  <div class="flex-1 flex flex-col overflow-hidden min-w-0">

    <!-- TOPBAR -->
    <header class="bg-white border-b border-gray-100 px-4 lg:px-6 py-3
                   flex items-center gap-4">

      <button (click)="sidebarOpen = true"
              class="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
        ☰
      </button>

      <!-- Sede -->
      <div class="flex items-center gap-1.5 px-3 py-1.5
                  bg-slate-50 border border-slate-200 rounded-full">
        <span class="text-xs">🏪</span>
        <span class="text-xs text-slate-600 font-medium max-w-[160px] truncate">
          {{ sucursalNombre }}
        </span>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-medium text-gray-700">{{ email }}</p>
          <p class="text-xs text-gray-400">{{ rolNombre }}</p>
        </div>

        <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center
                    justify-center text-white text-sm font-bold flex-shrink-0">
          {{ inicialNombre }}
        </div>

        <button (click)="logout()"
                class="flex items-center gap-1.5 px-3 py-1.5
                       text-red-500 hover:bg-red-50 rounded-lg
                       transition-colors text-sm font-medium">
          Salir
        </button>
      </div>
    </header>

    <!-- PÁGINA -->
    <main class="flex-1 overflow-auto p-4 lg:p-6">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100
                  p-4 lg:p-6 min-h-full">
        <router-outlet></router-outlet>
      </div>
    </main>

  </div>

</div>
  `,
  styles: [`
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border-radius: 8px;
    font-size: 13px;
    color: white;
    transition: all 0.15s;
    cursor: pointer;
    background: transparent;
    border: none;
    text-align: left;
  }
  .nav-item:hover { background: #1e293b; }
  .section-label {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0 10px;
    margin-bottom: 4px;
    font-weight: 600;
  }
  nav::-webkit-scrollbar {
    display: none;
  }
  nav {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .sub-item {
    display: block;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 13px;
    color: #cbd5e1;
    transition: all 0.15s;
  }
  .sub-item:hover { background: #1e293b; color: white; }
  `]
})
export class MainLayout implements OnInit {

  openMenu:      string | null = null;
  sidebarOpen    = false;
  rolNombre      = '';
  email          = '';
  sucursalId     = 0;
  sucursalNombre = '';
  inicialNombre  = '';

  constructor(public auth: AuthService) {}

  ngOnInit() {
    const claims        = this.auth.getClaims();
    this.rolNombre      = this.auth.getRolNombre();
    this.sucursalNombre = this.auth.getSucursalNombre();
    this.email          = claims?.email       ?? '';
    this.sucursalId     = claims?.sucursal_id ?? 0;
    this.inicialNombre  = this.email.charAt(0).toUpperCase();
  }

  toggle(menu: string) {
    this.openMenu = this.openMenu === menu ? null : menu;
  }

  logout()          { this.auth.logout(); }
  isAdmin():        boolean { return this.auth.isAdmin(); }
  isSuperAdmin():   boolean { return this.auth.isSuperAdmin(); }
  isAdminOrSuper(): boolean { return this.auth.isAdminOrSuper(); }
  isVendedor():     boolean { return this.auth.isVendedor(); }
  isProduccion():   boolean { return this.auth.isProduccion(); }
  isCajero():       boolean { return this.auth.isCajero(); }
  isDistribuidor(): boolean { return this.auth.isDistribuidor(); }
}