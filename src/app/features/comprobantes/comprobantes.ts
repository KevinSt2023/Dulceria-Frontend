import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas';
import { PdfService } from '../../core/services/pdf';
import { PedidosService } from '../../core/services/pedidos';
import { ComprobantesNubefactService } from '../../core/services/comprobantes_nubefact';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
        {{ tabActivo === 'comprobantes'
            ? totalRegistros + ' registros'
            : creditos.length + ' créditos pendientes' }}
      </p>
    </div>
    <button (click)="tabActivo === 'comprobantes' ? cargar() : cargarCreditos()"
            class="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm text-gray-600 transition-colors">
      🔄 Refrescar
    </button>
  </div>

  <!-- TABS -->
  <div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
    <button (click)="cambiarTab('comprobantes')"
            [ngClass]="tabActivo === 'comprobantes' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-2 rounded-lg text-sm transition-all">
      📄 Comprobantes
    </button>
    <button (click)="cambiarTab('creditos')"
            [ngClass]="tabActivo === 'creditos' ? 'bg-white text-orange-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
      💳 Créditos pendientes
      <span *ngIf="creditos.length > 0" class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
        {{ creditos.length }}
      </span>
    </button>
  </div>

  <!-- ══ TAB COMPROBANTES ══ -->
  <div *ngIf="tabActivo === 'comprobantes'">

    <!-- FILTROS -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-3">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Desde</label>
        <input type="date" [(ngModel)]="filtros.desde" class="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Hasta</label>
        <input type="date" [(ngModel)]="filtros.hasta" class="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Tipo</label>
        <select [(ngModel)]="filtros.tipo" class="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400">
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
        <button (click)="buscar()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">Buscar</button>
        <button (click)="limpiarFiltros()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">Limpiar</button>
      </div>
    </div>

    <!-- RESUMEN -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ totalRegistros }}</p>
        <p class="text-xs text-gray-500 mt-1">Total</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-green-600">{{ totalBoletas }}</p>
        <p class="text-xs text-gray-500 mt-1">Boletas</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-purple-600">{{ totalFacturas }}</p>
        <p class="text-xs text-gray-500 mt-1">Facturas</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-xl font-bold text-gray-800">S/ {{ montoTotal | number:'1.2-2' }}</p>
        <p class="text-xs text-gray-500 mt-1">Monto total</p>
      </div>
    </div>

    <div *ngIf="loading" class="text-center text-gray-400 py-10">Cargando comprobantes...</div>

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
              <p *ngIf="c.referencia_pago" class="text-xs text-purple-600 font-mono mt-0.5">#{{ c.referencia_pago }}</p>
            </td>
            <td class="p-3 text-right">
              <p class="font-bold text-gray-800">S/ {{ c.total | number:'1.2-2' }}</p>
              <p class="text-xs text-gray-400">IGV: S/ {{ c.igv | number:'1.2-2' }}</p>
            </td>
            <td class="p-3 text-center hidden md:table-cell">
              <span class="px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1"
                    [ngClass]="getEstadoBadgeClass(c.estado_sunat)">
                {{ getEstadoIcono(c.estado_sunat) }}
                {{ c.estado_sunat }}
              </span>
              <p *ngIf="c.motivo_rechazo" class="text-xs text-red-500 mt-1 truncate max-w-[160px] mx-auto" [title]="c.motivo_rechazo">
                {{ c.motivo_rechazo }}
              </p>
            </td>
            <td class="p-3 text-center hidden md:table-cell">
              <p class="text-xs text-gray-600">{{ c.fecha | date:'dd/MM/yyyy':'UTC' }}</p>
              <p class="text-xs text-gray-400">{{ c.fecha | date:'HH:mm':'UTC' }}</p>
            </td>
            <td class="p-3">
              <div class="flex justify-center gap-1 flex-wrap">
                <!-- Ver detalle -->
                <button (click)="verDetalle(c)" title="Ver detalle"
                        class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Ver
                </button>

                <!-- PDF Nubefact (si está aceptado) -->
                <button *ngIf="c.estado_sunat === 'ACEPTADO' && c.nubefact_enlace_pdf"
                        (click)="verPDFNubefact(c)" title="PDF SUNAT (Nubefact)"
                        class="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  📄
                </button>

                <!-- XML Nubefact -->
                <button *ngIf="c.estado_sunat === 'ACEPTADO' && c.nubefact_enlace_xml"
                        (click)="descargarXMLNubefact(c)" title="Descargar XML"
                        class="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  📦
                </button>

                <!-- Reenviar a SUNAT (si falló o sin enviar) -->
                <button *ngIf="['RECHAZADO','ERROR','SIN_ENVIAR'].includes(c.estado_sunat)"
                        (click)="reenviarComprobante(c)" title="Reenviar a SUNAT"
                        class="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🔄
                </button>

                <!-- Consultar estado (si está enviando) -->
                <button *ngIf="c.estado_sunat === 'ENVIANDO'"
                        (click)="consultarEstado(c)" title="Consultar estado SUNAT"
                        class="bg-cyan-500 hover:bg-cyan-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🔍
                </button>

                <!-- Anular (solo aceptadas) -->
                <button *ngIf="c.estado_sunat === 'ACEPTADO'"
                        (click)="anularComprobante(c)" title="Anular"
                        class="bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🚫
                </button>

                <!-- PDF interno -->
                <button (click)="imprimirPDF(c)" title="Imprimir PDF interno"
                        class="bg-slate-500 hover:bg-slate-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🖨️
                </button>

                <!-- Ticket térmico -->
                <button (click)="imprimirTicket(c)" title="Ticket térmico"
                        class="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  🧾
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINACIÓN -->
    <div *ngIf="totalPaginas > 1" class="flex items-center justify-between mt-4 px-1">
      <p class="text-xs text-gray-400">
        Mostrando {{ (paginaActual - 1) * 10 + 1 }}–{{ min(paginaActual * 10, totalRegistros) }}
        de {{ totalRegistros }} registros
      </p>
      <div class="flex items-center gap-1">
        <button (click)="irPagina(1)" [disabled]="paginaActual === 1"
                class="px-2 py-1 rounded-lg text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors">«</button>
        <button (click)="irPagina(paginaActual - 1)" [disabled]="paginaActual === 1"
                class="px-2 py-1 rounded-lg text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors">‹</button>
        <span *ngFor="let p of getPaginas()"
              (click)="irPagina(p)"
              [ngClass]="p === paginaActual ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer'"
              class="px-3 py-1 rounded-lg text-xs font-medium transition-colors select-none">
          {{ p }}
        </span>
        <button (click)="irPagina(paginaActual + 1)" [disabled]="paginaActual === totalPaginas"
                class="px-2 py-1 rounded-lg text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors">›</button>
        <button (click)="irPagina(totalPaginas)" [disabled]="paginaActual === totalPaginas"
                class="px-2 py-1 rounded-lg text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors">»</button>
      </div>
    </div>
  </div>

  <!-- ══ TAB CRÉDITOS PENDIENTES ══ -->
  <div *ngIf="tabActivo === 'creditos'">

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-orange-600">{{ creditos.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Créditos pendientes</p>
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

    <div *ngIf="loadingCreditos" class="text-center text-gray-400 py-10">Cargando créditos...</div>

    <div *ngIf="!loadingCreditos" class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Referencia</th>
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
              <p class="text-3xl mb-2">✅</p>No hay créditos pendientes
            </td>
          </tr>
          <tr *ngFor="let cr of creditos" class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="p-3">
              <p class="font-bold text-gray-800 text-sm font-mono">
                {{ cr.origen === 'POS' ? (cr.comprobante || '—') : '#' + cr.pedido_id }}
              </p>
              <div class="flex items-center gap-1 mt-0.5">
                <span *ngIf="cr.origen === 'POS'"
                      class="bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full text-xs font-medium">POS</span>
                <span *ngIf="cr.origen === 'PEDIDO'"
                      class="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs font-medium">Pedido</span>
                <span class="text-xs text-gray-400">{{ cr.metodo_pago ?? '—' }}</span>
              </div>
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
              <p class="text-xs text-gray-600">{{ cr.fecha | date:'dd/MM/yyyy':'UTC' }}</p>
              <p class="text-xs text-gray-400">{{ cr.fecha | date:'HH:mm':'UTC' }}</p>
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
  <div *ngIf="comprobanteSeleccionado" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
          <p class="font-semibold text-gray-800">{{ comprobanteSeleccionado.fecha | date:'dd/MM/yyyy HH:mm':'UTC' }}</p>
          <p class="text-gray-500 text-xs">Cajero: {{ comprobanteSeleccionado.cajero }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Método de pago</p>
          <p class="font-semibold text-gray-800">{{ comprobanteSeleccionado.metodo_pago ?? '—' }}</p>
          <p *ngIf="comprobanteSeleccionado.referencia_pago" class="text-xs text-purple-600 font-mono mt-0.5">
            N° operación: #{{ comprobanteSeleccionado.referencia_pago }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Estado SUNAT</p>
          <span class="px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1"
                [ngClass]="getEstadoBadgeClass(comprobanteSeleccionado.estado_sunat)">
            {{ getEstadoIcono(comprobanteSeleccionado.estado_sunat) }}
            {{ comprobanteSeleccionado.estado_sunat }}
          </span>
          <p *ngIf="comprobanteSeleccionado.motivo_rechazo" class="text-xs text-red-500 mt-1">
            {{ comprobanteSeleccionado.motivo_rechazo }}
          </p>
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
          <span>Subtotal (sin IGV)</span><span>S/ {{ comprobanteSeleccionado.subtotal | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-500">
          <span>IGV (18%)</span><span>S/ {{ comprobanteSeleccionado.igv | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-lg font-bold text-gray-800 border-t pt-2 mt-2">
          <span>TOTAL</span><span class="text-green-600">S/ {{ comprobanteSeleccionado.total | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Acciones Nubefact en el modal -->
      <div class="px-6 pb-3 flex gap-2 flex-wrap">
        <button *ngIf="comprobanteSeleccionado.estado_sunat === 'ACEPTADO' && comprobanteSeleccionado.nubefact_enlace_pdf"
                (click)="verPDFNubefact(comprobanteSeleccionado)"
                class="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors">
          📄 PDF SUNAT
        </button>
        <button *ngIf="comprobanteSeleccionado.estado_sunat === 'ACEPTADO' && comprobanteSeleccionado.nubefact_enlace_xml"
                (click)="descargarXMLNubefact(comprobanteSeleccionado)"
                class="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors">
          📦 XML
        </button>
        <button *ngIf="['RECHAZADO','ERROR','SIN_ENVIAR'].includes(comprobanteSeleccionado.estado_sunat)"
                (click)="reenviarComprobante(comprobanteSeleccionado)"
                class="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors">
          🔄 Reenviar a SUNAT
        </button>
        <button *ngIf="comprobanteSeleccionado.estado_sunat === 'ENVIANDO'"
                (click)="consultarEstado(comprobanteSeleccionado)"
                class="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-medium transition-colors">
          🔍 Consultar estado
        </button>
        <button *ngIf="comprobanteSeleccionado.estado_sunat === 'ACEPTADO'"
                (click)="anularComprobante(comprobanteSeleccionado)"
                class="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
          🚫 Anular
        </button>
      </div>

      <div class="px-6 pb-6 flex gap-2">
        <button (click)="imprimirPDF(comprobanteSeleccionado)" class="flex-1 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">🖨️ Imprimir</button>
        <button (click)="imprimirTicket(comprobanteSeleccionado)" class="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors">🧾 Ticket térmico</button>
        <button (click)="descargarPDF(comprobanteSeleccionado)" class="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">⬇️ Descargar PDF</button>
      </div>
    </div>
  </div>

  <!-- MODAL ABONOS — funciona para PEDIDO y POS -->
  <div *ngIf="creditoSeleccionado" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">

      <!-- Cabecera -->
      <div class="p-5 border-b flex justify-between items-start">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span *ngIf="creditoSeleccionado.origen === 'POS'"
                  class="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">POS</span>
            <span *ngIf="creditoSeleccionado.origen === 'PEDIDO'"
                  class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">Pedido</span>
          </div>
          <h3 class="text-lg font-bold">
            {{ creditoSeleccionado.origen === 'POS'
               ? (creditoSeleccionado.comprobante || 'Venta POS')
               : 'Pedido #' + creditoSeleccionado.pedido_id }}
          </h3>
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

      <!-- Historial abonos — solo PEDIDO -->
      <div *ngIf="creditoSeleccionado.origen === 'PEDIDO'" class="p-5 border-b">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial de abonos</p>
        <div *ngIf="loadingAbonos" class="text-center text-gray-400 py-4 text-sm">Cargando...</div>
        <div *ngIf="!loadingAbonos && abonos.length === 0" class="text-center text-gray-400 py-4 text-sm">Sin abonos registrados</div>
        <div *ngFor="let a of abonos" class="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
          <div>
            <p class="font-medium text-gray-800">S/ {{ a.monto | number:'1.2-2' }}</p>
            <p class="text-xs text-gray-400">{{ a.metodo_pago }} · {{ a.observacion }}</p>
          </div>
          <p class="text-xs text-gray-400">{{ a.fecha | date:'dd/MM/yy HH:mm':'UTC' }}</p>
        </div>
      </div>

      <!-- Formulario registrar abono — funciona para AMBOS -->
      <div class="p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registrar abono</p>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Monto</label>
            <input type="number" [(ngModel)]="nuevoAbono.monto"
                   [max]="creditoSeleccionado.saldo_pendiente" min="0.01"
                   class="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Método de pago</label>
            <div class="grid grid-cols-3 gap-2">
              <button *ngFor="let m of metodosPagoAbono" (click)="nuevoAbono.metodo_pago = m.valor"
                      [ngClass]="nuevoAbono.metodo_pago === m.valor ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'"
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
                  class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium">Cancelar</button>
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

  paginaActual   = 1;
  totalPaginas   = 1;
  totalRegistros = 0;
  totalBoletas   = 0;
  totalFacturas  = 0;
  montoTotal     = 0;

  nuevoAbono = { monto: 0, metodo_pago: 'efectivo', observacion: '' };

  metodosPagoAbono = [
    { valor: 'efectivo', icono: '💵', label: 'Efectivo' },
    { valor: 'yape',     icono: '📱', label: 'Yape/Plin' },
    { valor: 'tarjeta',  icono: '💳', label: 'Tarjeta' }
  ];

  filtros = { desde: '', hasta: '', tipo: '', buscar: '' };

  private destroyRef = inject(DestroyRef);

  constructor(
    private ventasService:  VentasService,
    private pdfService:     PdfService,
    private pedidosService: PedidosService,
    private nubefactSvc:    ComprobantesNubefactService,
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
      buscar: this.filtros.buscar || undefined,
      pagina: this.paginaActual
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.comprobantes   = res.data;
        this.totalRegistros = res.total;
        this.totalPaginas   = res.total_paginas;
        this.totalBoletas   = res.total_boletas;
        this.totalFacturas  = res.total_facturas;
        this.montoTotal     = res.monto_total;
        this.loading        = false;
        this.cd.detectChanges();
      },
      error: () => { this.loading = false; this.cd.detectChanges(); }
    });
  }

  buscar() { this.paginaActual = 1; this.cargar(); }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
    this.cargar();
  }

  getPaginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin    = Math.min(this.totalPaginas, inicio + 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  limpiarFiltros() {
    this.filtros      = { desde: '', hasta: '', tipo: '', buscar: '' };
    this.paginaActual = 1;
    this.cargar();
  }

  cargarCreditos() {
    this.loadingCreditos = true;
    this.pedidosService.getCreditosPendientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => { this.creditos = res; this.loadingCreditos = false; this.cd.detectChanges(); },
      error: ()        => { this.loadingCreditos = false; this.cd.detectChanges(); }
    });
  }

  verDetalle(c: any) { this.comprobanteSeleccionado = c; this.cd.detectChanges(); }

  verAbonos(cr: any) {
    this.creditoSeleccionado = cr;
    this.nuevoAbono = { monto: cr.saldo_pendiente, metodo_pago: 'efectivo', observacion: '' };
    this.abonos        = [];
    this.loadingAbonos = false;

    if (cr.origen === 'PEDIDO' && cr.pedido_id) {
      this.loadingAbonos = true;
      this.cd.detectChanges();
      this.pedidosService.getAbonos(cr.pedido_id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res: any) => { this.abonos = res.abonos ?? []; this.loadingAbonos = false; this.cd.detectChanges(); },
        error: ()        => { this.loadingAbonos = false; this.cd.detectChanges(); }
      });
    } else {
      this.cd.detectChanges();
    }
  }

  abrirModalAbono(cr: any) { this.verAbonos(cr); }

  confirmarAbono() {
    if (!this.creditoSeleccionado || !this.nuevoAbono.monto) return;
    this.procesandoAbono = true;

    const obs$ = this.creditoSeleccionado.origen === 'POS'
      ? this.ventasService.abonarVenta(
          this.creditoSeleccionado.venta_id,
          { monto: this.nuevoAbono.monto, metodo_pago: this.nuevoAbono.metodo_pago, observacion: this.nuevoAbono.observacion }
        )
      : this.pedidosService.abonar(
          this.creditoSeleccionado.pedido_id,
          this.nuevoAbono.monto,
          this.nuevoAbono.metodo_pago,
          this.nuevoAbono.observacion
        );

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.procesandoAbono     = false;
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

  totalSaldoPendiente():  number { return this.creditos.reduce((sum, c) => sum + (c.saldo_pendiente ?? 0), 0); }
  totalCobradoCreditos(): number { return this.creditos.reduce((sum, c) => sum + (c.monto_pagado ?? 0), 0); }

  async descargarPDF(c: any)   { await this.pdfService.descargar(c); }
  async imprimirPDF(c: any)    { await this.pdfService.imprimir(c); }
  async imprimirTicket(c: any) { await this.pdfService.imprimirTicket(c); }

  // ═══════════════════════════════════════════════════════════════
  // BADGES Y ESTADO SUNAT
  // ═══════════════════════════════════════════════════════════════
  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'ACEPTADO':   return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'RECHAZADO':  return 'bg-red-100 text-red-700 border-red-200';
      case 'ENVIANDO':   return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ERROR':      return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ANULADO':    return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'SIN_ENVIAR': return 'bg-slate-50 text-slate-500 border-slate-200';
      default:           return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }

  getEstadoIcono(estado: string): string {
    switch (estado) {
      case 'ACEPTADO':   return '✅';
      case 'RECHAZADO':  return '❌';
      case 'ENVIANDO':   return '🔄';
      case 'ERROR':      return '⚠️';
      case 'ANULADO':    return '🚫';
      case 'SIN_ENVIAR': return '📤';
      default:           return '❓';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES NUBEFACT
  // ═══════════════════════════════════════════════════════════════
  reenviarComprobante(comprobante: any) {
    Swal.fire({
      title: '¿Reenviar a SUNAT?',
      text: `Comprobante ${comprobante.numero_formato} se enviará nuevamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reenviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0ea5e9'
    }).then(r => {
      if (!r.isConfirmed) return;

      Swal.fire({
        title: 'Enviando a Nubefact...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null)
      });

      this.nubefactSvc.reenviar(comprobante.comprobante_id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res.exitoso) {
              Swal.fire({
                icon: 'success',
                title: '✅ Aceptado por SUNAT',
                html: `
                  <p>${res.mensaje || 'Comprobante aceptado'}</p>
                  ${res.enlace_pdf ? `<br><a href="${res.enlace_pdf}" target="_blank" style="color:#2563eb;text-decoration:underline">Ver PDF</a>` : ''}
                `,
                confirmButtonColor: '#10b981'
              }).then(() => {
                this.comprobanteSeleccionado = null;
                this.cargar();
              });
            } else {
              Swal.fire('Error', res.mensaje || 'No se pudo enviar', 'error');
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.mensaje || 'Error al reenviar', 'error');
          }
        });
    });
  }

  consultarEstado(comprobante: any) {
    Swal.fire({
      title: 'Consultando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    this.nubefactSvc.consultar(comprobante.comprobante_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: res.exitoso ? 'success' : 'info',
            title: `Estado: ${res.estado}`,
            text: res.mensaje || 'Consultado correctamente'
          }).then(() => this.cargar());
        },
        error: () => Swal.fire('Error', 'No se pudo consultar', 'error')
      });
  }

  verPDFNubefact(comprobante: any) {
    if (!comprobante.nubefact_enlace_pdf) {
      Swal.fire('No disponible', 'Este comprobante aún no tiene PDF generado por Nubefact', 'info');
      return;
    }
    window.open(comprobante.nubefact_enlace_pdf, '_blank');
  }

  descargarXMLNubefact(comprobante: any) {
    if (!comprobante.nubefact_enlace_xml) {
      Swal.fire('No disponible', 'Este comprobante aún no tiene XML generado', 'info');
      return;
    }
    window.open(comprobante.nubefact_enlace_xml, '_blank');
  }

  anularComprobante(comprobante: any) {
    if (comprobante.estado_sunat !== 'ACEPTADO') {
      Swal.fire('No permitido', 'Solo se pueden anular comprobantes ACEPTADOS por SUNAT', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Anular comprobante?',
      html: `
        <p style="margin-bottom:12px">Se enviará una comunicación de baja a SUNAT.</p>
        <p style="font-size:13px;color:#64748b">Esta acción no se puede deshacer.</p>
      `,
      input: 'text',
      inputLabel: 'Motivo de anulación',
      inputPlaceholder: 'Ej: Error en datos del cliente',
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) return 'Debe indicar un motivo (mínimo 5 caracteres)';
        return null;
      },
      showCancelButton: true,
      confirmButtonText: '🚫 Anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (!r.isConfirmed || !r.value) return;

      Swal.fire({
        title: 'Anulando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null)
      });

      this.nubefactSvc.anular(comprobante.comprobante_id, r.value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res.exitoso) {
              Swal.fire('✅ Anulado', res.mensaje || 'Comprobante anulado en SUNAT', 'success')
                .then(() => {
                  this.comprobanteSeleccionado = null;
                  this.cargar();
                });
            } else {
              Swal.fire('Error', res.mensaje || 'No se pudo anular', 'error');
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.mensaje || 'Error al anular', 'error');
          }
        });
    });
  }
}