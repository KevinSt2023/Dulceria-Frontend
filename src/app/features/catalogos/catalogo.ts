import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../core/services/productos';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="mb-6">
    <h2 class="text-xl font-bold text-gray-800">Catálogo disponible</h2>
    <p class="text-sm text-gray-400 mt-0.5">
      Productos que puedes ofrecer hoy en tu sede
    </p>
  </div>

  <!-- BUSCADOR Y FILTROS -->
  <div class="flex flex-wrap gap-3 mb-5">
    <div class="relative flex-1 min-w-[200px]">
      <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
      <input [(ngModel)]="busqueda"
             (ngModelChange)="filtrar()"
             placeholder="Buscar producto..."
             class="w-full pl-9 pr-4 py-2 border border-gray-200
                    rounded-xl text-sm focus:ring-2 focus:ring-cyan-400
                    outline-none"/>
    </div>

    <select [(ngModel)]="filtroTipo"
            (ngModelChange)="filtrar()"
            class="p-2 border border-gray-200 rounded-xl text-sm
                   focus:ring-2 focus:ring-cyan-400 outline-none">
      <option value="">Todos</option>
      <option value="encargo">Solo encargo</option>
      <option value="stock">Con stock</option>
    </select>

    <button (click)="cargar()"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200
                   rounded-xl text-sm text-gray-600 transition-colors">
      🔄 Actualizar
    </button>
  </div>

  <!-- RESUMEN RÁPIDO -->
  <div class="grid grid-cols-3 gap-3 mb-5">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm
                p-3 text-center">
      <p class="text-2xl font-bold text-gray-800">
        {{ productosFiltrados.length }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Disponibles</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm
                p-3 text-center">
      <p class="text-2xl font-bold text-green-600">
        {{ conStock }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Con stock</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm
                p-3 text-center">
      <p class="text-2xl font-bold text-blue-600">
        {{ encargos }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Por encargo</p>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando catálogo...
  </div>

  <!-- GRID DE PRODUCTOS -->
  <div *ngIf="!loading"
       class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">

    <div *ngFor="let p of productosFiltrados"
         class="bg-white rounded-xl border shadow-sm overflow-hidden
                transition-all hover:shadow-md"
         [ngClass]="p.stock_disponible === 0 && !p.permite_pedido_sin_stock
                     ? 'opacity-60 border-red-100'
                     : 'border-gray-100'">

      <!-- Color superior según estado -->
      <div class="h-1.5"
           [ngClass]="p.permite_pedido_sin_stock
                       ? 'bg-blue-400'
                       : p.stock_disponible > 0
                         ? 'bg-green-400'
                         : 'bg-red-400'">
      </div>

      <div class="p-4">

        <!-- Nombre -->
        <h3 class="font-semibold text-gray-800 text-sm mb-1 leading-tight">
          {{ p.nombre }}
        </h3>

        <!-- Categoría -->
        <p class="text-xs text-gray-400 mb-3">{{ p.categoria }}</p>

        <!-- Precio grande -->
        <p class="text-2xl font-bold text-green-600 mb-3">
          S/ {{ p.precio | number:'1.2-2' }}
        </p>

        <!-- Stock info -->
        <div class="space-y-1.5">

          <!-- Encargo -->
          <div *ngIf="p.permite_pedido_sin_stock"
               class="flex items-center gap-2 px-2.5 py-1.5
                      bg-blue-50 border border-blue-100 rounded-lg">
            <span class="text-blue-500 text-sm">📋</span>
            <div>
              <p class="text-xs font-semibold text-blue-700">
                Producto por encargo
              </p>
              <p class="text-xs text-blue-500">
                Se produce al recibir el pedido
              </p>
            </div>
          </div>

          <!-- Con stock -->
          <div *ngIf="!p.permite_pedido_sin_stock && p.stock_disponible > 0"
               class="flex items-center justify-between px-2.5 py-1.5
                      bg-green-50 border border-green-100 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-green-500 text-sm">✓</span>
              <p class="text-xs font-semibold text-green-700">
                Disponible
              </p>
            </div>
            <span class="text-sm font-bold text-green-600">
              {{ p.stock_disponible }} uds.
            </span>
          </div>

          <!-- Sin stock -->
          <div *ngIf="!p.permite_pedido_sin_stock && p.stock_disponible === 0"
               class="flex items-center gap-2 px-2.5 py-1.5
                      bg-red-50 border border-red-100 rounded-lg">
            <span class="text-red-500 text-sm">✗</span>
            <p class="text-xs font-semibold text-red-600">
              Sin stock disponible
            </p>
          </div>

          <!-- Stock reservado -->
          <div *ngIf="p.stock_reservado > 0"
               class="flex items-center justify-between
                      text-xs text-gray-400 px-1">
            <span>Reservado para otros pedidos</span>
            <span class="font-medium text-orange-500">
              {{ p.stock_reservado }} uds.
            </span>
          </div>

        </div>
      </div>

    </div>

  </div>

  <!-- Sin resultados -->
  <div *ngIf="!loading && productosFiltrados.length === 0"
       class="text-center py-10 text-gray-400">
    <p class="text-3xl mb-2">📦</p>
    <p class="text-sm">Sin productos que coincidan</p>
  </div>

</div>
  `
})
export class CatalogoComponent implements OnInit {

  productos:         any[] = [];
  productosFiltrados: any[] = [];
  loading                  = true;
  busqueda                 = '';
  filtroTipo               = '';

  get conStock(): number {
    return this.productos.filter(
      p => !p.permite_pedido_sin_stock && p.stock_disponible > 0
    ).length;
  }

  get encargos(): number {
    return this.productos.filter(p => p.permite_pedido_sin_stock).length;
  }

  constructor(
    private productosService: ProductosService,
    private cd:               ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.productosService.getProductosDisponibles().subscribe({
      next: (res: any) => {
        this.productos         = res;
        this.productosFiltrados = res;
        this.loading           = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  filtrar() {
    let result = [...this.productos];

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      result  = result.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria?.toLowerCase().includes(q)
      );
    }

    if (this.filtroTipo === 'encargo') {
      result = result.filter(p => p.permite_pedido_sin_stock);
    } else if (this.filtroTipo === 'stock') {
      result = result.filter(p =>
        !p.permite_pedido_sin_stock && p.stock_disponible > 0
      );
    }

    this.productosFiltrados = result;
    this.cd.detectChanges();
  }
}