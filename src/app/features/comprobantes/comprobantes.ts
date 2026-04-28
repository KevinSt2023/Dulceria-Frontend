import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas';
import { PdfService } from '../../core/services/pdf';
import { PedidosService } from '../../core/services/pedidos';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-comprobantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Comprobantes</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        {{ tabActivo === 'comprobantes' ? comprobantes.length + ' registros' : creditos.length + ' créditos pendientes' }}
      </p>
    </div>
    <button (click)="tabActivo === 'comprobantes' ? cargar() : cargarCreditos()"
            class="bg-slate-100 hover:bg-slate-200 px-4 py-2
                   rounded-lg text-sm text-gray-600 transition-colors">
      🔄 Refrescar
    </button>
  </div>

  <!-- TABS -->
  <div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
    <button (click)="cambiarTab('comprobantes')"
            [ngClass]="tabActivo === 'comprobantes'
              ? 'bg-white text-blue-600 shadow-sm font-semibold'
              : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-2 rounded-lg text-sm transition-all">
      📄 Comprobantes
    </button>
    <button (click)="cambiarTab('creditos')"
            [ngClass]="tabActivo === 'creditos'
              ? 'bg-white text-orange-600 shadow-sm font-semibold'
              : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
      💳 Créditos pendientes
      <span *ngIf="creditos.length > 0"
            class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
        {{ creditos.length }}
      </span>
    </button>
  </div>

  <!-- ══ TAB COMPROBANTES ══ -->
  <div *ngIf="tabActivo === 'comprobantes'">

    <!-- FILTROS -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100
                p-4 mb-5 flex flex-wrap gap-3">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Desde</label>
        <input type="date" [(ngModel)]="filtros.desde"
               class="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Hasta</label>
        <input type="date" [(ngModel)]="filtros.hasta"
               class="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Tipo</label>
        <select [(ngModel)]="filtros.tipo"
                class="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Todos</option>
          <option value="03">Boleta</option>
          <option value="01">Factura</option>
        </select>
      </div>
      <div class="flex-1 min-w-[180px]">
        <label class="text-xs text-gray-500 block mb-1">Buscar cliente</label>
        <input [(ngModel)]="filtros.buscar" placeholder="Nombre o documento..."
               class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>
      <div class="flex items-end gap-2">
        <button (click)="cargar()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          Buscar
        </button>
        <button (click)="limpiarFiltros()"
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
          Limpiar
        </button>
      </div>
    </div>

    <!-- RESUMEN -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ comprobantes.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Total</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-green-600">{{ contarTipo('03') }}</p>
        <p class="text-xs text-gray-500 mt-1">Boletas</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-purple-600">{{ contarTipo('01') }}</p>
        <p class="text-xs text-gray-500 mt-1">Facturas</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-xl font-bold text-gray-800">S/ {{ totalGeneral() | number:'1.2-2' }}</p>
        <p class="text-xs text-gray-500 mt-1">Monto total</p>
      </div>
    </div>

    <!-- LOADING -->
    <div *ngIf="loading" class="text-center text-gray-400 py-10">Cargando comprobantes...</div>

    <!-- TABLA COMPROBANTES -->
    <div *ngIf="!loading" class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Comprobante</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
            <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Método</th>
            <th class="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Estado SUNAT</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="comprobantes.length === 0">
            <td colspan="8" class="p-8 text-center text-gray-400 text-sm">No hay comprobantes registrados</td>
          </tr>
          <tr *ngFor="let c of comprobantes" class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="p-3">
              <p class="font-bold text-gray-800 font-mono text-sm">{{ c.numero_formato }}</p>
              <p class="text-xs text-gray-400">Cajero: {{ c.cajero }}</p>
            </td>
            <td class="p-3 text-center">
              <span [ngClass]="c.codigo_sunat === '01' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                    class="px-2.5 py-1 rounded-full text-xs font-medium">
                {{ c.codigo_sunat === '01' ? '🧾 Factura' : '📄 Boleta' }}
              </span>
            </td>
            <td class="p-3">
              <p class="text-sm font-medium text-gray-800">{{ c.cliente }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ c.cliente_doc }}</p>
            </td>
            <td class="p-3 text-center hidden md:table-cell">
              <span class="text-xs text-gray-600">{{ c.metodo_pago ?? '—' }}</span>
            </td>
            <td class="p-3 text-right">
              <p class="font-bold text-gray-800">S/ {{ c.total | number:'1.2-2' }}</p>
              <p class="text-xs text-gray-400">IGV: S/ {{ c.igv | number:'1.2-2' }}</p>
            </td>
            <td class="p-3 text-center hidden md:table-cell">
              <span [ngClass]="getEstadoSunatClase(c.estado_sunat)"
                    class="px-2 py-1 rounded-full text-xs font-medium">
                {{ c.estado_sunat }}
              </span>
            </td>
            <td class="p-3 text-center hidden md:table-cell">
              <p class="text-xs text-gray-600">{{ c.fecha | date:'dd/MM/yyyy' }}</p>
              <p class="text-xs text-gray-400">{{ c.fecha | date:'HH:mm' }}</p>
            </td>
            <td class="p-3 text-center">
              <div class="flex justify-center gap-1">
                <button (click)="verDetalle(c)"
                        class="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Ver
                </button>
                <button (click)="imprimirPDF(c)"
                        class="bg-slate-500 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🖨️
                </button>
                <button (click)="imprimirTicket(c)"
                        class="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🧾
                </button>
                <button (click)="descargarPDF(c)"
                        class="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  ⬇️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ TAB CRÉDITOS PENDIENTES ══ -->
  <div *ngIf="tabActivo === 'creditos'">

    <!-- RESUMEN CRÉDITOS -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-orange-600">{{ creditos.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Pedidos con deuda</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-xl font-bold text-red-600">S/ {{ totalSaldoPendiente() | number:'1.2-2' }}</p>
        <p class="text-xs text-gray-500 mt-1">Total por cobrar</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-xl font-bold text-green-600">S/ {{ totalCobradoCreditos() | number:'1.2-2' }}</p>
        <p class="text-xs text-gray-500 mt-1">Ya cobrado</p>
      </div>
    </div>

    <!-- LOADING CRÉDITOS -->
    <div *ngIf="loadingCreditos" class="text-center text-gray-400 py-10">Cargando créditos...</div>

    <!-- TABLA CRÉDITOS -->
    <div *ngIf="!loadingCreditos" class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedido</th>
            <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
            <th class="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th class="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagado</th>
            <th class="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
            <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="creditos.length === 0">
            <td colspan="7" class="p-8 text-center text-gray-400 text-sm">
              <p class="text-3xl mb-2">✅</p>
              No hay créditos pendientes
            </td>
          </tr>
          <tr *ngFor="let cr of creditos" class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="p-3">
              <p class="font-bold text-gray-800 text-sm">#{{ cr.pedido_id }}</p>
              <p class="text-xs text-gray-400">{{ cr.metodo_pago ?? '—' }}</p>
            </td>
            <td class="p-3">
              <p class="text-sm font-medium text-gray-800">{{ cr.cliente }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ cr.cliente_doc }}</p>
            </td>
            <td class="p-3 text-right">
              <p class="font-bold text-gray-800 text-sm">S/ {{ cr.total | number:'1.2-2' }}</p>
            </td>
            <td class="p-3 text-right">
              <p class="text-sm text-green-600 font-medium">S/ {{ cr.monto_pagado | number:'1.2-2' }}</p>
            </td>
            <td class="p-3 text-right">
              <span class="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                S/ {{ cr.saldo_pendiente | number:'1.2-2' }}
              </span>
            </td>
            <td class="p-3 text-center hidden md:table-cell">
              <p class="text-xs text-gray-600">{{ cr.fecha | date:'dd/MM/yyyy' }}</p>
              <p class="text-xs text-gray-400">{{ cr.fecha | date:'HH:mm' }}</p>
            </td>
            <td class="p-3 text-center">
              <div class="flex justify-center gap-1">
                <button (click)="verAbonos(cr)"
                        class="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Ver
                </button>
                <button (click)="abrirModalAbono(cr)"
                        class="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  + Abonar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- MODAL DETALLE COMPROBANTE -->
  <div *ngIf="comprobanteSeleccionado"
       class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
      <div class="p-6 border-b flex justify-between items-start">
        <div>
          <p class="text-xs text-gray-400 mb-1">Comprobante de venta</p>
          <h3 class="text-2xl font-bold text-gray-800 font-mono">{{ comprobanteSeleccionado.numero_formato }}</h3>
          <span [ngClass]="comprobanteSeleccionado.codigo_sunat === '01' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                class="px-2.5 py-1 rounded-full text-xs font-medium mt-1 inline-block">
            {{ comprobanteSeleccionado.tipo }}
          </span>
        </div>
        <button (click)="comprobanteSeleccionado = null" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div class="p-6 border-b grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Cliente</p>
          <p class="font-semibold text-gray-800">{{ comprobanteSeleccionado.cliente }}</p>
          <p class="text-gray-500 font-mono text-xs">{{ comprobanteSeleccionado.cliente_doc }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Fecha</p>
          <p class="font-semibold text-gray-800">{{ comprobanteSeleccionado.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
          <p class="text-gray-500 text-xs">Cajero: {{ comprobanteSeleccionado.cajero }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Método de pago</p>
          <p class="font-semibold text-gray-800">{{ comprobanteSeleccionado.metodo_pago ?? '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Estado SUNAT</p>
          <span [ngClass]="getEstadoSunatClase(comprobanteSeleccionado.estado_sunat)"
                class="px-2 py-1 rounded-full text-xs font-medium">
            {{ comprobanteSeleccionado.estado_sunat }}
          </span>
        </div>
      </div>
      <div class="p-6 border-b">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalle</p>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-gray-500 text-xs">
              <th class="text-left pb-2">Producto</th>
              <th class="text-center pb-2 w-12">Cant.</th>
              <th class="text-right pb-2 w-20">P. Unit.</th>
              <th class="text-right pb-2 w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of comprobanteSeleccionado.detalles" class="border-b border-gray-50">
              <td class="py-2 font-medium text-gray-800">{{ d.producto }}</td>
              <td class="py-2 text-center text-gray-600">{{ d.cantidad }}</td>
              <td class="py-2 text-right text-gray-600">S/ {{ d.precio_unitario | number:'1.2-2' }}</td>
              <td class="py-2 text-right font-semibold text-gray-800">S/ {{ d.total | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-6 space-y-1">
        <div class="flex justify-between text-sm text-gray-500">
          <span>Subtotal (sin IGV)</span>
          <span>S/ {{ comprobanteSeleccionado.subtotal | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-500">
          <span>IGV (18%)</span>
          <span>S/ {{ comprobanteSeleccionado.igv | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-lg font-bold text-gray-800 border-t pt-2 mt-2">
          <span>TOTAL</span>
          <span class="text-green-600">S/ {{ comprobanteSeleccionado.total | number:'1.2-2' }}</span>
        </div>
      </div>
      <div class="px-6 pb-6 flex gap-2">
        <button (click)="imprimirPDF(comprobanteSeleccionado)"
                class="flex-1 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
          🖨️ Imprimir
        </button>
        <button (click)="imprimirTicket(comprobanteSeleccionado)"
                class="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors">
          🧾 Ticket térmico
        </button>
        <button (click)="descargarPDF(comprobanteSeleccionado)"
                class="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
          ⬇️ Descargar PDF
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL ABONOS -->
  <div *ngIf="creditoSeleccionado"
       class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">

      <div class="p-5 border-b flex justify-between items-start">
        <div>
          <h3 class="text-lg font-bold">Pedido #{{ creditoSeleccionado.pedido_id }}</h3>
          <p class="text-sm text-gray-500">{{ creditoSeleccionado.cliente }}</p>
        </div>
        <button (click)="creditoSeleccionado = null" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <!-- Resumen deuda -->
      <div class="p-5 grid grid-cols-3 gap-3 border-b">
        <div class="text-center">
          <p class="text-xs text-gray-400">Total</p>
          <p class="font-bold text-gray-800">S/ {{ creditoSeleccionado.total | number:'1.2-2' }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-400">Pagado</p>
          <p class="font-bold text-green-600">S/ {{ creditoSeleccionado.monto_pagado | number:'1.2-2' }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-400">Saldo</p>
          <p class="font-bold text-red-600">S/ {{ creditoSeleccionado.saldo_pendiente | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- Historial abonos -->
      <div class="p-5 border-b">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial de abonos</p>
        <div *ngIf="loadingAbonos" class="text-center text-gray-400 py-4 text-sm">Cargando...</div>
        <div *ngIf="!loadingAbonos && abonos.length === 0" class="text-center text-gray-400 py-4 text-sm">Sin abonos registrados</div>
        <div *ngFor="let a of abonos" class="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
          <div>
            <p class="font-medium text-gray-800">S/ {{ a.monto | number:'1.2-2' }}</p>
            <p class="text-xs text-gray-400">{{ a.metodo_pago }} · {{ a.observacion }}</p>
          </div>
          <p class="text-xs text-gray-400">{{ a.fecha | date:'dd/MM/yy HH:mm' }}</p>
        </div>
      </div>

      <!-- Formulario nuevo abono -->
      <div class="p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registrar abono</p>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Monto</label>
            <input type="number" [(ngModel)]="nuevoAbono.monto"
                   [max]="creditoSeleccionado.saldo_pendiente"
                   min="0.01"
                   class="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Método de pago</label>
            <div class="grid grid-cols-3 gap-2">
              <button *ngFor="let m of metodosPagoAbono"
                      (click)="nuevoAbono.metodo_pago = m.valor"
                      [ngClass]="nuevoAbono.metodo_pago === m.valor
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-500'"
                      class="border-2 rounded-xl p-2 text-center transition-all">
                <p class="text-lg">{{ m.icono }}</p>
                <p class="text-xs font-medium">{{ m.label }}</p>
              </button>
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Observación (opcional)</label>
            <input [(ngModel)]="nuevoAbono.observacion" placeholder="Ej: pago parcial, abono..."
                   class="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"/>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button (click)="creditoSeleccionado = null"
                  class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium">
            Cancelar
          </button>
          <button (click)="confirmarAbono()"
                  [disabled]="procesandoAbono || !nuevoAbono.monto || nuevoAbono.monto <= 0"
                  class="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
            {{ procesandoAbono ? 'Procesando...' : '✓ Registrar abono' }}
          </button>
        </div>
      </div>

    </div>
  </div>

</div>
  `
})
export class ComprobantesComponent implements OnInit {

  comprobantes:            any[] = [];
  creditos:                any[] = [];
  abonos:                  any[] = [];
  comprobanteSeleccionado: any   = null;
  creditoSeleccionado:     any   = null;
  loading                        = true;
  loadingCreditos                = false;
  loadingAbonos                  = false;
  procesandoAbono                = false;
  tabActivo                      = 'comprobantes';

  nuevoAbono = { monto: 0, metodo_pago: 'efectivo', observacion: '' };

  metodosPagoAbono = [
    { valor: 'efectivo', icono: '💵', label: 'Efectivo' },
    { valor: 'yape',     icono: '📱', label: 'Yape/Plin' },
    { valor: 'tarjeta',  icono: '💳', label: 'Tarjeta' }
  ];

  filtros = { desde: '', hasta: '', tipo: '', buscar: '' };

  constructor(
    private ventasService:  VentasService,
    private pdfService:     PdfService,
    private pedidosService: PedidosService,
    private cd:             ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarCreditos();
  }

  cambiarTab(tab: string) {
    this.tabActivo = tab;
    if (tab === 'creditos' && this.creditos.length === 0) this.cargarCreditos();
    this.cd.detectChanges();
  }

  cargar() {
    this.loading = true;
    this.ventasService.getComprobantes({
      desde:  this.filtros.desde  || undefined,
      hasta:  this.filtros.hasta  || undefined,
      tipo:   this.filtros.tipo   || undefined,
      buscar: this.filtros.buscar || undefined
    }).subscribe({
      next: (res) => { this.comprobantes = res; this.loading = false; this.cd.detectChanges(); },
      error: ()  => { this.loading = false; this.cd.detectChanges(); }
    });
  }

  cargarCreditos() {
    this.loadingCreditos = true;
    this.pedidosService.getCreditosPendientes().subscribe({
      next: (res: any) => { this.creditos = res; this.loadingCreditos = false; this.cd.detectChanges(); },
      error: ()        => { this.loadingCreditos = false; this.cd.detectChanges(); }
    });
  }

  limpiarFiltros() {
    this.filtros = { desde: '', hasta: '', tipo: '', buscar: '' };
    this.cargar();
  }

  verDetalle(c: any) { this.comprobanteSeleccionado = c; this.cd.detectChanges(); }

  verAbonos(cr: any) {
    this.creditoSeleccionado = cr;
    this.nuevoAbono = { monto: cr.saldo_pendiente, metodo_pago: 'efectivo', observacion: '' };
    this.abonos = [];
    this.loadingAbonos = true;
    this.cd.detectChanges();

    this.pedidosService.getAbonos(cr.pedido_id).subscribe({
      next: (res: any) => {
        this.abonos = res.abonos ?? [];
        this.loadingAbonos = false;
        this.cd.detectChanges();
      },
      error: () => { this.loadingAbonos = false; this.cd.detectChanges(); }
    });
  }

  abrirModalAbono(cr: any) { this.verAbonos(cr); }

  confirmarAbono() {
    if (!this.creditoSeleccionado || !this.nuevoAbono.monto) return;
    this.procesandoAbono = true;

    this.pedidosService.abonar(
      this.creditoSeleccionado.pedido_id,
      this.nuevoAbono.monto,
      this.nuevoAbono.metodo_pago,
      this.nuevoAbono.observacion
    ).subscribe({
      next: (res: any) => {
        this.procesandoAbono = false;
        this.creditoSeleccionado = null;
        this.cd.detectChanges();
        Swal.fire({
          icon:  'success',
          title: res.pagado_completo ? '¡Deuda cancelada!' : '¡Abono registrado!',
          html:  res.pagado_completo
            ? 'El cliente ha pagado la deuda completa'
            : `Saldo restante: <b>S/ ${res.saldo_pendiente?.toFixed(2)}</b>`,
          timer: 2500, showConfirmButton: false
        });
        this.cargarCreditos();
      },
      error: (err) => {
        this.procesandoAbono = false;
        Swal.fire('Error', err?.error?.mensaje || err?.error || 'No se pudo registrar', 'error');
        this.cd.detectChanges();
      }
    });
  }

  contarTipo(codigo: string): number {
    return this.comprobantes.filter(c => c.codigo_sunat === codigo).length;
  }

  totalGeneral(): number {
    return this.comprobantes.reduce((sum, c) => sum + c.total, 0);
  }

  totalSaldoPendiente(): number {
    return this.creditos.reduce((sum, c) => sum + c.saldo_pendiente, 0);
  }

  totalCobradoCreditos(): number {
    return this.creditos.reduce((sum, c) => sum + c.monto_pagado, 0);
  }

  async descargarPDF(c: any)   { await this.pdfService.descargar(c); }
  async imprimirPDF(c: any)    { await this.pdfService.imprimir(c); }
  async imprimirTicket(c: any) { await this.pdfService.imprimirTicket(c); }

  getEstadoSunatClase(estado: string): string {
    const clases: Record<string, string> = {
      'ACEPTADO':   'bg-green-100 text-green-700',
      'RECHAZADO':  'bg-red-100 text-red-600',
      'ANULADO':    'bg-gray-100 text-gray-600',
      'SIN_ENVIAR': 'bg-yellow-100 text-yellow-700',
      'PENDIENTE':  'bg-blue-100 text-blue-600'
    };
    return clases[estado] ?? 'bg-gray-100 text-gray-500';
  }
}