import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DistribucionService } from '../../core/services/distribucion';
import { AuthService } from '../../core/auth/auth';
import { ColorService } from '../../core/services/color';

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
        Pedidos listos para entregar · {{ pedidos.length }} pendientes
      </p>
    </div>
    <button (click)="cargar()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm
                   hover:bg-blue-700 transition-colors">
      Refrescar
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-16">
    Cargando pedidos...
  </div>

  <!-- VACÍO -->
  <div *ngIf="!loading && pedidos.length === 0"
       class="text-center py-20 text-gray-400">
    <p class="text-5xl mb-4">🛵</p>
    <p class="font-semibold text-lg">Sin pedidos para entregar</p>
    <p class="text-sm mt-1">Todos los pedidos han sido entregados</p>
  </div>

  <!-- CARDS -->
  <div *ngIf="!loading && pedidos.length > 0"
       class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

    <div *ngFor="let p of pedidos"
         class="bg-white rounded-xl shadow-sm border border-gray-100
                overflow-hidden hover:shadow-md transition-shadow">

      <!-- Cabecera -->
      <div class="px-4 pt-4 pb-3 border-b border-gray-50">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-gray-800 text-lg">
                #{{ p.pedido_id }}
              </span>
              <!-- Badge estado dinámico -->
              <span [ngClass]="p.estado_pedido_id === 4
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'"
                    class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ p.estado_pedido_id === 4 ? 'LISTO' : 'DESPACHADO' }}
              </span>
            </div>
            <p class="font-semibold text-gray-700">{{ p.cliente }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ p.fecha | date:'dd/MM/yy HH:mm' }}
            </p>
          </div>

          <div class="flex flex-col items-end gap-1">
            <span class="bg-orange-500 text-white text-xs
                         px-2.5 py-1 rounded-full font-medium">
              🛵 Delivery
            </span>
            <span *ngIf="p.pagado"
                  class="bg-green-100 text-green-700 text-xs
                         px-2 py-0.5 rounded-full font-medium">
              ✓ Pagado ({{ getMetodoLabel(p.metodo_pago) }})
            </span>
            <span *ngIf="!p.pagado"
                  class="bg-orange-100 text-orange-700 text-xs
                         px-2 py-0.5 rounded-full font-medium">
              💵 Contra entrega
            </span>
          </div>
        </div>
      </div>

      <!-- Dirección -->
      <div *ngIf="p.direccion_entrega"
           class="mx-4 mt-3 px-3 py-2 bg-blue-50 border border-blue-100
                  rounded-lg flex items-start gap-2">
        <span class="text-blue-500 mt-0.5 flex-shrink-0">📍</span>
        <p class="text-xs text-blue-700 leading-relaxed">
          {{ p.direccion_entrega }}
        </p>
      </div>

      <!-- Observaciones -->
      <div *ngIf="p.observaciones"
           class="mx-4 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-100
                  rounded-lg flex items-start gap-2">
        <span class="text-yellow-500 flex-shrink-0">📝</span>
        <p class="text-xs text-yellow-700">{{ p.observaciones }}</p>
      </div>

      <!-- Productos -->
      <div class="px-4 py-3">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Productos
        </p>
        <div class="space-y-1">
          <div *ngFor="let d of p.detalles"
               class="flex justify-between items-center text-sm">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 bg-slate-100 rounded-full flex items-center
                           justify-center text-xs font-bold text-slate-600">
                {{ d.cantidad }}
              </span>
              <span class="text-gray-700">{{ d.producto }}</span>
            </div>
            <span class="text-gray-500 text-xs font-medium">
              S/ {{ d.subtotal | number:'1.2-2' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Total + Acción -->
      <div class="px-4 pb-4 pt-2 border-t border-gray-50">
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm text-gray-500">Total</span>
          <span class="font-bold text-green-600 text-lg">
            S/ {{ p.total | number:'1.2-2' }}
          </span>
        </div>

        <button (click)="abrirModalCobro(p)"
                [disabled]="procesando === p.pedido_id"
                class="w-full py-2.5 rounded-xl text-sm font-semibold
                       text-white transition-all duration-200
                       disabled:opacity-50 active:scale-95"
                [style]="p.estado_pedido_id === 4
                  ? 'background: linear-gradient(135deg, #ea580c, #f97316)'
                  : p.pagado
                    ? 'background: linear-gradient(135deg, #065f46, #10b981)'
                    : 'background: linear-gradient(135deg, #0369a1, #0ea5e9)'">
          {{ procesando === p.pedido_id
              ? 'Procesando...'
              : p.estado_pedido_id === 4
                ? '🛵 Despachar'
                : p.pagado
                  ? '✓ Confirmar entrega'
                  : '💵 Cobrar y entregar' }}
        </button>
      </div>

    </div>
  </div>

  <!-- ══ MODAL COBRO EN CAMPO ══ -->
  <div *ngIf="mostrarModalCobro"
       class="fixed inset-0 bg-black/50 flex items-center
              justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">

      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-bold">Registrar cobro</h3>
          <p class="text-sm text-gray-500">
            Pedido #{{ pedidoCobro?.pedido_id }} —
            {{ pedidoCobro?.cliente }}
          </p>
        </div>
        <button (click)="mostrarModalCobro = false"
                class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <div class="bg-green-50 border border-green-200 rounded-xl
                  p-4 text-center mb-4">
        <p class="text-xs text-green-600 mb-1">Total a cobrar</p>
        <p class="text-3xl font-bold text-green-700">
          S/ {{ pedidoCobro?.total | number:'1.2-2' }}
        </p>
      </div>

      <div class="mb-4">
        <label class="text-xs text-gray-500 mb-2 block font-medium">
          Método de pago
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button *ngFor="let m of metodosPago"
                  (click)="metodoCobro = m.valor"
                  [ngClass]="metodoCobro === m.valor
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 text-gray-500'"
                  class="border-2 rounded-xl p-2 text-center transition-all">
            <p class="text-lg">{{ m.icono }}</p>
            <p class="text-xs font-medium">{{ m.label }}</p>
          </button>
        </div>
      </div>

      <div class="mb-4">
        <label class="text-xs text-gray-500 mb-1 block font-medium">
          Monto recibido
        </label>
        <input type="number"
               [(ngModel)]="montoCobrado"
               [min]="pedidoCobro?.total"
               class="w-full p-3 border rounded-xl text-center text-xl
                      font-bold focus:ring-2 focus:ring-cyan-400 outline-none"/>
      </div>

      <div *ngIf="montoCobrado > pedidoCobro?.total"
           class="bg-blue-50 border border-blue-200 rounded-xl
                  p-3 text-center mb-4">
        <p class="text-xs text-blue-600">Vuelto a entregar</p>
        <p class="text-2xl font-bold text-blue-700">
          S/ {{ (montoCobrado - pedidoCobro?.total) | number:'1.2-2' }}
        </p>
      </div>

      <div *ngIf="montoCobrado > 0 && montoCobrado < pedidoCobro?.total"
           class="bg-red-50 border border-red-200 rounded-xl
                  p-3 text-center mb-4">
        <p class="text-xs text-red-600 font-medium">
          Monto insuficiente — faltan
          S/ {{ (pedidoCobro?.total - montoCobrado) | number:'1.2-2' }}
        </p>
      </div>

      <div class="flex gap-2">
        <button (click)="mostrarModalCobro = false"
                class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200
                       rounded-xl text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button (click)="confirmarCobro()"
                [disabled]="procesando === pedidoCobro?.pedido_id
                             || montoCobrado < pedidoCobro?.total"
                class="flex-1 py-2.5 text-white rounded-xl text-sm
                       font-semibold transition-colors disabled:opacity-50"
                style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
          {{ procesando === pedidoCobro?.pedido_id
              ? 'Procesando...'
              : 'Confirmar cobro' }}
        </button>
      </div>

    </div>
  </div>

</div>
  `
})
export class DistribucionComponent implements OnInit {

  pedidos:    any[] = [];
  loading          = true;
  procesando: number | null = null;

  mostrarModalCobro = false;
  pedidoCobro: any  = null;
  montoCobrado      = 0;
  metodoCobro       = 'efectivo';

  metodosPago = [
    { valor: 'efectivo', icono: '💵', label: 'Efectivo' },
    { valor: 'yape',     icono: '📱', label: 'Yape/Plin' },
    { valor: 'tarjeta',  icono: '💳', label: 'Tarjeta' }
  ];

  constructor(
    private distribucionService: DistribucionService,
    private authService:         AuthService,
    public  colors:              ColorService,
    private cd:                  ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.distribucionService.getPedidosListos().subscribe({
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

  // ── Acción principal según estado ──
  abrirModalCobro(p: any) {
    if (p.estado_pedido_id === 4) {
      // LISTO → despachar primero
      this.despacharPedido(p);
      return;
    }
    // DESPACHADO → cobrar o confirmar entrega
    if (p.pagado) {
      this.confirmarEntregaDirecta(p);
    } else {
      this.pedidoCobro       = p;
      this.montoCobrado      = p.total;
      this.metodoCobro       = 'efectivo';
      this.mostrarModalCobro = true;
      this.cd.detectChanges();
    }
  }

  // ── Despachar pedido LISTO → DESPACHADO ──
  despacharPedido(p: any) {
    Swal.fire({
      title:             '¿Confirmar despacho?',
      html:              `Pedido <b>#${p.pedido_id}</b> — <b>${p.cliente}</b>
                          <br><small style="color:#6b7280">
                            El pedido saldrá a ruta de entrega
                          </small>`,
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: '🛵 Sí, despachar',
      cancelButtonText:  'Cancelar',
      confirmButtonColor: '#f97316'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = p.pedido_id;
      this.cd.detectChanges();

      this.distribucionService.marcarDespachado(p.pedido_id).subscribe({
        next: () => {
          this.procesando = null;
          Swal.fire({
            icon:  'success',
            title: '¡Despachado!',
            text:  'El pedido está en ruta de entrega',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargar();
        },
        error: (err) => {
          this.procesando = null;
          Swal.fire('Error', err?.error || 'No se pudo despachar', 'error');
          this.cd.detectChanges();
        }
      });
    });
  }

  // ── Confirmar entrega pago anticipado ──
  confirmarEntregaDirecta(p: any) {
    Swal.fire({
      title:             '¿Confirmar entrega?',
      html:              `Pedido <b>#${p.pedido_id}</b> — <b>${p.cliente}</b>
                          <br><small style="color:#16a34a">
                            ✓ Pago anticipado
                            (${this.getMetodoLabel(p.metodo_pago)})
                          </small>`,
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: 'Confirmar entrega',
      cancelButtonText:  'Cancelar',
      confirmButtonColor: '#0ea5e9'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = p.pedido_id;
      this.cd.detectChanges();

      this.distribucionService.confirmarCobroYEntrega(
        p.pedido_id, p.total, p.metodo_pago ?? 'yape'
      ).subscribe({
        next: () => {
          this.procesando = null;
          Swal.fire({
            icon:  'success',
            title: '¡Entregado!',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargar();
        },
        error: (err) => {
          this.procesando = null;
          Swal.fire('Error', err?.error || 'No se pudo actualizar', 'error');
          this.cd.detectChanges();
        }
      });
    });
  }

  // ── Confirmar cobro contra entrega ──
  confirmarCobro() {
    if (this.montoCobrado < this.pedidoCobro.total) {
      Swal.fire('Atención',
        'El monto cobrado no puede ser menor al total', 'warning');
      return;
    }

    this.procesando = this.pedidoCobro.pedido_id;

    this.distribucionService.confirmarCobroYEntrega(
      this.pedidoCobro.pedido_id,
      this.montoCobrado,
      this.metodoCobro
    ).subscribe({
      next: () => {
        const vuelto           = this.montoCobrado - this.pedidoCobro.total;
        this.procesando        = null;
        this.mostrarModalCobro = false;
        this.cd.detectChanges();

        Swal.fire({
          icon:  'success',
          title: '¡Entregado y cobrado!',
          html:  vuelto > 0
                  ? `Vuelto a entregar: <b>S/ ${vuelto.toFixed(2)}</b>`
                  : '✓ Cobro exacto',
          timer: 3000,
          showConfirmButton: false
        });
        this.cargar();
      },
      error: (err) => {
        this.procesando = null;
        Swal.fire('Error', err?.error || 'No se pudo registrar', 'error');
        this.cd.detectChanges();
      }
    });
  }

  getMetodoLabel(metodo: string): string {
    const m: Record<string, string> = {
      'efectivo':       'Efectivo',
      'yape':           'Yape/Plin',
      'tarjeta':        'Tarjeta',
      'contra_entrega': 'Contra entrega'
    };
    return m[metodo] ?? metodo ?? '—';
  }
}