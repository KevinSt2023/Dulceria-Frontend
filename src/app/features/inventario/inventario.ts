import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario';
import { ProductosService } from '../../core/services/productos';
import { AlmacenesService } from '../../core/services/almacenes';
import Swal from 'sweetalert2';


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
            <th class="p-3 text-center">Stock Min</th>
            <th class="p-3 text-center">Stock Max</th>
            <th class="p-3 text-center">Stock</th>
            <th class="p-3 text-center">Config. Stock</th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let i of inventario" class="border-t text-center">
            <td class="p-3">{{ i.producto_id }}</td>
            <td class="p-3">{{ i.nombreproducto }}</td>
            <td class="p-3">{{ i.almacennombre }}</td>
            <td class="p-3">{{ i.stock_minimo }}</td>
            <td class="p-3">{{ i.stock_maximo }}</td>

            <td class="p-3 font-bold"
              [ngClass]="{
                'text-red-600': i.stock_actual < i.stock_minimo,
                'text-yellow-600': i.stock_actual > i.stock_maximo
              }">
              {{ i.stock_actual }}
            </td>

            <td class="p-3">
              <button
                (click)="editarConfig(i)"
                class="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                ⚙️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL MOVIMIENTO -->
    <div *ngIf="mostrarModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

      <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div class="flex justify-between mb-4">
          <h3 class="text-lg font-bold">➕ Movimiento</h3>
          <button (click)="cerrarModal()">✕</button>
        </div>

        <div *ngIf="cargandoProductos">Cargando productos...</div>

        <div *ngIf="!cargandoProductos" class="space-y-3">

          <div>
            <label class="text-sm text-gray-600"> Producto </label>
            <select [(ngModel)]="form.producto_id" class="w-full p-2 border rounded">
              <option [ngValue]="null">Seleccione producto</option>
              <option *ngFor="let p of productos" [ngValue]="p.producto_id">
                {{ p.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm text-gray-600"> Almacén </label>
            <select [(ngModel)]="form.almacen_id" class="w-full p-2 border rounded">
              <option [ngValue]="null">Seleccione almacén</option>
              <option *ngFor="let a of almacenes" [ngValue]="a.almacen_id">
                {{ a.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm text-gray-600"> Tipo de movimiento </label>
            <select [(ngModel)]="form.tipo_movimiento" class="w-full p-2 border rounded">
              <option value="">Seleccione tipo</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>

          <div>
            <label class="text-sm text-gray-600"> Cantidad </label>
            <input [(ngModel)]="form.cantidad" type="number" class="w-full p-2 border rounded" />
          </div>

          <div>
            <label class="text-sm text-gray-600"> Motivo </label>
            <input [(ngModel)]="form.motivo" class="w-full p-2 border rounded" />
          </div>

          <button 
            (click)="guardar()" 
            [disabled]="guardando"
            class="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>

        </div>
      </div>
    </div>

    <!-- MODAL CONFIG -->
    <div *ngIf="mostrarConfig"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="font-bold mb-4">⚙️ Configurar Stock</h3>

        <div class="mb-2">
          <label class="text-sm text-gray-600"> Stock mínimo </label>
          <input [(ngModel)]="config.stock_minimo" type="number"
            class="w-full p-2 border rounded" />
        </div>

        <div class="mb-4">
          <label class="text-sm text-gray-600"> Stock máximo </label>
          <input [(ngModel)]="config.stock_maximo" type="number"
            class="w-full p-2 border rounded" />
        </div>

        <div class="flex justify-end gap-2">
          <button (click)="cerrarConfig()" class="px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>

          <button (click)="guardarConfig()"
            class="px-4 py-2 bg-blue-600 text-white rounded">
            Guardar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InventarioComponent implements OnInit {

  inventario: any[] = [];
  productos: any[] = [];
  almacenes: any[] = [];
  mostrarModal = false;
  mostrarConfig = false;
  cargandoProductos = false;
  guardando = false;

  form: any = this.getFormInicial();

  config: any = {
    producto_id: null,
    almacen_id: null,
    stock_minimo: 0,
    stock_maximo: 0,
  };

  constructor(
    private inventarioService: InventarioService,
    private productosService: ProductosService,
    private almacenesService: AlmacenesService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargar();

    this.almacenesService.getAlmacenes().subscribe((res: any) => {
      this.almacenes = res;
    });
  }

  getFormInicial() {
    return {
      producto_id: null,
      almacen_id: null,
      tipo_movimiento: '',
      cantidad: 0,
      motivo: '',
    };
  }

  cargar() {
  this.inventarioService.getInventario().subscribe((res: any) => {
    this.inventario = res;

    const alertas: string[] = [];

    res.forEach((i: any) => {
      if (i.stock_actual < i.stock_minimo) {
        alertas.push(`🔴 ${i.nombreproducto} está por debajo del stock mínimo`);
      }

      if (i.stock_actual > i.stock_maximo && i.stock_maximo > 0) {
        alertas.push(`🟡 ${i.nombreproducto} supera el stock máximo`);
      }
    });

    // 🔥 SWEET ALERT
    if (alertas.length > 0) {
      Swal.fire({
        title: '⚠️ Alerta de Inventario',
        html: alertas.join('<br>'),
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2563eb',
        allowOutsideClick: false
      });
    }

    this.cd.detectChanges();
  });
}


  abrirModal() {
    this.form = this.getFormInicial();
    this.mostrarModal = true;
    this.cargandoProductos = true;

    this.productosService.getProductos().subscribe((res: any) => {
      this.productos = res;
      this.cargandoProductos = false;
      this.cd.detectChanges();
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.form = this.getFormInicial();
    this.cargandoProductos = false;
    this.guardando = false;
  }

  guardar() {
    if (this.guardando) return;

    if (!this.form.producto_id) return alert('Selecciona un producto');
    if (!this.form.almacen_id) return alert('Selecciona un almacén');
    if (!this.form.tipo_movimiento) return alert('Selecciona el tipo');
    if (this.form.cantidad <= 0) return alert('Cantidad inválida');

    this.guardando = true;

    this.inventarioService.createMovimiento(this.form).subscribe({
      next: (res: any) => {
        if (res.alerta) {
        Swal.fire({
          title: '⚠️ Atención',
          text: res.alerta,
          icon: 'warning',
          confirmButtonText: 'Ok'
        });
      }


        this.cargar();
        this.cerrarModal();
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error,
          icon: 'error',
          confirmButtonText: 'Ok'
        });

        this.guardando = false; // 🔥 FIX
      }
    });
  }

  editarConfig(i: any) {
    this.config = {
      producto_id: i.producto_id,
      almacen_id: i.almacen_id,
      stock_minimo: i.stock_minimo,
      stock_maximo: i.stock_maximo,
    };
    this.mostrarConfig = true;
  }

  cerrarConfig() {
    this.mostrarConfig = false;
  }

  guardarConfig() {
    this.inventarioService.updateConfig(this.config).subscribe(() => {
      this.cargar();
      this.cerrarConfig();
    });
  }
}
