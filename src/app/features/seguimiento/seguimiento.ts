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
<div class="p-4">

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-700">Cola de producción</h2>
      <p class="text-sm text-gray-400">
        Pedidos pendientes · {{ cola.length }} en cola
      </p>
    </div>
    <button (click)="cargar()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
      Refrescar
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-16">
    Cargando cola...
  </div>

  <!-- COLA VACÍA -->
  <div *ngIf="!loading && cola.length === 0"
       class="text-center py-16 text-gray-400">
    <p class="text-4xl mb-3">✓</p>
    <p class="font-medium">Sin pedidos pendientes</p>
    <p class="text-sm">Todos los pedidos están al día</p>
  </div>

  <!-- CARDS -->
  <div *ngIf="!loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

    <div *ngFor="let p of cola"
         class="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">

      <!-- Cabecera -->
      <div class="flex justify-between items-start px-4 pt-4 pb-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold text-gray-800">#{{ p.pedido_id }}</span>
            <span [class]="getBadgeEstado(p.estado)"
                  class="text-xs px-2 py-0.5 rounded-full font-medium">
              {{ p.estado }}
            </span>
          </div>
          <p class="text-sm font-medium text-gray-700">{{ p.cliente }}</p>
          <p class="text-xs text-gray-400">{{ p.fecha | date:'dd/MM/yy HH:mm' }}</p>
        </div>

        <!-- Tipo pedido -->
        <div class="text-right">
          <span [class]="p.tipos_pedido === 'DELIVERY'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'"
                class="text-xs px-2 py-1 rounded-full font-medium">
            {{ p.tipos_pedido === 'DELIVERY' ? 'Delivery' : 'Pickup' }}
          </span>
          <p *ngIf="p.tipos_pedido === 'DELIVERY' && p.direccion_entrega"
             class="text-xs text-gray-400 mt-1 max-w-[140px] text-right truncate"
             [title]="p.direccion_entrega">
            {{ p.direccion_entrega }}
          </p>
        </div>
      </div>

      <!-- Observaciones -->
      <div *ngIf="p.observaciones"
           class="mx-4 mb-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200
                  rounded text-xs text-yellow-800">
        {{ p.observaciones }}
      </div>

      <!-- Productos con semáforo -->
      <div class="px-4 pb-3">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Productos
        </p>
        <div class="space-y-1.5">
          <div *ngFor="let d of p.detalles"
               class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 min-w-0">
              <span [class]="getSemaforoClase(d.semaforo)"
                    class="w-2 h-2 rounded-full flex-shrink-0"></span>
              <span class="text-gray-700 truncate">{{ d.producto }}</span>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0 ml-2">
              <span class="text-gray-500 text-xs">x{{ d.cantidad }}</span>
              <span [class]="getStockTexto(d.semaforo)"
                    class="text-xs font-medium whitespace-nowrap">
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
        <span class="font-bold text-green-600">
          S/ {{ p.total | number:'1.2-2' }}
        </span>
      </div>

      <!-- Acciones -->
      <!-- Acciones -->
<div class="px-4 pb-4 pt-2 space-y-2">

  <!-- Avanzar estado -->
  <button *ngIf="puedeAccionar(p)"
          (click)="accionarPedido(p)"
          [disabled]="procesando === p.pedido_id"
          [class]="getBotonClase(p.estado)"
          class="w-full py-2 rounded-lg text-sm font-medium
                 disabled:opacity-50 transition-colors">
    {{ procesando === p.pedido_id
        ? 'Procesando...'
        : getTextoBoton(p.estado) }}
  </button>

  <!-- Registrar producción — cuando hay stock crítico -->
  <button *ngIf="tieneStockCritico(p) && puedeRegistrarProduccion()"
          (click)="abrirModalProduccion(p)"
          class="w-full py-2 rounded-lg text-sm font-medium
                 bg-green-600 hover:bg-green-700 text-white transition-colors">
    + Registrar producción
  </button>

  <p *ngIf="tieneStockCritico(p)"
     class="text-xs text-red-500 text-center">
    Hay productos sin stock suficiente
  </p>

</div>
    </div>
  </div>

  <!-- ══ MODAL REGISTRAR PRODUCCIÓN ══ -->
  <div *ngIf="mostrarModalProduccion"
       class="fixed inset-0 bg-black/50 flex items-center
              justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg
                max-h-screen overflow-y-auto">

      <!-- Cabecera modal -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-bold">Registrar producción</h3>
          <p class="text-sm text-gray-500">
            Pedido #{{ pedidoProduccion?.pedido_id }} —
            {{ pedidoProduccion?.cliente }}
          </p>
        </div>
        <button (click)="mostrarModalProduccion = false"
                class="text-gray-400 hover:text-gray-600 text-xl leading-none">
          ✕
        </button>
      </div>

      <!-- Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
        Indica cuánto produjiste de cada producto y en qué almacén
        se va a registrar la entrada de stock.
      </div>

      <!-- Items -->
      <div class="space-y-3">
        <div *ngFor="let item of itemsProduccion"
             class="border rounded-lg p-3 bg-gray-50">

          <p class="font-medium text-sm mb-3 text-gray-800">
            {{ item.producto }}
          </p>

          <div class="grid grid-cols-2 gap-2 mb-2">
            <!-- Cantidad pedida (readonly) -->
            <div>
              <label class="text-xs text-gray-500 block mb-1">
                Pedido
              </label>
              <div class="p-2 bg-white border rounded text-sm
                          text-center text-gray-500 font-medium">
                {{ item.cantidad_pedida }}
              </div>
            </div>

            <!-- Cantidad producida -->
            <div>
              <label class="text-xs text-gray-500 block mb-1">
                Producido
              </label>
              <input type="number"
                     [(ngModel)]="item.cantidad_producida"
                     min="1"
                     class="w-full p-2 border rounded text-sm text-center
                            focus:ring-2 focus:ring-green-500 focus:outline-none"/>
            </div>
          </div>

          <!-- Almacén destino -->
          <div>
            <label class="text-xs text-gray-500 block mb-1">
              Almacén destino
            </label>
            <select [(ngModel)]="item.almacen_id"
                    class="w-full p-2 border rounded text-sm">
              <option [ngValue]="null">-- Selecciona almacén --</option>
              <option *ngFor="let a of almacenes" [ngValue]="a.almacen_id">
                {{ a.nombre }}
              </option>
            </select>
          </div>

          <!-- Alerta si producido < pedido -->
          <p *ngIf="item.cantidad_producida < item.cantidad_pedida"
             class="text-xs text-yellow-600 mt-1.5">
            Producirás menos de lo pedido
            ({{ item.cantidad_pedida - item.cantidad_producida }} faltantes)
          </p>

        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-2 mt-5">
        <button (click)="mostrarModalProduccion = false"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
          Cancelar
        </button>
        <button (click)="guardarProduccion()"
                [disabled]="guardandoProduccion"
                class="px-6 py-2 bg-green-600 hover:bg-green-700
                       text-white rounded disabled:opacity-50">
          {{ guardandoProduccion ? 'Registrando...' : 'Confirmar producción' }}
        </button>
      </div>

    </div>
  </div>

</div>
  `
})
export class SeguimientoComponent implements OnInit {

  cola:      any[] = [];
  loading         = true;
  procesando: number | null = null;

  // Modal producción
  mostrarModalProduccion = false;
  pedidoProduccion: any  = null;
  almacenes: any[]       = [];
  guardandoProduccion    = false;
  itemsProduccion: {
    producto_id:         number;
    producto:            string;
    cantidad_pedida:     number;
    cantidad_producida:  number;
    almacen_id:          number | null;
  }[] = [];

  private readonly siguienteEstado: Record<string, number> = {
    'PENDIENTE':  2,
    'CONFIRMADO': 3
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
    // Cargar almacenes una sola vez — ya filtrados por sucursal del JWT
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

  // ─────────────────────────────────────────────
  abrirModalProduccion(p: any) {
    this.pedidoProduccion      = p;
    this.mostrarModalProduccion = true;
    this.guardandoProduccion   = false;

    this.itemsProduccion = p.detalles.map((d: any) => ({
      producto_id:        d.producto_id,
      producto:           d.producto,
      cantidad_pedida:    d.cantidad,
      cantidad_producida: d.cantidad, // default: exactamente lo pedido
      almacen_id:         this.almacenes.length === 1
                            ? this.almacenes[0].almacen_id  // autoselect si hay uno solo
                            : null
    }));

    this.cd.detectChanges();
  }

  guardarProduccion() {
    if (this.guardandoProduccion) return;

    // Validaciones
    const sinAlmacen = this.itemsProduccion.some(i => !i.almacen_id);
    if (sinAlmacen) {
      Swal.fire('Atención', 'Selecciona el almacén para todos los productos', 'warning');
      return;
    }

    const sinCantidad = this.itemsProduccion.some(i => i.cantidad_producida < 1);
    if (sinCantidad) {
      Swal.fire('Atención', 'La cantidad producida debe ser mayor a 0', 'warning');
      return;
    }

    this.guardandoProduccion = true;

    // Una ENTRADA por cada producto producido
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
        Swal.fire({
          icon:              'success',
          title:             'Producción registrada',
          text:              'El stock fue actualizado correctamente',
          timer:             2000,
          showConfirmButton: false
        });
        this.guardandoProduccion    = false;
        this.mostrarModalProduccion = false;
        this.cargar();
      })
      .catch(err => {
        this.guardandoProduccion = false;
        Swal.fire('Error', err?.error || 'No se pudo registrar', 'error');
      });
  }

  // ─────────────────────────────────────────────
  accionarPedido(p: any) {
    const siguiente = this.siguienteEstado[p.estado];
    if (!siguiente) return;

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
      }
    };

    const conf = textos[p.estado];

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
          Swal.fire('Error', err?.error || 'No se pudo cambiar el estado', 'error');
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  puedeAccionar(p: any): boolean {
    const rol = this.authService.getRolId();
    if (rol === 0 || rol === 1) return true;
    if (rol !== 3) return false;
    return p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO';
  }

  puedeRegistrarProduccion(): boolean {
    const rol = this.authService.getRolId();
    return rol === 0 || rol === 1 || rol === 3;
  }

  tieneStockCritico(p: any): boolean {
    return p.detalles.some((d: any) => d.semaforo === 'sin_stock');
  }

  getTextoBoton(estado: string): string {
    return estado === 'PENDIENTE' ? 'Confirmar pedido' : 'Iniciar preparación';
  }

  getBotonClase(estado: string): string {
    return estado === 'PENDIENTE'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-purple-600 hover:bg-purple-700 text-white';
  }

  getBadgeEstado(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE':      'bg-yellow-100 text-yellow-800',
      'CONFIRMADO':     'bg-blue-100 text-blue-800',
      'EN_PREPARACION': 'bg-purple-100 text-purple-800'
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