import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas';
import { ProductosService } from '../../core/services/productos';
import { ConfiguracionPagoService } from '../../core/services/configuracion-pago';
import { ClientesService } from '../../core/services/clientes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex h-full gap-0 p-0 -m-4 lg:-m-6">

  <!-- ══ PANEL IZQUIERDO — Pedidos ══ -->
  <div class="w-72 flex-shrink-0 bg-slate-50 border-r border-gray-200
              flex flex-col overflow-hidden">

    <div class="p-4 border-b bg-white">
      <h3 class="font-bold text-gray-800">Pedidos para cobrar</h3>
      <p class="text-xs text-gray-400 mt-0.5">
        PICKUP listos · {{ pedidos.length }} pendientes
      </p>
    </div>

    <div *ngIf="resumenDia"
         class="mx-3 mt-3 p-3 rounded-xl text-white text-center"
         style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
      <p class="text-xs opacity-80">Ventas hoy</p>
      <p class="text-xl font-bold">S/ {{ resumenDia.monto_total | number:'1.2-2' }}</p>
      <p class="text-xs opacity-70">{{ resumenDia.total_ventas }} transacciones</p>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div *ngIf="cargandoPedidos" class="text-center text-gray-400 py-8 text-sm">
        Cargando...
      </div>
      <div *ngIf="!cargandoPedidos && pedidos.length === 0"
           class="text-center text-gray-400 py-8">
        <p class="text-3xl mb-2">🏪</p>
        <p class="text-sm">Sin pedidos pendientes</p>
      </div>
      <div *ngFor="let p of pedidos"
           (click)="seleccionarPedido(p)"
           [ngClass]="pedidoSeleccionado?.pedido_id === p.pedido_id
                       ? 'border-cyan-500 bg-cyan-50'
                       : 'border-gray-200 bg-white hover:border-gray-300'"
           class="border-2 rounded-xl p-3 cursor-pointer transition-all">
        <div class="flex justify-between items-start mb-1">
          <span class="font-bold text-gray-800 text-sm">#{{ p.pedido_id }}</span>
          <span class="text-green-600 font-bold text-sm">
            S/ {{ p.total | number:'1.2-2' }}
          </span>
        </div>
        <p class="text-xs text-gray-600 font-medium truncate">{{ p.cliente }}</p>
        <p class="text-xs text-gray-400">
          {{ p.fecha | date:'HH:mm' }} — {{ p.detalles.length }} producto(s)
        </p>
        <div *ngIf="p.observaciones" class="mt-1 text-xs text-yellow-600 truncate">
          📝 {{ p.observaciones }}
        </div>
      </div>
    </div>

    <div class="p-3 border-t">
      <button (click)="cargarPedidos()"
              class="w-full py-2 bg-slate-100 hover:bg-slate-200
                     rounded-lg text-sm text-gray-600 transition-colors">
        🔄 Refrescar
      </button>
    </div>
  </div>

  <!-- ══ PANEL CENTRAL ══ -->
  <div class="flex-1 flex flex-col overflow-hidden border-r border-gray-200">

    <!-- Sin pedido — buscador -->
    <div *ngIf="!pedidoSeleccionado"
         class="flex-1 flex flex-col items-center justify-start pt-10 px-8">
      <p class="text-5xl mb-3">🧾</p>
      <p class="text-lg font-semibold text-gray-600 mb-1">Venta directa</p>
      <p class="text-sm text-gray-400 mb-8">
        Busca un producto o escanea el código de barras
      </p>
      <div class="w-full max-w-md space-y-3">
        <div class="relative">
          <span class="absolute left-4 top-3.5 text-gray-400">📷</span>
          <input [(ngModel)]="codigoBarras"
                 (keyup.enter)="buscarPorCodigo()"
                 placeholder="Código de barras — escanea o escribe..."
                 class="w-full pl-11 pr-4 py-3 border-2 border-gray-200
                        rounded-xl text-sm focus:ring-2 focus:ring-cyan-400
                        focus:border-cyan-400 outline-none bg-white"/>
        </div>
        <div class="relative">
          <span class="absolute left-4 top-3.5 text-gray-400">🔍</span>
          <input [(ngModel)]="busquedaManual"
                 (ngModelChange)="buscarProductoManual()"
                 placeholder="Buscar producto por nombre..."
                 class="w-full pl-11 pr-4 py-3 border-2 border-cyan-400
                        rounded-xl text-sm focus:ring-2 focus:ring-cyan-400
                        outline-none bg-white font-medium"/>
        </div>
        <div *ngIf="resultadosBusqueda.length > 0"
             class="bg-white border-2 border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <div class="px-3 py-2 bg-gray-50 border-b">
            <p class="text-xs text-gray-500 font-medium">
              {{ resultadosBusqueda.length }} resultado(s) — click para agregar
            </p>
          </div>
          <div *ngFor="let r of resultadosBusqueda; let last = last"
               (click)="agregarProductoDirecto(r)"
               [ngClass]="!last ? 'border-b border-gray-50' : ''"
               class="flex items-center justify-between px-4 py-3
                      hover:bg-cyan-50 cursor-pointer transition-colors group">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-slate-100 group-hover:bg-cyan-100
                          rounded-xl flex items-center justify-center
                          flex-shrink-0 transition-colors">🥐</div>
              <div>
                <p class="text-sm font-semibold text-gray-800">{{ r.nombre }}</p>
                <p class="text-xs text-gray-400">
                  {{ r.permite_pedido_sin_stock ? 'Encargo' : 'Con stock' }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-green-600">
                S/ {{ r.precio | number:'1.2-2' }}
              </p>
              <p class="text-xs text-cyan-600 opacity-0
                        group-hover:opacity-100 transition-opacity">
                + Agregar
              </p>
            </div>
          </div>
        </div>
        <div *ngIf="busquedaManual && resultadosBusqueda.length === 0"
             class="p-4 bg-gray-50 rounded-xl text-center">
          <p class="text-sm text-gray-400">
            Sin resultados para "{{ busquedaManual }}"
          </p>
        </div>
      </div>
    </div>

    <!-- Con pedido — ticket -->
    <div *ngIf="pedidoSeleccionado" class="flex-1 flex flex-col overflow-hidden">

      <div class="p-4 border-b bg-white flex justify-between items-center gap-3">
        <div class="min-w-0">
          <h3 class="font-bold text-gray-800">
            {{ pedidoSeleccionado.pedido_id
                ? 'Pedido #' + pedidoSeleccionado.pedido_id
                : 'Venta directa' }}
          </h3>
          <p class="text-sm text-gray-500 truncate">
            {{ clienteEncontrado?.nombre || pedidoSeleccionado.cliente }}
            <span *ngIf="clienteEncontrado?.documento"
                  class="text-gray-400">
              · {{ clienteEncontrado.documento }}
            </span>
          </p>
        </div>
        <div *ngIf="!pedidoSeleccionado.pedido_id" class="relative flex-shrink-0">
          <input [(ngModel)]="busquedaManual"
                 (ngModelChange)="buscarProductoManual()"
                 placeholder="+ Agregar producto..."
                 class="w-44 pl-3 pr-3 py-1.5 border border-gray-200
                        rounded-lg text-xs focus:ring-2 focus:ring-cyan-400
                        outline-none"/>
          <div *ngIf="resultadosBusqueda.length > 0"
               class="absolute top-9 right-0 w-64 bg-white border
                      rounded-xl shadow-xl z-20 overflow-hidden">
            <div *ngFor="let r of resultadosBusqueda"
                 (click)="agregarProductoDirecto(r)"
                 class="flex justify-between items-center px-3 py-2.5
                        hover:bg-cyan-50 cursor-pointer border-b
                        last:border-0 text-sm">
              <span class="font-medium text-gray-700 truncate">{{ r.nombre }}</span>
              <span class="text-green-600 font-bold ml-2 flex-shrink-0">
                S/ {{ r.precio | number:'1.2-2' }}
              </span>
            </div>
          </div>
        </div>
        <button (click)="limpiar()"
                class="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-gray-500 text-xs uppercase tracking-wide">
              <th class="text-left pb-2 font-medium">Producto</th>
              <th class="text-center pb-2 w-24 font-medium">Cant.</th>
              <th class="text-right pb-2 w-24 font-medium">Precio</th>
              <th class="text-right pb-2 w-24 font-medium">Total</th>
              <th class="w-6"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of pedidoSeleccionado.detalles; let i = index"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 font-medium text-gray-800">{{ d.producto }}</td>
              <td class="py-3 text-center">
                <div *ngIf="!pedidoSeleccionado.pedido_id"
                     class="flex items-center justify-center gap-1">
                  <button (click)="cambiarCantidad(i, -1)"
                          class="w-6 h-6 bg-gray-100 hover:bg-red-100
                                 text-gray-600 hover:text-red-600
                                 rounded font-bold text-xs transition-colors">−</button>
                  <span class="w-8 text-center font-semibold">{{ d.cantidad }}</span>
                  <button (click)="cambiarCantidad(i, 1)"
                          class="w-6 h-6 bg-gray-100 hover:bg-green-100
                                 text-gray-600 hover:text-green-600
                                 rounded font-bold text-xs transition-colors">+</button>
                </div>
                <span *ngIf="pedidoSeleccionado.pedido_id" class="text-gray-600">
                  {{ d.cantidad }}
                </span>
              </td>
              <td class="py-3 text-right text-gray-500">
                S/ {{ d.precio | number:'1.2-2' }}
              </td>
              <td class="py-3 text-right font-bold text-gray-800">
                S/ {{ d.subtotal | number:'1.2-2' }}
              </td>
              <td class="py-3 text-center">
                <button *ngIf="!pedidoSeleccionado.pedido_id"
                        (click)="eliminarItem(i)"
                        class="text-red-300 hover:text-red-500 text-sm">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="pedidoSeleccionado.detalles.length === 0"
             class="text-center text-gray-400 py-10 text-sm">
          <p class="text-2xl mb-2">📦</p>
          Agrega productos con el buscador
        </div>
      </div>

      <div class="border-t bg-gray-50 p-4">
        <div class="flex justify-between text-sm text-gray-500 mb-1">
          <span>Subtotal (sin IGV)</span>
          <span>S/ {{ subtotal | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-500 mb-2">
          <span>IGV ({{ tasaIgv }}%)</span>
          <span>S/ {{ igv | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-xl font-bold text-gray-800 border-t pt-2">
          <span>TOTAL</span>
          <span class="text-green-600">S/ {{ total | number:'1.2-2' }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ PANEL DERECHO — Cobro ══ -->
  <div class="w-80 flex-shrink-0 bg-white flex flex-col overflow-hidden">

    <div class="p-4 border-b">
      <h3 class="font-bold text-gray-800">Cobro</h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <!-- Tipo comprobante -->
      <div>
        <label class="text-xs font-semibold text-gray-500 uppercase
                      tracking-wide block mb-2">Comprobante</label>
        <div class="grid grid-cols-2 gap-2">
          <button *ngFor="let t of tiposComprobante"
                  (click)="seleccionarTipoComprobante(t)"
                  [ngClass]="form.tipo_comprobante_id === t.tipo_comprobante_id
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 text-gray-500'"
                  class="border-2 rounded-xl p-3 text-center transition-all">
            <p class="text-xl mb-0.5">
              {{ t.codigo_sunat === '01' ? '🧾' : '📄' }}
            </p>
            <p class="text-xs font-bold">{{ t.nombre }}</p>
            <p class="text-xs opacity-50">{{ t.codigo_sunat }}</p>
          </button>
        </div>
      </div>

      <!-- DNI — Boleta (opcional) -->
      <div *ngIf="tipoSeleccionado?.codigo_sunat === '03'" class="space-y-2">
        <label class="text-xs font-semibold text-gray-500 uppercase
                      tracking-wide block">
          DNI del cliente
          <span class="text-gray-400 font-normal normal-case ml-1">(opcional)</span>
        </label>
        <div class="flex gap-2">
          <input [(ngModel)]="docBusqueda"
                 maxlength="8"
                 placeholder="12345678"
                 class="flex-1 p-2.5 border-2 border-gray-200 rounded-xl
                        text-sm font-mono focus:ring-2 focus:ring-cyan-400
                        focus:border-cyan-400 outline-none"/>
          <button (click)="buscarCliente()"
                  [disabled]="docBusqueda.length !== 8 || buscandoCliente"
                  class="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white
                         rounded-xl text-sm disabled:opacity-40 transition-colors">
            {{ buscandoCliente ? '⏳' : '🔍' }}
          </button>
        </div>
        <div *ngIf="clienteEncontrado"
             class="p-2.5 bg-green-50 border border-green-200 rounded-xl">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-xs font-bold text-gray-800">
                {{ clienteEncontrado.nombre }}
              </p>
              <p class="text-xs text-gray-500">
                DNI: {{ clienteEncontrado.documento }}
              </p>
              <span *ngIf="clienteEncontrado.encontrado_en_bd"
                    class="text-xs text-green-600">✓ En base de datos</span>
              <span *ngIf="!clienteEncontrado.encontrado_en_bd"
                    class="text-xs text-blue-600">📡 Consultado RENIEC</span>
            </div>
            <button (click)="limpiarCliente()"
                    class="text-gray-400 hover:text-red-500 text-sm">✕</button>
          </div>
          <button *ngIf="!clienteEncontrado.encontrado_en_bd"
                  (click)="guardarClienteRapido()"
                  class="mt-2 w-full py-1 bg-blue-500 hover:bg-blue-600
                         text-white text-xs rounded-lg transition-colors">
            + Guardar en base de datos
          </button>
        </div>
        <p class="text-xs text-gray-400">
          Sin DNI se usará <span class="font-medium">Cliente General</span>
        </p>
      </div>

      <!-- RUC — Factura (obligatorio) -->
      <div *ngIf="tipoSeleccionado?.codigo_sunat === '01'"
           class="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
        <label class="text-xs font-semibold text-amber-700 uppercase
                      tracking-wide block">🧾 RUC del cliente *</label>
        <div class="flex gap-2">
          <input [(ngModel)]="docBusqueda"
                 maxlength="11"
                 placeholder="20123456789"
                 class="flex-1 p-2.5 border border-amber-300 rounded-xl
                        text-sm font-mono focus:ring-2 focus:ring-amber-400
                        outline-none bg-white"/>
          <button (click)="buscarCliente()"
                  [disabled]="docBusqueda.length !== 11 || buscandoCliente"
                  class="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white
                         rounded-xl text-sm disabled:opacity-40 transition-colors">
            {{ buscandoCliente ? '⏳' : '🔍' }}
          </button>
        </div>
        <div *ngIf="clienteEncontrado"
             class="p-2.5 bg-white border border-amber-200 rounded-xl">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-xs font-bold text-gray-800">
                {{ clienteEncontrado.nombre }}
              </p>
              <p class="text-xs text-gray-500">
                RUC: {{ clienteEncontrado.documento }}
              </p>
              <p *ngIf="clienteEncontrado.estado" class="text-xs"
                 [ngClass]="clienteEncontrado.estado === 'ACTIVO'
                             ? 'text-green-600' : 'text-red-500'">
                {{ clienteEncontrado.estado }} — {{ clienteEncontrado.condicion }}
              </p>
            </div>
            <button (click)="limpiarCliente()"
                    class="text-gray-400 hover:text-red-500 text-sm">✕</button>
          </div>
          <button *ngIf="!clienteEncontrado.encontrado_en_bd"
                  (click)="guardarClienteRapido()"
                  class="mt-2 w-full py-1 bg-amber-500 hover:bg-amber-600
                         text-white text-xs rounded-lg transition-colors">
            + Guardar en base de datos
          </button>
        </div>
        <div *ngIf="docBusqueda.length === 11 && !clienteEncontrado && !buscandoCliente"
             class="space-y-2">
          <p class="text-xs text-amber-600">
            No encontrado. Ingresa la razón social:
          </p>
          <input [(ngModel)]="razonSocialManual"
                 placeholder="Razón social..."
                 class="w-full p-2 border border-amber-300 rounded-lg
                        text-sm outline-none bg-white"/>
          <button (click)="confirmarClienteManual()"
                  [disabled]="!razonSocialManual.trim()"
                  class="w-full py-1.5 bg-amber-500 hover:bg-amber-600
                         text-white text-xs rounded-lg disabled:opacity-40">
            ✓ Usar este cliente
          </button>
        </div>
        <p *ngIf="!clienteEncontrado" class="text-xs text-amber-600">
          ⚠️ RUC obligatorio para emitir factura
        </p>
      </div>

      <!-- Método de pago -->
      <div>
        <label class="text-xs font-semibold text-gray-500 uppercase
                      tracking-wide block mb-2">Método de pago</label>
        <div class="grid grid-cols-2 gap-2">
          <button *ngFor="let m of metodosPago"
                  (click)="seleccionarMetodo(m)"
                  [ngClass]="form.metodo_pago_id === m.metodo_pago_id
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 text-gray-500'"
                  class="border-2 rounded-xl p-2 text-center transition-all">
            <p class="text-lg">{{ getMetodoIcono(m.codigo) }}</p>
            <p class="text-xs font-medium leading-tight mt-0.5">{{ m.nombre }}</p>
          </button>
        </div>
      </div>

      <!-- QR Yape/Plin -->
      <div *ngIf="qrActual && (metodoCodigo === 'YAPE' || metodoCodigo === 'PLIN')"
           class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
        <p class="text-xs text-purple-600 font-medium mb-2">
          Muestra el QR al cliente
        </p>
        <img [src]="'data:image/png;base64,' + qrActual.qr_base64"
             class="w-32 h-32 object-contain mx-auto border bg-white rounded-lg p-1"/>
        <p class="text-xs font-bold text-gray-800 mt-2">{{ qrActual.titular }}</p>
        <p class="text-xs text-gray-500">{{ qrActual.numero }}</p>
        <p class="text-base font-bold text-green-600 mt-1">
          S/ {{ total | number:'1.2-2' }}
        </p>
      </div>

      <!-- Efectivo -->
      <div *ngIf="metodoCodigo === 'EFECTIVO'">
        <label class="text-xs font-semibold text-gray-500 uppercase
                      tracking-wide block mb-2">Monto recibido</label>
        <div class="relative">
          <span class="absolute left-3 top-3 text-gray-500 font-bold text-sm">S/</span>
          <input type="number"
                 [(ngModel)]="form.monto_pagado"
                 (ngModelChange)="calcularVuelto()"
                 [min]="total"
                 class="w-full pl-10 p-3 border-2 border-gray-200 rounded-xl
                        text-right text-2xl font-bold focus:ring-2
                        focus:ring-cyan-400 focus:border-cyan-400 outline-none"/>
        </div>
        <div class="grid grid-cols-3 gap-1.5 mt-2">
          <button *ngFor="let m of montosRapidos"
                  (click)="form.monto_pagado = m; calcularVuelto()"
                  class="py-2 bg-slate-100 hover:bg-slate-200 rounded-lg
                         text-sm font-medium transition-colors">
            S/ {{ m }}
          </button>
        </div>
        <div *ngIf="vuelto >= 0"
             class="mt-3 p-3 rounded-xl text-center border"
             [ngClass]="vuelto > 0 ? 'bg-blue-50 border-blue-200'
                                    : 'bg-green-50 border-green-200'">
          <p class="text-xs font-medium"
             [ngClass]="vuelto > 0 ? 'text-blue-600' : 'text-green-600'">
            {{ vuelto > 0 ? 'Vuelto a entregar' : '✓ Cobro exacto' }}
          </p>
          <p *ngIf="vuelto > 0" class="text-2xl font-bold text-blue-700 mt-1">
            S/ {{ vuelto | number:'1.2-2' }}
          </p>
        </div>
      </div>

      <!-- Referencia tarjeta/transferencia -->
      <div *ngIf="metodoCodigo === 'TARJETA_DEBITO' ||
                  metodoCodigo === 'TARJETA_CREDITO' ||
                  metodoCodigo === 'TRANSFERENCIA'">
        <label class="text-xs font-semibold text-gray-500 uppercase
                      tracking-wide block mb-2">N° Referencia / Operación</label>
        <input [(ngModel)]="form.referencia_pago"
               placeholder="Últimos 4 dígitos o N° operación"
               class="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm
                      focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400
                      outline-none"/>
      </div>

    </div>

    <!-- Botón cobrar -->
    <div class="p-4 border-t">
      <p *ngIf="!pedidoSeleccionado"
         class="text-center text-xs text-gray-400 py-2">
        Selecciona un pedido o busca un producto
      </p>
      <button *ngIf="pedidoSeleccionado"
              (click)="procesarVenta()"
              [disabled]="!puedeVender() || procesando"
              class="w-full py-4 rounded-xl text-white font-bold text-base
                     transition-all disabled:opacity-40 active:scale-95"
              style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
        <span *ngIf="!procesando">✓ Cobrar S/ {{ total | number:'1.2-2' }}</span>
        <span *ngIf="procesando" class="flex items-center justify-center gap-2">
          <span class="animate-spin">⏳</span> Procesando...
        </span>
      </button>
    </div>
  </div>

</div>
  `
})
export class PosComponent implements OnInit {

  pedidos:            any[] = [];
  metodosPago:        any[] = [];
  tiposComprobante:   any[] = [];
  resumenDia:         any   = null;
  qrActual:           any   = null;
  resultadosBusqueda: any[] = [];
  itemsVentaDirecta:  any[] = [];

  // Cliente
  docBusqueda       = '';
  razonSocialManual = '';
  clienteEncontrado: any = null;
  buscandoCliente   = false;

  pedidoSeleccionado: any  = null;
  busquedaManual           = '';
  codigoBarras             = '';
  metodoCodigo             = '';
  cargandoPedidos          = false;
  procesando               = false;

  subtotal = 0;
  igv      = 0;
  total    = 0;
  tasaIgv  = 18;
  vuelto   = -1;

  montosRapidos = [10, 20, 50, 100, 200, 500];

  private busquedaTimeout: any;
  private bufferScanner   = '';
  private timerScanner:   any;

  form: any = {
    pedido_id:           null,
    cliente_id:          null,
    tipo_comprobante_id: 2,
    metodo_pago_id:      1,
    impuesto_id:         1,
    monto_pagado:        0,
    referencia_pago:     '',
    detalles:            []
  };

  constructor(
    private ventasService:     VentasService,
    private configPagoService: ConfiguracionPagoService,
    private productoService:   ProductosService,
    private clienteService:    ClientesService,
    private cd:                ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPedidos();
    this.cargarMetodos();
    this.cargarTiposComprobante();
    this.cargarResumenDia();
  }

  get tipoSeleccionado() {
    return this.tiposComprobante.find(
      t => t.tipo_comprobante_id === this.form.tipo_comprobante_id
    );
  }

  // ── Scanner ──
  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Enter') {
      if (this.bufferScanner.length > 3) {
        this.codigoBarras = this.bufferScanner;
        this.buscarPorCodigo();
      }
      this.bufferScanner = '';
      clearTimeout(this.timerScanner);
    } else {
      this.bufferScanner += e.key;
      clearTimeout(this.timerScanner);
      this.timerScanner = setTimeout(() => { this.bufferScanner = ''; }, 100);
    }
  }

  // ── Comprobante ──
  seleccionarTipoComprobante(t: any) {
    this.form.tipo_comprobante_id = t.tipo_comprobante_id;
    this.limpiarCliente();
    this.cd.detectChanges();
  }

  // ── Clientes ──
  buscarCliente() {
    if (this.buscandoCliente) return;
    const esFactura = this.tipoSeleccionado?.codigo_sunat === '01';
    const longitud  = esFactura ? 11 : 8;
    if (this.docBusqueda.length !== longitud) return;

    this.buscandoCliente = true;
    this.clienteEncontrado = null;
    this.cd.detectChanges();

    const obs = esFactura
      ? this.clienteService.consultarRUC(this.docBusqueda)
      : this.clienteService.consultarDNI(this.docBusqueda);

    obs.subscribe({
      next: (res: any) => {
        this.clienteEncontrado   = res;
        this.form.cliente_id     = res.cliente_id ?? null;
        this.buscandoCliente     = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.clienteEncontrado = null;
        this.buscandoCliente   = false;
        Swal.fire('No encontrado',
          esFactura ? 'RUC no encontrado en SUNAT'
                    : 'DNI no encontrado en RENIEC', 'warning');
        this.cd.detectChanges();
      }
    });
  }

  guardarClienteRapido() {
    if (!this.clienteEncontrado) return;
    this.clienteService.createClientes({
      nombre:    this.clienteEncontrado.nombre,
      documento: this.clienteEncontrado.documento,
      direccion: this.clienteEncontrado.direccion ?? '',
      activo:    true
    }).subscribe({
      next: (res: any) => {
        this.clienteEncontrado.encontrado_en_bd = true;
        this.clienteEncontrado.cliente_id       = res.cliente_id;
        this.form.cliente_id                    = res.cliente_id;
        this.cd.detectChanges();
        Swal.fire({
          icon: 'success', title: 'Cliente guardado',
          timer: 1500, showConfirmButton: false
        });
      },
      error: (err) => Swal.fire('Error',
        err.error || 'No se pudo guardar', 'error')
    });
  }

  confirmarClienteManual() {
    if (!this.razonSocialManual.trim()) return;
    this.clienteEncontrado = {
      nombre:           this.razonSocialManual,
      documento:        this.docBusqueda,
      encontrado_en_bd: false,
      cliente_id:       null
    };
    this.form.cliente_id = null;
    this.cd.detectChanges();
  }

  limpiarCliente() {
    this.clienteEncontrado = null;
    this.docBusqueda       = '';
    this.razonSocialManual = '';
    this.form.cliente_id   = this.pedidoSeleccionado?.cliente_id ?? null;
    this.cd.detectChanges();
  }

  // ── Productos ──
  buscarPorCodigo() {
    if (!this.codigoBarras.trim()) return;
    this.productoService.buscarProducto(this.codigoBarras).subscribe({
      next: (res: any[]) => {
        if (res.length === 1)      this.agregarProductoDirecto(res[0]);
        else if (res.length > 1)   this.resultadosBusqueda = res;
        else Swal.fire({
          icon: 'warning', title: 'Producto no encontrado',
          text: `Código: ${this.codigoBarras}`,
          timer: 2000, showConfirmButton: false
        });
        this.codigoBarras = '';
        this.cd.detectChanges();
      }
    });
  }

  buscarProductoManual() {
    clearTimeout(this.busquedaTimeout);
    if (!this.busquedaManual.trim()) { this.resultadosBusqueda = []; return; }
    this.busquedaTimeout = setTimeout(() => {
      this.productoService.buscarProducto(this.busquedaManual).subscribe({
        next: (res: any) => { this.resultadosBusqueda = res; this.cd.detectChanges(); }
      });
    }, 300);
  }

  agregarProductoDirecto(p: any) {
    if (!this.pedidoSeleccionado) this.iniciarVentaDirecta();
    const existente = this.itemsVentaDirecta
      .find((i: any) => i.producto_id === p.producto_id);
    if (existente) {
      existente.cantidad++;
      existente.subtotal = existente.precio * existente.cantidad;
    } else {
      this.itemsVentaDirecta.push({
        producto_id: p.producto_id, producto: p.nombre,
        cantidad: 1, precio: p.precio, subtotal: p.precio
      });
    }
    this.busquedaManual     = '';
    this.resultadosBusqueda = [];
    this.recalcularVentaDirecta();
    this.cd.detectChanges();
  }

  iniciarVentaDirecta() {
    this.pedidoSeleccionado = {
      pedido_id: null, cliente: 'Cliente general',
      cliente_doc: '', cliente_id: null, detalles: [], total: 0
    };
    this.form.pedido_id  = null;
    this.form.cliente_id = null;
  }

  recalcularVentaDirecta() {
    const total = this.itemsVentaDirecta
      .reduce((sum: number, i: any) => sum + i.subtotal, 0);
    this.pedidoSeleccionado.detalles = this.itemsVentaDirecta;
    this.form.detalles = this.itemsVentaDirecta.map((i: any) => ({
      producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio
    }));
    this.calcularTotales(total);
  }

  cambiarCantidad(index: number, delta: number) {
    const item = this.itemsVentaDirecta[index];
    if (!item) return;
    item.cantidad = Math.max(1, item.cantidad + delta);
    item.subtotal = item.precio * item.cantidad;
    this.recalcularVentaDirecta();
    this.cd.detectChanges();
  }

  eliminarItem(index: number) {
    this.itemsVentaDirecta.splice(index, 1);
    if (this.itemsVentaDirecta.length === 0) this.pedidoSeleccionado = null;
    else this.recalcularVentaDirecta();
    this.cd.detectChanges();
  }

  // ── Carga de datos ──
  cargarPedidos() {
    this.cargandoPedidos = true;
    this.ventasService.getPedidosPendientes().subscribe({
      next: (res) => { this.pedidos = res; this.cargandoPedidos = false; this.cd.detectChanges(); },
      error: ()    => { this.cargandoPedidos = false; this.cd.detectChanges(); }
    });
  }

  cargarMetodos() {
    this.ventasService.getMetodosPago().subscribe({
      next: (res) => {
        this.metodosPago = res;
        const efectivo = res.find((m: any) => m.codigo === 'EFECTIVO');
        if (efectivo) { this.form.metodo_pago_id = efectivo.metodo_pago_id; this.metodoCodigo = 'EFECTIVO'; }
        this.cd.detectChanges();
      }
    });
  }

  cargarTiposComprobante() {
    this.ventasService.getTiposComprobante().subscribe({
      next: (res) => {
        this.tiposComprobante = res;
        const boleta = res.find((t: any) => t.codigo_sunat === '03');
        if (boleta) this.form.tipo_comprobante_id = boleta.tipo_comprobante_id;
        this.cd.detectChanges();
      }
    });
  }

  cargarResumenDia() {
    this.ventasService.getResumenDia().subscribe({
      next: (res) => { this.resumenDia = res; this.cd.detectChanges(); }
    });
  }

  seleccionarPedido(p: any) {
    this.pedidoSeleccionado = p;
    this.form.pedido_id     = p.pedido_id;
    this.form.cliente_id    = p.cliente_id;
    this.form.detalles      = [];
    this.form.monto_pagado  = p.total;
    this.vuelto             = 0;
    this.limpiarCliente();
    this.calcularTotales(p.total);
    this.cd.detectChanges();
  }

  calcularTotales(totalConIgv: number) {
    this.total    = totalConIgv;
    this.subtotal = Math.round((totalConIgv / 1.18) * 100) / 100;
    this.igv      = Math.round((totalConIgv - this.subtotal) * 100) / 100;
  }

  seleccionarMetodo(m: any) {
    this.form.metodo_pago_id  = m.metodo_pago_id;
    this.metodoCodigo         = m.codigo;
    this.qrActual             = null;
    this.form.referencia_pago = '';
    if (m.codigo === 'YAPE' || m.codigo === 'PLIN') {
      this.form.monto_pagado = this.total;
      this.configPagoService.getQR(m.codigo.toLowerCase()).subscribe({
        next:  (res: any) => { this.qrActual = res;  this.cd.detectChanges(); },
        error: ()         => { this.qrActual = null; this.cd.detectChanges(); }
      });
    }
    this.cd.detectChanges();
  }

  calcularVuelto() {
    this.vuelto = this.form.monto_pagado >= this.total
      ? Math.round((this.form.monto_pagado - this.total) * 100) / 100
      : -1;
    this.cd.detectChanges();
  }

  puedeVender(): boolean {
    if (!this.pedidoSeleccionado)                        return false;
    if (!this.form.tipo_comprobante_id)                  return false;
    if (!this.form.metodo_pago_id)                       return false;
    if (this.pedidoSeleccionado?.detalles?.length === 0) return false;
    if (this.tipoSeleccionado?.codigo_sunat === '01' && !this.clienteEncontrado)
      return false;
    if (this.metodoCodigo === 'EFECTIVO')
      return this.form.monto_pagado >= this.total;
    return true;
  }

  procesarVenta() {
    if (!this.puedeVender() || this.procesando) return;

    // Asignar cliente correcto
    if (this.clienteEncontrado?.cliente_id) {
      this.form.cliente_id = this.clienteEncontrado.cliente_id;
    }
    // Si boleta sin cliente → backend usará cliente genérico 00000000

    const metodo = this.metodosPago.find(m => m.metodo_pago_id === this.form.metodo_pago_id);
    const tipo   = this.tiposComprobante.find(t => t.tipo_comprobante_id === this.form.tipo_comprobante_id);

    Swal.fire({
      title: '¿Confirmar venta?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:2">
          <p><b>Cliente:</b> ${this.clienteEncontrado?.nombre || this.pedidoSeleccionado.cliente}</p>
          <p><b>Total:</b> S/ ${this.total.toFixed(2)}</p>
          <p><b>Comprobante:</b> ${tipo?.nombre}</p>
          <p><b>Pago:</b> ${metodo?.nombre}</p>
          ${this.metodoCodigo === 'EFECTIVO' && this.vuelto > 0
            ? `<p style="color:#2563eb"><b>Vuelto: S/ ${this.vuelto.toFixed(2)}</b></p>`
            : ''}
        </div>`,
      icon: 'question',
      showCancelButton:  true,
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText:  'Cancelar',
      confirmButtonColor: '#0ea5e9'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = true;
      this.cd.detectChanges();

      this.ventasService.crearVenta(this.form).subscribe({
        next: (res: any) => {
          this.procesando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Venta registrada!',
            html: `
              <div style="text-align:center">
                <p style="font-size:26px;font-weight:bold;color:#16a34a">
                  ${res.numero_formato}
                </p>
                <p style="color:#6b7280;font-size:13px">${tipo?.nombre}</p>
                <hr style="margin:12px 0"/>
                <div style="font-size:14px;text-align:left;line-height:2">
                  <p>Subtotal: S/ ${res.subtotal.toFixed(2)}</p>
                  <p>IGV (18%): S/ ${res.igv.toFixed(2)}</p>
                  <p><b>Total: S/ ${res.total.toFixed(2)}</b></p>
                  ${res.vuelto > 0
                    ? `<p style="color:#2563eb"><b>Vuelto: S/ ${res.vuelto.toFixed(2)}</b></p>`
                    : ''}
                </div>
              </div>`,
            confirmButtonText:  '✓ Nueva venta',
            confirmButtonColor: '#0ea5e9'
          }).then(() => {
            this.limpiar();
            this.cargarPedidos();
            this.cargarResumenDia();
          });
        },
        error: (err) => {
          this.procesando = false;
          let msg = 'No se pudo procesar la venta';
          if (typeof err.error === 'string')  msg = err.error;
          else if (err.error?.message)        msg = err.error.message;
          else if (err.error?.title)          msg = err.error.title;
          Swal.fire('Error', msg, 'error');
          this.cd.detectChanges();
        }
      });
    });
  }

  limpiar() {
    this.pedidoSeleccionado  = null;
    this.itemsVentaDirecta   = [];
    this.busquedaManual      = '';
    this.resultadosBusqueda  = [];
    this.vuelto              = -1;
    this.qrActual            = null;
    this.metodoCodigo        = 'EFECTIVO';
    this.subtotal            = 0;
    this.igv                 = 0;
    this.total               = 0;
    this.limpiarCliente();
    this.form = {
      pedido_id:           null,
      cliente_id:          null,
      tipo_comprobante_id: this.tiposComprobante
        .find(t => t.codigo_sunat === '03')?.tipo_comprobante_id ?? 2,
      metodo_pago_id:      this.metodosPago
        .find(m => m.codigo === 'EFECTIVO')?.metodo_pago_id ?? 1,
      impuesto_id:         1,
      monto_pagado:        0,
      referencia_pago:     '',
      detalles:            []
    };
    this.cd.detectChanges();
  }

  getMetodoIcono(codigo: string): string {
    const m: Record<string, string> = {
      'EFECTIVO': '💵', 'YAPE': '📱', 'PLIN': '💜',
      'TARJETA_DEBITO': '💳', 'TARJETA_CREDITO': '💳', 'TRANSFERENCIA': '🏦'
    };
    return m[codigo] ?? '💰';
  }
}