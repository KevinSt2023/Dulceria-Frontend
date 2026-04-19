import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard';
import { AuthService } from '../../core/auth/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Dashboard</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        Resumen del día — {{ hoy | date:'EEEE dd/MM/yyyy' : '' : 'es'}}
      </p>
    </div>
    <button (click)="cargar()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm
                   hover:bg-blue-700 transition-colors">
      Refrescar
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-20">
    <p class="text-4xl mb-3 animate-pulse">📊</p>
    <p>Cargando métricas...</p>
  </div>

  <div *ngIf="!loading">

    <!-- MÉTRICAS PRINCIPALES -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <!-- Pedidos hoy -->
  <div class="rounded-xl p-4 text-white"
       style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs uppercase tracking-wide font-medium opacity-80">
        Pedidos hoy
      </p>
      <span class="text-2xl">🛵</span>
    </div>
    <p class="text-4xl font-bold">{{ data?.pedidos_hoy ?? 0 }}</p>
    <div class="mt-3">
      <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">
        {{ data?.pedidos_pendientes ?? 0 }} pendientes
      </span>
    </div>
  </div>

  <!-- En producción -->
  <div class="rounded-xl p-4 text-white"
       style="background: linear-gradient(135deg, #6d28d9, #a855f7)">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs uppercase tracking-wide font-medium opacity-80">
        En producción
      </p>
      <span class="text-2xl">⚙️</span>
    </div>
    <p class="text-4xl font-bold">{{ data?.pedidos_en_produccion ?? 0 }}</p>
    <div class="mt-3">
      <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">
        {{ data?.pedidos_listos ?? 0 }} listos
      </span>
    </div>
  </div>

  <!-- Ventas hoy -->
  <div class="rounded-xl p-4 text-white"
       style="background: linear-gradient(135deg, #065f46, #10b981)">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs uppercase tracking-wide font-medium opacity-80">
        Ventas hoy
      </p>
      <span class="text-2xl">💰</span>
    </div>
    <p class="text-3xl font-bold">
      S/ {{ data?.ventas_hoy ?? 0 | number:'1.2-2' }}
    </p>
    <p class="text-xs opacity-70 mt-3">
      Mes: S/ {{ data?.ventas_mes ?? 0 | number:'1.2-2' }}
    </p>
  </div>

  <!-- Stock bajo -->
  <div class="rounded-xl p-4 text-white"
       [style]="(data?.stock_bajo?.length ?? 0) > 0
         ? 'background: linear-gradient(135deg, #991b1b, #ef4444)'
         : 'background: linear-gradient(135deg, #155e75, #06b6d4)'">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs uppercase tracking-wide font-medium opacity-80">
        Stock bajo
      </p>
      <span class="text-2xl">
        {{ (data?.stock_bajo?.length ?? 0) > 0 ? '⚠️' : '✅' }}
      </span>
    </div>
    <p class="text-4xl font-bold">{{ data?.stock_bajo?.length ?? 0 }}</p>
    <p class="text-xs opacity-70 mt-3">productos bajo mínimo</p>
  </div>



    </div>

    <!-- FILA SECUNDARIA -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

  <!-- Totales globales -->
  <div class="rounded-xl p-4 border border-slate-200"
       style="background: linear-gradient(160deg, #f8fafc, #f1f5f9)">
    <p class="text-sm font-semibold text-gray-700 mb-4">Resumen general</p>
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 bg-blue-500 rounded-lg flex items-center
                       justify-center text-sm text-white">📦</span>
          <span class="text-sm text-gray-600">Productos activos</span>
        </div>
        <span class="font-bold text-gray-800">{{ data?.total_productos ?? 0 }}</span>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 bg-teal-500 rounded-lg flex items-center
                       justify-center text-sm text-white">👥</span>
          <span class="text-sm text-gray-600">Usuarios activos</span>
        </div>
        <span class="font-bold text-gray-800">{{ data?.total_usuarios ?? 0 }}</span>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 bg-orange-500 rounded-lg flex items-center
                       justify-center text-sm text-white">🏪</span>
          <span class="text-sm text-gray-600">Sede</span>
        </div>
        <span class="font-bold text-gray-800 text-xs">{{ sucursalNombre }}</span>
      </div>
    </div>
  </div>

  <!-- Alertas stock -->
  <div class="rounded-xl p-4 border lg:col-span-2"
       [ngClass]="(data?.stock_bajo?.length ?? 0) > 0
                   ? 'border-red-200 bg-red-50'
                   : 'border-gray-100 bg-white'">
    <p class="text-sm font-semibold text-gray-700 mb-3">⚠️ Alertas de stock</p>

    <div *ngIf="(data?.stock_bajo?.length ?? 0) === 0"
         class="text-center py-6 text-gray-400">
      <p class="text-2xl mb-1">✅</p>
      <p class="text-sm">Todo el stock está en niveles normales</p>
    </div>

    <div *ngIf="(data?.stock_bajo?.length ?? 0) > 0"
         class="space-y-2 max-h-40 overflow-y-auto">
      <div *ngFor="let s of data?.stock_bajo"
           class="flex items-center justify-between px-3 py-2
                  bg-white border border-red-100 rounded-lg shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-700">{{ s.producto }}</p>
          <p class="text-xs text-gray-400">{{ s.almacen }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-red-600">{{ s.stock }}</p>
          <p class="text-xs text-gray-400">mín: {{ s.minimo }}</p>
        </div>
      </div>
    </div>
  </div>

</div>

    <!-- PEDIDOS RECIENTES -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm font-semibold text-gray-700">
          Últimos pedidos
        </p>
        <a routerLink="/app/pedidos"
           class="text-xs text-blue-600 hover:underline">
          Ver todos →
        </a>
      </div>

      <div *ngIf="(data?.pedidos_recientes?.length ?? 0) === 0"
           class="text-center py-6 text-gray-400 text-sm">
        No hay pedidos registrados aún
      </div>

      <div class="overflow-x-auto">
        <table *ngIf="(data?.pedidos_recientes?.length ?? 0) > 0"
               class="min-w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left text-xs text-gray-400 font-medium pb-2">N°</th>
              <th class="text-left text-xs text-gray-400 font-medium pb-2">Cliente</th>
              <th class="text-left text-xs text-gray-400 font-medium pb-2
                         hidden md:table-cell">
                Sucursal
              </th>
              <th class="text-left text-xs text-gray-400 font-medium pb-2">Estado</th>
              <th class="text-right text-xs text-gray-400 font-medium pb-2">Total</th>
              <th class="text-right text-xs text-gray-400 font-medium pb-2
                         hidden md:table-cell">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of data?.pedidos_recientes"
                class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-2.5 text-sm font-bold text-gray-700">
                #{{ p.pedido_id }}
              </td>
              <td class="py-2.5 text-sm text-gray-600">{{ p.cliente }}</td>
              <td class="py-2.5 hidden md:table-cell">
                <span class="text-xs bg-blue-100 text-blue-700
                             px-2 py-0.5 rounded-full">
                  {{ p.sucursal }}
                </span>
              </td>
              <td class="py-2.5">
                <span [ngClass]="getEstadoClase(p.estado)"
                      class="text-xs px-2 py-0.5 rounded-full font-medium">
                  {{ p.estado }}
                </span>
              </td>
              <td class="py-2.5 text-right text-sm font-bold text-green-600">
                S/ {{ p.total | number:'1.2-2' }}
              </td>
              <td class="py-2.5 text-right text-xs text-gray-400
                         hidden md:table-cell">
                {{ p.fecha | date:'dd/MM HH:mm' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ACCESOS RÁPIDOS — solo Admin/SuperAdmin -->
    <div *ngIf="isAdminOrSuper"
         class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <a routerLink="/app/pedidos"
         class="flex items-center gap-2 px-4 py-3 bg-blue-600
                hover:bg-blue-700 text-white rounded-xl text-sm
                font-medium transition-colors">
        <span>🛵</span> Nuevo pedido
      </a>
      <a routerLink="/app/inventario"
         class="flex items-center gap-2 px-4 py-3 bg-slate-700
                hover:bg-slate-800 text-white rounded-xl text-sm
                font-medium transition-colors">
        <span>📦</span> Inventario
      </a>
      <a routerLink="/app/usuarios"
         class="flex items-center gap-2 px-4 py-3 bg-teal-600
                hover:bg-teal-700 text-white rounded-xl text-sm
                font-medium transition-colors">
        <span>👥</span> Usuarios
      </a>
      <a routerLink="/app/seguimiento"
         class="flex items-center gap-2 px-4 py-3 bg-purple-600
                hover:bg-purple-700 text-white rounded-xl text-sm
                font-medium transition-colors">
        <span>⚙️</span> Producción
      </a>
    </div>

  </div>

</div>
  `
})
export class DashboardComponent implements OnInit {

  data:          any    = null;
  loading              = true;
  hoy                  = new Date();
  isAdminOrSuper       = false;
  sucursalNombre       = '';

  constructor(
    private dashboardService: DashboardService,
    private authService:      AuthService,
    private cd:               ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isAdminOrSuper  = this.authService.isAdminOrSuper();
    this.sucursalNombre  = this.authService.getSucursalNombre();
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.data    = res;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  getEstadoClase(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE':      'bg-yellow-100 text-yellow-800',
      'CONFIRMADO':     'bg-blue-100 text-blue-800',
      'EN_PREPARACION': 'bg-purple-100 text-purple-800',
      'LISTO':          'bg-green-100 text-green-800',
      'ENTREGADO':      'bg-gray-200 text-gray-700',
      'CANCELADO':      'bg-red-100 text-red-700'
    };
    return m[estado] ?? 'bg-gray-100 text-gray-600';
  }
}