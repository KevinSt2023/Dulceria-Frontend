import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProductosService } from '../../core/services/productos';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../core/services/categorias';
import { TiposProductosService } from '../../core/services/tipos-productos';
import { UnidadesService } from '../../core/services/unidades';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Productos</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        {{ productos.length }} productos registrados
      </p>
    </div>
    <button (click)="nuevo()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg
                   hover:bg-blue-700 transition text-sm font-medium">
      + Nuevo producto
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando productos...
  </div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto mb-4">
    <table class="min-w-full bg-white rounded-xl shadow-sm
                  border border-gray-100">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Nombre</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Precio venta</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Margen</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Estado</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Tipo pedido</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide hidden md:table-cell">
            Categoría
          </th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide hidden md:table-cell">
            Unidad
          </th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="productosPaginados.length === 0">
          <td colspan="8" class="p-8 text-center text-gray-400 text-sm">
            No hay productos registrados
          </td>
        </tr>
        <tr *ngFor="let p of productosPaginados"
            class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
          <td class="p-3">
            <p class="font-medium text-gray-800 text-sm">{{ p.nombre }}</p>
            <p class="text-xs text-gray-400">{{ p.tipos }}</p>
          </td>
          <td class="p-3 text-center">
            <span class="font-bold text-green-600">
              S/ {{ p.precio | number:'1.2-2' }}
            </span>
            <p *ngIf="p.costo" class="text-xs text-gray-400">
              Costo: S/ {{ p.costo | number:'1.2-2' }}
            </p>
          </td>
          <td class="p-3 text-center">
            <span *ngIf="p.precio > 0 && p.costo > 0"
                  [ngClass]="calcularMargen(p.precio, p.costo) >= 30
                              ? 'bg-green-100 text-green-700'
                              : calcularMargen(p.precio, p.costo) >= 15
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-600'"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ calcularMargen(p.precio, p.costo) | number:'1.0-0' }}%
            </span>
            <span *ngIf="!p.costo || p.costo === 0"
                  class="text-xs text-gray-300">—</span>
          </td>
          <td class="p-3 text-center">
            <span [ngClass]="p.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'"
                  class="px-2.5 py-1 rounded-full text-xs font-medium">
              {{ p.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="p-3 text-center">
            <span [ngClass]="p.permite_pedido_sin_stock
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'"
                  class="px-2.5 py-1 rounded-full text-xs font-medium">
              {{ p.permite_pedido_sin_stock ? 'Encargo' : 'Solo stock' }}
            </span>
          </td>
          <td class="p-3 text-center hidden md:table-cell">
            <span class="text-sm text-gray-600">{{ p.categoria }}</span>
          </td>
          <td class="p-3 text-center hidden md:table-cell">
            <span class="text-sm text-gray-600">{{ p.unidades }}</span>
          </td>
          <td class="p-3 text-center">
            <button (click)="editar(p)"
                    class="bg-blue-500 hover:bg-blue-600 text-white
                           px-3 py-1.5 rounded-lg text-xs font-medium
                           transition-colors">
              Editar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PAGINACIÓN -->
    <div *ngIf="totalPaginas() > 1"
         class="flex justify-center mt-4 gap-2">
      <button (click)="cambiarPagina(paginaActual - 1)"
              [disabled]="paginaActual === 1"
              class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50
                     hover:bg-gray-300 transition-colors text-sm">◀</button>
      <button *ngFor="let p of [].constructor(totalPaginas()); let i = index"
              (click)="cambiarPagina(i + 1)"
              [ngClass]="{
                'bg-blue-600 text-white': paginaActual === i + 1,
                'bg-gray-200 hover:bg-gray-300': paginaActual !== i + 1
              }"
              class="px-3 py-1 rounded text-sm transition-colors">
        {{ i + 1 }}
      </button>
      <button (click)="cambiarPagina(paginaActual + 1)"
              [disabled]="paginaActual === totalPaginas()"
              class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50
                     hover:bg-gray-300 transition-colors text-sm">▶</button>
    </div>
  </div>

  <!-- MODAL -->
  <div *ngIf="mostrarForm"
       class="fixed inset-0 z-50 flex items-center justify-center
              bg-black/50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md
                max-h-screen overflow-y-auto">

      <!-- Cabecera modal -->
      <div class="flex justify-between items-center p-6 border-b">
        <h3 class="text-lg font-bold text-gray-800">
          {{ editando ? 'Editar' : 'Nuevo' }} producto
        </h3>
        <button (click)="cancelar()"
                class="text-gray-400 hover:text-gray-600 text-xl leading-none">
          ✕
        </button>
      </div>

      <div class="p-6 space-y-4">

        <!-- NOMBRE -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1.5">
            Nombre *
          </label>
          <input [(ngModel)]="form.nombre"
                 placeholder="Ej: Pastel de Chocolate"
                 class="w-full p-2.5 border border-gray-200 rounded-xl
                        text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
        </div>

        <!-- DESCRIPCIÓN -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1.5">
            Descripción
            <span class="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <textarea [(ngModel)]="form.descripcion"
                    rows="2"
                    placeholder="Describe brevemente el producto..."
                    class="w-full p-2.5 border border-gray-200 rounded-xl
                           text-sm resize-none focus:ring-2 focus:ring-blue-400
                           outline-none">
          </textarea>
        </div>

        <!-- CATEGORÍA + TIPO en grid -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1.5">
              Categoría *
            </label>
            <select [(ngModel)]="form.categoria_id"
                    class="w-full p-2.5 border border-gray-200 rounded-xl
                           text-sm focus:ring-2 focus:ring-blue-400 outline-none">
              <option value="">Seleccione</option>
              <option *ngFor="let c of categorias" [value]="c.categoria_id">
                {{ c.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1.5">
              Tipo *
            </label>
            <select [(ngModel)]="form.tipo_producto_id"
                    class="w-full p-2.5 border border-gray-200 rounded-xl
                           text-sm focus:ring-2 focus:ring-blue-400 outline-none">
              <option value="">Seleccione</option>
              <option *ngFor="let t of tipos" [value]="t.tipo_producto_id">
                {{ t.nombre }}
              </option>
            </select>
          </div>
        </div>

        <!-- UNIDAD -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1.5">
            Unidad de medida *
          </label>
          <select [(ngModel)]="form.unidad_id"
                  class="w-full p-2.5 border border-gray-200 rounded-xl
                         text-sm focus:ring-2 focus:ring-blue-400 outline-none">
            <option value="">Seleccione</option>
            <option *ngFor="let u of unidades" [value]="u.unidad_id">
              {{ u.nombre }}
            </option>
          </select>
        </div>

        <!-- PRECIOS en grid -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1.5">
              Precio de venta *
              <span class="text-xs text-gray-400 font-normal block">
                Lo que paga el cliente
              </span>
            </label>
            <div class="flex items-center border border-gray-200
                        rounded-xl px-3 focus-within:ring-2
                        focus-within:ring-blue-400">
              <span class="text-gray-500 font-medium text-sm">S/</span>
              <input [(ngModel)]="form.precio"
                     type="number"
                     min="0"
                     step="0.10"
                     class="w-full p-2.5 outline-none text-sm"
                     placeholder="0.00"/>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1.5">
              Costo / Precio compra
              <span class="text-xs text-gray-400 font-normal block">
                Lo que te cuesta producirlo
              </span>
            </label>
            <div class="flex items-center border border-gray-200
                        rounded-xl px-3 bg-gray-50 focus-within:ring-2
                        focus-within:ring-blue-400">
              <span class="text-gray-400 text-sm">S/</span>
              <input [(ngModel)]="form.costo"
                     type="number"
                     min="0"
                     step="0.10"
                     class="w-full p-2.5 outline-none text-sm bg-gray-50"
                     placeholder="0.00"/>
            </div>
          </div>
        </div>

        <!-- MARGEN DE GANANCIA -->
        <div *ngIf="form.precio > 0 && form.costo > 0"
             class="px-3 py-2 rounded-xl text-sm flex justify-between
                    items-center"
             [ngClass]="margenForm >= 30
                         ? 'bg-green-50 border border-green-200'
                         : margenForm >= 15
                           ? 'bg-yellow-50 border border-yellow-200'
                           : 'bg-red-50 border border-red-200'">
          <span [ngClass]="margenForm >= 30
                            ? 'text-green-700'
                            : margenForm >= 15
                              ? 'text-yellow-700'
                              : 'text-red-600'"
                class="text-xs">
            {{ margenForm >= 30 ? '✓ Buen margen'
               : margenForm >= 15 ? '⚠ Margen ajustado'
               : '✗ Margen muy bajo' }}
          </span>
          <span [ngClass]="margenForm >= 30
                            ? 'text-green-700'
                            : margenForm >= 15
                              ? 'text-yellow-700'
                              : 'text-red-600'"
                class="font-bold text-sm">
            {{ margenForm | number:'1.0-0' }}% ganancia
          </span>
        </div>

        <!-- TIPO DE PEDIDO -->
        <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <label class="text-sm font-medium text-gray-700 block mb-3">
            ¿Cómo se vende este producto?
          </label>
          <div class="space-y-2">
            <label class="flex items-start gap-3 cursor-pointer p-2.5
                          rounded-lg border-2 transition-all"
                   [ngClass]="form.permite_pedido_sin_stock
                               ? 'border-blue-400 bg-blue-50'
                               : 'border-gray-200 bg-white'">
              <input type="radio"
                     [(ngModel)]="form.permite_pedido_sin_stock"
                     [value]="true"
                     name="tipo_pedido"
                     class="mt-0.5 flex-shrink-0"/>
              <span class="text-sm">
                <span class="font-semibold text-blue-700">Encargo</span>
                <span class="text-gray-500 block text-xs mt-0.5">
                  Se produce o consigue sin importar el stock actual
                </span>
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer p-2.5
                          rounded-lg border-2 transition-all"
                   [ngClass]="!form.permite_pedido_sin_stock
                               ? 'border-orange-400 bg-orange-50'
                               : 'border-gray-200 bg-white'">
              <input type="radio"
                     [(ngModel)]="form.permite_pedido_sin_stock"
                     [value]="false"
                     name="tipo_pedido"
                     class="mt-0.5 flex-shrink-0"/>
              <span class="text-sm">
                <span class="font-semibold text-orange-700">Solo stock</span>
                <span class="text-gray-500 block text-xs mt-0.5">
                  Solo se puede pedir si hay unidades disponibles
                </span>
              </span>
            </label>
          </div>
        </div>

        <!-- ACTIVO -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" [(ngModel)]="form.activo"
                 class="w-4 h-4 rounded"/>
          <span class="text-sm text-gray-700">Producto activo</span>
        </label>

      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-2 px-6 pb-6">
        <button (click)="cancelar()"
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200
                       rounded-xl text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button (click)="guardar()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                       rounded-xl text-sm font-medium transition-colors">
          {{ editando ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>

    </div>
  </div>

</div>
  `
})
export class ProductosComponent implements OnInit {

  categorias: any[] = [];
  tipos:      any[] = [];
  unidades:   any[] = [];
  productos:  any[] = [];

  paginaActual        = 1;
  registrosPorPagina  = 10;
  productosPaginados: any[] = [];
  loading             = true;
  mostrarForm         = false;
  editando            = false;

  form: any = {
    producto_id:              null,
    nombre:                   '',
    descripcion:              '',
    categoria_id:             null,
    tipo_producto_id:         null,
    unidad_id:                null,
    precio:                   0,
    costo:                    0,
    activo:                   true,
    permite_pedido_sin_stock: true
  };

  // Margen en tiempo real dentro del formulario
  get margenForm(): number {
    return this.calcularMargen(this.form.precio, this.form.costo);
  }

  calcularMargen(precio: number, costo: number): number {
    if (!precio || !costo || precio === 0) return 0;
    return ((precio - costo) / precio) * 100;
  }

  constructor(
    private productosService: ProductosService,
    private categoriaService: CategoriasService,
    private tiposService:     TiposProductosService,
    private unidadesService:  UnidadesService,
    private cd:               ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    forkJoin({
      categorias: this.categoriaService.getCategorias(),
      tipos:      this.tiposService.getTipos(),
      unidades:   this.unidadesService.getUnidades()
    }).subscribe((res: any) => {
      this.categorias = res.categorias;
      this.tipos      = res.tipos;
      this.unidades   = res.unidades;
      this.cd.detectChanges();
    });
  }

  cargar() {
    this.loading = true;
    this.productosService.getProductos().subscribe({
      next: (res: any) => {
        this.productos = res;
        this.actualizarPaginacion();
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  nuevo() {
    this.form = {
      producto_id:              null,
      nombre:                   '',
      descripcion:              '',
      categoria_id:             null,
      tipo_producto_id:         null,
      unidad_id:                null,
      precio:                   0,
      costo:                    0,
      activo:                   true,
      permite_pedido_sin_stock: true
    };
    this.editando    = false;
    this.mostrarForm = true;
  }

  editar(p: any) {
    this.form        = { ...p };
    this.editando    = true;
    this.mostrarForm = true;
  }

  guardar() {
    if (!this.form.nombre?.trim()) {
      Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }
    if (!this.form.categoria_id) {
      Swal.fire('Campo requerido', 'Selecciona una categoría', 'warning');
      return;
    }
    if (!this.form.unidad_id) {
      Swal.fire('Campo requerido', 'Selecciona una unidad', 'warning');
      return;
    }
    if (!this.form.precio || this.form.precio <= 0) {
      Swal.fire('Campo requerido', 'El precio de venta debe ser mayor a 0', 'warning');
      return;
    }

    const accion = this.editando
      ? this.productosService.updateProducto(this.form.producto_id, this.form)
      : this.productosService.createProducto(this.form);

    accion.subscribe({
      next: () => {
        Swal.fire({
          icon:  'success',
          title: this.editando ? 'Actualizado' : 'Registrado',
          text:  `Producto ${this.editando ? 'actualizado' : 'registrado'} correctamente`,
          timer: 1500, showConfirmButton: false
        });
        this.cargar();
        this.cancelar();
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo guardar', 'error')
    });
  }

  cancelar() { this.mostrarForm = false; }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    this.productosPaginados = this.productos
      .slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productos.length / this.registrosPorPagina));
  }
}