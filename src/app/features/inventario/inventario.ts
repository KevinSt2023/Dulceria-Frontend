import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario';
import { ProductosService } from '../../core/services/productos';
import { AlmacenesService } from '../../core/services/almacenes';
import { ColorService } from '../../core/services/color';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventario',
  standalone: true,  
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-bold text-gray-700">Inventario</h2>
    <button (click)="abrirModal()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg
                   hover:bg-blue-700 transition">
      + Movimiento
    </button>
  </div>

  <!-- FILTROS -->
  <div class="flex flex-wrap gap-3 mb-4">
    <select [(ngModel)]="filtroSucursal"
            (ngModelChange)="aplicarFiltros()"
            class="p-2 border rounded-lg text-sm">
      <option value="">Todas las sucursales</option>
      <option *ngFor="let s of sucursales" [value]="s">{{ s }}</option>
    </select>

    <select [(ngModel)]="filtroEstado"
            (ngModelChange)="aplicarFiltros()"
            class="p-2 border rounded-lg text-sm">
      <option value="">Todos los estados</option>
      <option value="BAJO">Stock bajo</option>
      <option value="NORMAL">Normal</option>
      <option value="ALTO">Stock alto</option>
    </select>

    <input [(ngModel)]="filtroBusqueda"
           (ngModelChange)="aplicarFiltros()"
           placeholder="Buscar producto..."
           class="p-2 border rounded-lg text-sm flex-1 min-w-[160px]"/>

    <button (click)="limpiarFiltros()"
            class="px-3 py-2 bg-gray-200 hover:bg-gray-300
                   rounded-lg text-sm text-gray-600">
      Limpiar
    </button>
  </div>

  <!-- RESUMEN -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-blue-500">
      <p class="text-2xl font-bold text-blue-600">{{ inventarioFiltrado.length }}</p>
      <p class="text-xs text-gray-500 mt-1">Registros</p>
    </div>
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-red-500">
      <p class="text-2xl font-bold text-red-600">{{ contarEstado('BAJO') }}</p>
      <p class="text-xs text-gray-500 mt-1">Stock bajo</p>
    </div>
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-green-500">
      <p class="text-2xl font-bold text-green-600">{{ contarEstado('NORMAL') }}</p>
      <p class="text-xs text-gray-500 mt-1">Normal</p>
    </div>
    <div class="bg-white rounded-xl shadow p-3 text-center border-l-4 border-yellow-500">
      <p class="text-2xl font-bold text-yellow-600">{{ contarEstado('ALTO') }}</p>
      <p class="text-xs text-gray-500 mt-1">Stock alto</p>
    </div>
  </div>

  <!-- TABLA -->
  <div class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-3 text-center text-sm">Producto</th>
          <th class="p-3 text-center text-sm">Sucursal</th>
          <th class="p-3 text-center text-sm">Almacén</th>
          <th class="p-3 text-center text-sm">Min</th>
          <th class="p-3 text-center text-sm">Máx</th>
          <th class="p-3 text-center text-sm">Stock real</th>
          <th class="p-3 text-center text-sm">Reservado</th>
          <th class="p-3 text-center text-sm">Disponible</th>
          <th class="p-3 text-center text-sm">Estado</th>
          <th class="p-3 text-center text-sm">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="inventarioPaginados.length === 0">
          <td colspan="10" class="p-6 text-center text-gray-400">
            No hay registros
          </td>
        </tr>
        <tr *ngFor="let i of inventarioPaginados"
            class="border-t hover:bg-gray-50 text-center text-sm">

          <td class="p-3 font-medium text-left">{{ i.nombreproducto }}</td>

          <td class="p-3">
            <span [ngClass]="colors.getSucursalClasePorId(i.sucursal_id)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ i.sucursalnombre | slice:0:20 }}
            </span>
          </td>

          <td class="p-3 text-gray-600">{{ i.almacennombre }}</td>
          <td class="p-3 text-gray-500">{{ i.stock_minimo }}</td>
          <td class="p-3 text-gray-500">{{ i.stock_maximo }}</td>

          <td class="p-3 font-bold"
              [ngClass]="{
                'text-red-600':    i.stock_actual < i.stock_minimo,
                'text-yellow-600': i.stock_actual > i.stock_maximo,
                'text-gray-700':   i.stock_actual >= i.stock_minimo
                                && i.stock_actual <= i.stock_maximo
              }">
            {{ i.stock_actual }}
          </td>

          <td class="p-3">
            <span *ngIf="i.stock_reservado > 0"
                  class="text-orange-600 font-medium">
              {{ i.stock_reservado }}
            </span>
            <span *ngIf="i.stock_reservado === 0"
                  class="text-gray-300">—</span>
          </td>

          <td class="p-3">
            <span class="font-bold"
                  [ngClass]="i.stock_disponible <= 0
                              ? 'text-red-600'
                              : i.stock_disponible <= i.stock_minimo
                                ? 'text-yellow-600'
                                : 'text-green-600'">
              {{ i.stock_disponible }}
            </span>
          </td>

          <td class="p-3">
            <span [ngClass]="colors.getEstadoClase(i.estado)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ i.estado }}
            </span>
          </td>

          <td class="p-3">
            <div class="flex justify-center gap-1">
              <button (click)="verKardex(i)" title="Kardex"
                      class="bg-blue-500 hover:bg-blue-600 text-white
                             px-2 py-1 rounded text-sm">
                📊
              </button>
              <button (click)="editarConfig(i)" title="Configurar stock"
                      class="bg-gray-200 hover:bg-gray-300
                             px-2 py-1 rounded text-sm">
                ⚙️
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PAGINACIÓN -->
    <div class="flex justify-center mt-4 gap-2">
      <button (click)="cambiarPagina(paginaActual - 1)"
              [disabled]="paginaActual === 1"
              class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">◀</button>
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
              class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">▶</button>
    </div>
  </div>

  <!-- ══ MODAL MOVIMIENTO ══ -->
  <div *ngIf="mostrarModal"
       class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">

      <div class="flex justify-between mb-5">
        <h3 class="text-lg font-bold">Registrar movimiento</h3>
        <button (click)="cerrarModal()"
                class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <div *ngIf="cargandoProductos" class="text-center py-4 text-gray-400">
        Cargando...
      </div>

      <div *ngIf="!cargandoProductos" class="space-y-3">
        <div>
          <label class="text-sm text-gray-600 block mb-1">Producto</label>
          <select [(ngModel)]="form.producto_id" class="w-full p-2 border rounded">
            <option [ngValue]="null">Seleccione producto</option>
            <option *ngFor="let p of productos" [ngValue]="p.producto_id">
              {{ p.nombre }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">
            Almacén
            <span class="text-xs text-gray-400 ml-1">(selecciona la sede correcta)</span>
          </label>
          <select [(ngModel)]="form.almacen_id" class="w-full p-2 border rounded">
            <option [ngValue]="null">Seleccione almacén</option>
            <option *ngFor="let a of almacenes" [ngValue]="a.almacen_id">
              {{ a.nombre }} — {{ a.sucursalnombre }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">Tipo de movimiento</label>
          <select [(ngModel)]="form.tipo_movimiento" class="w-full p-2 border rounded">
            <option value="">Seleccione tipo</option>
            <option value="ENTRADA">Entrada (aumenta stock)</option>
            <option value="SALIDA">Salida (reduce stock)</option>
            <option value="AJUSTE">Ajuste (establece stock exacto)</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">Cantidad</label>
          <input [(ngModel)]="form.cantidad" type="number" min="1"
                 class="w-full p-2 border rounded"/>
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">Motivo</label>
          <input [(ngModel)]="form.motivo"
                 placeholder="Ej: Compra a proveedor, merma..."
                 class="w-full p-2 border rounded"/>
        </div>

        <button (click)="guardar()" [disabled]="guardando"
                class="w-full bg-blue-600 text-white p-2 rounded
                       hover:bg-blue-700 disabled:opacity-50">
          {{ guardando ? 'Guardando...' : 'Guardar movimiento' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL CONFIG STOCK ══ -->
  <div *ngIf="mostrarConfig"
       class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-6 w-full max-w-sm">

      <h3 class="font-bold mb-1">Configurar stock</h3>
      <p class="text-sm text-gray-500 mb-4">
        {{ config._nombreproducto }} · {{ config._almacennombre }}
        <span [ngClass]="colors.getSucursalClase(config._sucursalnombre)"
              class="ml-1 text-xs px-2 py-0.5 rounded-full font-medium">
          {{ config._sucursalnombre }}
        </span>
      </p>

      <div class="space-y-3">
        <div>
          <label class="text-sm text-gray-600 block mb-1">Stock mínimo</label>
          <input [(ngModel)]="config.stock_minimo" type="number" min="0"
                 class="w-full p-2 border rounded"/>
          <p class="text-xs text-gray-400 mt-1">
            Alerta cuando el stock baje de este valor
          </p>
        </div>
        <div>
          <label class="text-sm text-gray-600 block mb-1">Stock máximo</label>
          <input [(ngModel)]="config.stock_maximo" type="number" min="1"
                 class="w-full p-2 border rounded"/>
          <p class="text-xs text-gray-400 mt-1">
            Alerta cuando el stock supere este valor
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <button (click)="cerrarConfig()"
                class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Cancelar
        </button>
        <button (click)="guardarConfig()"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Guardar
        </button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL KARDEX ══ -->
  <div *ngIf="mostrarKardex"
       class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl p-6 w-full max-w-4xl max-h-screen overflow-y-auto">

      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-bold text-lg">Kardex</h3>
          <p class="text-sm text-gray-500">
            {{ kardex[0]?.producto }} · {{ kardex[0]?.almacen }}
          </p>
        </div>
        <button (click)="mostrarKardex = false"
                class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Fecha inicio</label>
          <input type="date" [(ngModel)]="fechaInicio"
                 class="border p-2 rounded text-sm"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Fecha fin</label>
          <input type="date" [(ngModel)]="fechaFin"
                 class="border p-2 rounded text-sm"/>
        </div>
        <div class="flex items-end gap-2">
          <button (click)="filtrarKardex()"
                  class="bg-blue-600 text-white px-3 py-2 rounded text-sm">
            Filtrar
          </button>
          <button (click)="limpiarFiltro()"
                  class="bg-gray-400 text-white px-3 py-2 rounded text-sm">
            Limpiar
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full bg-white text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-2 text-center">Fecha</th>
              <th class="p-2 text-center">Tipo</th>
              <th class="p-2 text-center">Cantidad</th>
              <th class="p-2 text-center">Stock anterior</th>
              <th class="p-2 text-center">Stock final</th>
              <th class="p-2 text-center">Motivo</th>
              <th class="p-2 text-center">Almacén</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="kardex.length === 0">
              <td colspan="7" class="p-4 text-center text-gray-400">
                Sin movimientos
              </td>
            </tr>
            <tr *ngFor="let k of kardex"
                class="text-center border-t hover:bg-gray-50">
              <td class="p-2">{{ k.fecha | date:'dd/MM/yy HH:mm' }}</td>
              <td class="p-2 font-semibold"
                  [ngClass]="{
                    'text-green-600': k.tipo_movimiento === 'ENTRADA',
                    'text-red-600':   k.tipo_movimiento === 'SALIDA',
                    'text-blue-600':  k.tipo_movimiento === 'AJUSTE'
                  }">
                {{ k.tipo_movimiento }}
              </td>
              <td class="p-2 font-medium">{{ k.cantidad }}</td>
              <td class="p-2 text-gray-500">{{ k.stock_antes }}</td>
              <td class="p-2 font-bold">{{ k.stock_despues }}</td>
              <td class="p-2 text-gray-600 text-left">{{ k.motivo }}</td>
              <td class="p-2 text-gray-500">{{ k.almacen }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

</div>
  `
})
export class InventarioComponent implements OnInit {

  inventario:          any[] = [];
  inventarioFiltrado:  any[] = [];
  inventarioPaginados: any[] = [];
  productos:  any[] = [];
  almacenes:  any[] = [];
  sucursales: string[] = [];

  mostrarModal      = false;
  mostrarConfig     = false;
  mostrarKardex     = false;
  cargandoProductos = false;
  guardando         = false;
  private alertaMostrada = false;

  paginaActual       = 1;
  registrosPorPagina = 8;

  filtroSucursal = '';
  filtroEstado   = '';
  filtroBusqueda = '';

  productoSeleccionado: number | null = null;
  almacenSeleccionado:  number | null = null;
  kardex:      any[] = [];
  fechaInicio  = '';
  fechaFin     = '';

  form:   any = this.getFormInicial();
  config: any = {
    producto_id:     null,
    almacen_id:      null,
    stock_minimo:    0,
    stock_maximo:    0,
    _nombreproducto: '',
    _almacennombre:  '',
    _sucursalnombre: ''
  };

  constructor(
    private inventarioService: InventarioService,
    private productosService:  ProductosService,
    private almacenesService:  AlmacenesService,
    public  colors:            ColorService,   // ← inyectado correctamente
    private cd:                ChangeDetectorRef
  ) {}

  ngOnInit() {
  this.cargar(true); // ← true = mostrar alerta
  this.almacenesService.getAlmacenes().subscribe((res: any) => {
    this.almacenes = res;
  });
}

  cargar(mostrarAlerta = false) {
  this.inventarioService.getInventario().subscribe((res: any) => {
    this.inventario = res;
    this.sucursales = [...new Set<string>(
      res.map((i: any) => i.sucursalnombre)
    )].sort();
    this.aplicarFiltros();

    // ← Solo mostrar alertas en la carga inicial
    if (mostrarAlerta && !this.alertaMostrada) {
      this.alertaMostrada = true;
      const alertas: string[] = [];
      res.forEach((i: any) => {
        if (i.stock_actual < i.stock_minimo && i.stock_minimo > 0)
          alertas.push(`🔴 <b>${i.nombreproducto}</b> (${i.sucursalnombre}) — stock: ${i.stock_actual}/${i.stock_minimo} mín`);
        if (i.stock_actual > i.stock_maximo && i.stock_maximo > 0)
          alertas.push(`🟡 <b>${i.nombreproducto}</b> (${i.sucursalnombre}) — stock alto: ${i.stock_actual}/${i.stock_maximo} máx`);
      });
      if (alertas.length > 0) {
        Swal.fire({
          title:              'Alertas de inventario',
          html:               alertas.join('<br>'),
          icon:               'warning',
          confirmButtonText:  'Entendido',
          confirmButtonColor: '#2563eb'
        });
      }
    }
    this.cd.detectChanges();
  });
}

  aplicarFiltros() {
    let r = [...this.inventario];
    if (this.filtroSucursal)
      r = r.filter(i => i.sucursalnombre === this.filtroSucursal);
    if (this.filtroEstado)
      r = r.filter(i => i.estado === this.filtroEstado);
    if (this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.toLowerCase();
      r = r.filter(i => i.nombreproducto.toLowerCase().includes(q));
    }
    this.inventarioFiltrado = r;
    this.paginaActual       = 1;
    this.actualizarPaginacion();
  }

  limpiarFiltros() {
    this.filtroSucursal = '';
    this.filtroEstado   = '';
    this.filtroBusqueda = '';
    this.aplicarFiltros();
  }

  contarEstado(estado: string): number {
    return this.inventarioFiltrado.filter(i => i.estado === estado).length;
  }

  abrirModal() {
    this.form              = this.getFormInicial();
    this.mostrarModal      = true;
    this.cargandoProductos = true;
    this.productosService.getProductos().subscribe((res: any) => {
      this.productos         = res;
      this.cargandoProductos = false;
      this.cd.detectChanges();
    });
  }

  cerrarModal() {
    this.mostrarModal      = false;
    this.form              = this.getFormInicial();
    this.cargandoProductos = false;
    this.guardando         = false;
  }

  guardar() {
    if (this.guardando) return;
    if (!this.form.producto_id)     { Swal.fire('Atención', 'Selecciona un producto', 'warning'); return; }
    if (!this.form.almacen_id)      { Swal.fire('Atención', 'Selecciona un almacén', 'warning'); return; }
    if (!this.form.tipo_movimiento) { Swal.fire('Atención', 'Selecciona el tipo', 'warning'); return; }
    if (this.form.cantidad <= 0)    { Swal.fire('Atención', 'Cantidad inválida', 'warning'); return; }
    if (!this.form.motivo?.trim())  { Swal.fire('Atención', 'Ingresa un motivo', 'warning'); return; }

    this.guardando = true;
    this.inventarioService.createMovimiento(this.form).subscribe({
      next: (res: any) => {
        Swal.fire({ icon: 'success', title: 'Movimiento registrado',
          text: `Stock actual: ${res.stock_actual}`, timer: 2000, showConfirmButton: false });
        this.cargar();
        this.cerrarModal();
      },
      error: (err) => { Swal.fire('Error', err.error, 'error'); this.guardando = false; }
    });
  }

  editarConfig(i: any) {
    this.config = {
      producto_id:     i.producto_id,
      almacen_id:      i.almacen_id,
      stock_minimo:    i.stock_minimo,
      stock_maximo:    i.stock_maximo,
      _nombreproducto: i.nombreproducto,
      _almacennombre:  i.almacennombre,
      _sucursalnombre: i.sucursalnombre
    };
    this.mostrarConfig = true;
  }

  cerrarConfig() { this.mostrarConfig = false; }

  guardarConfig() {
    this.inventarioService.updateConfig(this.config).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Configuración guardada',
          timer: 1500, showConfirmButton: false });
        this.cargar();
        this.cerrarConfig();
      },
      error: (err) => Swal.fire('Error', err.error, 'error')
    });
  }

  verKardex(i: any) {
    this.productoSeleccionado = i.producto_id;
    this.almacenSeleccionado  = i.almacen_id;
    this.fechaInicio          = '';
    this.fechaFin             = '';
    this.inventarioService.getKardex(i.producto_id, i.almacen_id).subscribe((res: any) => {
      this.kardex        = res;
      this.mostrarKardex = true;
      this.cd.detectChanges();
    });
  }

  filtrarKardex() {
    if (!this.productoSeleccionado || !this.almacenSeleccionado) return;
    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      Swal.fire('Atención', 'La fecha inicio no puede ser mayor que la fecha fin', 'warning');
      return;
    }
    this.inventarioService.getKardexFiltrado(
      this.productoSeleccionado, this.almacenSeleccionado, this.fechaInicio, this.fechaFin
    ).subscribe((res: any) => { this.kardex = res; this.cd.detectChanges(); });
  }

  limpiarFiltro() {
    this.fechaInicio = '';
    this.fechaFin    = '';
    this.verKardex({ producto_id: this.productoSeleccionado, almacen_id: this.almacenSeleccionado });
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    this.inventarioPaginados = this.inventarioFiltrado.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.inventarioFiltrado.length / this.registrosPorPagina));
  }

  getFormInicial() {
    return { producto_id: null, almacen_id: null, tipo_movimiento: '', cantidad: 0, motivo: '' };
  }
}