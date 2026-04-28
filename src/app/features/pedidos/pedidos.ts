import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidosService } from '../../core/services/pedidos';
import { ClientesService } from '../../core/services/clientes';
import { ProductosService } from '../../core/services/productos';
import { SucursalesService } from '../../core/services/sucursales';
import { UbigeoService } from '../../core/services/ubigeos';
import { AuthService } from '../../core/auth/auth';
import { ColorService } from '../../core/services/color';
import { ConfiguracionPagoService } from '../../core/services/configuracion-pago';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Pedidos</h2>
      <p class="text-sm text-gray-400 mt-0.5">{{ pedidos.length }} pedidos registrados</p>
    </div>
    <div class="flex gap-2">
      <button (click)="cargar()"
              class="bg-slate-100 hover:bg-slate-200 text-gray-600 px-4 py-2 rounded-lg text-sm transition-colors">
        🔄 Refrescar
      </button>
      <button (click)="nuevoPedido()"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        + Nuevo Pedido
      </button>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">Cargando pedidos...</div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto">
    <table class="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">N°</th>
          <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Sucursal</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tipo</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
          <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="pedidos.length === 0">
          <td colspan="8" class="p-10 text-center text-gray-400 text-sm">
            <p class="text-3xl mb-2">📋</p>No hay pedidos registrados
          </td>
        </tr>
        <tr *ngFor="let p of pedidos" class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
          <td class="p-3 text-center"><span class="font-bold text-gray-800 text-sm">{{ p.pedido_id }}</span></td>
          <td class="p-3">
            <p class="font-medium text-gray-800 text-sm">{{ p.cliente }}</p>
            <p *ngIf="p.direccion_entrega" class="text-xs text-gray-400 truncate max-w-[180px]">{{ p.direccion_entrega }}</p>
          </td>
          <td class="p-3 text-center hidden md:table-cell">
            <span [ngClass]="colors.getSucursalClase(p.sucursal)" class="px-2.5 py-1 rounded-full text-xs font-medium">{{ p.sucursal }}</span>
          </td>
          <td class="p-3 text-center"><span class="font-bold text-green-600 text-sm">S/ {{ p.total | number:'1.2-2' }}</span></td>
          <td class="p-3 text-center">
            <span [ngClass]="getEstadoClase(p.estado)" class="px-2.5 py-1 rounded-full text-xs font-medium">{{ p.estado }}</span>
          </td>
          <td class="p-3 text-center hidden md:table-cell">
            <span [ngClass]="p.tipos_pedido === 'DELIVERY' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'"
                  class="px-2.5 py-1 rounded-full text-xs font-medium">
              {{ p.tipos_pedido === 'DELIVERY' ? '🛵 Delivery' : '🏪 Pickup' }}
            </span>
          </td>
          <td class="p-3 text-center hidden md:table-cell">
            <p class="text-xs text-gray-600">{{ p.fecha | date:'dd/MM/yyyy' }}</p>
            <p class="text-xs text-gray-400">{{ p.fecha | date:'HH:mm' }}</p>
          </td>
          <td class="p-3">
            <div class="flex justify-center gap-1.5">
              <button (click)="verDetalle(p)" title="Ver detalle"
                      class="bg-slate-100 hover:bg-slate-200 text-slate-600 w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors">
                👁️
              </button>
              <button *ngIf="puedeAvanzar(p)" (click)="cambiarEstado(p)"
                      class="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {{ getTextoAccion(p.estado) }}
              </button>
              <button *ngIf="!esFinal(p.estado)" (click)="cancelarPedido(p)" title="Cancelar pedido"
                      class="bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ══ MODAL NUEVO PEDIDO ══ -->
  <div *ngIf="mostrarModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col" style="max-height: 90vh;">

      <div class="flex justify-between items-center p-6 border-b flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold text-gray-800">Nuevo Pedido</h3>
          <p class="text-xs text-gray-400 mt-0.5">Paso {{ paso }} de {{ pasos.length }} — {{ pasos[paso - 1] }}</p>
        </div>
        <button (click)="cerrarModal()"
                class="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">✕</button>
      </div>

      <div class="flex items-center gap-1 px-6 py-3 border-b flex-shrink-0 bg-gray-50">
        <div *ngFor="let s of pasos; let i = index" class="flex items-center gap-1">
          <div [ngClass]="paso > i + 1 ? 'bg-green-500 text-white' : paso === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'"
               class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all">
            {{ paso > i + 1 ? '✓' : i + 1 }}
          </div>
          <span [ngClass]="paso >= i + 1 ? 'text-gray-700' : 'text-gray-400'" class="text-xs font-medium hidden sm:block mr-1">{{ s }}</span>
          <div *ngIf="i < pasos.length - 1" class="w-8 h-px mx-1" [ngClass]="paso > i + 1 ? 'bg-green-400' : 'bg-gray-200'"></div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">

        <!-- PASO 1: Cliente -->
        <div *ngIf="paso === 1">
          <div class="flex gap-2 mb-4">
            <input [(ngModel)]="dniBusqueda" placeholder="DNI (8 dígitos) o RUC (11 dígitos)" maxlength="11"
                   class="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                   (keyup.enter)="buscarCliente()"/>
            <button (click)="buscarCliente()" [disabled]="buscandoCliente || (dniBusqueda.length !== 8 && dniBusqueda.length !== 11)"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl text-sm disabled:opacity-50 transition-colors">
              {{ buscandoCliente ? '⏳' : '🔍 Buscar' }}
            </button>
          </div>
          <div *ngIf="clienteEncontrado" class="flex items-center gap-3 bg-green-50 border border-green-200 p-3 rounded-xl mb-4">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">✓</div>
            <div>
              <p class="font-semibold text-gray-800 text-sm">{{ clienteEncontrado.nombre }}</p>
              <p class="text-xs text-gray-500">{{ clienteEncontrado.documento }}{{ clienteEncontrado.telefono ? ' · ' + clienteEncontrado.telefono : '' }}</p>
              <p *ngIf="clienteEncontrado.direccion" class="text-xs text-gray-400 mt-0.5">📍 {{ clienteEncontrado.direccion }}</p>
            </div>
          </div>
          <div *ngIf="mostrarFormCliente" class="border border-yellow-200 bg-yellow-50 p-4 rounded-xl">
            <p class="font-semibold text-yellow-700 text-sm mb-3">📝 Registrar nuevo cliente</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input [(ngModel)]="nuevoCliente.nombre" placeholder="Nombres y apellidos *" class="p-2.5 border border-yellow-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-400"/>
              <input [value]="dniBusqueda" placeholder="N° Documento" readonly class="p-2.5 border border-yellow-200 rounded-lg text-sm bg-yellow-100 text-gray-500"/>
              <input [(ngModel)]="nuevoCliente.telefono" placeholder="Celular" class="p-2.5 border border-yellow-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-400"/>
              <input [(ngModel)]="nuevoCliente.email" placeholder="Correo electrónico" class="p-2.5 border border-yellow-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-400"/>
              <input [(ngModel)]="nuevoCliente.direccion" placeholder="Dirección" class="p-2.5 border border-yellow-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-400 md:col-span-2"/>
            </div>
            <button (click)="crearCliente()" class="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors">Guardar cliente</button>
          </div>
          <div class="flex justify-end mt-4">
            <button (click)="irPaso(2)" [disabled]="!form.cliente_id"
                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors">Siguiente →</button>
          </div>
        </div>

        <!-- PASO 2: Productos -->
        <div *ngIf="paso === 2">
          <div class="flex gap-2 mb-3">
            <select [(ngModel)]="nuevoItem.producto_id" class="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none">
              <option [ngValue]="null">-- Selecciona producto --</option>
              <option *ngFor="let p of productos" [ngValue]="p.producto_id" [disabled]="!p.permite_pedido_sin_stock && p.stock_disponible === 0">
                {{ p.nombre }} — S/ {{ p.precio }} {{ !p.permite_pedido_sin_stock ? '(stock: ' + p.stock_disponible + ')' : '(encargo)' }}
              </option>
            </select>
            <input type="number" [(ngModel)]="nuevoItem.cantidad" min="1" class="w-20 p-2.5 border border-gray-200 rounded-xl text-center text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
            <button (click)="agregarItem()" class="bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl text-sm font-medium transition-colors">+ Agregar</button>
          </div>
          <div class="border border-gray-100 rounded-xl bg-gray-50 divide-y max-h-52 overflow-y-auto mb-4">
            <div *ngIf="form.detalles.length === 0" class="p-6 text-center text-gray-400 text-sm">Sin productos — agrega al menos uno</div>
            <div *ngFor="let d of form.detalles; let i = index" class="flex items-center gap-2 p-3 bg-white">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ d.producto }}</p>
                <span *ngIf="d.permite_pedido_sin_stock" class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">encargo</span>
              </div>
              <input type="number" [(ngModel)]="d.cantidad" (ngModelChange)="recalcular(d)" min="1" [max]="d.permite_pedido_sin_stock ? 9999 : d.stock_actual"
                     class="w-16 border border-gray-200 p-1.5 text-center rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
              <span class="w-24 text-right font-semibold text-sm text-green-600">S/ {{ d.subtotal | number:'1.2-2' }}</span>
              <button (click)="eliminarItem(i)" class="text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 transition-colors text-lg">✕</button>
            </div>
          </div>
          <div class="flex justify-between items-center mb-4 bg-green-50 border border-green-100 rounded-xl p-3">
            <span class="text-sm text-gray-600 font-medium">Total del pedido</span>
            <span class="text-xl font-bold text-green-600">S/ {{ total | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between">
            <button (click)="irPaso(1)" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">← Volver</button>
            <button (click)="irPaso(3)" [disabled]="form.detalles.length === 0" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors">Siguiente →</button>
          </div>
        </div>

        <!-- PASO 3: Tipo y entrega -->
        <div *ngIf="paso === 3">
          <div class="grid grid-cols-2 gap-3 mb-5">
            <button (click)="seleccionarTipo('DELIVERY')"
                    [ngClass]="form.tipos_pedido === 'DELIVERY' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'"
                    class="border-2 rounded-xl p-4 text-center transition-all">
              <p class="text-3xl mb-2">🛵</p>
              <p class="font-semibold text-sm text-gray-800">Delivery</p>
              <p class="text-xs text-gray-400 mt-0.5">Se lleva al cliente</p>
            </button>
            <button (click)="seleccionarTipo('PICKUP')"
                    [ngClass]="form.tipos_pedido === 'PICKUP' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
                    class="border-2 rounded-xl p-4 text-center transition-all">
              <p class="text-3xl mb-2">🏪</p>
              <p class="font-semibold text-sm text-gray-800">Pickup</p>
              <p class="text-xs text-gray-400 mt-0.5">Recoge en tienda</p>
            </button>
          </div>

          <!-- DELIVERY -->
          <div *ngIf="form.tipos_pedido === 'DELIVERY'" class="space-y-4">
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Método de pago</label>
              <div class="grid grid-cols-2 gap-2">
                <button (click)="seleccionarMetodo('contra_entrega', false)"
                        [ngClass]="form.metodo_pago === 'contra_entrega' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'"
                        class="border-2 rounded-xl p-3 text-center transition-all hover:border-gray-300">
                  <p class="text-xl mb-1">💵</p><p class="font-semibold text-xs text-gray-800">Contra entrega</p><p class="text-xs text-gray-400">Paga al recibir</p>
                </button>
                <button (click)="seleccionarMetodo('yape', true)"
                        [ngClass]="form.metodo_pago === 'yape' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'"
                        class="border-2 rounded-xl p-3 text-center transition-all hover:border-gray-300">
                  <p class="text-xl mb-1">📱</p><p class="font-semibold text-xs text-gray-800">Yape / Plin</p><p class="text-xs text-gray-400">Ya pagó</p>
                </button>
                <button (click)="seleccionarMetodo('efectivo', true)"
                        [ngClass]="form.metodo_pago === 'efectivo' ? 'border-green-500 bg-green-50' : 'border-gray-200'"
                        class="border-2 rounded-xl p-3 text-center transition-all hover:border-gray-300">
                  <p class="text-xl mb-1">💰</p><p class="font-semibold text-xs text-gray-800">Efectivo</p><p class="text-xs text-gray-400">Pago en tienda</p>
                </button>
                <button (click)="seleccionarMetodo('tarjeta', true)"
                        [ngClass]="form.metodo_pago === 'tarjeta' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
                        class="border-2 rounded-xl p-3 text-center transition-all hover:border-gray-300">
                  <p class="text-xl mb-1">💳</p><p class="font-semibold text-xs text-gray-800">Tarjeta</p><p class="text-xs text-gray-400">Pago en tienda</p>
                </button>
              </div>
            </div>

            <!-- QR Yape -->
            <div *ngIf="form.metodo_pago === 'yape' && qrActual"
                 class="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p class="text-xs text-purple-600 font-medium mb-3 text-center">📱 Muestra este QR al cliente para que pague</p>
              <div class="flex items-center gap-4">
                <img [src]="'data:image/png;base64,' + qrActual.qr_base64" class="w-28 h-28 object-contain rounded-lg border bg-white p-1 flex-shrink-0" alt="QR Yape"/>
                <div>
                  <p class="font-bold text-gray-800 text-sm">{{ qrActual.titular }}</p>
                  <p class="text-sm text-gray-500">{{ qrActual.numero }}</p>
                  <p class="text-xl font-bold text-green-600 mt-1">S/ {{ total | number:'1.2-2' }}</p>
                </div>
              </div>
            </div>

            <!-- N° Operación Yape obligatorio -->
            <div *ngIf="form.metodo_pago === 'yape'">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                N° Operación Yape <span class="text-red-500">*</span>
              </label>
              <input [(ngModel)]="form.referencia_pago"
                     placeholder="Código de operación que muestra el cliente"
                     class="w-full p-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                     [ngClass]="form.referencia_pago?.trim() ? 'border-green-400' : 'border-red-300'"/>
              <p class="text-xs text-gray-400 mt-1">El cliente verá este código en su app Yape/Plin</p>
            </div>

            <div *ngIf="form.metodo_pago === 'yape' && !qrActual && !cargandoQR"
                 class="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p class="text-xs text-yellow-700 text-center">⚠️ QR de Yape no configurado — pide al administrador que lo configure en Configuración → Métodos de pago</p>
            </div>

            <!-- Dirección -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Dirección de entrega</label>
              <div class="flex gap-2 mb-3">
                <button (click)="usarDireccionCliente()"
                        [ngClass]="usandoDireccionCliente ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                        class="flex-1 py-2 rounded-lg text-xs font-medium transition-colors">📍 Dirección del cliente</button>
                <button (click)="usarOtraDireccion()"
                        [ngClass]="!usandoDireccionCliente ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                        class="flex-1 py-2 rounded-lg text-xs font-medium transition-colors">🗺️ Otra dirección</button>
              </div>
              <div *ngIf="usandoDireccionCliente" class="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                <p *ngIf="clienteEncontrado?.direccion" class="text-gray-700">📍 {{ clienteEncontrado.direccion }}</p>
                <p *ngIf="!clienteEncontrado?.direccion" class="text-yellow-600 text-xs">⚠️ El cliente no tiene dirección registrada. Usa "Otra dirección".</p>
              </div>
              <div *ngIf="!usandoDireccionCliente" class="space-y-2">
                <select [(ngModel)]="entrega.departamento_id" (ngModelChange)="onDepartamentoChange($event)" class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                  <option [ngValue]="null">-- Departamento --</option>
                  <option *ngFor="let d of departamentos" [ngValue]="d.departamento_id">{{ d.nombre }}</option>
                </select>
                <select [(ngModel)]="entrega.provincia_id" (ngModelChange)="onProvinciaChange($event)" [disabled]="!entrega.departamento_id" class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:opacity-50">
                  <option [ngValue]="null">-- Provincia --</option>
                  <option *ngFor="let p of provincias" [ngValue]="p.provincia_id">{{ p.nombre }}</option>
                </select>
                <select [(ngModel)]="entrega.distrito_id" [disabled]="!entrega.provincia_id" class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:opacity-50">
                  <option [ngValue]="null">-- Distrito --</option>
                  <option *ngFor="let d of distritos" [ngValue]="d.distrito_id">{{ d.nombre }}</option>
                </select>
                <input [(ngModel)]="entrega.direccion" placeholder="Dirección exacta (calle, número, referencia)" class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
              </div>
            </div>

            <div>
              <label class="text-xs text-gray-500 block mb-1">Observaciones (opcional)</label>
              <input [(ngModel)]="form.observaciones" placeholder="Ej: dejar en recepción, llamar al llegar..."
                     class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
            </div>
          </div>

          <!-- PICKUP -->
          <div *ngIf="form.tipos_pedido === 'PICKUP'" class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Sucursal de recojo</label>
              <select [(ngModel)]="form.sucursal_recojo_id" class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                <option [ngValue]="null">-- Selecciona la sede --</option>
                <option *ngFor="let s of sucursales" [ngValue]="s.sucursal_id">{{ s.nombre }}{{ s.direccion ? ' — ' + s.direccion : '' }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">Observaciones (opcional)</label>
              <input [(ngModel)]="form.observaciones" placeholder="Ej: viene a las 3pm, pide sin sal..."
                     class="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <button (click)="irPaso(2)" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">← Volver</button>
            <button (click)="guardarPedido()" [disabled]="!puedeGuardar() || guardando"
                    class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors">
              {{ guardando ? '⏳ Guardando...' : '✓ Guardar Pedido' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ══ MODAL ENTREGA CAJERO — con scroll ══ -->
  <div *ngIf="mostrarModalEntrega" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" style="max-height:90vh">

      <!-- Cabecera fija -->
      <div class="flex justify-between items-center p-5 border-b flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold">Registrar entrega</h3>
          <p class="text-sm text-gray-500">Pedido #{{ pedidoEntrega?.pedido_id }} — {{ pedidoEntrega?.cliente }}</p>
        </div>
        <button (click)="mostrarModalEntrega = false" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">

        <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p class="text-xs text-green-600 mb-1">Total del pedido</p>
          <p class="text-3xl font-bold text-green-700">S/ {{ pedidoEntrega?.total | number:'1.2-2' }}</p>
        </div>

        <!-- Tipo de pago -->
        <div>
          <label class="text-xs text-gray-500 mb-2 block font-medium">Tipo de pago</label>
          <div class="grid grid-cols-2 gap-2">
            <button (click)="tipoPagoEntrega = 'CONTADO'; montoEntrega = pedidoEntrega?.total"
                    [ngClass]="tipoPagoEntrega === 'CONTADO' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-2.5 text-center text-xs font-semibold transition-all">✅ Contado</button>
            <button (click)="tipoPagoEntrega = 'CREDITO'; montoEntrega = 0"
                    [ngClass]="tipoPagoEntrega === 'CREDITO' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-2.5 text-center text-xs font-semibold transition-all">💳 Crédito</button>
          </div>
        </div>

        <!-- Método de pago -->
        <div>
          <label class="text-xs text-gray-500 mb-2 block font-medium">Método de pago</label>
          <div class="grid grid-cols-3 gap-2">
            <button *ngFor="let m of metodosPagoEntrega"
                    (click)="seleccionarMetodoEntrega(m.valor)"
                    [ngClass]="metodoEntrega === m.valor ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-500'"
                    class="border-2 rounded-xl p-2 text-center transition-all">
              <p class="text-lg">{{ m.icono }}</p>
              <p class="text-xs font-medium">{{ m.label }}</p>
            </button>
          </div>
        </div>

        <!-- QR Yape en modal entrega -->
        <div *ngIf="qrEntrega && metodoEntrega === 'yape'"
             class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p class="text-xs text-purple-600 font-medium mb-2">📱 Muestra el QR al cliente</p>
          <img [src]="'data:image/png;base64,' + qrEntrega.qr_base64" class="w-28 h-28 object-contain mx-auto border bg-white rounded-lg p-1"/>
          <p class="text-xs font-bold text-gray-800 mt-2">{{ qrEntrega.titular }}</p>
          <p class="text-xs text-gray-500">{{ qrEntrega.numero }}</p>
          <p class="text-base font-bold text-green-600 mt-1">S/ {{ pedidoEntrega?.total | number:'1.2-2' }}</p>
        </div>

        <!-- N° Operación Yape en modal entrega -->
        <div *ngIf="metodoEntrega === 'yape'">
          <label class="text-xs text-gray-500 mb-1 block font-medium">N° Operación Yape <span class="text-red-500">*</span></label>
          <input [(ngModel)]="referenciaEntrega"
                 placeholder="Código de operación Yape/Plin"
                 class="w-full p-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                 [ngClass]="referenciaEntrega.trim() ? 'border-green-400' : 'border-red-300'"/>
          <p class="text-xs text-gray-400 mt-1">El cliente verá el código en su app</p>
        </div>

        <!-- Monto -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block font-medium">
            {{ tipoPagoEntrega === 'CREDITO' ? 'Monto inicial (abono)' : 'Monto recibido' }}
          </label>
          <input type="number" [(ngModel)]="montoEntrega"
                 [min]="tipoPagoEntrega === 'CREDITO' ? 0 : pedidoEntrega?.total"
                 class="w-full p-3 border rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-cyan-400 outline-none"/>
        </div>

        <div *ngIf="tipoPagoEntrega === 'CONTADO' && montoEntrega > pedidoEntrega?.total"
             class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p class="text-xs text-blue-600">Vuelto</p>
          <p class="text-2xl font-bold text-blue-700">S/ {{ (montoEntrega - pedidoEntrega?.total) | number:'1.2-2' }}</p>
        </div>

        <div *ngIf="tipoPagoEntrega === 'CREDITO' && montoEntrega < pedidoEntrega?.total"
             class="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
          <p class="text-xs text-orange-600 font-medium">Saldo pendiente</p>
          <p class="text-xl font-bold text-orange-700">S/ {{ (pedidoEntrega?.total - montoEntrega) | number:'1.2-2' }}</p>
        </div>

      </div>

      <!-- Botones fijos abajo -->
      <div class="flex gap-2 p-5 border-t flex-shrink-0">
        <button (click)="mostrarModalEntrega = false"
                class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium">Cancelar</button>
        <button (click)="confirmarEntrega()"
                [disabled]="procesandoEntrega ||
                            (tipoPagoEntrega === 'CONTADO' && montoEntrega < pedidoEntrega?.total) ||
                            (tipoPagoEntrega === 'CREDITO' && montoEntrega < 0) ||
                            (metodoEntrega === 'yape' && !referenciaEntrega.trim())"
                class="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
          {{ procesandoEntrega ? 'Procesando...' : tipoPagoEntrega === 'CREDITO' ? '💳 Registrar crédito' : '✓ Confirmar entrega' }}
        </button>
      </div>
    </div>
  </div>

</div>
  `
})
export class PedidosComponent implements OnInit {

  pedidos:       any[] = [];
  productos:     any[] = [];
  sucursales:    any[] = [];
  departamentos: any[] = [];
  provincias:    any[] = [];
  distritos:     any[] = [];

  paso  = 1;
  pasos = ['Cliente', 'Productos', 'Entrega'];

  dniBusqueda             = '';
  clienteEncontrado: any  = null;
  mostrarFormCliente      = false;
  usandoDireccionCliente  = false;
  buscandoCliente         = false;
  cargandoQR              = false;
  qrActual: any           = null;
  mostrarModalEntrega     = false;
  pedidoEntrega: any      = null;
  montoEntrega            = 0;
  metodoEntrega           = 'efectivo';
  tipoPagoEntrega         = 'CONTADO';
  procesandoEntrega       = false;
  referenciaEntrega       = '';
  qrEntrega: any          = null;

  nuevoCliente: any = { nombre: '', telefono: '', direccion: '', email: '' };

  metodosPagoEntrega = [
    { valor: 'efectivo', icono: '💵', label: 'Efectivo' },
    { valor: 'yape',     icono: '📱', label: 'Yape/Plin' },
    { valor: 'tarjeta',  icono: '💳', label: 'Tarjeta' }
  ];

  form: any = {
    cliente_id: null, detalles: [], tipos_pedido: null,
    observaciones: '', direccion_entrega: '',
    sucursal_recojo_id: null, pagado: false,
    metodo_pago: null, referencia_pago: ''
  };

  entrega: any = { departamento_id: null, provincia_id: null, distrito_id: null, direccion: '' };
  nuevoItem: any = { producto_id: null, cantidad: 1 };
  mostrarModal = false;
  loading      = true;
  guardando    = false;

  private readonly flujoEstados: Record<string, number> = {
    'PENDIENTE': 2, 'CONFIRMADO': 3, 'EN_PREPARACION': 4, 'LISTO': 5
  };
  private readonly estadosFinales = new Set(['ENTREGADO', 'CANCELADO']);

  constructor(
    private pedidosService:    PedidosService,
    private clientesService:   ClientesService,
    private productosService:  ProductosService,
    private sucursalesService: SucursalesService,
    private ubigeoService:     UbigeoService,
    private authService:       AuthService,
    private configPagoService: ConfiguracionPagoService,
    private cd:                ChangeDetectorRef,
    public  colors:            ColorService
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.pedidosService.getPedidos().subscribe({
      next: (res: any) => { this.pedidos = res; this.loading = false; this.cd.detectChanges(); },
      error: () => { this.loading = false; Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error'); }
    });
  }

  nuevoPedido() {
    this.paso = 1; this.mostrarModal = true; this.qrActual = null;
    this.form = { cliente_id: null, detalles: [], tipos_pedido: null, observaciones: '', direccion_entrega: '', sucursal_recojo_id: null, pagado: false, metodo_pago: null, referencia_pago: '' };
    this.entrega = { departamento_id: null, provincia_id: null, distrito_id: null, direccion: '' };
    this.dniBusqueda = ''; this.clienteEncontrado = null;
    this.mostrarFormCliente = false; this.usandoDireccionCliente = false;
    this.nuevoItem = { producto_id: null, cantidad: 1 };
    this.productosService.getProductosDisponibles().subscribe((res: any) => { this.productos = res; this.cd.detectChanges(); });
    this.sucursalesService.getSucursalesPickup().subscribe((res: any) => { this.sucursales = res.filter((s: any) => s.activo); this.cd.detectChanges(); });
    this.ubigeoService.getDepartamentos().subscribe((res: any) => { this.departamentos = res; this.cd.detectChanges(); });
  }

  cerrarModal() { this.mostrarModal = false; }
  irPaso(n: number) { this.paso = n; this.cd.detectChanges(); }

  seleccionarMetodo(metodo: string, pagado: boolean) {
    this.form.metodo_pago     = metodo;
    this.form.pagado          = pagado;
    this.form.referencia_pago = '';
    this.qrActual             = null;
    if (metodo === 'yape') this.cargarQR('yape');
    this.cd.detectChanges();
  }

  cargarQR(tipo: string) {
    this.cargandoQR = true;
    this.configPagoService.getQR(tipo).subscribe({
      next:  (res: any) => { this.qrActual = res; this.cargandoQR = false; this.cd.detectChanges(); },
      error: ()         => { this.qrActual = null; this.cargandoQR = false; this.cd.detectChanges(); }
    });
  }

  seleccionarMetodoEntrega(valor: string) {
    this.metodoEntrega    = valor;
    this.referenciaEntrega = '';
    this.qrEntrega        = null;
    if (valor === 'yape') {
      this.configPagoService.getQR('yape').subscribe({
        next:  (res: any) => { this.qrEntrega = res; this.cd.detectChanges(); },
        error: ()         => { this.qrEntrega = null; this.cd.detectChanges(); }
      });
    }
    this.cd.detectChanges();
  }

  buscarCliente() {
    if (!this.dniBusqueda.trim()) { Swal.fire('¡Cuidado!', 'Ingrese un número de documento', 'warning'); return; }
    if (this.buscandoCliente) return;
    this.buscandoCliente = true; this.cd.detectChanges();
    this.clientesService.getClienteDNI(this.dniBusqueda).subscribe({
      next: (res: any) => { this.buscandoCliente = false; this.clienteEncontrado = res; this.form.cliente_id = res.cliente_id; this.mostrarFormCliente = false; this.cd.detectChanges(); },
      error: () => {
        const esRUC = this.dniBusqueda.length === 11;
        const obs   = esRUC ? this.clientesService.consultarRUC(this.dniBusqueda) : this.clientesService.consultarDNI(this.dniBusqueda);
        obs.subscribe({
          next: (res: any) => {
            this.buscandoCliente = false;
            if (res.nombre) { this.nuevoCliente = { nombre: res.nombre, documento: res.documento, telefono: '', email: '', direccion: res.direccion ?? '' }; this.mostrarFormCliente = true; this.clienteEncontrado = null; }
            else { this.nuevoCliente = { nombre: '', telefono: '', email: '', direccion: '' }; this.mostrarFormCliente = true; this.clienteEncontrado = null; Swal.fire('No encontrado', 'Ingresa los datos manualmente', 'warning'); }
            this.cd.detectChanges();
          },
          error: () => { this.buscandoCliente = false; this.mostrarFormCliente = true; this.nuevoCliente = { nombre: '', telefono: '', email: '', direccion: '' }; this.cd.detectChanges(); }
        });
      }
    });
  }

  crearCliente() {
    if (!this.nuevoCliente.nombre?.trim()) { Swal.fire('Campo requerido', 'Ingrese el nombre del cliente', 'warning'); return; }
    this.nuevoCliente.documento = this.dniBusqueda;
    this.clientesService.createClientes(this.nuevoCliente).subscribe({
      next: (res: any) => { this.form.cliente_id = res.cliente_id; this.clienteEncontrado = res; this.mostrarFormCliente = false; Swal.fire({ icon: 'success', title: 'Cliente registrado', timer: 1500, showConfirmButton: false }); this.cd.detectChanges(); },
      error: () => Swal.fire('Error', 'No se pudo registrar el cliente', 'error')
    });
  }

  seleccionarTipo(tipo: string) {
    this.form.tipos_pedido = tipo; this.usandoDireccionCliente = false;
    this.form.sucursal_recojo_id = null; this.form.pagado = false;
    this.form.metodo_pago = null; this.form.referencia_pago = '';
    this.qrActual = null;
    this.entrega = { departamento_id: null, provincia_id: null, distrito_id: null, direccion: '' };
    this.cd.detectChanges();
  }

  usarDireccionCliente() { this.usandoDireccionCliente = true; this.form.direccion_entrega = this.clienteEncontrado?.direccion ?? ''; this.cd.detectChanges(); }
  usarOtraDireccion() { this.usandoDireccionCliente = false; this.entrega = { departamento_id: null, provincia_id: null, distrito_id: null, direccion: '' }; this.cd.detectChanges(); }

  onDepartamentoChange(departamentoId: number) {
    this.entrega.provincia_id = null; this.entrega.distrito_id = null; this.provincias = []; this.distritos = [];
    if (!departamentoId) return;
    this.ubigeoService.getProvincias(departamentoId).subscribe((res: any) => { this.provincias = res; this.cd.detectChanges(); });
  }

  onProvinciaChange(provinciaId: number) {
    this.entrega.distrito_id = null; this.distritos = [];
    if (!provinciaId) return;
    this.ubigeoService.getDistritos(provinciaId).subscribe((res: any) => { this.distritos = res; this.cd.detectChanges(); });
  }

  puedeGuardar(): boolean {
    if (!this.form.tipos_pedido) return false;
    if (this.form.tipos_pedido === 'PICKUP') return !!this.form.sucursal_recojo_id;
    if (this.form.tipos_pedido === 'DELIVERY') {
      if (!this.form.metodo_pago) return false;
      if (this.form.metodo_pago === 'yape' && !this.form.referencia_pago?.trim()) return false;
      if (this.usandoDireccionCliente) return !!(this.clienteEncontrado?.direccion || this.clienteEncontrado?.distrito_id);
      return !!(this.entrega.distrito_id && this.entrega.direccion?.trim());
    }
    return false;
  }

  agregarItem() {
    if (!this.nuevoItem.producto_id) { Swal.fire('Atención', 'Selecciona un producto', 'warning'); return; }
    if (!this.nuevoItem.cantidad || this.nuevoItem.cantidad < 1) { Swal.fire('Atención', 'La cantidad debe ser mayor a 0', 'warning'); return; }
    const prod = this.productos.find(p => p.producto_id === this.nuevoItem.producto_id);
    if (!prod.permite_pedido_sin_stock) {
      const yaEnCarrito = this.form.detalles.filter((d: any) => d.producto_id === prod.producto_id).reduce((sum: number, d: any) => sum + d.cantidad, 0);
      const totalSolicitado = yaEnCarrito + this.nuevoItem.cantidad;
      if (prod.stock_disponible === 0) { Swal.fire({ icon: 'error', title: 'Sin stock', text: `"${prod.nombre}" no tiene stock disponible.` }); return; }
      if (totalSolicitado > prod.stock_disponible) { Swal.fire({ icon: 'warning', title: 'Stock insuficiente', html: `Solo hay <b>${prod.stock_disponible}</b> unidad(es) disponibles de "<b>${prod.nombre}</b>".` }); return; }
    }
    const existente = this.form.detalles.find((d: any) => d.producto_id === prod.producto_id);
    if (existente) { existente.cantidad += this.nuevoItem.cantidad; this.recalcular(existente); }
    else { this.form.detalles.push({ producto_id: prod.producto_id, producto: prod.nombre, cantidad: this.nuevoItem.cantidad, precio: prod.precio, subtotal: prod.precio * this.nuevoItem.cantidad, stock_actual: prod.stock_disponible, permite_pedido_sin_stock: prod.permite_pedido_sin_stock }); }
    this.nuevoItem = { producto_id: null, cantidad: 1 };
  }

  recalcular(d: any) { d.subtotal = d.precio * d.cantidad; }
  eliminarItem(i: number) { this.form.detalles.splice(i, 1); }
  get total() { return this.form.detalles.reduce((a: number, b: any) => a + b.subtotal, 0); }

  guardarPedido() {
    if (this.guardando) return;
    if (this.form.tipos_pedido === 'DELIVERY') {
      if (this.usandoDireccionCliente) { this.form.direccion_entrega = this.clienteEncontrado?.direccion ?? ''; }
      else {
        const dist = this.distritos.find(d => d.distrito_id === this.entrega.distrito_id);
        const prov = this.provincias.find(p => p.provincia_id === this.entrega.provincia_id);
        const dep  = this.departamentos.find(d => d.departamento_id === this.entrega.departamento_id);
        this.form.direccion_entrega = [this.entrega.direccion, dist?.nombre, prov?.nombre, dep?.nombre].filter(Boolean).join(', ');
      }
      this.form.sucursal_recojo_id = null;
    } else {
      const suc = this.sucursales.find(s => s.sucursal_id === this.form.sucursal_recojo_id);
      this.form.direccion_entrega = suc?.direccion ?? '';
    }
    this.guardando = true; this.cd.detectChanges();
    this.pedidosService.createPedido(this.form).subscribe({
      next: (res: any) => {
        this.guardando = false; this.mostrarModal = false; this.cd.detectChanges();
        Swal.fire({ icon: 'success', title: '¡Pedido creado!', html: res.sucursal_preparacion ? `Se preparará en: <b>${res.sucursal_preparacion}</b>` : 'Pedido registrado correctamente', timer: 2000, showConfirmButton: false });
        this.cargar();
      },
      error: (err) => {
        this.guardando = false; this.cd.detectChanges();
        if (err.error?.errores) {
          const lista = err.error.errores.map((e: string) => `<li>${e}</li>`).join('');
          Swal.fire({ icon: 'warning', title: err.error.mensaje ?? 'Stock insuficiente', html: `<ul style="text-align:left">${lista}</ul><p style="color:#6b7280;font-size:13px;margin-top:8px">${err.error.sugerencia ?? ''}</p>`, confirmButtonText: 'Entendido' });
        } else { Swal.fire('Error', err?.error?.message ?? err?.error ?? 'No se pudo crear', 'error'); }
      }
    });
  }

  verDetalle(p: any) {
    if (!p.detalles?.length) { Swal.fire('Sin detalle', 'Este pedido no tiene productos', 'info'); return; }
    const rows = p.detalles.map((d: any) => `<tr><td style="padding:6px 8px;text-align:left">${d.producto}</td><td style="padding:6px 8px;text-align:center">${d.cantidad}</td><td style="padding:6px 8px;text-align:right">S/ ${Number(d.precio).toFixed(2)}</td><td style="padding:6px 8px;text-align:right;font-weight:600;color:#16a34a">S/ ${Number(d.subtotal).toFixed(2)}</td></tr>`).join('');
    Swal.fire({ title: `Pedido #${p.pedido_id}`, html: `<p style="font-size:12px;color:#6b7280;margin-bottom:8px">${p.tipos_pedido === 'DELIVERY' ? '🛵 Delivery' : '🏪 Pickup'}${p.direccion_entrega ? ' · ' + p.direccion_entrega : ''}</p><table style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:11px;text-transform:uppercase"><th style="padding:6px 8px;text-align:left">Producto</th><th style="padding:6px 8px">Cant.</th><th style="padding:6px 8px">Precio</th><th style="padding:6px 8px">Subtotal</th></tr></thead><tbody>${rows}</tbody><tfoot><tr style="border-top:2px solid #e5e7eb"><td colspan="3" style="padding:8px;text-align:right;font-weight:600;font-size:14px">Total</td><td style="padding:8px;text-align:right;font-weight:700;color:#16a34a;font-size:16px">S/ ${Number(p.total).toFixed(2)}</td></tr></tfoot></table>`, width: 500 });
  }

  cambiarEstado(p: any) {
    const rol = this.authService.getRolId();
    let siguiente: number | null = null;
    if (rol === 3 && p.estado === 'PENDIENTE')           siguiente = 2;
    else if (rol === 3 && p.estado === 'CONFIRMADO')     siguiente = 3;
    else if (rol === 3 && p.estado === 'EN_PREPARACION') siguiente = 4;
    else if (rol === 4 && p.estado === 'LISTO') { this.abrirModalEntrega(p); return; }
    else if (this.authService.isAdminOrSuper()) siguiente = this.flujoEstados[p.estado];
    if (!siguiente) { Swal.fire('No permitido', 'No puedes cambiar este estado', 'warning'); return; }
    this.pedidosService.cambiarEstado(p.pedido_id, siguiente).subscribe({
      next: () => this.cargar(),
      error: (err) => Swal.fire('Error', err.error, 'error')
    });
  }

  cancelarPedido(p: any) {
    Swal.fire({ title: '¿Cancelar pedido?', text: `Pedido #${p.pedido_id} de ${p.cliente}`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No' })
      .then(r => { if (!r.isConfirmed) return; this.pedidosService.cancelarPedido(p.pedido_id).subscribe({ next: () => this.cargar(), error: (err) => Swal.fire('Error', err?.error || 'No se pudo cancelar', 'error') }); });
  }

  esFinal(estado: string): boolean { return this.estadosFinales.has(estado); }
  getEstadoClase(e: string): string { return this.colors.getEstadoClase(e); }

  puedeAvanzar(p: any): boolean {
    if (this.esFinal(p.estado)) return false;
    const rol = this.authService.getRolId();
    if (rol === 2) return false;
    if (rol === 3) return p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO' || p.estado === 'EN_PREPARACION';
    if (rol === 4) return p.estado === 'LISTO';
    if (rol === 5) return p.estado === 'LISTO';
    return true;
  }

  getTextoAccion(estado: string): string {
    const map: Record<string, string> = { 'PENDIENTE': 'Confirmar', 'CONFIRMADO': 'Preparar', 'EN_PREPARACION': 'Marcar listo', 'LISTO': 'Entregar' };
    return map[estado] ?? 'Avanzar';
  }

  abrirModalEntrega(p: any) {
    this.pedidoEntrega       = p;
    this.montoEntrega        = p.total;
    this.metodoEntrega       = 'efectivo';
    this.tipoPagoEntrega     = 'CONTADO';
    this.referenciaEntrega   = '';
    this.qrEntrega           = null;
    this.mostrarModalEntrega = true;
    this.cd.detectChanges();
  }

  confirmarEntrega() {
    if (this.tipoPagoEntrega === 'CONTADO' && this.montoEntrega < this.pedidoEntrega.total) {
      Swal.fire('Atención', 'El monto no puede ser menor al total', 'warning'); return;
    }
    this.procesandoEntrega = true;
    this.pedidosService.entregar(
      this.pedidoEntrega.pedido_id, this.montoEntrega,
      this.metodoEntrega, this.tipoPagoEntrega
    ).subscribe({
      next: (res: any) => {
        this.procesandoEntrega = false; this.mostrarModalEntrega = false; this.cd.detectChanges();
        const msg = this.tipoPagoEntrega === 'CREDITO' ? `Saldo pendiente: <b>S/ ${res.saldo_pendiente?.toFixed(2)}</b>` : res.vuelto > 0 ? `Vuelto: <b>S/ ${res.vuelto?.toFixed(2)}</b>` : '✓ Cobro exacto';
        Swal.fire({ icon: 'success', title: '¡Entregado!', html: msg, timer: 2500, showConfirmButton: false });
        this.cargar();
      },
      error: (err) => { this.procesandoEntrega = false; Swal.fire('Error', err?.error?.mensaje || err?.error || 'Error al entregar', 'error'); this.cd.detectChanges(); }
    });
  }
}