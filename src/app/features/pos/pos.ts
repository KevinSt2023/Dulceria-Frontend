import { Component, OnInit, ChangeDetectorRef, HostListener, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas';
import { ProductosService } from '../../core/services/productos';
import { ConfiguracionPagoService } from '../../core/services/configuracion-pago';
import { ClientesService } from '../../core/services/clientes';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketInternoModalComponent } from './ticket-interno-modal.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketInternoModalComponent],
  template: `
<div class="flex h-full gap-0 p-0 -m-4 lg:-m-6" style="background: #f1f5f9">

  <!-- ══ PANEL IZQUIERDO ══ -->
  <div class="w-56 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden"
       style="background: #f8fafc">
    <div class="p-3 border-b border-slate-200 bg-white">
      <h3 class="font-bold text-slate-800 text-sm">Pedidos</h3>
      <p class="text-xs text-slate-400">{{ pedidos.length }} pendientes</p>
    </div>

    <!-- Resumen del día -->
    <div *ngIf="resumenDia" class="mx-2 mt-2 space-y-1.5">
      <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
        <div class="px-3 pt-2.5 pb-2 text-white text-center border-b border-white/20">
          <p class="text-xs opacity-75 uppercase tracking-wide">Ventas hoy</p>
          <p class="text-xl font-bold">S/ {{ resumenDia.monto_total | number:'1.2-2' }}</p>
          <p class="text-xs opacity-60">{{ resumenDia.total_ventas }} transacciones</p>
        </div>
        <div class="grid grid-cols-2 divide-x divide-white/20">
          <div class="px-2 py-1.5 text-center text-white">
            <p class="text-xs opacity-60">Recibido</p>
            <p class="text-sm font-bold">S/ {{ resumenDia.recibido_hoy | number:'1.2-2' }}</p>
          </div>
          <div class="px-2 py-1.5 text-center text-white">
            <p class="text-xs opacity-60">Vuelto</p>
            <p class="text-sm font-bold text-amber-300">S/ {{ resumenDia.vuelto_hoy | number:'1.2-2' }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="(resumenDia.cantidad_creditos ?? 0) > 0"
           class="rounded-xl overflow-hidden border border-orange-200 bg-orange-50">
        <div class="px-3 py-2 text-center border-b border-orange-200">
          <p class="text-xs text-orange-600 font-semibold uppercase tracking-wide">
            💳 Créditos hoy ({{ resumenDia.cantidad_creditos }})
          </p>
          <p class="text-base font-bold text-orange-700">S/ {{ resumenDia.credito_hoy | number:'1.2-2' }}</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-1.5 mt-1.5">
      <div *ngIf="cargandoPedidos" class="text-center text-slate-400 py-8 text-sm">Cargando...</div>
      <div *ngIf="!cargandoPedidos && pedidos.length === 0" class="text-center text-slate-400 py-8">
        <p class="text-2xl mb-1">🏪</p>
        <p class="text-xs">Sin pedidos pendientes</p>
      </div>
      <div *ngFor="let p of pedidos" (click)="seleccionarPedido(p)"
          [ngClass]="pedidoSeleccionado?.pedido_id === p.pedido_id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'"
          class="border-2 rounded-xl p-2.5 cursor-pointer transition-all">
        <div class="flex justify-between items-start mb-0.5">
          <span class="font-bold text-slate-800 text-xs">#{{ p.pedido_id }}</span>
          <span class="text-emerald-600 font-bold text-xs">S/ {{ p.total | number:'1.2-2' }}</span>
        </div>
        <p class="text-xs text-slate-600 truncate">{{ p.cliente }}</p>
        <p class="text-xs text-slate-400">{{ p.fecha | date:'HH:mm':'UTC' }}</p>
      </div>
    </div>

    <div class="p-2 border-t border-slate-200">
      <button (click)="cargarPedidos()" class="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-600 transition-colors">
        🔄 Refrescar
      </button>
    </div>
  </div>

  <!-- ══ PANEL CENTRAL ══ -->
  <div class="flex-1 flex flex-col overflow-hidden border-r border-slate-200">

    <div class="p-2.5 border-b border-slate-200 bg-white flex items-center gap-2 flex-shrink-0">
      <div class="relative flex-1">
        <span class="absolute left-3 top-2 text-slate-400 text-sm">🔍</span>
        <input [(ngModel)]="busquedaManual" (ngModelChange)="filtrarCatalogo()"
              placeholder="Buscar producto..."
              class="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-slate-50"/>
      </div>
      <input [(ngModel)]="codigoBarras" (keyup.enter)="buscarPorCodigo()" placeholder="Cód. barras"
            class="w-28 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-slate-50"/>
      <button *ngIf="pedidoSeleccionado" (click)="limpiar()"
              class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs transition-colors whitespace-nowrap">
        ✕ Limpiar
      </button>
    </div>

    <div class="border-b border-slate-200 flex-shrink-0" style="height: 45%; background: #f1f5f9">
      <div class="h-full overflow-y-auto p-3">
        <div *ngIf="cargandoCatalogo" class="text-center text-slate-400 py-8 text-sm">
          <p class="text-2xl mb-1 animate-pulse">🛍️</p>Cargando...
        </div>
        <div *ngIf="!cargandoCatalogo && catalogoFiltrado.length === 0" class="text-center text-slate-400 py-8">
          <p class="text-2xl mb-1">🔍</p>
          <p class="text-sm">Sin resultados para "{{ busquedaManual }}"</p>
        </div>
        <div *ngIf="!cargandoCatalogo && catalogoFiltrado.length > 0">
          <p class="text-xs text-slate-500 mb-2 font-medium">{{ catalogoFiltrado.length }} producto(s) — click para agregar</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            <div *ngFor="let p of catalogoFiltrado"
                (click)="onClickProducto(p)"
                class="bg-white border-2 rounded-xl p-2 cursor-pointer transition-all hover:shadow-md group active:scale-95 select-none relative"
                [ngClass]="esPorEncargo(p)
                  ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                  : 'border-slate-200 hover:border-cyan-400 hover:bg-cyan-50'">

              <div *ngIf="getCantidadEnTicket(p.producto_id) > 0"
                   class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center z-10">
                {{ getCantidadEnTicket(p.producto_id) }}
              </div>

              <div class="w-full aspect-square rounded-lg flex items-center justify-center mb-1.5 transition-colors"
                   [ngClass]="esPorEncargo(p)
                     ? 'bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300'
                     : 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-cyan-100 group-hover:to-cyan-200'">
                <span class="text-xl font-bold transition-colors"
                      [ngClass]="esPorEncargo(p) ? 'text-blue-500 group-hover:text-blue-700' : 'text-slate-400 group-hover:text-cyan-600'">
                  {{ p.nombre.charAt(0).toUpperCase() }}
                </span>
              </div>

              <p class="text-xs font-semibold text-slate-800 leading-tight truncate">{{ p.nombre }}</p>
              <p class="text-sm font-bold text-emerald-600">S/ {{ p.precio | number:'1.2-2' }}</p>

              <div class="mt-0.5">
                <span *ngIf="esPorEncargo(p)"
                      class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                  📦 Por encargo
                </span>
                <span *ngIf="!esPorEncargo(p) && p.stock_disponible > 0"
                      class="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                  Stock: {{ p.stock_disponible }}
                </span>
                <span *ngIf="!esPorEncargo(p) && p.stock_disponible <= 0"
                      class="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                  Sin stock
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden" style="background: #f8fafc">
      <div *ngIf="!pedidoSeleccionado" class="flex-1 flex items-center justify-center text-slate-400">
        <div class="text-center"><p class="text-3xl mb-2">🧾</p><p class="text-sm">Haz click en un producto o pedido</p></div>
      </div>

      <div *ngIf="pedidoSeleccionado" class="flex-1 flex flex-col overflow-hidden">
        <div class="px-3 py-1.5 bg-cyan-50 border-b border-cyan-100 flex justify-between items-center flex-shrink-0">
          <p class="text-xs font-semibold text-cyan-700">
            {{ pedidoSeleccionado.pedido_id ? '📦 Pedido #' + pedidoSeleccionado.pedido_id : '🧾 Venta directa' }}
            <span *ngIf="tieneEncargos()" class="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
              📦 Incluye encargo
            </span>
          </p>
          <p class="text-xs text-cyan-600">{{ clienteEncontrado?.nombre || pedidoSeleccionado.cliente }}</p>
        </div>
        <div class="flex-1 overflow-y-auto bg-white">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-50 border-b">
              <tr class="text-slate-500 text-xs uppercase tracking-wide">
                <th class="text-left p-2 font-medium">Producto</th>
                <th class="text-center p-2 w-20 font-medium">Cant.</th>
                <th class="text-right p-2 w-16 font-medium">Precio</th>
                <th class="text-right p-2 w-16 font-medium">Total</th>
                <th class="w-6"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of pedidoSeleccionado.detalles; let i = index"
                  class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  [ngClass]="d.es_encargo ? 'bg-blue-50/30' : ''">
                <td class="p-2 font-medium text-slate-800 text-xs">
                  {{ d.producto }}
                  <span *ngIf="d.es_encargo" class="ml-1 px-1 py-0 bg-blue-100 text-blue-700 rounded text-xs">encargo</span>
                </td>
                <td class="p-2 text-center">
                  <div *ngIf="!pedidoSeleccionado.pedido_id" class="flex items-center justify-center gap-1">
                    <button (click)="cambiarCantidad(i, -1)" class="w-5 h-5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded font-bold text-xs transition-colors">−</button>
                    <span class="w-6 text-center font-semibold text-xs">{{ d.cantidad }}</span>
                    <button (click)="cambiarCantidad(i, 1)" class="w-5 h-5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 rounded font-bold text-xs transition-colors">+</button>
                  </div>
                  <span *ngIf="pedidoSeleccionado.pedido_id" class="text-slate-600 text-xs">{{ d.cantidad }}</span>
                </td>
                <td class="p-2 text-right text-slate-500 text-xs">S/ {{ d.precio | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-bold text-slate-800 text-xs">S/ {{ d.subtotal | number:'1.2-2' }}</td>
                <td class="p-2 text-center">
                  <button *ngIf="!pedidoSeleccionado.pedido_id" (click)="eliminarItem(i)" class="text-red-300 hover:text-red-500 text-xs">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="pedidoSeleccionado.detalles.length === 0" class="text-center text-slate-400 py-6 text-sm">
            <p class="text-xl mb-1">📦</p>Agrega productos desde el catálogo
          </div>
        </div>
        <div class="border-t border-slate-200 bg-slate-50 p-3 flex-shrink-0">
          <div class="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Subtotal (sin IGV)</span><span>S/ {{ subtotal | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>IGV ({{ tasaIgv }}%)</span><span>S/ {{ igv | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-1.5">
            <span>TOTAL</span><span class="text-emerald-600">S/ {{ total | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ PANEL DERECHO — Cobro ══ -->
  <div class="w-72 flex-shrink-0 bg-white flex flex-col overflow-hidden">

    <div class="p-3 border-b border-slate-200">
      <h3 class="font-bold text-slate-800">{{ tieneEncargos() ? '📦 Pedido con encargo' : 'Cobro' }}</h3>
      <p *ngIf="tieneEncargos()" class="text-xs text-blue-600 mt-0.5">Se generará ticket interno, no boleta</p>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-3">

      <!-- BLOQUE NORMAL (sin encargos) -->
      <ng-container *ngIf="!tieneEncargos()">

        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Comprobante</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button *ngFor="let t of tiposComprobante" (click)="seleccionarTipoComprobante(t)"
                    [ngClass]="form.tipo_comprobante_id === t.tipo_comprobante_id ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all">
              <p class="text-lg mb-0.5">{{ t.codigo_sunat === '01' ? '🧾' : t.codigo_sunat === '03' ? '📄' : '🗒️' }}</p>
              <p class="text-xs font-bold">{{ t.nombre }}</p>
              <p class="text-xs opacity-50">{{ t.codigo_sunat }}</p>
            </button>
          </div>
        </div>

        <div *ngIf="tipoSeleccionado?.codigo_sunat === '03'" class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
            DNI del cliente <span class="text-slate-400 font-normal normal-case ml-1">(opcional)</span>
          </label>
          <div class="flex gap-1.5">
            <input [(ngModel)]="docBusqueda" maxlength="8" placeholder="12345678"
                  class="flex-1 p-2 border-2 border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
            <button (click)="buscarCliente()" [disabled]="docBusqueda.length !== 8 || buscandoCliente"
                    class="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm disabled:opacity-40 transition-colors">
              {{ buscandoCliente ? '⏳' : '🔍' }}
            </button>
          </div>
          <div *ngIf="clienteEncontrado" class="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs font-bold text-slate-800">{{ clienteEncontrado.nombre }}</p>
                <p class="text-xs text-slate-500">DNI: {{ clienteEncontrado.documento }}</p>
              </div>
              <button (click)="limpiarCliente()" class="text-slate-400 hover:text-red-500 text-sm">✕</button>
            </div>
          </div>
        </div>

        <div *ngIf="tipoSeleccionado?.codigo_sunat === '01'"
            class="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1.5">
          <label class="text-xs font-semibold text-amber-700 uppercase tracking-wide block">🧾 RUC del cliente *</label>
          <div class="flex gap-1.5">
            <input [(ngModel)]="docBusqueda" maxlength="11" placeholder="20123456789"
                  class="flex-1 p-2 border border-amber-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-400 outline-none bg-white"/>
            <button (click)="buscarCliente()" [disabled]="docBusqueda.length !== 11 || buscandoCliente"
                    class="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm disabled:opacity-40 transition-colors">
              {{ buscandoCliente ? '⏳' : '🔍' }}
            </button>
          </div>
          <div *ngIf="clienteEncontrado" class="p-2 bg-white border border-amber-200 rounded-xl">
            <p class="text-xs font-bold text-slate-800">{{ clienteEncontrado.nombre }}</p>
            <p class="text-xs text-slate-500">RUC: {{ clienteEncontrado.documento }}</p>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Tipo de pago</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button (click)="tipoPago = 'CONTADO'; form.tipo_pago = 'CONTADO'"
                    [ngClass]="tipoPago === 'CONTADO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all">
              <p class="text-base">✅</p><p class="text-xs font-semibold">Contado</p>
            </button>
            <button (click)="tipoPago = 'CREDITO'; form.tipo_pago = 'CREDITO'; form.monto_inicial = 0"
                    [ngClass]="tipoPago === 'CREDITO' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all">
              <p class="text-base">💳</p><p class="text-xs font-semibold">Crédito</p>
            </button>
          </div>
        </div>

      </ng-container>

      <!-- BLOQUE CON ENCARGO -->
      <ng-container *ngIf="tieneEncargos()">

        <!-- DNI obligatorio -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
          <label class="text-xs font-semibold text-blue-700 uppercase tracking-wide block">
            🆔 DNI o RUC del cliente *
          </label>
          <div class="flex gap-1.5">
            <input [(ngModel)]="docBusqueda" maxlength="11" placeholder="DNI (8) o RUC (11)"
                   class="flex-1 p-2 border-2 border-blue-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none bg-white"/>
            <button (click)="buscarClientePosMixto()" [disabled]="(docBusqueda.length !== 8 && docBusqueda.length !== 11) || buscandoCliente"
                    class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm disabled:opacity-40">
              {{ buscandoCliente ? '⏳' : '🔍' }}
            </button>
          </div>
          <div *ngIf="clienteEncontrado" class="p-2 bg-white border border-blue-200 rounded-xl">
            <p class="text-xs font-bold text-slate-800">{{ clienteEncontrado.nombre }}</p>
            <p class="text-xs text-slate-500">{{ clienteEncontrado.documento }}</p>
          </div>
        </div>

        <!-- Datos de contacto -->
        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            📞 Teléfono de contacto *
          </label>
          <input [(ngModel)]="posMixtoForm.telefono" placeholder="987654321"
                 class="w-full p-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
        </div>

        <!-- Fecha y hora de recojo -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">📅 Fecha *</label>
            <input type="date" [(ngModel)]="posMixtoForm.fecha_recojo" [min]="hoyStr"
                   class="w-full p-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">⏰ Hora *</label>
            <input type="time" [(ngModel)]="posMixtoForm.hora_recojo"
                   class="w-full p-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
          </div>
        </div>

        <!-- Tipo de entrega -->
        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Tipo de entrega</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button (click)="posMixtoForm.tipo_entrega = 'PICKUP'"
                    [ngClass]="posMixtoForm.tipo_entrega === 'PICKUP' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all text-xs font-semibold">
              🏪 Recojo
            </button>
            <button (click)="posMixtoForm.tipo_entrega = 'DELIVERY'"
                    [ngClass]="posMixtoForm.tipo_entrega === 'DELIVERY' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all text-xs font-semibold">
              🛵 Delivery
            </button>
          </div>
        </div>

        <div *ngIf="posMixtoForm.tipo_entrega === 'DELIVERY'">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Dirección *
          </label>
          <input [(ngModel)]="posMixtoForm.direccion" placeholder="Av. Principal 123, Lima"
                 class="w-full p-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Observaciones <span class="text-slate-400 font-normal normal-case ml-1">(decoración, mensaje...)</span>
          </label>
          <textarea [(ngModel)]="posMixtoForm.observaciones" rows="2"
                    placeholder="Sabor, decoración, mensaje en torta..."
                    class="w-full p-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none"></textarea>
        </div>

      </ng-container>

      <!-- Método de pago (común para ambos flujos) -->
      <div>
        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Método de pago</label>
        <div class="grid grid-cols-2 gap-1.5">
          <button *ngFor="let m of metodosPago" (click)="seleccionarMetodo(m)"
                  [ngClass]="form.metodo_pago_id === m.metodo_pago_id ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'"
                  class="border-2 rounded-xl p-1.5 text-center transition-all">
            <p class="text-base">{{ getMetodoIcono(m.codigo) }}</p>
            <p class="text-xs font-medium leading-tight">{{ m.nombre }}</p>
          </button>
        </div>
      </div>

      <div *ngIf="qrActual && (metodoCodigo === 'YAPE' || metodoCodigo === 'PLIN')"
          class="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-center">
        <p class="text-xs text-purple-600 font-medium mb-1.5">Muestra el QR al cliente</p>
        <img [src]="'data:image/png;base64,' + qrActual.qr_base64"
            class="w-24 h-24 object-contain mx-auto border bg-white rounded-lg p-1"/>
        <p class="text-xs font-bold text-slate-800 mt-1.5">{{ qrActual.titular }}</p>
        <p class="text-xs text-slate-500">{{ qrActual.numero }}</p>
      </div>

      <div *ngIf="metodoCodigo === 'YAPE' || metodoCodigo === 'PLIN'">
        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          N° Operación <span class="text-red-500">*</span>
        </label>
        <input [(ngModel)]="form.referencia_pago" placeholder="Código de operación"
              class="w-full p-2 border-2 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
              [ngClass]="form.referencia_pago?.trim() ? 'border-emerald-400' : 'border-red-300'"/>
      </div>

      <!-- MONTO POS MIXTO -->
      <div *ngIf="tieneEncargos()" class="bg-orange-50 border border-orange-200 rounded-xl p-2.5 space-y-2">
        <p class="text-xs font-semibold text-orange-700 uppercase tracking-wide">💰 Abono inicial</p>
        <p *ngIf="porcentajeMinimoEncargo > 0" class="text-xs text-orange-600">
          Mínimo {{ porcentajeMinimoEncargo }}% del total
          (S/ {{ (total * porcentajeMinimoEncargo / 100) | number:'1.2-2' }})
        </p>
        <p *ngIf="porcentajeMinimoEncargo === 0" class="text-xs text-orange-600">
          Sin mínimo — puedes registrar sin pago
        </p>
        <div class="relative">
          <span class="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">S/</span>
          <input type="number" [(ngModel)]="posMixtoForm.monto_abono"
                 [min]="0" [max]="total" step="0.01"
                 class="w-full pl-10 p-2.5 border-2 border-orange-300 rounded-xl text-right text-lg font-bold focus:ring-2 focus:ring-orange-400 outline-none bg-white"/>
        </div>
        <div class="bg-white border border-orange-200 rounded-xl p-2 text-center">
          <p class="text-xs text-slate-500 mb-0.5">Saldo a cobrar al recoger</p>
          <p class="text-xl font-bold text-orange-600">S/ {{ (total - (posMixtoForm.monto_abono || 0)) | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- MONTO CONTADO NORMAL -->
      <div *ngIf="!tieneEncargos() && tipoPago === 'CONTADO' && metodoCodigo === 'EFECTIVO'">
        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Monto recibido</label>
        <div class="relative">
          <span class="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">S/</span>
          <input type="number" [(ngModel)]="form.monto_pagado" (ngModelChange)="calcularVuelto()" [min]="total"
                class="w-full pl-10 p-2.5 border-2 border-slate-200 rounded-xl text-right text-xl font-bold focus:ring-2 focus:ring-cyan-400 outline-none"/>
        </div>
        <div class="grid grid-cols-4 gap-1 mt-1.5">
          <button *ngFor="let m of montosRapidos" (click)="form.monto_pagado = m; calcularVuelto()"
                  class="py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors">
            S/{{ m }}
          </button>
        </div>
        <div *ngIf="vuelto >= 0" class="mt-2 p-2.5 rounded-xl text-center border"
            [ngClass]="vuelto > 0 ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'">
          <p class="text-xs font-medium" [ngClass]="vuelto > 0 ? 'text-blue-600' : 'text-emerald-600'">
            {{ vuelto > 0 ? 'Vuelto a entregar' : '✓ Cobro exacto' }}
          </p>
          <p *ngIf="vuelto > 0" class="text-xl font-bold text-blue-700">S/ {{ vuelto | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- CREDITO NORMAL -->
      <div *ngIf="!tieneEncargos() && tipoPago === 'CREDITO'" class="bg-orange-50 border border-orange-200 rounded-xl p-2.5 space-y-2">
        <p class="text-xs font-semibold text-orange-700 uppercase tracking-wide">💳 Venta a crédito</p>
        <div>
          <label class="text-xs text-slate-500 block mb-1">Abono inicial (puede ser 0)</label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">S/</span>
            <input type="number" [(ngModel)]="form.monto_inicial" [min]="0" [max]="total"
                  class="w-full pl-10 p-2.5 border-2 border-orange-300 rounded-xl text-right text-lg font-bold focus:ring-2 focus:ring-orange-400 outline-none bg-white"/>
          </div>
        </div>
      </div>

    </div>

    <div class="p-3 border-t border-slate-200">
      <p *ngIf="!pedidoSeleccionado" class="text-center text-xs text-slate-400 py-1">
        Selecciona un pedido o agrega productos
      </p>
      <button *ngIf="pedidoSeleccionado" (click)="cobrar()"
              [disabled]="!puedeCobrar() || procesando"
              class="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 active:scale-95"
              [style.background]="tieneEncargos()
                ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                : 'linear-gradient(135deg, #0369a1, #0ea5e9)'">
        <span *ngIf="!procesando">
          {{ tieneEncargos() ? '📦 Generar pedido + ticket' : (tipoPago === 'CREDITO' ? '💳 Registrar crédito' : '✓ Cobrar') }}
          S/ {{ total | number:'1.2-2' }}
        </span>
        <span *ngIf="procesando">⏳ Procesando...</span>
      </button>
    </div>
    
  </div>
  <app-ticket-interno-modal
    *ngIf="ticketModalId"
    [ticketId]="ticketModalId"
    (onCerrar)="cerrarTicketModal()">
  </app-ticket-interno-modal>
  
</div>
  `
})
export class PosComponent implements OnInit {

  Math = Math;

  pedidos:           any[] = [];
  metodosPago:       any[] = [];
  tiposComprobante:  any[] = [];
  catalogoCompleto:  any[] = [];
  catalogoFiltrado:  any[] = [];
  resumenDia:        any   = null;
  qrActual:          any   = null;
  itemsVentaDirecta: any[] = [];

  // Config de la empresa (cargada al iniciar)
  porcentajeMinimoEncargo = 0;
  diasMaxAbandono = 30;
  ticketModalId: number | null = null;
  docBusqueda        = '';
  clienteEncontrado: any = null;
  buscandoCliente    = false;

  pedidoSeleccionado: any = null;
  busquedaManual          = '';
  codigoBarras            = '';
  metodoCodigo            = '';
  tipoPago                = 'CONTADO';
  cargandoPedidos         = false;
  cargandoCatalogo        = false;
  procesando              = false;

  subtotal = 0;
  igv      = 0;
  total    = 0;
  tasaIgv  = 18;
  vuelto   = -1;

  montosRapidos = [10, 20, 50, 100, 200];

  hoyStr = new Date().toISOString().split('T')[0];

  // Formulario para POS Mixto (encargo)
  posMixtoForm: any = {
    telefono: '',
    fecha_recojo: '',
    hora_recojo: '14:00',
    tipo_entrega: 'PICKUP',
    direccion: '',
    observaciones: '',
    monto_abono: 0
  };

  private bufferScanner = '';
  private timerScanner:  any;
  private destroyRef = inject(DestroyRef);

  form: any = {
    pedido_id:           null,
    cliente_id:          null,
    tipo_comprobante_id: 2,
    metodo_pago_id:      1,
    impuesto_id:         1,
    monto_pagado:        0,
    monto_inicial:       0,
    referencia_pago:     '',
    tipo_pago:           'CONTADO',
    detalles:            []
  };

  constructor(
    private ventasService:     VentasService,
    private configPagoService: ConfiguracionPagoService,
    private productoService:   ProductosService,
    private clienteService:    ClientesService,
    private http:              HttpClient,
    private router:            Router,
    private cd:                ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPedidos();
    this.cargarMetodos();
    this.cargarTiposComprobante();
    this.cargarResumenDia();
    this.cargarCatalogo();
    this.cargarConfigEmpresa();
    this.posMixtoForm.fecha_recojo = this.hoyStr;
  }

  cargarConfigEmpresa() {
    this.http.get<any>(`${environment.apiUrl}/configuracion-negocio`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.porcentajeMinimoEncargo = res.porcentaje_minimo_encargo ?? 0;
          this.diasMaxAbandono = res.dias_max_pedido_abandonado ?? 30;
          this.cd.detectChanges();
        }
      });
  }

  cerrarTicketModal() {
    this.ticketModalId = null;
    this.limpiar();
    this.cargarPedidos();
    this.cargarCatalogo();
    this.cd.detectChanges();
  }

  get tipoSeleccionado() {
    return this.tiposComprobante.find(t => t.tipo_comprobante_id === this.form.tipo_comprobante_id);
  }

  getCantidadEnTicket(productoId: number): number {
    const item = this.itemsVentaDirecta.find((i: any) => i.producto_id === productoId);
    return item ? item.cantidad : 0;
  }

  // ── Detección de producto "por encargo" ──
  esPorEncargo(p: any): boolean {
    return p.permite_pedido_sin_stock === true && (p.stock_disponible ?? 0) <= 0;
  }

  /** Verifica si el ticket actual incluye al menos 1 item de encargo */
  tieneEncargos(): boolean {
    return this.itemsVentaDirecta.some((i: any) => i.es_encargo);
  }

  // ── Click en producto: ya NO abre modal aparte. Se agrega al ticket marcado como encargo si aplica ──
  onClickProducto(p: any) {
    if (!this.pedidoSeleccionado) this.iniciarVentaDirecta();

    const esEncargo = this.esPorEncargo(p);
    const existente = this.itemsVentaDirecta.find((i: any) =>
      i.producto_id === p.producto_id && i.es_encargo === esEncargo);

    if (existente) {
      existente.cantidad++;
      existente.subtotal = existente.precio * existente.cantidad;
    } else {
      this.itemsVentaDirecta.push({
        producto_id: p.producto_id,
        producto: p.nombre,
        cantidad: 1,
        precio: p.precio,
        subtotal: p.precio,
        es_encargo: esEncargo
      });
    }

    this.recalcularVentaDirecta();
    this.cd.detectChanges();
  }

  iniciarVentaDirecta() {
    this.pedidoSeleccionado = {
      pedido_id: null,
      cliente: 'Cliente general',
      cliente_doc: '',
      cliente_id: null,
      detalles: [],
      total: 0
    };
    this.form.pedido_id  = null;
    this.form.cliente_id = null;
  }

  recalcularVentaDirecta() {
    const total = this.itemsVentaDirecta.reduce((sum: number, i: any) => sum + i.subtotal, 0);
    this.pedidoSeleccionado.detalles = this.itemsVentaDirecta;
    this.form.detalles = this.itemsVentaDirecta.map((i: any) => ({
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio
    }));
    this.calcularTotales(total);

    // Si tiene encargos, ajustar monto_abono al mínimo configurado
    if (this.tieneEncargos() && this.porcentajeMinimoEncargo > 0) {
      this.posMixtoForm.monto_abono = Math.round(total * this.porcentajeMinimoEncargo / 100 * 100) / 100;
    }
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

  cargarPedidos() {
    this.cargandoPedidos = true;
    this.ventasService.getPedidosPendientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.pedidos = res; this.cargandoPedidos = false; this.cd.detectChanges(); },
      error: ()   => { this.cargandoPedidos = false; this.cd.detectChanges(); }
    });
  }

  cargarMetodos() {
    this.ventasService.getMetodosPago().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.metodosPago = res;
        const efectivo = res.find((m: any) => m.codigo === 'EFECTIVO');
        if (efectivo) { this.form.metodo_pago_id = efectivo.metodo_pago_id; this.metodoCodigo = 'EFECTIVO'; }
        this.cd.detectChanges();
      }
    });
  }

  cargarTiposComprobante() {
    this.ventasService.getTiposComprobante().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.tiposComprobante = res;
        if (res.length > 0) this.form.tipo_comprobante_id = res[0].tipo_comprobante_id;
        this.cd.detectChanges();
      }
    });
  }

  cargarResumenDia() {
    this.ventasService.getResumenDia().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.resumenDia = res; this.cd.detectChanges(); }
    });
  }

  cargarCatalogo() {
    this.cargandoCatalogo = true;
    this.productoService.getProductosDisponibles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any[]) => { this.catalogoCompleto = res; this.catalogoFiltrado = res; this.cargandoCatalogo = false; this.cd.detectChanges(); },
      error: ()           => { this.cargandoCatalogo = false; this.cd.detectChanges(); }
    });
  }

  filtrarCatalogo() {
    const q = this.busquedaManual.toLowerCase().trim();
    this.catalogoFiltrado = q
      ? this.catalogoCompleto.filter(p => p.nombre.toLowerCase().includes(q))
      : this.catalogoCompleto;
    this.cd.detectChanges();
  }

  seleccionarTipoComprobante(t: any) {
    this.form.tipo_comprobante_id = t.tipo_comprobante_id;
    this.limpiarCliente();
    this.cd.detectChanges();
  }

  buscarCliente() {
    if (this.buscandoCliente) return;
    const esFactura = this.tipoSeleccionado?.codigo_sunat === '01';
    const longitud = esFactura ? 11 : 8;
    if (this.docBusqueda.length !== longitud) return;

    this.buscandoCliente = true;
    this.clienteEncontrado = null;
    this.cd.detectChanges();

    const obs = esFactura
      ? this.clienteService.consultarRUC(this.docBusqueda)
      : this.clienteService.consultarDNI(this.docBusqueda);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.clienteEncontrado = res;
        this.form.cliente_id = res.cliente_id ?? null;
        this.buscandoCliente = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.buscandoCliente = false;
        Swal.fire('No encontrado', esFactura ? 'RUC no encontrado' : 'DNI no encontrado', 'warning');
        this.cd.detectChanges();
      }
    });
  }

  buscarClientePosMixto() {
    if (this.buscandoCliente) return;
    const longitud = this.docBusqueda.length;
    if (longitud !== 8 && longitud !== 11) return;

    this.buscandoCliente = true;
    this.clienteEncontrado = null;
    this.cd.detectChanges();

    const obs = longitud === 11
      ? this.clienteService.consultarRUC(this.docBusqueda)
      : this.clienteService.consultarDNI(this.docBusqueda);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.clienteEncontrado = res;
        this.buscandoCliente = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.buscandoCliente = false;
        Swal.fire('No encontrado', 'DNI/RUC no encontrado', 'warning');
        this.cd.detectChanges();
      }
    });
  }

  limpiarCliente() {
    this.clienteEncontrado = null;
    this.docBusqueda = '';
    this.form.cliente_id = this.pedidoSeleccionado?.cliente_id ?? null;
    this.cd.detectChanges();
  }

  buscarPorCodigo() {
    if (!this.codigoBarras.trim()) return;
    this.productoService.buscarProducto(this.codigoBarras).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any[]) => {
        if (res.length === 1) this.onClickProducto(res[0]);
        else if (res.length > 1) this.catalogoFiltrado = this.catalogoCompleto.filter(p => res.some((r: any) => r.producto_id === p.producto_id));
        else Swal.fire({ icon: 'warning', title: 'Producto no encontrado', text: `Código: ${this.codigoBarras}`, timer: 2000, showConfirmButton: false });
        this.codigoBarras = '';
        this.cd.detectChanges();
      }
    });
  }

  seleccionarPedido(p: any) {
    this.pedidoSeleccionado = p;
    this.form.pedido_id = p.pedido_id;
    this.form.cliente_id = p.cliente_id;
    this.form.detalles = [];
    this.form.monto_pagado = p.total;
    this.vuelto = 0;
    this.limpiarCliente();
    this.calcularTotales(p.total);
    this.cd.detectChanges();
  }

  calcularTotales(totalConIgv: number) {
    this.total = totalConIgv;
    this.subtotal = Math.round((totalConIgv / 1.18) * 100) / 100;
    this.igv = Math.round((totalConIgv - this.subtotal) * 100) / 100;
  }

  seleccionarMetodo(m: any) {
    this.form.metodo_pago_id = m.metodo_pago_id;
    this.metodoCodigo = m.codigo;
    this.qrActual = null;
    this.form.referencia_pago = '';
    if (m.codigo === 'YAPE' || m.codigo === 'PLIN') {
      this.form.monto_pagado = this.total;
      this.configPagoService.getQR(m.codigo.toLowerCase()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next:  (res: any) => { this.qrActual = res;  this.cd.detectChanges(); },
        error: ()         => { this.qrActual = null; this.cd.detectChanges(); }
      });
    }
    this.cd.detectChanges();
  }

  calcularVuelto() {
    if (this.tipoPago !== 'CONTADO' || this.metodoCodigo !== 'EFECTIVO') {
      this.vuelto = -1;
      return;
    }
    this.vuelto = this.form.monto_pagado >= this.total
      ? Math.round((this.form.monto_pagado - this.total) * 100) / 100
      : -1;
    this.cd.detectChanges();
  }

  puedeCobrar(): boolean {
    if (!this.pedidoSeleccionado) return false;
    if (this.pedidoSeleccionado.detalles?.length === 0) return false;
    if (!this.form.metodo_pago_id) return false;

    // POS Mixto: validaciones adicionales
    if (this.tieneEncargos()) {
      if (!this.clienteEncontrado) return false;
      if (!this.posMixtoForm.telefono?.trim()) return false;
      if (!this.posMixtoForm.fecha_recojo || !this.posMixtoForm.hora_recojo) return false;
      if (this.posMixtoForm.tipo_entrega === 'DELIVERY' && !this.posMixtoForm.direccion?.trim()) return false;

      // Validar mínimo
      const montoMinimo = this.total * this.porcentajeMinimoEncargo / 100;
      if (this.posMixtoForm.monto_abono < montoMinimo) return false;

      // Validar referencia si es Yape/Plin
      if ((this.metodoCodigo === 'YAPE' || this.metodoCodigo === 'PLIN')
          && !this.form.referencia_pago?.trim()) return false;

      return true;
    }

    // Flujo normal
    if (!this.form.tipo_comprobante_id) return false;
    if (this.tipoSeleccionado?.codigo_sunat === '01' && !this.clienteEncontrado) return false;
    if ((this.metodoCodigo === 'YAPE' || this.metodoCodigo === 'PLIN')
        && !this.form.referencia_pago?.trim()) return false;

    if (this.tipoPago === 'CONTADO') {
      if (this.metodoCodigo === 'EFECTIVO') return this.form.monto_pagado >= this.total;
      return true;
    }
    if (this.tipoPago === 'CREDITO')
      return (this.form.monto_inicial ?? 0) >= 0 && (this.form.monto_inicial ?? 0) <= this.total;
    return true;
  }

  /** Botón único: si tiene encargos → POS Mixto, sino → flujo normal */
  cobrar() {
    if (this.tieneEncargos()) this.procesarPosMixto();
    else this.procesarVenta();
  }

  procesarPosMixto() {
    if (!this.puedeCobrar() || this.procesando) return;

    const fechaRecojo = `${this.posMixtoForm.fecha_recojo}T${this.posMixtoForm.hora_recojo}:00`;

    const dto = {
      cliente_id: this.clienteEncontrado?.cliente_id ?? null,
      documento_cliente: this.clienteEncontrado?.documento ?? this.docBusqueda,
      nombre_cliente: this.clienteEncontrado?.nombre ?? 'Cliente',
      telefono_contacto: this.posMixtoForm.telefono,
      detalles: this.itemsVentaDirecta.map((i: any) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        es_encargo: i.es_encargo
      })),
      tipo_entrega: this.posMixtoForm.tipo_entrega,
      direccion_entrega: this.posMixtoForm.direccion,
      fecha_recojo_estimada: fechaRecojo,
      observaciones: this.posMixtoForm.observaciones,
      metodo_pago_id: this.form.metodo_pago_id,
      monto_abono: this.posMixtoForm.monto_abono,
      referencia_pago: this.form.referencia_pago
    };

    Swal.fire({
      title: '¿Generar pedido?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:2">
          <p><b>Cliente:</b> ${this.clienteEncontrado?.nombre}</p>
          <p><b>Total:</b> S/ ${this.total.toFixed(2)}</p>
          <p><b>Abono:</b> S/ ${this.posMixtoForm.monto_abono.toFixed(2)}</p>
          <p style="color:#ea580c"><b>Saldo: S/ ${(this.total - this.posMixtoForm.monto_abono).toFixed(2)}</b></p>
          <p><b>Entrega:</b> ${this.posMixtoForm.fecha_recojo} ${this.posMixtoForm.hora_recojo}</p>
          <hr/>
          <p style="font-size:12px;color:#2563eb">Se generará TICKET INTERNO (no boleta). La boleta se emitirá al entregar.</p>
        </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generar pedido + ticket',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = true;
      this.cd.detectChanges();

      this.http.post(`${environment.apiUrl}/ventas/pos-mixto`, dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            this.procesando = false;
            Swal.fire({
              icon: 'success',
              title: '¡Pedido registrado!',
              html: `
                <div style="text-align:center">
                  <p style="font-size:24px;font-weight:bold;color:#2563eb">${res.ticket_numero}</p>
                  <p style="color:#6b7280;font-size:13px">Ticket interno</p>
                  <hr style="margin:12px 0"/>
                  <div style="font-size:14px;text-align:left;line-height:2">
                    <p><b>Pedido:</b> #${res.pedido_id}</p>
                    <p><b>Total:</b> S/ ${res.total.toFixed(2)}</p>
                    <p><b>Abonado:</b> S/ ${res.monto_abonado.toFixed(2)}</p>
                    <p style="color:#ea580c"><b>Saldo:</b> S/ ${res.saldo_pendiente.toFixed(2)}</p>
                  </div>
                </div>`,
              showCancelButton: true,
              confirmButtonText: '🖨️ Ver ticket',
              cancelButtonText: 'Nueva venta',
              confirmButtonColor: '#2563eb'
            }).then(r2 => {
              if (r2.isConfirmed) {
                // Abrir el modal del ticket (NO navegar)
                this.ticketModalId = res.ticket_id;
                this.cd.detectChanges();
                // El limpiar() se ejecutará cuando se cierre el modal
                return;
              }
              this.limpiar();
              this.cargarPedidos();
              this.cargarCatalogo();
            });
          },
          error: (err) => {
            this.procesando = false;
            let msg = 'No se pudo registrar el pedido';
            if (err.error?.mensaje) msg = err.error.mensaje;
            else if (typeof err.error === 'string') msg = err.error;
            Swal.fire('Error', msg, 'error');
            this.cd.detectChanges();
          }
        });
    });
  }

  procesarVenta() {
    // Lógica existente para venta normal (sin cambios)
    if (this.clienteEncontrado?.cliente_id) this.form.cliente_id = this.clienteEncontrado.cliente_id;
    this.form.tipo_pago = this.tipoPago;

    const metodo = this.metodosPago.find(m => m.metodo_pago_id === this.form.metodo_pago_id);
    const tipo = this.tiposComprobante.find(t => t.tipo_comprobante_id === this.form.tipo_comprobante_id);

    Swal.fire({
      title: '¿Confirmar venta?',
      html: `<div style="text-align:left;font-size:14px;line-height:2">
          <p><b>Total:</b> S/ ${this.total.toFixed(2)}</p>
          <p><b>Comprobante:</b> ${tipo?.nombre}</p>
          <p><b>Pago:</b> ${metodo?.nombre} (${this.tipoPago})</p>
        </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0ea5e9'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = true;
      this.cd.detectChanges();

      this.ventasService.crearVenta(this.form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res: any) => {
          this.procesando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Venta registrada!',
            html: `<p style="font-size:24px;font-weight:bold;color:#16a34a">${res.numero_formato}</p>
                   <p>Total: S/ ${res.total.toFixed(2)}</p>
                   ${res.vuelto > 0 ? `<p style="color:#2563eb">Vuelto: S/ ${res.vuelto.toFixed(2)}</p>` : ''}`,
            confirmButtonText: 'Nueva venta',
            confirmButtonColor: '#0ea5e9'
          }).then(() => { this.limpiar(); this.cargarPedidos(); this.cargarResumenDia(); this.cargarCatalogo(); });
        },
        error: (err) => {
          this.procesando = false;
          let msg = 'No se pudo procesar la venta';
          if (typeof err.error === 'string') msg = err.error;
          else if (err.error?.mensaje) msg = err.error.mensaje;
          Swal.fire('Error', msg, 'error');
          this.cd.detectChanges();
        }
      });
    });
  }

  limpiar() {
    this.pedidoSeleccionado = null;
    this.itemsVentaDirecta = [];
    this.busquedaManual = '';
    this.catalogoFiltrado = this.catalogoCompleto;
    this.vuelto = -1;
    this.qrActual = null;
    this.metodoCodigo = 'EFECTIVO';
    this.tipoPago = 'CONTADO';
    this.subtotal = 0;
    this.igv = 0;
    this.total = 0;
    this.limpiarCliente();
    this.posMixtoForm = {
      telefono: '',
      fecha_recojo: this.hoyStr,
      hora_recojo: '14:00',
      tipo_entrega: 'PICKUP',
      direccion: '',
      observaciones: '',
      monto_abono: 0
    };
    this.form = {
      pedido_id:           null,
      cliente_id:          null,
      tipo_comprobante_id: this.tiposComprobante[0]?.tipo_comprobante_id ?? null,
      metodo_pago_id:      this.metodosPago.find(m => m.codigo === 'EFECTIVO')?.metodo_pago_id ?? 1,
      impuesto_id:         1,
      monto_pagado:        0,
      monto_inicial:       0,
      referencia_pago:     '',
      tipo_pago:           'CONTADO',
      detalles:            []
    };
    this.cd.detectChanges();
  }

  getMetodoIcono(codigo: string): string {
    const m: Record<string, string> = {
      'EFECTIVO':        '💵',
      'YAPE':            '📱',
      'PLIN':            '💜',
      'TARJETA_DEBITO':  '💳',
      'TARJETA_CREDITO': '💳',
      'TRANSFERENCIA':   '🏦'
    };
    return m[codigo] ?? '💰';
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Enter') {
      if (this.bufferScanner.length > 3) { this.codigoBarras = this.bufferScanner; this.buscarPorCodigo(); }
      this.bufferScanner = '';
      clearTimeout(this.timerScanner);
    } else {
      this.bufferScanner += e.key;
      clearTimeout(this.timerScanner);
      this.timerScanner = setTimeout(() => { this.bufferScanner = ''; }, 100);
    }
  }
}