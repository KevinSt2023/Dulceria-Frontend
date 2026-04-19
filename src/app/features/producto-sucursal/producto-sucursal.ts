import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoSucursalService } from '../../core/services/producto-sucursal';
import { AuthService } from '../../core/auth/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-producto-sucursal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="mb-4">
    <h2 class="text-xl font-bold text-gray-700">Catálogo de mi sucursal</h2>
    <p class="text-sm text-gray-400 mt-0.5">
      Activa los productos que ofreces y define si son por encargo o requieren stock
    </p>
  </div>

  <!-- RESUMEN -->
  <div class="grid grid-cols-3 gap-3 mb-4">
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-blue-500">
      <p class="text-2xl font-bold text-blue-600">{{ productos.length }}</p>
      <p class="text-xs text-gray-500 mt-1">Total catálogo</p>
    </div>
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-green-500">
      <p class="text-2xl font-bold text-green-600">{{ activosCount }}</p>
      <p class="text-xs text-gray-500 mt-1">Activos en mi sede</p>
    </div>
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-gray-400">
      <p class="text-2xl font-bold text-gray-500">{{ productos.length - activosCount }}</p>
      <p class="text-xs text-gray-500 mt-1">No ofrecidos</p>
    </div>
  </div>

  <!-- BANNER EXPLICATIVO -->
  <div class="grid grid-cols-2 gap-3 mb-4">
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-xs font-semibold text-blue-700 mb-1">Encargo</p>
      <p class="text-xs text-blue-600">
        El vendedor puede pedirlo aunque no haya stock.
        Producción lo fabrica al recibir el pedido.
      </p>
    </div>
    <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <p class="text-xs font-semibold text-orange-700 mb-1">Solo stock</p>
      <p class="text-xs text-orange-600">
        Solo se puede pedir si hay unidades disponibles
        en el inventario de esta sede.
      </p>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando...
  </div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-3 text-left text-sm">Producto</th>
          <th class="p-3 text-center text-sm">Precio</th>
          <th class="p-3 text-center text-sm">Stock sede</th>
          <th class="p-3 text-center text-sm">Activo en sede</th>
          <th class="p-3 text-center text-sm">
            Tipo pedido
            <span class="block text-xs text-gray-400 font-normal">
              ¿Cómo se vende?
            </span>
          </th>
          <th class="p-3 text-center text-sm">Guardar</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of productos"
            class="border-t hover:bg-gray-50 transition-opacity"
            [ngClass]="!p.activo_en_sucursal ? 'opacity-40' : ''">

          <!-- Nombre -->
          <td class="p-3 font-medium text-sm">{{ p.nombre }}</td>

          <!-- Precio -->
          <td class="p-3 text-center text-sm text-green-600 font-medium">
            S/ {{ p.precio }}
          </td>

          <!-- Stock -->
          <td class="p-3 text-center">
            <span [ngClass]="p.stock_actual > 0
                              ? 'text-green-600 font-bold'
                              : 'text-gray-400'">
              {{ p.stock_actual }}
            </span>
          </td>

          <!-- Toggle activo -->
          <td class="p-3 text-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox"
                     [(ngModel)]="p.activo_en_sucursal"
                     class="sr-only peer"/>
              <div class="w-10 h-5 bg-gray-200 rounded-full peer
                          peer-checked:bg-green-500 transition-colors
                          after:content-[''] after:absolute after:top-0.5
                          after:left-0.5 after:bg-white after:rounded-full
                          after:h-4 after:w-4 after:transition-all
                          peer-checked:after:translate-x-5">
              </div>
            </label>
          </td>

          <!-- Tipo de pedido -->
          <td class="p-3 text-center">
            <div class="flex flex-col items-center gap-1.5">

              <div class="flex justify-center gap-3">
                <label class="flex items-center gap-1 cursor-pointer text-xs">
                  <input type="radio"
                         [name]="'tipo_' + p.producto_id"
                         [value]="true"
                         [(ngModel)]="p.permite_pedido_sin_stock"
                         [disabled]="!p.activo_en_sucursal"/>
                  <span class="text-blue-700 font-medium">Encargo</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer text-xs">
                  <input type="radio"
                         [name]="'tipo_' + p.producto_id"
                         [value]="false"
                         [(ngModel)]="p.permite_pedido_sin_stock"
                         [disabled]="!p.activo_en_sucursal"/>
                  <span class="text-orange-700 font-medium">Solo stock</span>
                </label>
              </div>

              <!-- Badge explicativo dinámico -->
              <div *ngIf="p.activo_en_sucursal">
                <span *ngIf="p.permite_pedido_sin_stock"
                      class="text-xs bg-blue-50 text-blue-600
                             border border-blue-200 px-2 py-0.5 rounded-full">
                  Se produce bajo pedido
                </span>
                <span *ngIf="!p.permite_pedido_sin_stock"
                      class="text-xs bg-orange-50 text-orange-600
                             border border-orange-200 px-2 py-0.5 rounded-full">
                  Requiere stock disponible
                </span>
              </div>

            </div>
          </td>

          <!-- Guardar -->
          <td class="p-3 text-center">
            <button (click)="guardar(p)"
                    [disabled]="guardando === p.producto_id"
                    class="bg-blue-600 hover:bg-blue-700 text-white
                           px-3 py-1.5 rounded text-xs font-medium
                           disabled:opacity-50 transition-colors">
              {{ guardando === p.producto_id ? 'Guardando...' : 'Guardar' }}
            </button>
          </td>

        </tr>
      </tbody>
    </table>
  </div>

</div>
  `
})
export class ProductoSucursalComponent implements OnInit {

  productos: any[] = [];
  loading          = true;
  guardando: number | null = null;

  get activosCount(): number {
    return this.productos.filter(p => p.activo_en_sucursal).length;
  }

  constructor(
    private service: ProductoSucursalService,
    private auth:    AuthService,
    private cd:      ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.service.getConfig().subscribe({
      next: (res: any) => {
        this.productos = res;
        this.loading   = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la configuración', 'error');
      }
    });
  }

  guardar(p: any) {
    this.guardando = p.producto_id;

    this.service.updateConfig(p.producto_id, {
      activo:                   p.activo_en_sucursal,
      permite_pedido_sin_stock: p.permite_pedido_sin_stock
    }).subscribe({
      next: () => {
        this.guardando = null;
        this.cd.detectChanges();
        Swal.fire({
          icon:              'success',
          title:             'Guardado',
          text:              `${p.nombre} actualizado correctamente`,
          timer:             1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.guardando = null;
        this.cd.detectChanges();
        Swal.fire('Error', err?.error || 'No se pudo guardar', 'error');
      }
    });
  }
}