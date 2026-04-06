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
            <th class="p-3 text-center">Kardex</th>
            <th class="p-3 text-center">Config. Stock</th>            
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let i of inventarioPaginados" class="border-t text-center">
            <td class="p-3">{{ i.producto_id }}</td>
            <td class="p-3">{{ i.nombreproducto }}</td>
            <td class="p-3">{{ i.almacennombre }}</td>
            <td class="p-3">{{ i.stock_minimo }}</td>
            <td class="p-3">{{ i.stock_maximo }}</td>

            <td
              class="p-3 font-bold"
              [ngClass]="{
                'text-red-600': i.stock_actual < i.stock_minimo,
                'text-yellow-600': i.stock_actual > i.stock_maximo,
              }"
            >
              {{ i.stock_actual }}
            </td>
            <td>
              <button
              (click)="verKardex(i)"
              class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 ml-2"
            >
              📊
            </button>
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

      <!-- PAGINACIÓN -->
      <div class="flex justify-center mt-4 gap-2">
        <button
          (click)="cambiarPagina(paginaActual - 1)"
          [disabled]="paginaActual === 1"
          class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          ◀
        </button>

        <button
          *ngFor="let p of [].constructor(totalPaginas()); let i = index"
          (click)="cambiarPagina(i + 1)"
          [ngClass]="{
            'bg-blue-600 text-white': paginaActual === i + 1,
            'bg-gray-200': paginaActual !== i + 1,
          }"
          class="px-3 py-1 rounded"
        >
          {{ i + 1 }}
        </button>

        <button
          (click)="cambiarPagina(paginaActual + 1)"
          [disabled]="paginaActual === totalPaginas()"
          class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          ▶
        </button>
      </div>
    </div>

    <!-- MODAL MOVIMIENTO -->
    <div
      *ngIf="mostrarModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
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
            class="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          >
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIG -->
    <div
      *ngIf="mostrarConfig"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="font-bold mb-4">⚙️ Configurar Stock</h3>

        <div class="mb-2">
          <label class="text-sm text-gray-600"> Stock mínimo </label>
          <input
            [(ngModel)]="config.stock_minimo"
            type="number"
            class="w-full p-2 border rounded"
          />
        </div>

        <div class="mb-4">
          <label class="text-sm text-gray-600"> Stock máximo </label>
          <input
            [(ngModel)]="config.stock_maximo"
            type="number"
            class="w-full p-2 border rounded"
          />
        </div>

        <div class="flex justify-end gap-2">
          <button (click)="cerrarConfig()" class="px-4 py-2 bg-gray-300 rounded">Cancelar</button>

          <button (click)="guardarConfig()" class="px-4 py-2 bg-blue-600 text-white rounded">
            Guardar
          </button>
        </div>
      </div>
    </div>    


    <div
      *ngIf="mostrarKardex"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >      
      <div class="bg-white rounded-xl p-6 w-full max-w-4xl">
        <h3 class="font-bold mb-4">📊 Kardex</h3>
        <p class="text-sm text-gray-500 mb-2">
          {{ kardex[0]?.producto }} - {{ kardex[0]?.almacen }}
        </p>


        <div class="overflow-x-auto">
          <div class="flex gap-2 mb-4 items-end">
            <div>
              <label class="text-sm text-gray-600">Fecha Inicio</label>
              <input type="date" [(ngModel)]="fechaInicio" class="border p-2 rounded w-full" />
            </div>           

            <div>
              <label class="text-sm text-gray-600">Fecha Fin</label>
              <input type="date" [(ngModel)]="fechaFin" class="border p-2 rounded w-full" />
            </div>

            <button
              (click)="filtrarKardex()"
              class="bg-blue-600 text-white px-3 py-2 rounded"
            >
              Filtrar
            </button>
            <button
              (click)="limpiarFiltro()"
              class="bg-gray-400 text-white px-3 py-2 rounded"
            >
              Limpiar
            </button>
          </div>

          <table class="min-w-full bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2">Fecha</th>
                <th class="p-2">Tipo</th>
                <th class="p-2">Ingreso</th>
                <th class="p-2">Saldo Inicial</th>
                <th class="p-2">Saldo Final</th>
                <th class="p-2">Motivo</th>
                <th class="p-2">Almacén</th>
              </tr>
            </thead>

            <tbody>
              <tr *ngFor="let k of kardex" class="text-center border-t">
                <td class="p-2">{{ k.fecha | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td
                  class="p-2 font-semibold"
                  [ngClass]="{
                    'text-green-600': k.tipo_movimiento === 'ENTRADA',
                    'text-red-600': k.tipo_movimiento === 'SALIDA',
                    'text-blue-600': k.tipo_movimiento === 'AJUSTE'
                  }"
                >
                  {{ k.tipo_movimiento }}
                </td>
                <td class="p-2">{{ k.cantidad }}</td>
                <td class="p-2">{{ k.stock_antes }}</td>
                <td class="p-2 font-bold">{{ k.stock_despues }}</td>
                <td class="p-2">{{ k.motivo }}</td>
                <td class="p-2">{{ k.almacen }}</td>                
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end mt-4">
          <button (click)="mostrarKardex = false" class="px-4 py-2 bg-gray-300 rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InventarioComponent implements OnInit {
  productoSeleccionado: number | null = null;
  almacenSeleccionado: number | null = null;
  inventario: any[] = [];
  productos: any[] = [];
  almacenes: any[] = [];
  mostrarModal = false;
  mostrarConfig = false;
  cargandoProductos = false;
  paginaActual = 1;
  registrosPorPagina = 6;
  inventarioPaginados: any[] = [];
  kardex: any[] = [];
  mostrarKardex = false;
  guardando = false;
  fechaInicio: string = '';
  fechaFin: string = '';

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
  ) { }

  ngOnInit() {
    this.cargar();

    this.almacenesService.getAlmacenes().subscribe((res: any) => {
      this.almacenes = res;
    });
  }

  verKardex(i: any) {
    this.productoSeleccionado = i.producto_id;
    this.almacenSeleccionado = i.almacen_id;

    this.inventarioService.getKardex(i.producto_id, i.almacen_id).subscribe((res: any) => {
      this.kardex = res;
      this.mostrarKardex = true;
      this.cd.detectChanges();
    });
  }

  filtrarKardex() {
    if (this.productoSeleccionado == null || this.almacenSeleccionado == null) {
      alert('Selecciona un producto y almacén primero');
      return;
    }

    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      alert('La fecha inicio no puede ser mayor que la fecha fin');
      return;
    }

    this.inventarioService
      .getKardexFiltrado(
        this.productoSeleccionado,
        this.almacenSeleccionado,
        this.fechaInicio,
        this.fechaFin
      )
      .subscribe((res: any) => {
        this.kardex = res;
        this.cd.detectChanges();
      });
  }

  limpiarFiltro() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.verKardex({
      producto_id: this.productoSeleccionado,
      almacen_id: this.almacenSeleccionado
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
      this.actualizarPaginacion();
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
          allowOutsideClick: false,
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
            confirmButtonText: 'Ok',
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
          confirmButtonText: 'Ok',
        });

        this.guardando = false; // 🔥 FIX
      },
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

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.inventarioPaginados = this.inventario.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  totalPaginas(): number {
    return Math.ceil(this.inventario.length / this.registrosPorPagina);
  }
}
