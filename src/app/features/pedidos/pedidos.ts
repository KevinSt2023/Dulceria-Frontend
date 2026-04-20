import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidosService } from '../../core/services/pedidos';
import { ClientesService } from '../../core/services/clientes';
import { ProductosService } from '../../core/services/productos';
import { SucursalesService } from '../../core/services/sucursales';
import { UbigeoService } from '../../core/services/ubigeos';
import { AuthService } from '../../core/auth/auth';
import { ColorService } from '../../core/services/color';
import { ConfiguracionPagoService } from '../../core/services/configuracion-pago';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4">

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-bold text-gray-700">Pedidos</h2>
    <div class="flex gap-2">
      <button (click)="nuevoPedido()"
              class="bg-green-600 text-white px-4 py-2 rounded-lg">
        + Nuevo Pedido
      </button>
      <button (click)="cargar()"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg">
        🔄 Refrescar
      </button>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando pedidos...
  </div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-3 text-center">N°</th>
          <th class="p-3 text-center">Cliente</th>
          <th class="p-3 text-center hidden md:table-cell">Sucursal</th>
          <th class="p-3 text-center">Total</th>
          <th class="p-3 text-center">Estado</th>
          <th class="p-3 text-center hidden md:table-cell">Tipo</th>
          <th class="p-3 text-center hidden md:table-cell">Fecha</th>
          <th class="p-3 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="pedidos.length === 0">
          <td colspan="8" class="p-6 text-center text-gray-400">
            No hay pedidos registrados
          </td>
        </tr>
        <tr *ngFor="let p of pedidos" class="border-t hover:bg-gray-50">
          <td class="p-3 font-bold text-center">{{ p.pedido_id }}</td>
          <td class="p-3 text-center">{{ p.cliente }}</td>
          <td class="p-3 text-center hidden md:table-cell">
            <span [ngClass]="colors.getSucursalClase(p.sucursal)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ p.sucursal }}
            </span>
          </td>
          <td class="p-3 text-center text-green-600 font-bold">
            S/ {{ p.total }}
          </td>
          <td class="p-3 text-center">
            <span [ngClass]="getEstadoClase(p.estado)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ p.estado }}
            </span>
          </td>
          <td class="p-3 text-center hidden md:table-cell">
            <span [ngClass]="colors.getTipoPedidoClase(p.tipos_pedido)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ p.tipos_pedido ?? '—' }}
            </span>
          </td>
          <td class="p-3 text-center hidden md:table-cell text-sm text-gray-500">
            {{ p.fecha | date:'dd/MM/yy HH:mm' }}
          </td>
          <td class="p-3 text-center">
            <div class="flex justify-center gap-1">
              <button (click)="verDetalle(p)"
                      class="bg-gray-500 hover:bg-gray-600 text-white
                             px-2 py-1 rounded text-sm">👁️</button>
              <button *ngIf="puedeAvanzar(p)"
                      (click)="cambiarEstado(p)"
                      class="bg-blue-500 hover:bg-blue-600 text-white
                             px-2 py-1 rounded text-sm">
                {{ getTextoAccion(p.estado) }}
              </button>
              <button *ngIf="!esFinal(p.estado)"
                      (click)="cancelarPedido(p)"
                      class="bg-red-500 hover:bg-red-600 text-white
                             px-2 py-1 rounded text-sm">❌</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ══ MODAL NUEVO PEDIDO ══ -->
  <div *ngIf="mostrarModal"
       class="fixed inset-0 bg-black/50 flex items-center
              justify-center z-50 p-4">

    <!-- ← max-h + overflow-y-auto para el scroll -->
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl
                flex flex-col"
         style="max-height: 90vh;">

      <!-- Cabecera fija -->
      <div class="flex justify-between items-center p-6 border-b flex-shrink-0">
        <h3 class="text-xl font-bold">Nuevo Pedido</h3>
        <button (click)="cerrarModal()"
                class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
          &times;
        </button>
      </div>

      <!-- Stepper fijo -->
      <div class="flex items-center gap-2 px-6 py-4 border-b flex-shrink-0">
        <div *ngFor="let s of pasos; let i = index"
             class="flex items-center gap-2">
          <div [ngClass]="paso >= i + 1
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-200 text-gray-500'"
               class="w-7 h-7 rounded-full flex items-center justify-center
                      text-xs font-bold transition-colors">
            {{ i + 1 }}
          </div>
          <span [ngClass]="paso >= i + 1 ? 'text-blue-600' : 'text-gray-400'"
                class="text-xs font-medium hidden sm:block">
            {{ s }}
          </span>
          <div *ngIf="i < pasos.length - 1"
               class="w-6 h-px bg-gray-300 mx-1"></div>
        </div>
      </div>

      <!-- Contenido con scroll -->
      <div class="flex-1 overflow-y-auto p-6">

        <!-- ══ PASO 1: Cliente ══ -->
        <div *ngIf="paso === 1">
          <p class="text-sm font-semibold text-gray-500 uppercase mb-3">
            1. Cliente
          </p>

          <div class="flex gap-2 mb-3">
            <input [(ngModel)]="dniBusqueda"
                  placeholder="DNI (8 dígitos) o RUC (11 dígitos)"
                  maxlength="11"
                  class="flex-1 p-2 border rounded"
                  (keyup.enter)="buscarCliente()"/>
            <button (click)="buscarCliente()"
                    [disabled]="buscandoCliente ||
                                (dniBusqueda.length !== 8 && dniBusqueda.length !== 11)"
                    class="bg-blue-600 text-white px-4 rounded disabled:opacity-50">
              {{ buscandoCliente ? '⏳' : '🔍' }}
            </button>
          </div>

          <div *ngIf="clienteEncontrado"
               class="flex items-center gap-3 bg-green-50
                      border border-green-200 p-3 rounded mb-3">
            <span class="text-green-600 text-xl">✓</span>
            <div>
              <p class="font-semibold">{{ clienteEncontrado.nombre }}</p>
              <p class="text-sm text-gray-500">
                {{ clienteEncontrado.documento }} · {{ clienteEncontrado.telefono }}
              </p>
              <p *ngIf="clienteEncontrado.direccion"
                 class="text-xs text-gray-400 mt-0.5">
                {{ clienteEncontrado.direccion }}
              </p>
            </div>
          </div>

          <div *ngIf="mostrarFormCliente"
               class="border border-yellow-200 bg-yellow-50 p-4 rounded">
            <p class="font-semibold text-yellow-700 mb-3">
              Registrar nuevo cliente
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input [(ngModel)]="nuevoCliente.nombre"
                     placeholder="Nombres y apellidos *"
                     class="p-2 border rounded"/>
              <input [(ngModel)]="nuevoCliente.documento"
                     placeholder="Nro. Documento"
                     class="p-2 border rounded"
                     [value]="dniBusqueda"
                     readonly/>
              <input [(ngModel)]="nuevoCliente.telefono"
                     placeholder="Celular"
                     class="p-2 border rounded"/>
              <input [(ngModel)]="nuevoCliente.email"
                     placeholder="Correo electrónico"
                     class="p-2 border rounded"/>
              <input [(ngModel)]="nuevoCliente.direccion"
                     placeholder="Dirección"
                     class="p-2 border rounded md:col-span-2"/>
            </div>
            <button (click)="crearCliente()"
                    class="mt-3 bg-green-600 text-white px-4 py-2 rounded w-full">
              Guardar Cliente
            </button>
          </div>

          <div class="flex justify-end mt-4">
            <button (click)="irPaso(2)"
                    [disabled]="!form.cliente_id"
                    class="px-5 py-2 bg-blue-600 text-white rounded
                           disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        </div>

        <!-- ══ PASO 2: Productos ══ -->
        <div *ngIf="paso === 2">
          <p class="text-sm font-semibold text-gray-500 uppercase mb-3">
            2. Productos
          </p>

          <div class="flex gap-2 mb-3">
            <select [(ngModel)]="nuevoItem.producto_id"
                    class="flex-1 p-2 border rounded">
              <option [ngValue]="null">-- Selecciona producto --</option>
              <option *ngFor="let p of productos"
                      [ngValue]="p.producto_id"
                      [disabled]="!p.permite_pedido_sin_stock && p.stock_actual === 0">
                {{ p.nombre }} — S/ {{ p.precio }}
                {{ !p.permite_pedido_sin_stock
                    ? '(stock: ' + p.stock_actual + ')'
                    : '(encargo)' }}
              </option>
            </select>
            <input type="number"
                   [(ngModel)]="nuevoItem.cantidad"
                   min="1"
                   class="w-20 p-2 border rounded text-center"/>
            <button (click)="agregarItem()"
                    class="bg-green-500 hover:bg-green-600 text-white px-4 rounded">
              + Agregar
            </button>
          </div>

          <div class="border rounded bg-gray-50 divide-y max-h-52
                      overflow-y-auto mb-3">
            <div *ngIf="form.detalles.length === 0"
                 class="p-4 text-center text-gray-400 text-sm">
              Sin productos aún
            </div>
            <div *ngFor="let d of form.detalles; let i = index"
                 class="flex items-center gap-2 p-2 bg-white">
              <span class="flex-1 text-sm font-medium truncate">
                {{ d.producto }}
                <span *ngIf="d.permite_pedido_sin_stock"
                      class="ml-1 text-xs bg-blue-100 text-blue-700
                             px-1.5 py-0.5 rounded-full">
                  encargo
                </span>
              </span>
              <input type="number"
                     [(ngModel)]="d.cantidad"
                     (ngModelChange)="recalcular(d)"
                     min="1"
                     [max]="d.permite_pedido_sin_stock ? 9999 : d.stock_actual"
                     class="w-16 border p-1 text-center rounded text-sm"/>
              <span class="w-24 text-right font-semibold text-sm">
                S/ {{ d.subtotal | number:'1.2-2' }}
              </span>
              <button (click)="eliminarItem(i)"
                      class="text-red-400 hover:text-red-600 px-1">✕</button>
            </div>
          </div>

          <div class="flex justify-end items-center gap-2 mb-4">
            <span class="text-gray-500">Total:</span>
            <span class="text-2xl font-bold text-green-600">
              S/ {{ total | number:'1.2-2' }}
            </span>
          </div>

          <div class="flex justify-between">
            <button (click)="irPaso(1)"
                    class="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded">
              ← Volver
            </button>
            <button (click)="irPaso(3)"
                    [disabled]="form.detalles.length === 0"
                    class="px-5 py-2 bg-blue-600 text-white rounded
                           disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        </div>

        <!-- ══ PASO 3: Tipo y entrega ══ -->
        <div *ngIf="paso === 3">
          <p class="text-sm font-semibold text-gray-500 uppercase mb-3">
            3. Tipo y entrega
          </p>

          <!-- Selector tipo pedido -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button (click)="seleccionarTipo('DELIVERY')"
                    [ngClass]="form.tipos_pedido === 'DELIVERY'
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-4 text-center transition-all">
              <p class="text-2xl mb-1">🛵</p>
              <p class="font-semibold text-sm">Delivery</p>
              <p class="text-xs opacity-70">Se lleva al cliente</p>
            </button>
            <button (click)="seleccionarTipo('PICKUP')"
                    [ngClass]="form.tipos_pedido === 'PICKUP'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-4 text-center transition-all">
              <p class="text-2xl mb-1">🏪</p>
              <p class="font-semibold text-sm">Pickup</p>
              <p class="text-xs opacity-70">Recoge en tienda</p>
            </button>
          </div>

          <!-- ── DELIVERY ── -->
          <div *ngIf="form.tipos_pedido === 'DELIVERY'" class="space-y-4">

            <!-- Método de pago -->
            <div>
              <label class="text-xs text-gray-500 mb-2 block font-medium">
                Método de pago
              </label>
              <div class="grid grid-cols-2 gap-2">

                <button (click)="seleccionarMetodo('contra_entrega', false)"
                        [ngClass]="form.metodo_pago === 'contra_entrega'
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 text-gray-500'"
                        class="border-2 rounded-xl p-3 text-center transition-all">
                  <p class="text-xl mb-1">💵</p>
                  <p class="font-semibold text-xs">Contra entrega</p>
                  <p class="text-xs opacity-70">Paga al recibir</p>
                </button>

                <button (click)="seleccionarMetodo('yape', true)"
                        [ngClass]="form.metodo_pago === 'yape'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 text-gray-500'"
                        class="border-2 rounded-xl p-3 text-center transition-all">
                  <p class="text-xl mb-1">📱</p>
                  <p class="font-semibold text-xs">Yape / Plin</p>
                  <p class="text-xs opacity-70">Ya pagó</p>
                </button>

                <button (click)="seleccionarMetodo('efectivo', true)"
                        [ngClass]="form.metodo_pago === 'efectivo'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 text-gray-500'"
                        class="border-2 rounded-xl p-3 text-center transition-all">
                  <p class="text-xl mb-1">💰</p>
                  <p class="font-semibold text-xs">Efectivo</p>
                  <p class="text-xs opacity-70">Pago en tienda</p>
                </button>

                <button (click)="seleccionarMetodo('tarjeta', true)"
                        [ngClass]="form.metodo_pago === 'tarjeta'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-500'"
                        class="border-2 rounded-xl p-3 text-center transition-all">
                  <p class="text-xl mb-1">💳</p>
                  <p class="font-semibold text-xs">Tarjeta</p>
                  <p class="text-xs opacity-70">Pago en tienda</p>
                </button>

              </div>
            </div>

            <!-- QR de Yape — fuera del botón, como sección aparte -->
            <div *ngIf="form.metodo_pago === 'yape' && qrActual"
                 class="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p class="text-xs text-purple-600 font-medium mb-3 text-center">
                📱 Muestra este QR al cliente para que pague
              </p>
              <div class="flex items-center gap-4">
                <img [src]="'data:image/png;base64,' + qrActual.qr_base64"
                     class="w-32 h-32 object-contain rounded-lg border
                            bg-white p-1 flex-shrink-0"
                     alt="QR Yape"/>
                <div>
                  <p class="font-bold text-gray-800">{{ qrActual.titular }}</p>
                  <p class="text-sm text-gray-500">{{ qrActual.numero }}</p>
                  <p class="text-lg font-bold text-green-600 mt-2">
                    S/ {{ total | number:'1.2-2' }}
                  </p>
                  <p class="text-xs text-purple-600 mt-1">
                    Confirma que el cliente pagó antes de guardar
                  </p>
                </div>
              </div>
            </div>

            <!-- QR no configurado -->
            <div *ngIf="form.metodo_pago === 'yape' && !qrActual && !cargandoQR"
                 class="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p class="text-xs text-yellow-700 text-center">
                ⚠️ QR de Yape no configurado.
                Pide al administrador que lo configure en
                Configuración → Métodos de pago.
              </p>
            </div>

            <!-- Dirección de entrega -->
            <div>
              <label class="text-xs text-gray-500 mb-2 block font-medium">
                Dirección de entrega
              </label>
              <div class="flex gap-3 mb-2">
                <button (click)="usarDireccionCliente()"
                        [ngClass]="usandoDireccionCliente
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600'"
                        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors">
                  Usar dirección del cliente
                </button>
                <button (click)="usarOtraDireccion()"
                        [ngClass]="!usandoDireccionCliente
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600'"
                        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors">
                  Otra dirección
                </button>
              </div>

              <div *ngIf="usandoDireccionCliente"
                   class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <p class="font-medium text-green-800 mb-1">
                  Dirección registrada del cliente
                </p>
                <p *ngIf="clienteEncontrado?.direccion" class="text-gray-700">
                  {{ clienteEncontrado.direccion }}
                </p>
                <p *ngIf="clienteEncontrado?.departamento_nombre ||
                          clienteEncontrado?.provincia_nombre ||
                          clienteEncontrado?.distrito_nombre"
                   class="text-gray-500 text-xs mt-1">
                  {{ clienteEncontrado?.distrito_nombre }}
                  {{ clienteEncontrado?.provincia_nombre
                      ? '· ' + clienteEncontrado.provincia_nombre : '' }}
                  {{ clienteEncontrado?.departamento_nombre
                      ? '· ' + clienteEncontrado.departamento_nombre : '' }}
                </p>
                <p *ngIf="!clienteEncontrado?.direccion &&
                          !clienteEncontrado?.distrito_nombre"
                   class="text-yellow-600 text-xs">
                  El cliente no tiene dirección registrada.
                  Usa "Otra dirección".
                </p>
              </div>

              <div *ngIf="!usandoDireccionCliente" class="space-y-2">
                <select [(ngModel)]="entrega.departamento_id"
                        (ngModelChange)="onDepartamentoChange($event)"
                        class="w-full p-2 border rounded">
                  <option [ngValue]="null">-- Departamento --</option>
                  <option *ngFor="let d of departamentos"
                          [ngValue]="d.departamento_id">{{ d.nombre }}</option>
                </select>
                <select [(ngModel)]="entrega.provincia_id"
                        (ngModelChange)="onProvinciaChange($event)"
                        [disabled]="!entrega.departamento_id"
                        class="w-full p-2 border rounded disabled:opacity-50">
                  <option [ngValue]="null">-- Provincia --</option>
                  <option *ngFor="let p of provincias"
                          [ngValue]="p.provincia_id">{{ p.nombre }}</option>
                </select>
                <select [(ngModel)]="entrega.distrito_id"
                        [disabled]="!entrega.provincia_id"
                        class="w-full p-2 border rounded disabled:opacity-50">
                  <option [ngValue]="null">-- Distrito --</option>
                  <option *ngFor="let d of distritos"
                          [ngValue]="d.distrito_id">{{ d.nombre }}</option>
                </select>
                <input [(ngModel)]="entrega.direccion"
                       placeholder="Dirección exacta"
                       class="w-full p-2 border rounded"/>
              </div>
            </div>

            <!-- Observaciones -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">
                Observaciones (opcional)
              </label>
              <input [(ngModel)]="form.observaciones"
                     placeholder="Ej: dejar en recepción..."
                     class="w-full p-2 border rounded text-sm"/>
            </div>

          </div>

          <!-- ── PICKUP ── -->
          <div *ngIf="form.tipos_pedido === 'PICKUP'" class="space-y-3">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">
                Sucursal donde recoge
              </label>
              <select [(ngModel)]="form.sucursal_recojo_id"
                      class="w-full p-2 border rounded">
                <option [ngValue]="null">-- Selecciona sucursal --</option>
                <option *ngFor="let s of sucursales" [ngValue]="s.sucursal_id">
                  {{ s.nombre }}{{ s.direccion ? ' — ' + s.direccion : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">
                Observaciones (opcional)
              </label>
              <input [(ngModel)]="form.observaciones"
                     placeholder="Ej: viene a las 3pm..."
                     class="w-full p-2 border rounded text-sm"/>
            </div>
          </div>

          <!-- Botones paso 3 -->
          <div class="flex justify-between mt-6">
            <button (click)="irPaso(2)"
                    class="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded">
              ← Volver
            </button>
            <button (click)="guardarPedido()"
                    [disabled]="!puedeGuardar() || guardando"
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white
                           rounded disabled:opacity-40">
              {{ guardando ? 'Guardando...' : 'Guardar Pedido' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>

</div>
  `
})
export class PedidosComponent implements OnInit {

  pedidos:       any[] = [];
  productos:     any[] = [];
  sucursales:    any[] = [];
  departamentos: any[] = [];
  provincias:    any[] = [];
  distritos:     any[] = [];

  paso  = 1;
  pasos = ['Cliente', 'Productos', 'Entrega'];

  dniBusqueda             = '';
  clienteEncontrado: any  = null;
  mostrarFormCliente      = false;
  usandoDireccionCliente  = false;
  buscandoCliente         = false;
  cargandoQR              = false;
  qrActual: { qr_base64: string; numero: string; titular: string } | null = null;

  nuevoCliente: any = { nombre: '', telefono: '', direccion: '', email: '' };

  form: any = {
    cliente_id:         null,
    detalles:           [],
    tipos_pedido:       null,
    observaciones:      '',
    direccion_entrega:  '',
    sucursal_recojo_id: null,
    pagado:             false,
    metodo_pago:        null
  };

  entrega: any = {
    departamento_id: null,
    provincia_id:    null,
    distrito_id:     null,
    direccion:       ''
  };

  nuevoItem: any = { producto_id: null, cantidad: 1 };

  mostrarModal = false;
  loading      = true;
  guardando    = false;

  private readonly flujoEstados: Record<string, number> = {
    'PENDIENTE':      2,
    'CONFIRMADO':     3,
    'EN_PREPARACION': 4,
    'LISTO':          5
  };

  private readonly estadosFinales = new Set(['ENTREGADO', 'CANCELADO']);

  constructor(
    private pedidosService:    PedidosService,
    private clientesService:   ClientesService,
    private productosService:  ProductosService,
    private sucursalesService: SucursalesService,
    private ubigeoService:     UbigeoService,
    private authService:       AuthService,
    private configPagoService: ConfiguracionPagoService,
    private cd:                ChangeDetectorRef,
    public  colors:            ColorService
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.pedidosService.getPedidos().subscribe({
      next: (res: any) => {
        this.pedidos = res;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error');
      }
    });
  }

  nuevoPedido() {
    this.paso               = 1;
    this.mostrarModal       = true;
    this.qrActual           = null;
    this.form               = {
      cliente_id:         null,
      detalles:           [],
      tipos_pedido:       null,
      observaciones:      '',
      direccion_entrega:  '',
      sucursal_recojo_id: null,
      pagado:             false,
      metodo_pago:        null
    };
    this.entrega = {
      departamento_id: null, provincia_id: null,
      distrito_id: null, direccion: ''
    };
    this.dniBusqueda            = '';
    this.clienteEncontrado      = null;
    this.mostrarFormCliente     = false;
    this.usandoDireccionCliente = false;
    this.nuevoItem              = { producto_id: null, cantidad: 1 };

    this.productosService.getProductosDisponibles().subscribe((res: any) => {
      this.productos = res;
      this.cd.detectChanges();
    });

    this.sucursalesService.getSucursalesPickup().subscribe((res: any) => {
      this.sucursales = res.filter((s: any) => s.activo);
      this.cd.detectChanges();
    });

    this.ubigeoService.getDepartamentos().subscribe((res: any) => {
      this.departamentos = res;
      this.cd.detectChanges();
    });
  }

  cerrarModal() { this.mostrarModal = false; }
  irPaso(n: number) { this.paso = n; this.cd.detectChanges(); }

  // ── Seleccionar método de pago ──
  seleccionarMetodo(metodo: string, pagado: boolean) {
    this.form.metodo_pago = metodo;
    this.form.pagado      = pagado;
    this.qrActual         = null;

    if (metodo === 'yape') {
      this.cargarQR('yape');
    }
    this.cd.detectChanges();
  }

  cargarQR(tipo: string) {
    this.cargandoQR = true;
    this.configPagoService.getQR(tipo).subscribe({
      next: (res: any) => {
        this.qrActual   = res;
        this.cargandoQR = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.qrActual   = null;
        this.cargandoQR = false;
        this.cd.detectChanges();
      }
    });
  }

  buscarCliente() {
  if (!this.dniBusqueda.trim()) {
    Swal.fire('¡Cuidado!', 'Ingrese un número de documento', 'warning');
    return;
  }
  if (this.buscandoCliente) return;

  this.buscandoCliente = true;
  this.cd.detectChanges();

  // Primero busca en BD
  this.clientesService.getClienteDNI(this.dniBusqueda).subscribe({
    next: (res: any) => {
      this.buscandoCliente    = false;
      this.clienteEncontrado  = res;
      this.form.cliente_id    = res.cliente_id;
      this.mostrarFormCliente = false;
      this.cd.detectChanges();
    },
    error: () => {
      // No está en BD → consultar RENIEC/SUNAT
      const esRUC = this.dniBusqueda.length === 11;
      const obs   = esRUC
        ? this.clientesService.consultarRUC(this.dniBusqueda)
        : this.clientesService.consultarDNI(this.dniBusqueda);

      obs.subscribe({
        next: (res: any) => {
          this.buscandoCliente = false;

          if (res.nombre) {
            // Encontrado en RENIEC/SUNAT — precargar formulario
            this.nuevoCliente = {
              nombre:    res.nombre,
              documento: res.documento,
              telefono:  '',
              email:     '',
              direccion: res.direccion ?? ''
            };
            this.mostrarFormCliente = true;
            this.clienteEncontrado  = null;
            Swal.fire({
              icon:  'info',
              title: esRUC ? '✓ RUC encontrado en SUNAT'
                           : '✓ DNI encontrado en RENIEC',
              text:  `${res.nombre} — confirma los datos y guarda`,
              timer: 2500,
              showConfirmButton: false
            });
          } else {
            // Tampoco en RENIEC — mostrar formulario vacío
            this.nuevoCliente       = {
              nombre: '', telefono: '', email: '', direccion: ''
            };
            this.mostrarFormCliente = true;
            this.clienteEncontrado  = null;
            Swal.fire('No encontrado',
              'Documento no encontrado. Ingresa los datos manualmente.', 'warning');
          }
          this.cd.detectChanges();
        },
        error: () => {
          this.buscandoCliente    = false;
          this.mostrarFormCliente = true;
          this.nuevoCliente       = {
            nombre: '', telefono: '', email: '', direccion: ''
          };
          this.cd.detectChanges();
          Swal.fire('No encontrado',
            'Ingresa los datos del cliente manualmente.', 'warning');
        }
      });
    }
  });
}

  crearCliente() {
    if (!this.nuevoCliente.nombre?.trim()) {
      Swal.fire('Campo requerido', 'Ingrese el nombre del cliente', 'warning');
      return;
    }
    this.nuevoCliente.documento = this.dniBusqueda;
    this.clientesService.createClientes(this.nuevoCliente).subscribe({
      next: (res: any) => {
        this.form.cliente_id    = res.cliente_id;
        this.clienteEncontrado  = res;
        this.mostrarFormCliente = false;
        Swal.fire('Listo', 'Cliente registrado', 'success');
        this.cd.detectChanges();
      },
      error: () => Swal.fire('Error', 'No se pudo registrar el cliente', 'error')
    });
  }

  seleccionarTipo(tipo: string) {
    this.form.tipos_pedido       = tipo;
    this.usandoDireccionCliente  = false;
    this.form.sucursal_recojo_id = null;
    this.form.pagado             = false;
    this.form.metodo_pago        = null;
    this.qrActual                = null;
    this.entrega = {
      departamento_id: null, provincia_id: null,
      distrito_id: null, direccion: ''
    };
    this.cd.detectChanges();
  }

  usarDireccionCliente() {
    this.usandoDireccionCliente = true;
    this.form.direccion_entrega = this.clienteEncontrado?.direccion ?? '';
    this.cd.detectChanges();
  }

  usarOtraDireccion() {
    this.usandoDireccionCliente = false;
    this.entrega = {
      departamento_id: null, provincia_id: null,
      distrito_id: null, direccion: ''
    };
    this.cd.detectChanges();
  }

  onDepartamentoChange(departamentoId: number) {
    this.entrega.provincia_id = null;
    this.entrega.distrito_id  = null;
    this.provincias           = [];
    this.distritos            = [];
    if (!departamentoId) return;
    this.ubigeoService.getProvincias(departamentoId).subscribe((res: any) => {
      this.provincias = res;
      this.cd.detectChanges();
    });
  }

  onProvinciaChange(provinciaId: number) {
    this.entrega.distrito_id = null;
    this.distritos           = [];
    if (!provinciaId) return;
    this.ubigeoService.getDistritos(provinciaId).subscribe((res: any) => {
      this.distritos = res;
      this.cd.detectChanges();
    });
  }

  puedeGuardar(): boolean {
    if (!this.form.tipos_pedido) return false;

    if (this.form.tipos_pedido === 'PICKUP')
      return !!this.form.sucursal_recojo_id;

    if (this.form.tipos_pedido === 'DELIVERY') {
      if (!this.form.metodo_pago) return false;
      if (this.usandoDireccionCliente)
        return !!(this.clienteEncontrado?.direccion ||
                  this.clienteEncontrado?.distrito_id);
      return !!(this.entrega.distrito_id && this.entrega.direccion?.trim());
    }

    return false;
  }

  agregarItem() {
    if (!this.nuevoItem.producto_id) {
      Swal.fire('Atención', 'Selecciona un producto', 'warning');
      return;
    }
    if (!this.nuevoItem.cantidad || this.nuevoItem.cantidad < 1) {
      Swal.fire('Atención', 'La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    const prod = this.productos.find(
      p => p.producto_id === this.nuevoItem.producto_id);

    if (!prod.permite_pedido_sin_stock) {
      const yaEnCarrito = this.form.detalles
        .filter((d: any) => d.producto_id === prod.producto_id)
        .reduce((sum: number, d: any) => sum + d.cantidad, 0);

      const totalSolicitado = yaEnCarrito + this.nuevoItem.cantidad;

      if (prod.stock_disponible === 0) {
        Swal.fire({ icon: 'error', title: 'Sin stock',
          text: `"${prod.nombre}" no tiene stock disponible.` });
        return;
      }

      if (totalSolicitado > prod.stock_disponible) {
        Swal.fire({ icon: 'warning', title: 'Stock insuficiente',
          html: `Solo hay <b>${prod.stock_actual}</b> unidad(es) de
                 "<b>${prod.nombre}</b>".<br>
                 Ya tienes <b>${yaEnCarrito}</b> en el pedido.` });
        return;
      }
    }

    const existente = this.form.detalles
      .find((d: any) => d.producto_id === prod.producto_id);

    if (existente) {
      existente.cantidad += this.nuevoItem.cantidad;
      this.recalcular(existente);
    } else {
      this.form.detalles.push({
        producto_id:              prod.producto_id,
        producto:                 prod.nombre,
        cantidad:                 this.nuevoItem.cantidad,
        precio:                   prod.precio,
        subtotal:                 prod.precio * this.nuevoItem.cantidad,
        stock_actual:             prod.stock_actual,
        permite_pedido_sin_stock: prod.permite_pedido_sin_stock
      });
    }

    this.nuevoItem = { producto_id: null, cantidad: 1 };
  }

  recalcular(d: any) { d.subtotal = d.precio * d.cantidad; }
  eliminarItem(i: number) { this.form.detalles.splice(i, 1); }

  get total() {
    return this.form.detalles.reduce((a: number, b: any) => a + b.subtotal, 0);
  }

  guardarPedido() {
    if (this.form.tipos_pedido === 'DELIVERY') {
      if (this.usandoDireccionCliente) {
        this.form.direccion_entrega = this.clienteEncontrado?.direccion ?? '';
      } else {
        const dist = this.distritos.find(
          d => d.distrito_id === this.entrega.distrito_id);
        const prov = this.provincias.find(
          p => p.provincia_id === this.entrega.provincia_id);
        const dep  = this.departamentos.find(
          d => d.departamento_id === this.entrega.departamento_id);
        this.form.direccion_entrega = [
          this.entrega.direccion, dist?.nombre,
          prov?.nombre, dep?.nombre
        ].filter(Boolean).join(', ');
      }
    } else {
      const suc = this.sucursales.find(
        s => s.sucursal_id === this.form.sucursal_recojo_id);
      this.form.direccion_entrega = suc?.direccion ?? '';
    }

    this.guardando = true;
    this.pedidosService.createPedido(this.form).subscribe({
      next: () => {
        Swal.fire('Pedido creado', 'El pedido fue registrado correctamente', 'success');
        this.mostrarModal = false;
        this.guardando    = false;
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err?.error || 'No se pudo crear el pedido', 'error');
      }
    });
  }

  verDetalle(p: any) {
    if (!p.detalles?.length) {
      Swal.fire('Sin detalle', 'Este pedido no tiene productos registrados', 'info');
      return;
    }
    const rows = p.detalles.map((d: any) =>
      `<tr>
        <td style="padding:4px 8px">${d.producto}</td>
        <td style="padding:4px 8px;text-align:center">${d.cantidad}</td>
        <td style="padding:4px 8px;text-align:right">S/ ${Number(d.precio).toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:600">
          S/ ${Number(d.subtotal).toFixed(2)}
        </td>
      </tr>`).join('');

    const tipoLabel = p.tipos_pedido === 'DELIVERY' ? '🛵 Delivery' : '🏪 Pickup';
    Swal.fire({
      title: `Pedido #${p.pedido_id}`,
      html: `
        <p style="margin:8px 0 0;font-size:12px;color:#6b7280">
          ${tipoLabel}${p.direccion_entrega ? ' · ' + p.direccion_entrega : ''}
        </p>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:12px">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;color:#6b7280">
              <th style="padding:4px 8px;text-align:left">Producto</th>
              <th style="padding:4px 8px">Cant.</th>
              <th style="padding:4px 8px">Precio</th>
              <th style="padding:4px 8px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="border-top:2px solid #e5e7eb">
              <td colspan="3" style="padding:8px;text-align:right;font-weight:600">Total</td>
              <td style="padding:8px;text-align:right;font-weight:700;color:#16a34a">
                S/ ${Number(p.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>`,
      width: 520
    });
  }

  cambiarEstado(p: any) {
    const rol = this.authService.getRolId();
    let siguiente: number | null = null;

    if (rol === 3 && p.estado === 'PENDIENTE')           siguiente = 2;
    else if (rol === 3 && p.estado === 'CONFIRMADO')     siguiente = 3;
    else if (rol === 3 && p.estado === 'EN_PREPARACION') siguiente = 4;
    else if (rol === 4 && p.estado === 'LISTO')          siguiente = 5;
    else if (rol === 5 && p.estado === 'LISTO')          siguiente = 5;
    else if (this.authService.isAdminOrSuper())
      siguiente = this.flujoEstados[p.estado];

    if (!siguiente) {
      Swal.fire('No permitido', 'No puedes cambiar este estado', 'warning');
      return;
    }

    this.pedidosService.cambiarEstado(p.pedido_id, siguiente).subscribe({
      next: () => this.cargar(),
      error: (err) => Swal.fire('Error', err.error, 'error')
    });
  }

  cancelarPedido(p: any) {
    Swal.fire({
      title: '¿Cancelar pedido?', text: `Pedido #${p.pedido_id} de ${p.cliente}`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.pedidosService.cancelarPedido(p.pedido_id).subscribe({
        next: () => this.cargar(),
        error: (err) => Swal.fire('Error', err?.error || 'No se pudo cancelar', 'error')
      });
    });
  }

  esFinal(estado: string): boolean { return this.estadosFinales.has(estado); }
  getEstadoClase(e: string): string { return this.colors.getEstadoClase(e); }

  puedeAvanzar(p: any): boolean {
    if (this.esFinal(p.estado)) return false;
    const rol = this.authService.getRolId();
    if (rol === 2) return false;
    if (rol === 3) return p.estado === 'PENDIENTE'
                       || p.estado === 'CONFIRMADO'
                       || p.estado === 'EN_PREPARACION';
    if (rol === 4) return p.estado === 'LISTO';
    if (rol === 5) return p.estado === 'LISTO';
    return true;
  }

  getTextoAccion(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE':      'Confirmar',
      'CONFIRMADO':     'Preparar',
      'EN_PREPARACION': 'Marcar listo',
      'LISTO':          'Entregar'
    };
    return map[estado] ?? 'Avanzar';
  }
}