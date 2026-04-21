import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas';
import { PdfService } from '../../core/services/pdf';
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
        {{ comprobantes.length }} registros
      </p>
    </div>
    <button (click)="cargar()"
            class="bg-slate-100 hover:bg-slate-200 px-4 py-2
                   rounded-lg text-sm text-gray-600 transition-colors">
      🔄 Refrescar
    </button>
  </div>

  <!-- FILTROS -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-100
              p-4 mb-5 flex flex-wrap gap-3">

    <div>
      <label class="text-xs text-gray-500 block mb-1">Desde</label>
      <input type="date" [(ngModel)]="filtros.desde"
             class="p-2 border rounded-lg text-sm outline-none
                    focus:ring-2 focus:ring-blue-400"/>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Hasta</label>
      <input type="date" [(ngModel)]="filtros.hasta"
             class="p-2 border rounded-lg text-sm outline-none
                    focus:ring-2 focus:ring-blue-400"/>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Tipo</label>
      <select [(ngModel)]="filtros.tipo"
              class="p-2 border rounded-lg text-sm outline-none
                     focus:ring-2 focus:ring-blue-400">
        <option value="">Todos</option>
        <option value="03">Boleta</option>
        <option value="01">Factura</option>
      </select>
    </div>

    <div class="flex-1 min-w-[180px]">
      <label class="text-xs text-gray-500 block mb-1">
        Buscar cliente
      </label>
      <input [(ngModel)]="filtros.buscar"
             placeholder="Nombre o documento..."
             class="w-full p-2 border rounded-lg text-sm outline-none
                    focus:ring-2 focus:ring-blue-400"/>
    </div>

    <div class="flex items-end gap-2">
      <button (click)="cargar()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     rounded-lg text-sm transition-colors">
        Buscar
      </button>
      <button (click)="limpiarFiltros()"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600
                     rounded-lg text-sm transition-colors">
        Limpiar
      </button>
    </div>

  </div>

  <!-- RESUMEN -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100
                p-3 text-center">
      <p class="text-2xl font-bold text-blue-600">
        {{ comprobantes.length }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Total</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100
                p-3 text-center">
      <p class="text-2xl font-bold text-green-600">
        {{ contarTipo('03') }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Boletas</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100
                p-3 text-center">
      <p class="text-2xl font-bold text-purple-600">
        {{ contarTipo('01') }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Facturas</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100
                p-3 text-center">
      <p class="text-xl font-bold text-gray-800">
        S/ {{ totalGeneral() | number:'1.2-2' }}
      </p>
      <p class="text-xs text-gray-500 mt-1">Monto total</p>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando comprobantes...
  </div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto">
    <table class="min-w-full bg-white rounded-xl shadow-sm
                  border border-gray-100">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Comprobante</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Tipo</th>
          <th class="p-3 text-left text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Cliente</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide hidden md:table-cell">
            Método
          </th>
          <th class="p-3 text-right text-xs font-semibold text-gray-500
                     uppercase tracking-wide">Total</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide hidden md:table-cell">
            Estado SUNAT
          </th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide hidden md:table-cell">
            Fecha
          </th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500
                     uppercase tracking-wide">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="comprobantes.length === 0">
          <td colspan="8"
              class="p-8 text-center text-gray-400 text-sm">
            No hay comprobantes registrados
          </td>
        </tr>
        <tr *ngFor="let c of comprobantes"
            class="border-t border-gray-50 hover:bg-gray-50
                   transition-colors">

          <!-- Número -->
          <td class="p-3">
            <p class="font-bold text-gray-800 font-mono text-sm">
              {{ c.numero_formato }}
            </p>
            <p class="text-xs text-gray-400">
              Cajero: {{ c.cajero }}
            </p>
          </td>

          <!-- Tipo -->
          <td class="p-3 text-center">
            <span [ngClass]="c.codigo_sunat === '01'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'"
                  class="px-2.5 py-1 rounded-full text-xs font-medium">
              {{ c.codigo_sunat === '01' ? '🧾 Factura' : '📄 Boleta' }}
            </span>
          </td>

          <!-- Cliente -->
          <td class="p-3">
            <p class="text-sm font-medium text-gray-800">{{ c.cliente }}</p>
            <p class="text-xs text-gray-400 font-mono">{{ c.cliente_doc }}</p>
          </td>

          <!-- Método pago -->
          <td class="p-3 text-center hidden md:table-cell">
            <span class="text-xs text-gray-600">
              {{ c.metodo_pago ?? '—' }}
            </span>
          </td>

          <!-- Total -->
          <td class="p-3 text-right">
            <p class="font-bold text-gray-800">
              S/ {{ c.total | number:'1.2-2' }}
            </p>
            <p class="text-xs text-gray-400">
              IGV: S/ {{ c.igv | number:'1.2-2' }}
            </p>
          </td>

          <!-- Estado SUNAT -->
          <td class="p-3 text-center hidden md:table-cell">
            <span [ngClass]="getEstadoSunatClase(c.estado_sunat)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ c.estado_sunat }}
            </span>
          </td>

          <!-- Fecha -->
          <td class="p-3 text-center hidden md:table-cell">
            <p class="text-xs text-gray-600">
              {{ c.fecha | date:'dd/MM/yyyy' }}
            </p>
            <p class="text-xs text-gray-400">
              {{ c.fecha | date:'HH:mm' }}
            </p>
          </td>

          <td class="p-3 text-center">
            <div class="flex justify-center gap-1">
                <button (click)="verDetalle(c)"
                        class="bg-blue-500 hover:bg-blue-600 text-white
                            px-2.5 py-1.5 rounded-lg text-xs font-medium
                            transition-colors">
                Ver
                </button>
                <button (click)="imprimirPDF(c)"
                        class="bg-slate-500 hover:bg-slate-600 text-white
                            px-2.5 py-1.5 rounded-lg text-xs font-medium
                            transition-colors">
                🖨️
                </button>
                <button (click)="descargarPDF(c)"
                        class="bg-green-500 hover:bg-green-600 text-white
                            px-2.5 py-1.5 rounded-lg text-xs font-medium
                            transition-colors">
                ⬇️
                </button>
            </div>
            </td>          
        </tr>
      </tbody>
    </table>
  </div>

  <!-- MODAL DETALLE -->
  <div *ngIf="comprobanteSeleccionado"
       class="fixed inset-0 bg-black/50 flex items-center
              justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg
                max-h-screen overflow-y-auto">

      <!-- Cabecera -->
      <div class="p-6 border-b flex justify-between items-start">
        <div>
          <p class="text-xs text-gray-400 mb-1">Comprobante de venta</p>
          <h3 class="text-2xl font-bold text-gray-800 font-mono">
            {{ comprobanteSeleccionado.numero_formato }}
          </h3>
          <span [ngClass]="comprobanteSeleccionado.codigo_sunat === '01'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'"
                class="px-2.5 py-1 rounded-full text-xs font-medium mt-1
                       inline-block">
            {{ comprobanteSeleccionado.tipo }}
          </span>
        </div>
        <button (click)="comprobanteSeleccionado = null"
                class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <!-- Info cliente y fecha -->
      <div class="p-6 border-b grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Cliente</p>
          <p class="font-semibold text-gray-800">
            {{ comprobanteSeleccionado.cliente }}
          </p>
          <p class="text-gray-500 font-mono text-xs">
            {{ comprobanteSeleccionado.cliente_doc }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Fecha</p>
          <p class="font-semibold text-gray-800">
            {{ comprobanteSeleccionado.fecha | date:'dd/MM/yyyy HH:mm' }}
          </p>
          <p class="text-gray-500 text-xs">
            Cajero: {{ comprobanteSeleccionado.cajero }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Método de pago</p>
          <p class="font-semibold text-gray-800">
            {{ comprobanteSeleccionado.metodo_pago ?? '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Estado SUNAT</p>
          <span [ngClass]="getEstadoSunatClase(
                              comprobanteSeleccionado.estado_sunat)"
                class="px-2 py-1 rounded-full text-xs font-medium">
            {{ comprobanteSeleccionado.estado_sunat }}
          </span>
        </div>
      </div>

      <!-- Detalle de productos -->
      <div class="p-6 border-b">
        <p class="text-xs font-semibold text-gray-500 uppercase
                  tracking-wide mb-3">
          Detalle
        </p>
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
            <tr *ngFor="let d of comprobanteSeleccionado.detalles"
                class="border-b border-gray-50">
              <td class="py-2 font-medium text-gray-800">
                {{ d.producto }}
              </td>
              <td class="py-2 text-center text-gray-600">
                {{ d.cantidad }}
              </td>
              <td class="py-2 text-right text-gray-600">
                S/ {{ d.precio_unitario | number:'1.2-2' }}
              </td>
              <td class="py-2 text-right font-semibold text-gray-800">
                S/ {{ d.total | number:'1.2-2' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totales -->
      <div class="p-6 space-y-1">
        <div class="flex justify-between text-sm text-gray-500">
          <span>Subtotal (sin IGV)</span>
          <span>S/ {{ comprobanteSeleccionado.subtotal | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-500">
          <span>IGV (18%)</span>
          <span>S/ {{ comprobanteSeleccionado.igv | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-lg font-bold text-gray-800
                    border-t pt-2 mt-2">
          <span>TOTAL</span>
          <span class="text-green-600">
            S/ {{ comprobanteSeleccionado.total | number:'1.2-2' }}
          </span>
        </div>
      </div>
      <!-- Botones PDF en el modal -->
        <div class="px-6 pb-6 flex gap-2">
        <button (click)="imprimirPDF(comprobanteSeleccionado)"
                class="flex-1 py-2.5 bg-slate-600 hover:bg-slate-700
                        text-white rounded-xl text-sm font-medium
                        transition-colors">
            🖨️ Imprimir
        </button>
        <button (click)="descargarPDF(comprobanteSeleccionado)"
                class="flex-1 py-2.5 bg-green-600 hover:bg-green-700
                        text-white rounded-xl text-sm font-medium
                        transition-colors">
            ⬇️ Descargar PDF
        </button>
        </div>
    </div>
  </div>

</div>
  `
})
export class ComprobantesComponent implements OnInit {

  comprobantes:           any[] = [];
  comprobanteSeleccionado: any  = null;
  loading                       = true;

  filtros = {
    desde:  '',
    hasta:  '',
    tipo:   '',
    buscar: ''
  };

  constructor(
    private ventasService: VentasService,
    private pdfService:    PdfService,
    private cd:            ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.ventasService.getComprobantes({
      desde:  this.filtros.desde  || undefined,
      hasta:  this.filtros.hasta  || undefined,
      tipo:   this.filtros.tipo   || undefined,
      buscar: this.filtros.buscar || undefined
    }).subscribe({
      next: (res) => {
        this.comprobantes = res;
        this.loading      = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  limpiarFiltros() {
    this.filtros = { desde: '', hasta: '', tipo: '', buscar: '' };
    this.cargar();
  }

  verDetalle(c: any) {
    this.comprobanteSeleccionado = c;
    this.cd.detectChanges();
  }

  contarTipo(codigo: string): number {
    return this.comprobantes.filter(c => c.codigo_sunat === codigo).length;
  }

  totalGeneral(): number {
    return this.comprobantes.reduce((sum, c) => sum + c.total, 0);
  }
  async descargarPDF(c: any) {
  await this.pdfService.descargar(c);
}

async imprimirPDF(c: any) {
  await this.pdfService.imprimir(c);
}

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