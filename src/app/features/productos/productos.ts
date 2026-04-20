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
    <h2 class="text-xl font-bold text-gray-700">Productos</h2>
    <button (click)="nuevo()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg
                   hover:bg-blue-700 transition">
      + Nuevo
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-gray-500">Cargando...</div>

  <!-- TABLA -->
  <div class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="text-center p-3">ID</th>
          <th class="text-center p-3">Nombre</th>
          <th class="text-center p-3">Descripción</th>
          <th class="text-center p-3">Precio Venta</th>
          <th class="text-center p-3">Estado</th>
          <th class="text-center p-3">Tipo pedido</th>
          <th class="text-center p-3">Categoría</th>
          <th class="text-center p-3">Unidad</th>
          <th class="text-center p-3">Tipo de prod.</th>
          <th class="text-center p-3 w-32">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr *ngFor="let p of productosPaginados"
            class="border-t hover:bg-gray-50">
          <td class="p-3 text-center">{{ p.producto_id }}</td>
          <td class="p-3 text-center">{{ p.nombre }}</td>
          <td class="p-3 max-w-sm">
            <p class="line-clamp-2">{{ p.descripcion }}</p>
          </td>
          <td class="p-3 font-semibold text-green-600 text-center">
            S/ {{ p.precio }}
          </td>
          <td class="p-3 text-center">
            <span [ngClass]="p.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'"
                  class="px-2 py-1 rounded text-xs">
              {{ p.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="p-3 text-center">
            <span [ngClass]="p.permite_pedido_sin_stock
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'"
                  class="px-2 py-1 rounded text-xs font-medium">
              {{ p.permite_pedido_sin_stock ? 'Encargo' : 'Solo stock' }}
            </span>
          </td>
          <td class="p-3 text-center">{{ p.categoria }}</td>
          <td class="p-3 text-center">{{ p.unidades }}</td>
          <td class="p-3 text-center">{{ p.tipos }}</td>
          <td class="p-3 text-center">
            <button (click)="editar(p)"
                    class="bg-blue-500 text-white px-2 py-1
                           rounded hover:bg-blue-600">
              ✏️
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PAGINACIÓN -->
    <div class="flex justify-center mt-4 gap-2">
      <button (click)="cambiarPagina(paginaActual - 1)"
              [disabled]="paginaActual === 1"
              class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">
        ◀
      </button>
      <button *ngFor="let p of [].constructor(totalPaginas()); let i = index"
              (click)="cambiarPagina(i + 1)"
              [ngClass]="{
                'bg-blue-600 text-white': paginaActual === i + 1,
                'bg-gray-200': paginaActual !== i + 1
              }"
              class="px-3 py-1 rounded">
        {{ i + 1 }}
      </button>
      <button (click)="cambiarPagina(paginaActual + 1)"
              [disabled]="paginaActual === totalPaginas()"
              class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">
        ▶
      </button>
    </div>
  </div>

  <!-- MODAL -->
  <div *ngIf="mostrarForm"
       class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6
                max-h-screen overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">
        {{ editando ? 'Editar' : 'Nuevo' }} Producto
      </h3>

      <div class="space-y-3">

        <!-- NOMBRE -->
        <div>
          <label class="text-sm text-gray-600">Nombre</label>
          <input [(ngModel)]="form.nombre"
                 class="w-full p-2 border rounded-lg"/>
        </div>

        <!-- DESCRIPCIÓN -->
        <div>
          <label class="text-sm text-gray-600">Descripción</label>
          <textarea [(ngModel)]="form.descripcion"
                    rows="3"
                    class="w-full p-2 border rounded-lg resize-none"
                    placeholder="Descripción del producto...">
          </textarea>
        </div>

        <!-- CATEGORÍA -->
        <div>
          <label class="text-sm text-gray-600">Categoría</label>
          <select [(ngModel)]="form.categoria_id"
                  class="w-full p-2 border rounded-lg">
            <option value="">Seleccione</option>
            <option *ngFor="let c of categorias" [value]="c.categoria_id">
              {{ c.nombre }}
            </option>
          </select>
        </div>

        <!-- TIPO -->
        <div>
          <label class="text-sm text-gray-600">Tipo</label>
          <select [(ngModel)]="form.tipo_producto_id"
                  class="w-full p-2 border rounded-lg">
            <option value="">Seleccione</option>
            <option *ngFor="let t of tipos" [value]="t.tipo_producto_id">
              {{ t.nombre }}
            </option>
          </select>
        </div>

        <!-- UNIDAD -->
        <div>
          <label class="text-sm text-gray-600">Unidad</label>
          <select [(ngModel)]="form.unidad_id"
                  class="w-full p-2 border rounded-lg">
            <option value="">Seleccione</option>
            <option *ngFor="let u of unidades" [value]="u.unidad_id">
              {{ u.nombre }}
            </option>
          </select>
        </div>

        <!-- PRECIO -->
        <div>
          <label class="text-sm text-gray-600">Precio</label>
          <div class="flex items-center border rounded-lg px-2">
            <span class="text-gray-500">S/</span>
            <input [(ngModel)]="form.precio"
                   type="text"
                   inputmode="decimal"
                   class="w-full p-2 outline-none"
                   placeholder="0.00"/>
          </div>
        </div>

        <!-- COSTO -->
        <div>
          <label class="text-sm text-gray-600">Precio de compra</label>
          <div class="flex items-center border rounded-lg px-2">
            <span class="text-gray-500">S/</span>
            <input [(ngModel)]="form.costo"
                   type="text"
                   inputmode="decimal"
                   class="w-full p-2 outline-none"
                   placeholder="0.00"/>
          </div>
        </div>

        <!-- TIPO DE PEDIDO -->
        <div class="border rounded-lg p-3 bg-gray-50">
          <label class="text-sm font-medium text-gray-700 block mb-2">
            Tipo de pedido
          </label>
          <div class="flex flex-col gap-2">
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio"
                     [(ngModel)]="form.permite_pedido_sin_stock"
                     [value]="true"
                     name="tipo_pedido"
                     class="mt-0.5"/>
              <span class="text-sm">
                <span class="font-medium text-blue-700">Encargo</span>
                <span class="text-gray-400 ml-1">
                  — se produce o consigue sin importar el stock
                </span>
              </span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio"
                     [(ngModel)]="form.permite_pedido_sin_stock"
                     [value]="false"
                     name="tipo_pedido"
                     class="mt-0.5"/>
              <span class="text-sm">
                <span class="font-medium text-orange-700">Solo stock</span>
                <span class="text-gray-400 ml-1">
                  — el vendedor solo puede pedir si hay inventario
                </span>
              </span>
            </label>
          </div>
          <p class="text-xs text-gray-400 mt-2">
            Esto controla si el vendedor puede hacer pedidos
            cuando el stock es 0.
          </p>
        </div>

        <!-- ACTIVO -->
        <label class="flex gap-2 items-center">
          <input type="checkbox" [(ngModel)]="form.activo"/>
          Activo
        </label>

        <!-- BOTONES -->
        <div class="flex justify-end gap-2 mt-5">
          <button (click)="cancelar()"
                  class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Cancelar
          </button>
          <button (click)="guardar()"
                  class="px-4 py-2 bg-green-600 text-white
                         rounded hover:bg-green-700">
            Guardar
          </button>
        </div>

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

  paginaActual       = 1;
  registrosPorPagina = 10;
  productosPaginados: any[] = [];
  loading = true;

  mostrarForm = false;
  editando    = false;

  form: any = {
    producto_id:              null,
    nombre:                   '',
    categoria_id:             null,
    tipo_producto_id:         null,
    unidad_id:                null,
    precio:                   0,
    costo:                    0,
    activo:                   true,
    permite_pedido_sin_stock: true
  };

  constructor(
    private productosService: ProductosService,
    private categoriaService: CategoriasService,
    private tiposService:     TiposProductosService,
    private unidadesService:  UnidadesService,
    private cd:               ChangeDetectorRef
  ) {}



  ngOnInit(): void {
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
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  nuevo() {
    this.form = {
      producto_id:              null,
      nombre:                   '',
      categoria_id:             null,
      tipo_producto_id:         null,
      unidad_id:                null,
      costo:                    0.0,
      precio:                   0.0,
      activo:                   true,
      permite_pedido_sin_stock: true
    };
    this.editando    = false;
    this.mostrarForm = true;
  }

  editar(p: any) {
    this.form     = { ...p };
    this.editando    = true;
    this.mostrarForm = true;
  }

  guardar() {
    if (!this.form.nombre) {
      Swal.fire({
        icon:              'warning',
        title:             'Campo requerido',
        text:              'El nombre es obligatorio',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const accion = this.editando
      ? this.productosService.updateProducto(this.form.producto_id, this.form)
      : this.productosService.createProducto(this.form);

    accion.subscribe({
      next: () => {
        Swal.fire({
          icon:              'success',
          title:             this.editando ? 'Actualizado' : 'Registrado',
          text:              this.editando
                               ? 'Producto actualizado correctamente'
                               : 'Producto creado correctamente',
          confirmButtonText: 'Aceptar'
        });
        this.cargar();
        this.cancelar();
      },
      error: (err) => {
        Swal.fire({
          icon:              'error',
          title:             'Error',
          text:              err.error || 'Error al guardar',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  cancelar() { this.mostrarForm = false; }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    this.productosPaginados = this.productos.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  totalPaginas(): number {
    return Math.ceil(this.productos.length / this.registrosPorPagina);
  }
}