import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario';
import { ProductosService } from '../../core/services/productos';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="text-xl font-bold mb-6">📦 Inventario</h2>

    <!-- BOTÓN -->
    <button
      (click)="abrirModal()"
      class="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      ➕ Movimiento
    </button>

    <!-- TABLA -->
    <div class="overflow-x-auto mb-6">
      <table class="min-w-full bg-white rounded-xl shadow">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-center">Producto</th>
            <th class="p-3 text-center">Almacén</th>
            <th class="p-3 text-center">Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let i of inventario" class="border-t text-center">
            <td class="p-3">{{ i.producto }}</td>
            <td class="p-3">{{ i.almacen_id }}</td>
            <td class="p-3 font-bold">{{ i.stock_actual }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <div *ngIf="mostrarModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">

        <h3 class="text-lg font-bold mb-4">➕ Movimiento</h3>

        <div *ngIf="cargandoProductos" class="text-center text-gray-500">
          Cargando productos...
        </div>

        <div *ngIf="!cargandoProductos" class="space-y-3">

          <select [(ngModel)]="form.producto_id" class="w-full p-2 border rounded">
            <option value="">Producto</option>
            <option *ngFor="let p of productos" [value]="p.producto_id">
              {{ p.nombre }}
            </option>
          </select>

          <input [(ngModel)]="form.almacen_id"
            class="w-full p-2 border rounded"
            placeholder="Almacén ID" />

          <select [(ngModel)]="form.tipo_movimiento"
            class="w-full p-2 border rounded">
            <option value="">Tipo</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>

          <input [(ngModel)]="form.cantidad"
            type="number"
            class="w-full p-2 border rounded"
            placeholder="Cantidad" />

          <input [(ngModel)]="form.motivo"
            class="w-full p-2 border rounded"
            placeholder="Motivo" />

          <div class="flex justify-end gap-2 mt-4">
            <button
              (click)="cerrarModal()"
              class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancelar
            </button>

            <button
              (click)="guardar()"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Guardar
            </button>
          </div>

        </div>

      </div>
    </div>
  `
})
export class InventarioComponent implements OnInit {

  inventario: any[] = [];
  productos: any[] = [];

  mostrarModal = false;
  cargandoProductos = false;

  form: any = {
    producto_id: null,
    almacen_id: 1,
    tipo_movimiento: '',
    cantidad: 0,
    motivo: ''
  };

  constructor(
    private inventarioService: InventarioService,
    private productosService: ProductosService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.inventarioService.getInventario().subscribe((res: any) => {
      this.inventario = res;
      this.cd.detectChanges();
    });
  }

  abrirModal() {
    this.cargandoProductos = true;

    this.productosService.getProductos().subscribe((res: any) => {
      this.productos = res;
      this.cargandoProductos = false;
      this.mostrarModal = true;
    });
  }

  cerrarModal() {
    this.mostrarModal = false;

    this.form = {
      producto_id: null,
      almacen_id: 1,
      tipo_movimiento: '',
      cantidad: 0,
      motivo: ''
    };
  }

  guardar() {
    this.inventarioService.createMovimiento(this.form).subscribe(() => {
      this.cargar();
      this.cerrarModal();
    });
  }
}
