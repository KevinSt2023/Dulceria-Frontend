import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DistribucionService } from '../../core/services/distribucion';
import { AuthService } from '../../core/auth/auth';
import { ColorService } from '../../core/services/color';
import { ConfiguracionNegocioService } from '../../core/services/configuracion-negocio';
import { ConfiguracionPagoService } from '../../core/services/configuracion-pago';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-distribucion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4">

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-700">Panel de Distribución</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        {{ tabActivo === 'hoy' ? pedidos.length + ' pendientes' : historial.length + ' entregados hoy' }}
      </p>
    </div>
    <button (click)="refrescar()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">Refrescar</button>
  </div>

  <!-- TABS -->
  <div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
    <button (click)="cambiarTab('hoy')"
            [ngClass]="tabActivo === 'hoy' ? 'bg-white text-orange-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
      🛵 En ruta
      <span *ngIf="pedidos.length > 0" class="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{{ pedidos.length }}</span>
    </button>
    <button (click)="cambiarTab('historial')"
            [ngClass]="tabActivo === 'historial' ? 'bg-white text-green-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
      ✅ Historial hoy
      <span *ngIf="historial.length > 0" class="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{{ historial.length }}</span>
    </button>
  </div>

  <!-- TAB EN RUTA -->
  <div *ngIf="tabActivo === 'hoy'">
    <div *ngIf="loading" class="text-center text-gray-400 py-16">Cargando pedidos...</div>
    <div *ngIf="!loading && pedidos.length === 0" class="text-center py-20 text-gray-400">
      <p class="text-5xl mb-4">🛵</p>
      <p class="font-semibold text-lg">Sin pedidos para entregar</p>
      <p class="text-sm mt-1">Todos los pedidos han sido entregados</p>
    </div>
    <div *ngIf="!loading && pedidos.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div *ngFor="let p of pedidos" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div class="px-4 pt-4 pb-3 border-b border-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-gray-800 text-lg">#{{ p.pedido_id }}</span>
                <span [ngClass]="p.estado_pedido_id === 4 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                  {{ p.estado_pedido_id === 4 ? 'LISTO' : 'DESPACHADO' }}
                </span>
              </div>
              <p class="font-semibold text-gray-700">{{ p.cliente }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ p.fecha | date:'dd/MM/yy HH:mm' }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="bg-orange-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">🛵 Delivery</span>
              <span *ngIf="p.pagado" class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Pagado</span>
              <span *ngIf="!p.pagado" class="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">💵 Contra entrega</span>
            </div>
          </div>
        </div>
        <div *ngIf="p.direccion_entrega" class="mx-4 mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
          <span class="text-blue-500 mt-0.5 flex-shrink-0">📍</span>
          <p class="text-xs text-blue-700 leading-relaxed">{{ p.direccion_entrega }}</p>
        </div>
        <div *ngIf="p.observaciones" class="mx-4 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-2">
          <span class="text-yellow-500 flex-shrink-0">📝</span>
          <p class="text-xs text-yellow-700">{{ p.observaciones }}</p>
        </div>
        <div class="px-4 py-3">
          <p class="text-xs text-gray-400 uppercase tracking-wide mb-2">Productos</p>
          <div class="space-y-1">
            <div *ngFor="let d of p.detalles" class="flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">{{ d.cantidad }}</span>
                <span class="text-gray-700">{{ d.producto }}</span>
              </div>
              <span class="text-gray-500 text-xs font-medium">S/ {{ d.subtotal | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="px-4 pb-4 pt-2 border-t border-gray-50">
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm text-gray-500">Total</span>
            <span class="font-bold text-green-600 text-lg">S/ {{ p.total | number:'1.2-2' }}</span>
          </div>
          <button *ngIf="p.estado_pedido_id === 7" (click)="imprimirNotaDespacho(p)"
                  class="w-full mb-2 py-2 rounded-xl text-sm font-medium border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
            📋 Nota de despacho
          </button>
          <button (click)="abrirModalCobro(p)" [disabled]="procesando === p.pedido_id"
                  class="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 active:scale-95"
                  [style]="p.estado_pedido_id === 4 ? 'background: linear-gradient(135deg, #ea580c, #f97316)' : p.pagado ? 'background: linear-gradient(135deg, #065f46, #10b981)' : 'background: linear-gradient(135deg, #0369a1, #0ea5e9)'">
            {{ procesando === p.pedido_id ? 'Procesando...' : p.estado_pedido_id === 4 ? '🛵 Despachar' : p.pagado ? '✓ Confirmar entrega' : '💵 Cobrar y entregar' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB HISTORIAL -->
  <div *ngIf="tabActivo === 'historial'">
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-2xl font-bold text-green-600">{{ historial.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Entregados hoy</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-xl font-bold text-blue-600">S/ {{ totalHistorial() | number:'1.2-2' }}</p>
        <p class="text-xs text-gray-500 mt-1">Total cobrado</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
        <p class="text-xl font-bold text-orange-600">S/ {{ totalCreditosHistorial() | number:'1.2-2' }}</p>
        <p class="text-xs text-gray-500 mt-1">En crédito</p>
      </div>
    </div>
    <div *ngIf="loadingHistorial" class="text-center text-gray-400 py-16">Cargando historial...</div>
    <div *ngIf="!loadingHistorial && historial.length === 0" class="text-center py-20 text-gray-400">
      <p class="text-5xl mb-4">📋</p>
      <p class="font-semibold text-lg">Sin entregas hoy</p>
    </div>
    <div *ngIf="!loadingHistorial && historial.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div *ngFor="let p of historial" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-4 pt-4 pb-3 border-b border-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-gray-800 text-lg">#{{ p.pedido_id }}</span>
                <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✅ ENTREGADO</span>
              </div>
              <p class="font-semibold text-gray-700">{{ p.cliente }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ p.fecha | date:'dd/MM/yy HH:mm' }}</p>
            </div>
            <span *ngIf="p.tipo_pago === 'CREDITO'" class="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">💳 Crédito</span>
            <span *ngIf="p.tipo_pago !== 'CREDITO'" class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Pagado</span>
          </div>
        </div>
        <div *ngIf="p.direccion_entrega" class="mx-4 mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
          <span class="text-blue-500 flex-shrink-0">📍</span>
          <p class="text-xs text-blue-700">{{ p.direccion_entrega }}</p>
        </div>
        <div class="px-4 py-3">
          <div class="space-y-1">
            <div *ngFor="let d of p.detalles" class="flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">{{ d.cantidad }}</span>
                <span class="text-gray-700">{{ d.producto }}</span>
              </div>
              <span class="text-gray-500 text-xs">S/ {{ d.subtotal | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="px-4 pb-4 pt-2 border-t border-gray-50">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-500">Total</span>
            <span class="font-bold text-green-600">S/ {{ p.total | number:'1.2-2' }}</span>
          </div>
          <div *ngIf="p.tipo_pago === 'CREDITO'" class="flex justify-between items-center mb-3">
            <span class="text-xs text-orange-500">Saldo pendiente</span>
            <span class="text-sm font-bold text-orange-600">S/ {{ p.saldo_pendiente | number:'1.2-2' }}</span>
          </div>
          <button (click)="imprimirNotaDespacho(p)" class="w-full py-2 rounded-xl text-sm font-medium border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
            📋 Reimprimir nota
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ MODAL COBRO — scrolleable ══ -->
  <div *ngIf="mostrarModalCobro" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" style="max-height:90vh">

      <!-- Cabecera fija -->
      <div class="flex justify-between items-center p-5 border-b flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold">Registrar cobro</h3>
          <p class="text-sm text-gray-500">Pedido #{{ pedidoCobro?.pedido_id }} — {{ pedidoCobro?.cliente }}</p>
        </div>
        <button (click)="mostrarModalCobro = false" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">

        <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p class="text-xs text-green-600 mb-1">Total a cobrar</p>
          <p class="text-3xl font-bold text-green-700">S/ {{ pedidoCobro?.total | number:'1.2-2' }}</p>
        </div>

        <!-- Método de pago -->
        <div>
          <label class="text-xs text-gray-500 mb-2 block font-medium">Método de pago</label>
          <div class="grid grid-cols-3 gap-2">
            <button *ngFor="let m of metodosPago" (click)="seleccionarMetodoCobro(m.valor)"
                    [ngClass]="metodoCobro === m.valor ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all">
              <p class="text-lg">{{ m.icono }}</p>
              <p class="text-xs font-medium">{{ m.label }}</p>
            </button>
          </div>
        </div>

        <!-- QR Yape -->
        <div *ngIf="qrActual && metodoCobro === 'yape'"
             class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p class="text-xs text-purple-600 font-medium mb-2">📱 Muestra este QR al cliente</p>
          <img [src]="'data:image/png;base64,' + qrActual.qr_base64" class="w-32 h-32 object-contain mx-auto border bg-white rounded-lg p-1"/>
          <p class="text-xs font-bold text-gray-800 mt-2">{{ qrActual.titular }}</p>
          <p class="text-xs text-gray-500">{{ qrActual.numero }}</p>
          <p class="text-base font-bold text-green-600 mt-1">S/ {{ pedidoCobro?.total | number:'1.2-2' }}</p>
        </div>

        <div *ngIf="cargandoQR" class="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p class="text-xs text-purple-600">Cargando QR...</p>
        </div>

        <!-- N° Operación Yape -->
        <div *ngIf="metodoCobro === 'yape'">
          <label class="text-xs text-gray-500 mb-1 block font-medium">N° Operación <span class="text-red-500">*</span></label>
          <input [(ngModel)]="referenciaYape" placeholder="Código de operación Yape/Plin"
                 class="w-full p-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                 [ngClass]="referenciaYape.trim() ? 'border-green-400' : 'border-red-300'"/>
          <p class="text-xs text-gray-400 mt-1">El cliente verá este código en su app Yape</p>
        </div>

        <!-- Tipo de pago -->
        <div>
          <label class="text-xs text-gray-500 mb-2 block font-medium">Tipo de pago</label>
          <div class="grid grid-cols-2 gap-2">
            <button (click)="tipoPago = 'CONTADO'"
                    [ngClass]="tipoPago === 'CONTADO' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-2.5 text-center transition-all text-xs font-semibold">✅ Contado</button>
            <button (click)="tipoPago = 'CREDITO'; montoCobrado = 0"
                    [ngClass]="tipoPago === 'CREDITO' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-2.5 text-center transition-all text-xs font-semibold">💳 Crédito</button>
          </div>
        </div>

        <!-- Monto -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block font-medium">
            {{ tipoPago === 'CREDITO' ? 'Monto inicial (abono)' : 'Monto recibido' }}
          </label>
          <input type="number" [(ngModel)]="montoCobrado" [min]="tipoPago === 'CREDITO' ? 0 : pedidoCobro?.total"
                 class="w-full p-3 border rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-cyan-400 outline-none"/>
        </div>

        <div *ngIf="tipoPago === 'CONTADO' && montoCobrado > pedidoCobro?.total"
             class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p class="text-xs text-blue-600">Vuelto a entregar</p>
          <p class="text-2xl font-bold text-blue-700">S/ {{ (montoCobrado - pedidoCobro?.total) | number:'1.2-2' }}</p>
        </div>

        <div *ngIf="tipoPago === 'CREDITO' && montoCobrado >= 0 && montoCobrado < pedidoCobro?.total"
             class="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
          <p class="text-xs text-orange-600 font-medium">Saldo pendiente</p>
          <p class="text-xl font-bold text-orange-700">S/ {{ (pedidoCobro?.total - montoCobrado) | number:'1.2-2' }}</p>
        </div>

      </div>

      <!-- Botones fijos abajo -->
      <div class="flex gap-2 p-5 border-t flex-shrink-0">
        <button (click)="mostrarModalCobro = false"
                class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
        <button (click)="confirmarCobro()"
                [disabled]="procesando === pedidoCobro?.pedido_id ||
                            (tipoPago === 'CONTADO' && montoCobrado < pedidoCobro?.total) ||
                            (tipoPago === 'CREDITO' && montoCobrado < 0) ||
                            (metodoCobro === 'yape' && !referenciaYape.trim())"
                class="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
          {{ procesando === pedidoCobro?.pedido_id ? 'Procesando...' : tipoPago === 'CREDITO' ? '💳 Registrar crédito' : 'Confirmar cobro' }}
        </button>
      </div>
    </div>
  </div>

</div>
  `
})
export class DistribucionComponent implements OnInit {

  pedidos:          any[] = [];
  historial:        any[] = [];
  loading                 = true;
  loadingHistorial        = false;
  procesando: number | null = null;
  tabActivo               = 'hoy';
  tipoPago                = 'CONTADO';
  mostrarModalCobro       = false;
  pedidoCobro: any        = null;
  montoCobrado            = 0;
  metodoCobro             = 'efectivo';
  qrActual: any           = null;
  cargandoQR              = false;
  referenciaYape          = '';

  metodosPago = [
    { valor: 'efectivo', icono: '💵', label: 'Efectivo' },
    { valor: 'yape',     icono: '📱', label: 'Yape/Plin' },
    { valor: 'tarjeta',  icono: '💳', label: 'Tarjeta' }
  ];

  constructor(
    private distribucionService: DistribucionService,
    private authService:         AuthService,
    public  colors:              ColorService,
    private negocioService:      ConfiguracionNegocioService,
    private configPagoService:   ConfiguracionPagoService,
    private cd:                  ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); this.cargarHistorial(); }

  cambiarTab(tab: string) {
    this.tabActivo = tab;
    if (tab === 'historial') this.cargarHistorial();
    this.cd.detectChanges();
  }

  refrescar() { this.cargar(); this.cargarHistorial(); }

  cargar() {
    this.loading = true;
    this.distribucionService.getPedidosListos().subscribe({
      next: (res: any) => { this.pedidos = res; this.loading = false; this.cd.detectChanges(); },
      error: () => { this.loading = false; Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error'); }
    });
  }

  cargarHistorial() {
    this.loadingHistorial = true;
    this.distribucionService.getHistorial().subscribe({
      next: (res: any) => { this.historial = res; this.loadingHistorial = false; this.cd.detectChanges(); },
      error: ()        => { this.loadingHistorial = false; this.cd.detectChanges(); }
    });
  }

  totalHistorial(): number { return this.historial.reduce((sum, p) => sum + p.monto_pagado, 0); }
  totalCreditosHistorial(): number { return this.historial.filter(p => p.tipo_pago === 'CREDITO').reduce((sum, p) => sum + p.saldo_pendiente, 0); }

  seleccionarMetodoCobro(valor: string) {
    this.metodoCobro    = valor;
    this.qrActual       = null;
    this.referenciaYape = '';
    if (valor === 'yape') {
      this.cargandoQR = true;
      this.configPagoService.getQR('yape').subscribe({
        next:  (res: any) => { this.qrActual = res; this.cargandoQR = false; this.cd.detectChanges(); },
        error: ()         => { this.qrActual = null; this.cargandoQR = false; this.cd.detectChanges(); }
      });
    }
    this.cd.detectChanges();
  }

  abrirModalCobro(p: any) {
    if (p.estado_pedido_id === 4) { this.despacharPedido(p); return; }
    if (p.pagado) { this.confirmarEntregaDirecta(p); }
    else {
      this.pedidoCobro       = p;
      this.montoCobrado      = p.total;
      this.metodoCobro       = 'efectivo';
      this.tipoPago          = 'CONTADO';
      this.qrActual          = null;
      this.referenciaYape    = '';
      this.mostrarModalCobro = true;
      this.cd.detectChanges();
    }
  }

  despacharPedido(p: any) {
    Swal.fire({
      title: '¿Confirmar despacho?',
      html:  `Pedido <b>#${p.pedido_id}</b> — <b>${p.cliente}</b><br><small style="color:#6b7280">El pedido saldrá a ruta de entrega</small>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: '🛵 Sí, despachar', cancelButtonText: 'Cancelar', confirmButtonColor: '#f97316'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = p.pedido_id; this.cd.detectChanges();
      this.distribucionService.marcarDespachado(p.pedido_id).subscribe({
        next: () => {
          this.procesando = null;
          this.imprimirNotaDespacho(p);
          Swal.fire({ icon: 'success', title: '¡Despachado!', text: 'El pedido está en ruta de entrega', timer: 2000, showConfirmButton: false });
          this.cargar();
        },
        error: (err) => { this.procesando = null; Swal.fire('Error', err?.error || 'No se pudo despachar', 'error'); this.cd.detectChanges(); }
      });
    });
  }

  confirmarEntregaDirecta(p: any) {
    Swal.fire({
      title: '¿Confirmar entrega?',
      html:  `Pedido <b>#${p.pedido_id}</b> — <b>${p.cliente}</b><br><small style="color:#16a34a">✓ Pago anticipado (${this.getMetodoLabel(p.metodo_pago)})</small>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Confirmar entrega', cancelButtonText: 'Cancelar', confirmButtonColor: '#0ea5e9'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = p.pedido_id; this.cd.detectChanges();
      this.distribucionService.confirmarCobroYEntrega(p.pedido_id, p.total, p.metodo_pago ?? 'yape', 'CONTADO').subscribe({
        next: () => { this.procesando = null; Swal.fire({ icon: 'success', title: '¡Entregado!', timer: 2000, showConfirmButton: false }); this.cargar(); this.cargarHistorial(); },
        error: (err) => { this.procesando = null; Swal.fire('Error', err?.error || 'No se pudo actualizar', 'error'); this.cd.detectChanges(); }
      });
    });
  }

  confirmarCobro() {
    if (this.tipoPago === 'CONTADO' && this.montoCobrado < this.pedidoCobro.total) { Swal.fire('Atención', 'El monto cobrado no puede ser menor al total', 'warning'); return; }
    if (this.tipoPago === 'CREDITO' && this.montoCobrado < 0) { Swal.fire('Atención', 'El monto no puede ser negativo', 'warning'); return; }
    this.procesando = this.pedidoCobro.pedido_id;
    this.distribucionService.confirmarCobroYEntrega(this.pedidoCobro.pedido_id, this.montoCobrado, this.metodoCobro, this.tipoPago).subscribe({
      next: () => {
        const vuelto = this.montoCobrado - this.pedidoCobro.total;
        this.procesando = null; this.mostrarModalCobro = false; this.cd.detectChanges();
        Swal.fire({ icon: 'success', title: '¡Entregado y cobrado!', html: vuelto > 0 ? `Vuelto: <b>S/ ${vuelto.toFixed(2)}</b>` : '✓ Cobro exacto', timer: 3000, showConfirmButton: false });
        this.cargar(); this.cargarHistorial();
      },
      error: (err) => { this.procesando = null; Swal.fire('Error', err?.error || 'No se pudo registrar', 'error'); this.cd.detectChanges(); }
    });
  }

  async imprimirNotaDespacho(p: any) {
    let negocio: any = {};
    try { negocio = await firstValueFrom(this.negocioService.getConfig()); } catch {}
    const nombre   = negocio.nombre_comercial || negocio.razon_social || 'Mi Negocio';
    const fecha    = new Date(p.fecha);
    const fechaStr = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr  = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const simbolo  = negocio.simbolo ?? 'S/';
    const filas    = (p.detalles ?? []).map((d: any) => `<tr><td style="border:1px solid #ccc;padding:6px 8px;text-align:center">${d.cantidad}</td><td style="border:1px solid #ccc;padding:6px 8px">${d.producto}</td><td style="border:1px solid #ccc;padding:6px 8px;text-align:right">${simbolo} ${Number(d.precio).toFixed(2)}</td><td style="border:1px solid #ccc;padding:6px 8px;text-align:right"><b>${simbolo} ${Number(d.subtotal).toFixed(2)}</b></td></tr>`).join('');
    const copias   = ['CLIENTE', 'REPARTIDOR', 'EMPRESA'];
    const bloqueCopia = (copia: string) => `
      <div class="copia">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div><div style="font-size:18px;font-weight:bold">${nombre}</div>${negocio.ruc ? `<div style="font-size:12px">RUC: ${negocio.ruc}</div>` : ''}${negocio.direccion ? `<div style="font-size:11px;color:#555">${negocio.direccion}</div>` : ''}${negocio.telefono ? `<div style="font-size:11px;color:#555">Tel: ${negocio.telefono}</div>` : ''}</div>
          <div style="text-align:right"><div style="font-size:11px;color:#555;font-style:italic">Nota de Despacho</div><div style="font-size:20px;font-weight:bold;color:#dc2626">N° ${String(p.pedido_id).padStart(6,'0')}</div><div style="font-size:11px;color:#555">${fechaStr} ${horaStr}</div><div style="margin-top:4px;padding:2px 8px;background:#f97316;color:white;border-radius:4px;font-size:11px;font-weight:bold">COPIA: ${copia}</div></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px"><tr><td style="width:50%;padding:4px 0;vertical-align:top"><b>Cliente:</b> ${p.cliente}<br><b>Doc:</b> ${p.cliente_doc ?? '—'}</td><td style="width:50%;padding:4px 0;vertical-align:top;text-align:right"><b>Dirección:</b><br><span style="font-size:11px">${p.direccion_entrega ?? '—'}</span></td></tr></table>
        ${p.observaciones ? `<div style="background:#fffbeb;border:1px solid #fcd34d;padding:4px 8px;border-radius:4px;font-size:11px;margin-bottom:8px">📝 <b>Obs:</b> ${p.observaciones}</div>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px"><thead><tr style="background:#1e293b;color:white"><th style="border:1px solid #ccc;padding:6px;width:50px;text-align:center">CANT.</th><th style="border:1px solid #ccc;padding:6px;text-align:left">DESCRIPCIÓN</th><th style="border:1px solid #ccc;padding:6px;width:80px;text-align:right">P. UNIT.</th><th style="border:1px solid #ccc;padding:6px;width:80px;text-align:right">TOTAL</th></tr></thead><tbody>${filas}</tbody><tfoot><tr><td colspan="3" style="border:1px solid #ccc;padding:6px;text-align:right;font-weight:bold">TOTAL:</td><td style="border:1px solid #ccc;padding:6px;text-align:right;font-weight:bold;font-size:14px">${simbolo} ${Number(p.total).toFixed(2)}</td></tr></tfoot></table>
        <table style="width:100%;margin-top:16px;font-size:11px"><tr><td style="width:33%;text-align:center;padding-top:30px;border-top:1px solid #000">Firma Vendedor</td><td style="width:33%;text-align:center;padding-top:30px;border-top:1px solid #000">Firma Repartidor</td><td style="width:33%;text-align:center;padding-top:30px;border-top:1px solid #000">Firma Cliente</td></tr></table>
        <div style="text-align:center;font-size:10px;color:#94a3b8;margin-top:8px">SophiTech ERP · sophitecherp.com</div>
      </div>`;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Nota de Despacho #${p.pedido_id}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f1f5f9;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px}.toolbar{display:flex;gap:10px;width:100%;max-width:720px}.btn{flex:1;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer}.btn-print{background:#2563eb;color:white}.btn-close{background:#e2e8f0;color:#475569}.copia{background:white;width:100%;max-width:720px;padding:16px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.12);border-top:4px solid #f97316}@media print{body{background:white;padding:0;gap:0}.toolbar{display:none}.copia{box-shadow:none;border-radius:0;max-width:100%;page-break-after:always;padding:12px}.copia:last-child{page-break-after:avoid}@page{margin:10mm;size:A4}}</style></head><body><div class="toolbar"><button class="btn btn-print" onclick="window.print()">🖨️ Imprimir 3 copias</button><button class="btn btn-close" onclick="window.close()">✕ Cerrar</button></div>${copias.map(c => bloqueCopia(c)).join('')}</body></html>`);
    win.document.close();
  }

  getMetodoLabel(metodo: string): string {
    const m: Record<string, string> = { 'efectivo': 'Efectivo', 'yape': 'Yape/Plin', 'tarjeta': 'Tarjeta', 'contra_entrega': 'Contra entrega' };
    return m[metodo] ?? metodo ?? '—';
  }
}