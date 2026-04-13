import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidosService } from '../../core/services/pedidos';
import { ClientesService } from '../../core/services/clientes';
import { ProductosService } from '../../core/services/productos';

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

  <!-- TABLA -->
  <div class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-3 text-center">N°</th>
          <th class="p-3 text-center">Cliente</th>
          <th class="p-3 text-center">Sucursal</th>
          <th class="p-3 text-center">Total</th>
          <th class="p-3 text-center">Estado</th>
          <th class="p-3 text-center hidden md:table-cell">Fecha</th>
          <th class="p-3 text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr *ngFor="let p of pedidos" class="border-t hover:bg-gray-50">

          <td class="p-3 font-bold text-center">{{ p.pedido_id }}</td>
          <td class="p-3 text-center">{{ p.cliente }}</td>
          <td class="p-3 text-center">{{ p.sucursal }}</td>
          <td class="p-3 text-center text-green-600 font-bold">S/ {{ p.total }}</td>

          <td class="p-3 text-center">
            <span [ngClass]="getEstadoClase(p.estado)" class="px-2 py-1 rounded text-xs">
              {{ p.estado }}
            </span>
          </td>

          <td class="p-3 text-center hidden md:table-cell">
            {{ p.fecha | date:'short' }}
          </td>

          <td class="p-3 text-center flex justify-center gap-2">
            <button (click)="verDetalle(p)" class="bg-gray-500 text-white px-2 rounded">👁️</button>
            <button (click)="cambiarEstado(p)" class="bg-blue-500 text-white px-2 rounded">🔄</button>
            <button (click)="cancelarPedido(p)" class="bg-red-500 text-white px-2 rounded">❌</button>
          </td>

        </tr>
      </tbody>
    </table>
  </div>

  <!-- MODAL -->
  <div *ngIf="mostrarModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div class="bg-white w-full h-full md:h-auto md:max-w-6xl lg:max-w-7xl rounded-none md:rounded-2xl p-6 overflow-y-auto">

      <h3 class="text-xl font-bold mb-4">Nuevo Pedido</h3>

      <!-- BUSCAR CLIENTE -->
      <div class="flex gap-2 mb-4">
        <input [(ngModel)]="dniBusqueda" placeholder="Buscar DNI" class="flex-1 p-2 border rounded"/>
        <button (click)="buscarCliente()" class="bg-blue-600 text-white px-3 rounded">Buscar</button>
      </div>

      <!-- CLIENTE -->
      <div *ngIf="clienteEncontrado" class="bg-gray-100 p-3 rounded mb-4">
        <b>{{ clienteEncontrado.nombre }}</b><br>
        {{ clienteEncontrado.documento }} - {{ clienteEncontrado.telefono }}
      </div>

      <!-- NUEVO CLIENTE -->
      <div *ngIf="mostrarFormCliente" class="border p-4 rounded mb-4">
        <h4 class="font-bold mb-2">Registrar Cliente</h4>

        <input [(ngModel)]="nuevoCliente.nombre" placeholder="Nombres y apellidos" class="w-full p-2 border mb-2"/>
        <input [(ngModel)]="nuevoCliente.documento" placeholder="Nro. Documento" class="w-full p-2 border mb-2"/>
        <input [(ngModel)]="nuevoCliente.telefono" placeholder="Celular" class="w-full p-2 border mb-2"/>
        <input [(ngModel)]="nuevoCliente.direccion" placeholder="Dirección" class="w-full p-2 border mb-2"/>
        <input [(ngModel)]="nuevoCliente.email" placeholder="Correo Electrónico" class="w-full p-2 border mb-2"/>

        <button (click)="crearCliente()" class="bg-green-600 text-white px-4 py-2 rounded">
          Guardar Cliente
        </button>
      </div>

      <!-- PRODUCTOS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select [(ngModel)]="nuevoItem.producto_id" class="p-3 border rounded w-full">
          <option [ngValue]="null">Producto</option>
          <option *ngFor="let p of productos" [ngValue]="p.producto_id">
            {{ p.nombre }}
          </option>
        </select>

        <input type="number" [(ngModel)]="nuevoItem.cantidad" class="p-3 border rounded w-full"/>

        <button (click)="agregarItem()" class="bg-green-500 text-white px-4 rounded w-full">
        Agregar
        </button>
      </div>

      <!-- DETALLE -->
      <div class="border p-4 rounded mb-4 max-h-64 overflow-auto bg-gray-50">
        <div *ngFor="let d of form.detalles; let i = index" 
     class="grid grid-cols-4 items-center gap-2 mb-2 bg-white p-2 rounded shadow-sm">
        <div class="text-sm font-medium">{{ d.producto }}</div>
        <input type="number"
            [(ngModel)]="d.cantidad"
            (ngModelChange)="recalcular(d)"
            class="border p-1 text-center rounded"/>
        <div class="text-right font-semibold">
            S/ {{ d.subtotal }}
        </div>
        <button (click)="eliminarItem(i)" class="text-red-500">
            ❌
        </button>
        </div>
      </div>

      <!-- TOTAL -->
      <div class="text-right font-bold text-lg mb-4">
        Total: S/ {{ total }}
      </div>

      <!-- BOTONES -->
      <div class="flex justify-end gap-2">
        <button (click)="mostrarModal=false" class="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button (click)="guardarPedido()" class="px-4 py-2 bg-blue-600 text-white rounded">
          Guardar Pedido
        </button>
      </div>

    </div>
  </div>

</div>
`
})
export class PedidosComponent implements OnInit {

  pedidos: any[] = [];
  productos: any[] = [];

  dniBusqueda = '';
  clienteEncontrado: any = null;
  mostrarFormCliente = false;

  nuevoCliente: any = {
    nombre: '',
    telefono: '',
    direccion: '',
    email: ''
  };

  form: any = {
    cliente_id: null,
    usuario_id: 1,
    sucursal_id: 1,
    detalles: []
  };

  nuevoItem: any = {
    producto_id: null,
    cantidad: 1
  };

  mostrarModal = false;
  loading = true;

  constructor(
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.pedidosService.getPedidos().subscribe((res: any) => {
      this.pedidos = res;
      this.loading = false;
      this.cd.detectChanges();
    });
  }

  nuevoPedido() {
    this.mostrarModal = true;
    this.form.detalles = [];
    this.productosService.getProductos().subscribe((res:any)=> this.productos = res);
    this.dniBusqueda = '';
    this.clienteEncontrado = null;
    this.mostrarFormCliente = false;
  }

  buscarCliente() {
    if (!this.dniBusqueda) {
        Swal.fire('¡Cuidado!', 'Ingrese Nro. DNI', 'warning');
        return;
    }

    this.clientesService.getClienteDNI(this.dniBusqueda).subscribe({
        next: (res: any) => {
        this.clienteEncontrado = res;
        this.form.cliente_id = res.cliente_id;
        this.mostrarFormCliente = false;

        this.cd.detectChanges();
        },
        error: () => {
        this.clienteEncontrado = null;
        Swal.fire('Aviso!', 'Cliente no encontrado, regístrelo', 'warning');        
        this.mostrarFormCliente = true;

        this.cd.detectChanges();
        }
    });
    }


  crearCliente() {
    this.nuevoCliente.documento = this.dniBusqueda;

    this.clientesService.createClientes(this.nuevoCliente).subscribe((res:any)=>{
      this.form.cliente_id = res.cliente_id;
      this.clienteEncontrado = res;
      this.mostrarFormCliente = false;

      Swal.fire('OK','Cliente creado','success');
    });
  }

  agregarItem() {
    const prod = this.productos.find(p=>p.producto_id==this.nuevoItem.producto_id);

    this.form.detalles.push({
      producto_id: prod.producto_id,
      producto: prod.nombre,
      cantidad: this.nuevoItem.cantidad,
      precio: prod.precio,
      subtotal: prod.precio * this.nuevoItem.cantidad
    });
  }

  recalcular(d:any){
    d.subtotal = d.precio * d.cantidad;
  }

  eliminarItem(i:number){
    this.form.detalles.splice(i,1);
  }

  get total(){
    return this.form.detalles.reduce((a:any,b:any)=>a+b.subtotal,0);
  }

  guardarPedido(){
    this.pedidosService.createPedido(this.form).subscribe(()=>{
      Swal.fire('OK','Pedido creado','success');
      this.mostrarModal=false;
      this.cargar();
    });
  }

  verDetalle(p:any){
    let html = '';

    p.detalles.forEach((d:any)=>{
      html += `• ${d.producto} - ${d.cantidad} x ${d.precio} = ${d.subtotal}<br>`;
    });

    Swal.fire('Detalle', html);
  }

  cambiarEstado(p:any){
    this.pedidosService.cambiarEstado(p.pedido_id,2).subscribe(()=>this.cargar());
  }

  cancelarPedido(p:any){
    this.pedidosService.cancelarPedido(p.pedido_id).subscribe(()=>this.cargar());
  }

  getEstadoClase(e:string){
    return {
      'PENDIENTE':'bg-yellow-100',
      'CONFIRMADO':'bg-blue-100',
      'EN_PRODUCCION':'bg-purple-100',
      'LISTO':'bg-green-100',
      'ENTREGADO':'bg-gray-200',
      'CANCELADO':'bg-red-100'
    }[e];
  }
}
