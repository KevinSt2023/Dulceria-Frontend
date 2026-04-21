import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { SeguimientoService } from '../../core/services/seguimiento';
import { AuthService } from '../../core/auth/auth';
import { InventarioService } from '../../core/services/inventario';
import { AlmacenesService } from '../../core/services/almacenes';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Cola de producción</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        {{ cola.length }} pedido(s) en cola
      </p>
    </div>
    <button (click)="cargar()"
            class="bg-slate-100 hover:bg-slate-200 text-gray-600
                   px-4 py-2 rounded-lg text-sm transition-colors">
      🔄 Refrescar
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-16">
    Cargando cola...
  </div>

  <!-- COLA VACÍA -->
  <div *ngIf="!loading && cola.length === 0"
       class="text-center py-16 text-gray-400">
    <p class="text-5xl mb-3">✓</p>
    <p class="font-semibold text-lg">Sin pedidos pendientes</p>
    <p class="text-sm mt-1">Todos los pedidos están al día</p>
  </div>

  <!-- CARDS -->
  <div *ngIf="!loading && cola.length > 0"
       class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

    <div *ngFor="let p of cola"
         class="bg-white rounded-xl shadow-sm border border-gray-100
                overflow-hidden hover:shadow-md transition-shadow">

      <!-- Cabecera -->
      <div class="flex justify-between items-start px-4 pt-4 pb-3
                  border-b border-gray-50">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold text-gray-800 text-lg">
              #{{ p.pedido_id }}
            </span>
            <span [class]="getBadgeEstado(p.estado)"
                  class="text-xs px-2.5 py-0.5 rounded-full font-medium">
              {{ p.estado }}
            </span>
          </div>
          <p class="text-sm font-medium text-gray-700">{{ p.cliente }}</p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ p.fecha | date:'dd/MM/yy HH:mm' }}
          </p>
        </div>

        <div class="text-right">
          <span [ngClass]="p.tipos_pedido === 'DELIVERY'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'"
                class="text-xs px-2.5 py-1 rounded-full font-medium">
            {{ p.tipos_pedido === 'DELIVERY' ? '🛵 Delivery' : '🏪 Pickup' }}
          </span>
          <p *ngIf="p.tipos_pedido === 'DELIVERY' && p.direccion_entrega"
             class="text-xs text-gray-400 mt-1 max-w-[140px] text-right truncate"
             [title]="p.direccion_entrega">
            📍 {{ p.direccion_entrega }}
          </p>
        </div>
      </div>

      <!-- Observaciones -->
      <div *ngIf="p.observaciones"
           class="mx-4 mt-3 px-3 py-1.5 bg-yellow-50 border border-yellow-200
                  rounded-lg text-xs text-yellow-800">
        📝 {{ p.observaciones }}
      </div>

      <!-- Productos con semáforo -->
      <div class="px-4 py-3">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">
          Productos
        </p>
        <div class="space-y-2">
          <div *ngFor="let d of p.detalles"
               class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 min-w-0">
              <span [class]="getSemaforoClase(d.semaforo)"
                    class="w-2.5 h-2.5 rounded-full flex-shrink-0"></span>
              <span class="text-gray-700 text-sm truncate">
                {{ d.producto }}
              </span>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0 ml-2">
              <span class="text-gray-500 text-xs">x{{ d.cantidad }}</span>
              <span [class]="getStockTexto(d.semaforo)"
                    class="text-xs font-semibold whitespace-nowrap">
                stock: {{ d.stock_actual }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div class="px-4 py-2 border-t border-gray-50
                  flex justify-between items-center">
        <span class="text-xs text-gray-400">Total</span>
        <span class="font-bold text-green-600 text-sm">
          S/ {{ p.total | number:'1.2-2' }}
        </span>
      </div>

      <!-- Acciones -->
      <div class="px-4 pb-4 pt-2 space-y-2">

        <!-- Avanzar estado -->
        <button *ngIf="puedeAccionar(p)"
                (click)="accionarPedido(p)"
                [disabled]="procesando === p.pedido_id"
                [class]="getBotonClase(p.estado)"
                class="w-full py-2.5 rounded-xl text-sm font-semibold
                       disabled:opacity-50 transition-colors">
          {{ procesando === p.pedido_id
              ? 'Procesando...'
              : getTextoBoton(p.estado) }}
        </button>

        <!-- Registrar producción -->
        <button *ngIf="tieneStockCritico(p) && puedeRegistrarProduccion()"
                (click)="abrirModalProduccion(p)"
                class="w-full py-2.5 rounded-xl text-sm font-semibold
                       bg-emerald-500 hover:bg-emerald-600 text-white
                       transition-colors">
          + Registrar producción
        </button>

        <!-- Alerta stock crítico -->
        <div *ngIf="tieneStockCritico(p)"
             class="flex items-center gap-1.5 px-2 py-1.5 bg-red-50
                    border border-red-100 rounded-lg">
          <span class="text-red-500 text-xs">⚠️</span>
          <p class="text-xs text-red-600 font-medium">
            Hay productos sin stock — registra producción antes de marcar listo
          </p>
        </div>

      </div>
    </div>
  </div>

  <!-- ══ MODAL REGISTRAR PRODUCCIÓN ══ -->
  <div *ngIf="mostrarModalProduccion"
       class="fixed inset-0 bg-black/50 flex items-center
              justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg
                max-h-screen overflow-y-auto">

      <!-- Cabecera -->
      <div class="flex justify-between items-center p-6 border-b">
        <div>
          <h3 class="text-lg font-bold text-gray-800">
            Registrar producción
          </h3>
          <p class="text-sm text-gray-500 mt-0.5">
            Pedido #{{ pedidoProduccion?.pedido_id }} —
            {{ pedidoProduccion?.cliente }}
          </p>
        </div>
        <button (click)="mostrarModalProduccion = false"
                class="text-gray-400 hover:text-gray-600 text-xl
                       w-8 h-8 flex items-center justify-center
                       rounded-lg hover:bg-gray-100 transition-colors">
          ✕
        </button>
      </div>

      <div class="p-6 space-y-4">

        <!-- Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl
                    p-3 text-xs text-blue-700">
          💡 Indica cuánto produjiste de cada producto y en qué almacén
          se registrará la entrada de stock.
        </div>

        <!-- Items -->
        <div class="space-y-3">
          <div *ngFor="let item of itemsProduccion"
               class="border border-gray-100 rounded-xl p-4 bg-gray-50">

            <p class="font-semibold text-sm text-gray-800 mb-3">
              {{ item.producto }}
            </p>

            <div class="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1.5">
                  Pedido
                </label>
                <div class="p-2.5 bg-white border border-gray-200
                            rounded-xl text-sm text-center
                            text-gray-500 font-medium">
                  {{ item.cantidad_pedida }}
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1.5">
                  Producido *
                </label>
                <input type="number"
                       [(ngModel)]="item.cantidad_producida"
                       min="1"
                       class="w-full p-2.5 border border-gray-200
                              rounded-xl text-sm text-center
                              focus:ring-2 focus:ring-green-400
                              outline-none"/>
              </div>
            </div>

            <div>
              <label class="text-xs text-gray-500 block mb-1.5">
                Almacén destino *
              </label>
              <select [(ngModel)]="item.almacen_id"
                      class="w-full p-2.5 border border-gray-200
                             rounded-xl text-sm focus:ring-2
                             focus:ring-green-400 outline-none">
                <option [ngValue]="null">-- Selecciona almacén --</option>
                <option *ngFor="let a of almacenes"
                        [ngValue]="a.almacen_id">
                  {{ a.nombre }}
                </option>
              </select>
            </div>

            <div *ngIf="item.cantidad_producida < item.cantidad_pedida"
                 class="mt-2 text-xs text-yellow-600 bg-yellow-50
                        border border-yellow-200 rounded-lg px-3 py-1.5">
              ⚠️ Producirás menos de lo pedido
              ({{ item.cantidad_pedida - item.cantidad_producida }} faltantes)
            </div>

          </div>
        </div>

      </div>

      <!-- Botones -->
      <div class="flex gap-2 px-6 pb-6">
        <button (click)="mostrarModalProduccion = false"
                class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200
                       rounded-xl text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button (click)="guardarProduccion()"
                [disabled]="guardandoProduccion"
                class="flex-1 py-2.5 bg-green-600 hover:bg-green-700
                       text-white rounded-xl text-sm font-semibold
                       disabled:opacity-50 transition-colors">
          {{ guardandoProduccion ? 'Registrando...' : '✓ Confirmar producción' }}
        </button>
      </div>

    </div>
  </div>

</div>
  `
})
export class SeguimientoComponent implements OnInit {

  cola:       any[] = [];
  loading          = true;
  procesando: number | null = null;

  mostrarModalProduccion = false;
  pedidoProduccion: any  = null;
  almacenes: any[]       = [];
  guardandoProduccion    = false;

  itemsProduccion: {
    producto_id:        number;
    producto:           string;
    cantidad_pedida:    number;
    cantidad_producida: number;
    almacen_id:         number | null;
  }[] = [];

  private readonly siguienteEstado: Record<string, number> = {
    'PENDIENTE':      2,
    'CONFIRMADO':     3,
    'EN_PREPARACION': 4,
  };

  constructor(
    private seguimientoService: SeguimientoService,
    private authService:        AuthService,
    private inventarioService:  InventarioService,
    private almacenesService:   AlmacenesService,
    private cd:                 ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    this.almacenesService.getAlmacenes().subscribe((res: any) => {
      this.almacenes = res;
      this.cd.detectChanges();
    });
  }

  cargar() {
    this.loading = true;
    this.seguimientoService.getCola().subscribe({
      next: (res) => {
        this.cola    = res;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la cola', 'error');
      }
    });
  }

  abrirModalProduccion(p: any) {
    this.pedidoProduccion       = p;
    this.mostrarModalProduccion = true;
    this.guardandoProduccion    = false;

    this.itemsProduccion = p.detalles.map((d: any) => ({
      producto_id:        d.producto_id,
      producto:           d.producto,
      cantidad_pedida:    d.cantidad,
      cantidad_producida: d.cantidad,
      almacen_id:         this.almacenes.length === 1
                            ? this.almacenes[0].almacen_id
                            : null
    }));

    this.cd.detectChanges();
  }

  guardarProduccion() {
    if (this.guardandoProduccion) return;

    const sinAlmacen = this.itemsProduccion.some(i => !i.almacen_id);
    if (sinAlmacen) {
      Swal.fire('Atención',
        'Selecciona el almacén para todos los productos', 'warning');
      return;
    }

    const sinCantidad = this.itemsProduccion.some(i => i.cantidad_producida < 1);
    if (sinCantidad) {
      Swal.fire('Atención',
        'La cantidad producida debe ser mayor a 0', 'warning');
      return;
    }

    this.guardandoProduccion = true;

    const registros = this.itemsProduccion.map(item =>
      this.inventarioService.createMovimiento({
        producto_id:     item.producto_id,
        almacen_id:      item.almacen_id,
        tipo_movimiento: 'ENTRADA',
        cantidad:        item.cantidad_producida,
        motivo:          `Producción pedido #${this.pedidoProduccion.pedido_id}`
      }).toPromise()
    );

    Promise.all(registros)
      .then(() => {
        this.guardandoProduccion    = false;
        this.mostrarModalProduccion = false;
        Swal.fire({
          icon:  'success',
          title: 'Producción registrada',
          text:  'Stock actualizado correctamente',
          timer: 2000, showConfirmButton: false
        });
        this.cargar();
      })
      .catch(err => {
        this.guardandoProduccion = false;
        Swal.fire('Error', err?.error || 'No se pudo registrar', 'error');
      });
  }

  accionarPedido(p: any) {
    const siguiente = this.siguienteEstado[p.estado];
    if (!siguiente) return;

    // ── BLOQUEAR si va a marcar LISTO y hay stock crítico ──
    if (siguiente === 4 && this.tieneStockCritico(p)) {
      const sinStock = p.detalles
        .filter((d: any) => d.semaforo === 'sin_stock');

      const lista = sinStock
        .map((d: any) =>
          `<li style="margin:4px 0">
            <b>${d.producto}</b>
            <span style="color:#6b7280"> — stock: ${d.stock_actual}</span>
          </li>`)
        .join('');

      Swal.fire({
        icon:  'warning',
        title: '⚠️ Stock insuficiente',
        html:  `<p style="margin-bottom:8px">
                  No puedes marcar como listo — faltan productos:
                </p>
                <ul style="text-align:left;list-style:none;padding:0">
                  ${lista}
                </ul>
                <p style="color:#6b7280;font-size:13px;margin-top:12px">
                  Usa <b>"+ Registrar producción"</b> para
                  agregar el stock faltante.
                </p>`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const textos: Record<string, { titulo: string; texto: string; btn: string }> = {
      'PENDIENTE': {
        titulo: '¿Confirmar pedido?',
        texto:  `Pedido #${p.pedido_id} de ${p.cliente}`,
        btn:    'Sí, confirmar'
      },
      'CONFIRMADO': {
        titulo: '¿Iniciar preparación?',
        texto:  `Pedido #${p.pedido_id} — pasará a EN PREPARACIÓN`,
        btn:    'Sí, iniciar'
      },
      'EN_PREPARACION': {
        titulo: '¿Marcar como listo?',
        texto:  `Pedido #${p.pedido_id} — pasará a LISTO para entrega`,
        btn:    'Sí, marcar listo'
      }
    };

    const conf = textos[p.estado];
    if (!conf) return;

    Swal.fire({
      title:             conf.titulo,
      text:              conf.texto,
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: conf.btn,
      cancelButtonText:  'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.procesando = p.pedido_id;

      this.seguimientoService.cambiarEstado(p.pedido_id, siguiente).subscribe({
        next: () => {
          this.procesando = null;
          this.cargar();
        },
        error: (err) => {
          this.procesando = null;
          Swal.fire('Error',
            err?.error || 'No se pudo cambiar el estado', 'error');
        }
      });
    });
  }

  puedeAccionar(p: any): boolean {
    const rol = this.authService.getRolId();
    if (rol === 0 || rol === 1) return true;
    if (rol === 3) return p.estado === 'PENDIENTE'
                       || p.estado === 'CONFIRMADO'
                       || p.estado === 'EN_PREPARACION';
    return false;
  }

  puedeRegistrarProduccion(): boolean {
    const rol = this.authService.getRolId();
    return rol === 0 || rol === 1 || rol === 3;
  }

  tieneStockCritico(p: any): boolean {
    return p.detalles.some((d: any) => d.semaforo === 'sin_stock');
  }

  getTextoBoton(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE':      'Confirmar pedido',
      'CONFIRMADO':     'Iniciar preparación',
      'EN_PREPARACION': 'Marcar listo'
    };
    return map[estado] ?? 'Avanzar';
  }

  getBotonClase(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE':      'bg-blue-600 hover:bg-blue-700 text-white',
      'CONFIRMADO':     'bg-purple-600 hover:bg-purple-700 text-white',
      'EN_PREPARACION': 'bg-green-600 hover:bg-green-700 text-white'
    };
    return m[estado] ?? 'bg-gray-600 text-white';
  }

  getBadgeEstado(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE':      'bg-yellow-100 text-yellow-700',
      'CONFIRMADO':     'bg-blue-100 text-blue-700',
      'EN_PREPARACION': 'bg-purple-100 text-purple-700'
    };
    return m[estado] ?? 'bg-gray-100 text-gray-600';
  }

  getSemaforoClase(semaforo: string): string {
    const m: Record<string, string> = {
      'ok':        'bg-green-500',
      'justo':     'bg-yellow-400',
      'sin_stock': 'bg-red-500'
    };
    return m[semaforo] ?? 'bg-gray-300';
  }

  getStockTexto(semaforo: string): string {
    const m: Record<string, string> = {
      'ok':        'text-green-600',
      'justo':     'text-yellow-600',
      'sin_stock': 'text-red-600'
    };
    return m[semaforo] ?? 'text-gray-500';
  }
}