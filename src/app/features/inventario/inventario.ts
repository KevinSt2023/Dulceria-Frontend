import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario';
import { ProductosService } from '../../core/services/productos';
import { AlmacenesService } from '../../core/services/almacenes';

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
            <th class="p-3 text-center">ID</th>
            <th class="p-3 text-center">Producto</th>
            <th class="p-3 text-center">Almacén</th>
            <th class="p-3 text-center">Stock Mínimo</th>
            <th class="p-3 text-center">Stock Actual</th>
          </tr>
        </thead>

        <tbody>          
          <tr *ngFor="let i of inventario" class="border-t text-center">
            <td class="p-3">{{ i.producto_id }}</td>
            <td class="p-3">{{ i.nombreproducto }}</td>
            <td class="p-3">{{ i.almacennombre }}</td>
            <td class="p-3 font-bold">{{ i.stock_minimo }}</td>
            <td class="p-3 font-bold">{{ i.stock_actual }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <div *ngIf="mostrarModal"
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

  <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
    
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-gray-800">➕ Registrar Movimiento</h3>
      <button (click)="cerrarModal()" class="text-gray-400 hover:text-gray-600">✕</button>
    </div>

    <div *ngIf="cargandoProductos" class="text-center py-4 text-gray-500 italic">
      Cargando catálogo de productos...
    </div>

    <div *ngIf="!cargandoProductos" class="space-y-4">

      <div>
        <label for="prod" class="block text-sm font-semibold text-gray-700 mb-1">Producto</label>
        <select id="prod" [(ngModel)]="form.producto_id" 
                class="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option [ngValue]="null">Seleccione un producto</option>
          <option *ngFor="let p of productos" [ngValue]="p.producto_id">
            {{ p.nombre }}
          </option>
        </select>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="alma" class="block text-sm font-semibold text-gray-700 mb-1">Almacén</label>
          <select [(ngModel)]="form.almacen_id" class="w-full p-2 border rounded-lg">
                <option value="">Seleccione</option>
                <option *ngFor="let c of almacenes" [value]="c.almacen_id">
                  {{ c.nombre }}
                </option>
              </select>
        </div>

        <div>
          <label for="tipo" class="block text-sm font-semibold text-gray-700 mb-1">Tipo de Operación</label>
          <select id="tipo" [(ngModel)]="form.tipo_movimiento" 
                  class="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccione...</option>
            <option value="ENTRADA">Entrada (+)</option>
            <option value="SALIDA">Salida (-)</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>
      </div>

      <div>
        <label for="cant" class="block text-sm font-semibold text-gray-700 mb-1">Cantidad a mover</label>
        <input id="cant" [(ngModel)]="form.cantidad" type="number" min="1"
               class="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
               placeholder="Ej: 10" />
      </div>

      <div>
        <label for="mot" class="block text-sm font-semibold text-gray-700 mb-1">Motivo / Referencia</label>
        <input id="mot" [(ngModel)]="form.motivo"
               class="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
               placeholder="Ej: Compra a proveedor, Ajuste de inventario..." />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button (click)="cerrarModal()"
          class="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition">
          Cancelar
        </button>

        <button (click)="guardar()"
          class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition disabled:opacity-50"
          [disabled]="!form.producto_id || !form.tipo_movimiento || form.cantidad <= 0">
          Guardar Cambios
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
  almacenes: any[] = [];

  mostrarModal = false;
  cargandoProductos = false;

  form: any = this.getFormInicial();

  constructor(
    private inventarioService: InventarioService,
    private productosService: ProductosService,
    private almacenesService : AlmacenesService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();

    this.almacenesService.getAlmacenes().subscribe((res:any) => {
      this.almacenes = res;
    });
  }

  getFormInicial() {
    return {
      producto_id: null,
      almacen_id: null,
      tipo_movimiento: '',
      cantidad: 0,
      motivo: ''
    };
  }

  cargar() {
    this.inventarioService.getInventario().subscribe({
      next: (res: any) => {
        this.inventario = res;
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  abrirModal() {
    this.mostrarModal = true;
    this.cargandoProductos = true;

    this.productosService.getProductos().subscribe({
      next: (res: any) => {
        this.productos = res;
        this.cargandoProductos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.cargandoProductos = false;
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.form = this.getFormInicial();
  }

  guardar() {
    if (!this.form.producto_id || !this.form.tipo_movimiento) {
      alert('Completa los campos obligatorios');
      return;
    }

    this.inventarioService.createMovimiento(this.form).subscribe({
      next: () => {
        this.cargar();
        this.cerrarModal();
      },
      error: (err) => console.error(err)
    });
  }
}
