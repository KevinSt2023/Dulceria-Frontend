import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidosService } from '../../core/services/pedidos';
import { ClientesService } from '../../core/services/clientes';
import { ProductosService } from '../../core/services/productos';
import { AuthService } from '../../core/auth/auth';

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
      <button (click)="nuevoPedido()" class="bg-green-600 text-white px-4 py-2 rounded-lg">
        + Nuevo Pedido
      </button>
      <button (click)="cargar()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">
        🔄 Refrescar
      </button>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">Cargando pedidos...</div>

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
          <th class="p-3 text-center hidden md:table-cell">Fecha</th>
          <th class="p-3 text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <!-- Sin pedidos -->
        <tr *ngIf="pedidos.length === 0">
          <td colspan="7" class="p-6 text-center text-gray-400">No hay pedidos registrados</td>
        </tr>

        <tr *ngFor="let p of pedidos" class="border-t hover:bg-gray-50">
          <td class="p-3 font-bold text-center">{{ p.pedido_id }}</td>
          <td class="p-3 text-center">{{ p.cliente }}</td>
          <td class="p-3 text-center hidden md:table-cell">{{ p.sucursal }}</td>
          <td class="p-3 text-center text-green-600 font-bold">S/ {{ p.total }}</td>

          <td class="p-3 text-center">
            <span [ngClass]="getEstadoClase(p.estado)"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ p.estado }}
            </span>
          </td>

          <td class="p-3 text-center hidden md:table-cell text-sm text-gray-500">
            {{ p.fecha | date:'dd/MM/yy HH:mm' }}
          </td>

          <td class="p-3 text-center">
            <div class="flex justify-center gap-1">
              <!-- Ver detalle -->
              <button (click)="verDetalle(p)"
                      title="Ver detalle"
                      class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm">
                👁️
              </button>

              <!-- Avanzar estado: oculto si es final -->
              <button *ngIf="puedeAvanzar(p)"
                      (click)="cambiarEstado(p)"
                      title="Avanzar estado"
                      class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm">
                      {{ getTextoAccion(p.estado) }}
              </button>

              <!-- Cancelar: oculto si ya es final -->
              <button *ngIf="!esFinal(p.estado)"
                      (click)="cancelarPedido(p)"
                      title="Cancelar pedido"
                      class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                ❌
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ══════════════════════════════════════════
       MODAL NUEVO PEDIDO
  ══════════════════════════════════════════ -->
  <div *ngIf="mostrarModal"
       class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div class="bg-white w-full h-full md:h-auto md:max-w-3xl rounded-none md:rounded-2xl p-6 overflow-y-auto">

      <!-- Cabecera modal -->
      <div class="flex justify-between items-center mb-5">
        <h3 class="text-xl font-bold">Nuevo Pedido</h3>
        <button (click)="cerrarModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <!-- ── PASO 1: Cliente ── -->
      <div class="mb-5">
        <p class="text-sm font-semibold text-gray-500 uppercase mb-2">1. Cliente</p>

        <div class="flex gap-2 mb-3">
          <input [(ngModel)]="dniBusqueda"
                 placeholder="Buscar por DNI / documento"
                 class="flex-1 p-2 border rounded"
                 (keyup.enter)="buscarCliente()"/>
          <button (click)="buscarCliente()"
                  class="bg-blue-600 text-white px-4 rounded">
            Buscar
          </button>
        </div>

        <!-- Cliente encontrado -->
        <div *ngIf="clienteEncontrado"
             class="flex items-center gap-3 bg-green-50 border border-green-200 p-3 rounded">
          <span class="text-green-600 text-xl">✓</span>
          <div>
            <p class="font-semibold">{{ clienteEncontrado.nombre }}</p>
            <p class="text-sm text-gray-500">{{ clienteEncontrado.documento }} · {{ clienteEncontrado.telefono }}</p>
          </div>
        </div>

        <!-- Formulario nuevo cliente -->
        <div *ngIf="mostrarFormCliente" class="border border-yellow-200 bg-yellow-50 p-4 rounded">
          <p class="font-semibold text-yellow-700 mb-3">Registrar nuevo cliente</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input [(ngModel)]="nuevoCliente.nombre"    placeholder="Nombres y apellidos *" class="p-2 border rounded"/>
            <input [(ngModel)]="nuevoCliente.documento" placeholder="Nro. Documento"        class="p-2 border rounded" [value]="dniBusqueda" readonly/>
            <input [(ngModel)]="nuevoCliente.telefono"  placeholder="Celular"               class="p-2 border rounded"/>
            <input [(ngModel)]="nuevoCliente.email"     placeholder="Correo electrónico"    class="p-2 border rounded"/>
            <input [(ngModel)]="nuevoCliente.direccion" placeholder="Dirección"             class="p-2 border rounded md:col-span-2"/>
          </div>
          <button (click)="crearCliente()"
                  class="mt-3 bg-green-600 text-white px-4 py-2 rounded w-full">
            Guardar Cliente
          </button>
        </div>
      </div>

      <!-- ── PASO 2: Productos ── -->
      <div class="mb-4">
        <p class="text-sm font-semibold text-gray-500 uppercase mb-2">2. Productos</p>

        <div class="flex gap-2 mb-3">
          <select [(ngModel)]="nuevoItem.producto_id" class="flex-1 p-2 border rounded">
            <option [ngValue]="null">-- Selecciona producto --</option>
            <option *ngFor="let p of productos" [ngValue]="p.producto_id">
              {{ p.nombre }} — S/ {{ p.precio }}
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

        <!-- Lista de items -->
        <div class="border rounded bg-gray-50 divide-y max-h-56 overflow-y-auto">
          <div *ngIf="form.detalles.length === 0"
               class="p-4 text-center text-gray-400 text-sm">
            Sin productos aún
          </div>

          <div *ngFor="let d of form.detalles; let i = index"
               class="flex items-center gap-2 p-2 bg-white">
            <span class="flex-1 text-sm font-medium">{{ d.producto }}</span>
            <input type="number"
                   [(ngModel)]="d.cantidad"
                   (ngModelChange)="recalcular(d)"
                   min="1"
                   class="w-16 border p-1 text-center rounded text-sm"/>
            <span class="w-24 text-right font-semibold text-sm">S/ {{ d.subtotal | number:'1.2-2' }}</span>
            <button (click)="eliminarItem(i)" class="text-red-400 hover:text-red-600 px-1">✕</button>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div class="flex justify-end items-center gap-2 mb-5">
        <span class="text-gray-500">Total:</span>
        <span class="text-2xl font-bold text-green-600">S/ {{ total | number:'1.2-2' }}</span>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-2">
        <button (click)="cerrarModal()"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
          Cancelar
        </button>
        <button (click)="guardarPedido()"
                [disabled]="guardando"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">
          {{ guardando ? 'Guardando...' : 'Guardar Pedido' }}
        </button>
      </div>

    </div>
  </div>

</div>
`
})
export class PedidosComponent implements OnInit {

  pedidos:  any[] = [];
  productos: any[] = [];

  dniBusqueda       = '';
  clienteEncontrado: any = null;
  mostrarFormCliente = false;

  nuevoCliente: any = {
    nombre: '', telefono: '', direccion: '', email: ''
  };

  // ── usuario_id y sucursal_id ya NO van aquí: los pone el backend desde el JWT ──
  form: any = {
    cliente_id: null,
    detalles:   []
  };

  nuevoItem: any = { producto_id: null, cantidad: 1 };

  mostrarModal = false;
  loading      = true;
  guardando    = false;

  // Mapa: estado actual → siguiente estado_id
  private readonly flujoEstados: Record<string, number> = {
    'PENDIENTE':      2,
    'CONFIRMADO':     3,
    'EN_PREPARACION': 4,
    'LISTO':          5
  };

  // Estados que no pueden avanzar ni cancelarse
  private readonly estadosFinales = new Set(['ENTREGADO', 'CANCELADO']);

  constructor(
    private pedidosService:  PedidosService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  // ─────────────────────────────────────────────
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
    this.mostrarModal      = true;
    this.form              = { cliente_id: null, detalles: [] };
    this.dniBusqueda       = '';
    this.clienteEncontrado = null;
    this.mostrarFormCliente = false;
    this.nuevoItem         = { producto_id: null, cantidad: 1 };

    this.productosService.getProductos().subscribe((res: any) => {
      this.productos = res;
      this.cd.detectChanges();
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  // ─────────────────────────────────────────────
  buscarCliente() {
    if (!this.dniBusqueda.trim()) {
      Swal.fire('¡Cuidado!', 'Ingrese un número de documento', 'warning');
      return;
    }

    this.clientesService.getClienteDNI(this.dniBusqueda).subscribe({
      next: (res: any) => {
        this.clienteEncontrado  = res;
        this.form.cliente_id    = res.cliente_id;
        this.mostrarFormCliente = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.clienteEncontrado = null;
        this.mostrarFormCliente = true;
        this.nuevoCliente = { nombre: '', telefono: '', direccion: '', email: '' };
        Swal.fire('Aviso', 'Cliente no encontrado — regístrelo', 'warning');
        this.cd.detectChanges();
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

  // ─────────────────────────────────────────────
  agregarItem() {
    if (!this.nuevoItem.producto_id) {
      Swal.fire('Atención', 'Selecciona un producto', 'warning');
      return;
    }

    if (!this.nuevoItem.cantidad || this.nuevoItem.cantidad < 1) {
      Swal.fire('Atención', 'La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    const prod = this.productos.find(p => p.producto_id === this.nuevoItem.producto_id);

    // Si el producto ya está en la lista, solo suma cantidad
    const existente = this.form.detalles.find((d: any) => d.producto_id === prod.producto_id);
    if (existente) {
      existente.cantidad += this.nuevoItem.cantidad;
      this.recalcular(existente);
    } else {
      this.form.detalles.push({
        producto_id: prod.producto_id,
        producto:    prod.nombre,
        cantidad:    this.nuevoItem.cantidad,
        precio:      prod.precio,
        subtotal:    prod.precio * this.nuevoItem.cantidad
      });
    }

    this.nuevoItem = { producto_id: null, cantidad: 1 };
  }

  recalcular(d: any) {
    d.subtotal = d.precio * d.cantidad;
  }

  eliminarItem(i: number) {
    this.form.detalles.splice(i, 1);
  }

  get total() {
    return this.form.detalles.reduce((a: number, b: any) => a + b.subtotal, 0);
  }

  // ─────────────────────────────────────────────
  guardarPedido() {
    if (!this.form.cliente_id) {
      Swal.fire('Falta cliente', 'Busca o registra un cliente antes de guardar', 'warning');
      return;
    }

    if (this.form.detalles.length === 0) {
      Swal.fire('Sin productos', 'Agrega al menos un producto al pedido', 'warning');
      return;
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

  // ─────────────────────────────────────────────
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
        <td style="padding:4px 8px;text-align:right;font-weight:600">S/ ${Number(d.subtotal).toFixed(2)}</td>
      </tr>`
    ).join('');

    Swal.fire({
      title: `Pedido #${p.pedido_id}`,
      html: `
        <table style="width:100%;font-size:14px;border-collapse:collapse">
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
              <td style="padding:8px;text-align:right;font-weight:700;color:#16a34a">S/ ${Number(p.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>`,
      width: 500
    });
  }

  // ─────────────────────────────────────────────
  cambiarEstado(p: any) {

  const rol = this.authService.getRolId();

  let siguiente = null;

  if (rol === 3 && p.estado === 'PENDIENTE') {
    siguiente = 2; // CONFIRMADO
  }

  else if (rol === 3 && p.estado === 'CONFIRMADO') {
    siguiente = 3; // EN_PREPARACION
  }

  else if (rol === 4 && p.estado === 'EN_PREPARACION') {
    siguiente = 4; // LISTO
  }

  else if ((rol === 4 || rol === 5) && p.estado === 'LISTO') {
    siguiente = 5; // ENTREGADO
  }

  else if (this.authService.isAdminOrSuper()) {
    siguiente = this.flujoEstados[p.estado];
  }

  if (!siguiente) {
    Swal.fire('No permitido', 'No puedes cambiar este estado', 'warning');
    return;
  }

  this.pedidosService.cambiarEstado(p.pedido_id, siguiente)
    .subscribe({
      next: () => this.cargar(),
      error: (err) => Swal.fire('Error', err.error, 'error')
    });
}


  cancelarPedido(p: any) {
    Swal.fire({
      title: '¿Cancelar pedido?',
      text: `Pedido #${p.pedido_id} de ${p.cliente}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then(r => {
      if (!r.isConfirmed) return;

      this.pedidosService.cancelarPedido(p.pedido_id).subscribe({
        next: () => this.cargar(),
        error: (err) => Swal.fire('Error', err?.error || 'No se pudo cancelar', 'error')
      });
    });
  }

  // ─────────────────────────────────────────────
  esFinal(estado: string): boolean {
    return this.estadosFinales.has(estado);
  }

  getEstadoClase(e: string): string {
    const clases: Record<string, string> = {
      'PENDIENTE':      'bg-yellow-100 text-yellow-800',
      'CONFIRMADO':     'bg-blue-100 text-blue-800',
      'EN_PREPARACION': 'bg-purple-100 text-purple-800',
      'LISTO':          'bg-green-100 text-green-800',
      'ENTREGADO':      'bg-gray-200 text-gray-700',
      'CANCELADO':      'bg-red-100 text-red-700'
    };
    return clases[e] ?? 'bg-gray-100 text-gray-600';
  }

  puedeAvanzar(p:any){
  return !this.esFinal(p.estado);
  }

  getTextoAccion(estado:string){
    const map:any = {
      'PENDIENTE': 'Confirmar',
      'CONFIRMADO': 'Preparar',
      'EN_PREPARACION': 'Marcar listo',
      'LISTO': 'Entregar'
    };
    return map[estado] || 'Avanzar';
  }
}