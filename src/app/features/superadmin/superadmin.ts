import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanesService } from '../../core/services/planes';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Panel SuperAdmin</h1>
      <p class="text-sm text-gray-400 mt-0.5">Gestión de tenants y planes</p>
    </div>
    <span class="px-3 py-1 bg-purple-100 text-purple-700
                 rounded-full text-xs font-semibold">
      SuperAdmin
    </span>
  </div>

  <!-- Resumen de planes -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div *ngFor="let p of planes"
         class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <p class="text-xs text-gray-400 uppercase tracking-wide">{{ p.nombre }}</p>
      <p class="text-2xl font-bold text-gray-800 mt-1">
        S/ {{ p.precio_mensual }}
        <span class="text-sm font-normal text-gray-400">/mes</span>
      </p>
      <div class="mt-2 space-y-0.5 text-xs text-gray-500">
        <p>👥 {{ p.max_usuarios === 0 ? 'Usuarios ilimitados' : p.max_usuarios + ' usuarios' }}</p>
        <p>🏪 {{ p.max_sucursales === 0 ? 'Sucursales ilimitadas' : p.max_sucursales + ' sucursales' }}</p>
        <p>🧾 Facturación: {{ p.tiene_facturacion_electronica ? '✅' : '❌' }}</p>
      </div>
      <p class="mt-2 text-xs font-semibold text-cyan-600">
        {{ contarTenantsPorPlan(p.plan_id) }} cliente(s) activos
      </p>
    </div>
  </div>

  <!-- Tabla de tenants -->
  <div class="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="font-semibold text-gray-700 text-sm">Clientes registrados</h2>
      <span class="text-xs text-gray-400">{{ tenants.length }} tenant(s)</span>
    </div>

    <div *ngIf="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-cyan-500 border-t-transparent
                  rounded-full animate-spin"></div>
    </div>

    <div *ngIf="!loading" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 text-left">Cliente</th>
            <th class="px-4 py-3 text-left">RUC</th>
            <th class="px-4 py-3 text-center">Plan</th>
            <th class="px-4 py-3 text-center">Usuarios</th>
            <th class="px-4 py-3 text-center">Sucursales</th>
            <th class="px-4 py-3 text-center">Vence</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr *ngFor="let t of tenants" class="hover:bg-gray-50 transition-colors">

            <td class="px-4 py-3">
              <p class="font-medium text-gray-800">{{ t.nombre }}</p>
              <p class="text-xs text-gray-400">{{ t.email }}</p>
            </td>

            <td class="px-4 py-3 text-gray-500">{{ t.ruc }}</td>

            <td class="px-4 py-3 text-center">
              <span [ngClass]="badgePlan(t.plan.nombre)"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold">
                {{ t.plan.nombre }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <span [ngClass]="t.total_usuarios >= limiteUsuarios(t.plan.nombre)
                               && limiteUsuarios(t.plan.nombre) !== 0
                               ? 'text-red-500 font-bold' : 'text-gray-600'">
                {{ t.total_usuarios }}
              </span>
              <span class="text-gray-300"> /
                {{ limiteUsuarios(t.plan.nombre) === 0 ? '∞' : limiteUsuarios(t.plan.nombre) }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <span [ngClass]="t.total_sucursales >= limiteSucursales(t.plan.nombre)
                               && limiteSucursales(t.plan.nombre) !== 0
                               ? 'text-red-500 font-bold' : 'text-gray-600'">
                {{ t.total_sucursales }}
              </span>
              <span class="text-gray-300"> /
                {{ limiteSucursales(t.plan.nombre) === 0 ? '∞' : limiteSucursales(t.plan.nombre) }}
              </span>
            </td>

            <td class="px-4 py-3 text-center text-xs"
                [ngClass]="estaVencido(t.plan_fecha_vencimiento)
                           ? 'text-red-500 font-bold' : 'text-gray-500'">
              {{ t.plan_fecha_vencimiento | date:'dd/MM/yyyy' }}
              <span *ngIf="estaVencido(t.plan_fecha_vencimiento)"
                    class="block text-red-400">⚠ Vencido</span>
            </td>

            <td class="px-4 py-3 text-center">
              <span [ngClass]="t.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold">
                {{ t.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <button (click)="abrirModal(t)"
                      class="px-3 py-1 bg-cyan-600 hover:bg-cyan-700
                             text-white text-xs rounded-lg transition-colors">
                Cambiar plan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

<!-- MODAL -->
<div *ngIf="modalOpen"
     class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">

    <div class="px-6 py-4 border-b border-gray-100">
      <h3 class="font-bold text-gray-800">Cambiar plan</h3>
      <p class="text-sm text-gray-400">{{ tenantSeleccionado?.nombre }}</p>
    </div>

    <div class="px-6 py-5 space-y-4">

      <div>
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Plan
        </label>
        <select [(ngModel)]="form.plan_id"
                class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2
                       text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
          <option *ngFor="let p of planes" [ngValue]="p.plan_id">
            {{ p.nombre }} — S/ {{ p.precio_mensual }}/mes
          </option>
        </select>
      </div>

      <div>
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Fecha de vencimiento
        </label>
        <input type="date"
               [(ngModel)]="form.fecha_vencimiento"
               class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
      </div>

      <p *ngIf="error" class="text-red-500 text-xs bg-red-50 p-2 rounded-lg">
        {{ error }}
      </p>

      <!-- Éxito -->
      <p *ngIf="exito" class="text-green-600 text-xs bg-green-50 p-2 rounded-lg">
        ✅ Plan actualizado correctamente
      </p>

    </div>

    <div class="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
      <button (click)="cerrarModal()"
              class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50
                     rounded-lg transition-colors">
        Cancelar
      </button>
      <button (click)="guardarPlan()"
              [disabled]="guardando"
              class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white
                     text-sm rounded-lg transition-colors disabled:opacity-50
                     flex items-center gap-2">
        <span *ngIf="guardando"
              class="w-4 h-4 border-2 border-white border-t-transparent
                     rounded-full animate-spin"></span>
        {{ guardando ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>

  </div>
</div>
  `
})
export class SuperAdminComponent implements OnInit {

  tenants: any[] = [];
  planes:  any[] = [];
  loading        = true;
  modalOpen      = false;
  guardando      = false;
  error          = '';
  exito          = false;
  tenantSeleccionado: any = null;

  form = {
    plan_id:           2,
    fecha_vencimiento: ''
  };

  constructor(
    private planesService: PlanesService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
  this.loading = true;
  this.planesService.getPlanes().subscribe({
    next: (planes: any) => {
      this.planes = planes;
      this.cdr.detectChanges();
      this.planesService.getTenants().subscribe({
        next: (tenants: any) => {
          this.tenants = tenants;
          this.loading  = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: () => {
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  abrirModal(tenant: any) {
    this.tenantSeleccionado     = tenant;
    this.form.plan_id           = Number(tenant.plan.plan_id);
    this.form.fecha_vencimiento = tenant.plan_fecha_vencimiento
      ? tenant.plan_fecha_vencimiento.toString().split('T')[0]
      : '';
    this.error    = '';
    this.exito    = false;
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen          = false;
    this.tenantSeleccionado = null;
    this.error              = '';
    this.exito              = false;
  }

  guardarPlan() {
    if (!this.form.plan_id) {
      this.error = 'Selecciona un plan';
      return;
    }
    // Avisar si el nuevo plan tiene límites menores al uso actual
    const planNuevo = this.planes.find(p => p.plan_id === Number(this.form.plan_id));
    const t = this.tenantSeleccionado;
    let advertencia = '';

    if (planNuevo.max_usuarios > 0 && t.total_usuarios > planNuevo.max_usuarios)
      advertencia += `⚠ Tiene ${t.total_usuarios} usuarios pero el plan permite ${planNuevo.max_usuarios}. Deberán desactivar ${t.total_usuarios - planNuevo.max_usuarios}. `;

    if (planNuevo.max_sucursales > 0 && t.total_sucursales > planNuevo.max_sucursales)
      advertencia += `⚠ Tiene ${t.total_sucursales} sucursales pero el plan permite ${planNuevo.max_sucursales}.`;

    if (advertencia) {
      this.error = advertencia; // muestra advertencia pero no bloquea
    }
    
    this.guardando = true;
    this.error     = '';
    this.exito     = false;

    const payload = {
      plan_id:           Number(this.form.plan_id),
      fecha_inicio:      null,
      fecha_vencimiento: this.form.fecha_vencimiento || null
    };

    this.planesService.cambiarPlan(
      this.tenantSeleccionado.tenant_id,
      payload
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.exito     = true;
        setTimeout(() => {
          this.cerrarModal();
          this.cargarDatos();
        }, 1000);
      },
      error: (err: any) => {
        this.guardando = false;
        this.error = err?.error?.mensaje
          || err?.error
          || 'Error al guardar. Revisa la consola.';
        console.error('Error cambiar plan:', err);
      }
    });
  }

  contarTenantsPorPlan(planId: number): number {
    return this.tenants.filter(t => t.plan?.plan_id === planId).length;
  }

  badgePlan(nombre: string): string {
    const map: any = {
      'Basico':      'bg-gray-100 text-gray-600',
      'Profesional': 'bg-blue-100 text-blue-700',
      'Empresarial': 'bg-purple-100 text-purple-700'
    };
    return map[nombre] ?? 'bg-gray-100 text-gray-600';
  }

  limiteUsuarios(nombre: string): number {
    return this.planes.find(p => p.nombre === nombre)?.max_usuarios ?? 0;
  }

  limiteSucursales(nombre: string): number {
    return this.planes.find(p => p.nombre === nombre)?.max_sucursales ?? 0;
  }

  estaVencido(fecha: string): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }
}