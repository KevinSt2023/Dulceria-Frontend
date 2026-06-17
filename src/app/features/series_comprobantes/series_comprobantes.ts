import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  SeriesService,
  SerieComprobante,
  GuardarSerie,
  SucursalSimple,
  TipoComprobanteSimple
} from '../../core/services/series';
import {
  ConfiguracionNubefactService,
  EmpresaEstadoFE
} from '../../core/services/configuracion_nubefact';
import { AuthService } from '../../core/auth/auth';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-series-comprobantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="max-w-5xl mx-auto p-6">

  <!-- HEADER -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
      <span class="text-3xl">📋</span> Series de Comprobantes
    </h1>
    <p class="text-sm text-slate-500 mt-1">
      Configura las series y correlativos que cada empresa usará al emitir comprobantes (deben coincidir con las del panel Nubefact).
    </p>
  </div>

  <!-- SELECTOR DE EMPRESA (solo SuperAdmin) -->
  <div *ngIf="esSuperAdmin" class="mb-5 p-4 bg-slate-900 text-white rounded-xl">
    <label class="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-2">
      🏢 Empresa
    </label>
    <select [(ngModel)]="tenantSeleccionado"
            (ngModelChange)="cambiarEmpresa($event)"
            class="w-full p-2.5 bg-slate-800 text-white border-2 border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none">
      <option [ngValue]="0">— Selecciona una empresa —</option>
      <option *ngFor="let e of empresas" [ngValue]="e.tenant_id">
        {{ e.nombre }} ({{ e.ruc }})
      </option>
    </select>
  </div>

  <!-- Sin empresa seleccionada -->
  <div *ngIf="esSuperAdmin && !tenantSeleccionado"
       class="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
    <p class="text-blue-700 font-medium">👆 Selecciona una empresa para gestionar sus series</p>
  </div>

  <!-- CONTENIDO -->
  <ng-container *ngIf="!esSuperAdmin || tenantSeleccionado">

    <!-- Acciones -->
    <div class="flex justify-between items-center mb-4">
      <p class="text-sm text-slate-500">
        {{ series.length }} {{ series.length === 1 ? 'serie configurada' : 'series configuradas' }}
      </p>
      <button (click)="abrirModalCrear()"
              class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition-all">
        + Nueva serie
      </button>
    </div>

    <!-- Tabla -->
    <div *ngIf="cargando" class="text-center text-slate-400 py-10">Cargando series...</div>

    <div *ngIf="!cargando" class="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      <div *ngIf="series.length === 0" class="text-center py-16 text-slate-400">
        <p class="text-4xl mb-3">📋</p>
        <p>Esta empresa no tiene series configuradas</p>
        <p class="text-xs text-slate-300 mt-2">Crea la primera serie con el botón "+ Nueva serie"</p>
      </div>

      <table *ngIf="series.length > 0" class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Sucursal</th>
            <th class="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
            <th class="p-3 text-left text-xs font-semibold text-slate-500 uppercase">Serie</th>
            <th class="p-3 text-right text-xs font-semibold text-slate-500 uppercase">Correlativo</th>
            <th class="p-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
            <th class="p-3 text-center text-xs font-semibold text-slate-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of series" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="p-3 text-sm text-slate-700">{{ s.sucursal_nombre }}</td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-700">{{ s.tipo_comprobante }}</span>
                <span *ngIf="s.codigo_sunat"
                      class="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
                  {{ s.codigo_sunat }}
                </span>
              </div>
            </td>
            <td class="p-3">
              <span class="font-mono font-bold text-cyan-700">{{ s.serie }}</span>
            </td>
            <td class="p-3 text-right">
              <span class="font-mono text-sm text-slate-600">
                {{ s.correlativo_actual.toString().padStart(8, '0') }}
              </span>
              <p class="text-xs text-slate-400 mt-0.5">próximo: {{ (s.correlativo_actual + 1).toString().padStart(8, '0') }}</p>
            </td>
            <td class="p-3 text-center">
              <button (click)="toggleActivo(s)"
                      [ngClass]="s.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
                      class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors">
                {{ s.activo ? '✅ Activa' : '⏸ Inactiva' }}
              </button>
            </td>
            <td class="p-3">
              <div class="flex justify-center gap-1">
                <button (click)="abrirModalEditar(s)"
                        class="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium">
                  ✏️ Editar
                </button>
                <button (click)="eliminar(s)"
                        class="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tip -->
    <div class="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">💡 Importante</p>
      <ul class="text-xs text-amber-800 space-y-1 list-disc pl-4">
        <li>Las series (B001, F001, NV01) deben <b>coincidir exactamente</b> con las que el cliente tenga configuradas en su panel Nubefact.</li>
        <li>El <b>correlativo actual</b> es el último número emitido. El próximo comprobante será correlativo+1.</li>
        <li>No se puede <b>bajar</b> el correlativo (evita conflictos con SUNAT).</li>
        <li>Si la serie ya tiene comprobantes emitidos, solo se puede <b>desactivar</b>, no eliminar.</li>
      </ul>
    </div>

  </ng-container>

  <!-- ══ MODAL CREAR/EDITAR ══ -->
  <div *ngIf="mostrarModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">

      <div class="flex justify-between items-center p-5 border-b">
        <div>
          <h3 class="text-lg font-bold text-slate-800">
            {{ editandoId ? 'Editar serie' : 'Nueva serie' }}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ editandoId ? 'Modificar configuración' : 'Configurar una nueva serie de comprobantes' }}
          </p>
        </div>
        <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 text-xl">✕</button>
      </div>

      <div class="p-5 space-y-4">

        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Sucursal <span class="text-red-500">*</span></label>
          <select [(ngModel)]="form.sucursal_id"
                  class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none">
            <option [ngValue]="0">— Selecciona sucursal —</option>
            <option *ngFor="let s of sucursales" [ngValue]="s.sucursal_id">{{ s.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Tipo de comprobante <span class="text-red-500">*</span></label>
          <select [(ngModel)]="form.tipo_comprobante_id"
                  class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none">
            <option [ngValue]="0">— Selecciona tipo —</option>
            <option *ngFor="let t of tiposComprobante" [ngValue]="t.tipo_comprobante_id">
              {{ t.nombre }} <span *ngIf="t.codigo_sunat">({{ t.codigo_sunat }})</span>
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Serie <span class="text-red-500">*</span></label>
          <input [(ngModel)]="form.serie" maxlength="10" placeholder="Ej: B001, F001, NV01"
                 (input)="form.serie = form.serie.toUpperCase()"
                 class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
          <p class="text-xs text-slate-400 mt-1">
            Debe coincidir exactamente con la serie configurada en Nubefact.
          </p>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">
            Correlativo actual
            <span *ngIf="!editandoId" class="text-slate-400 font-normal ml-1">(número del último emitido)</span>
          </label>
          <input type="number" [(ngModel)]="form.correlativo_actual" min="0"
                 class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
          <p class="text-xs text-slate-400 mt-1">
            <span *ngIf="!editandoId">Si es una serie nueva, déjalo en 0. El próximo comprobante será {{ (form.correlativo_actual + 1).toString().padStart(8, '0') }}.</span>
            <span *ngIf="editandoId">⚠️ No se puede bajar el valor actual.</span>
          </p>
        </div>

        <label class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
          <input type="checkbox" [(ngModel)]="form.activo" class="w-4 h-4 accent-cyan-500"/>
          <div>
            <p class="text-sm font-semibold text-slate-800">Serie activa</p>
            <p class="text-xs text-slate-500">{{ form.activo ? 'Disponible para emisión' : 'No se podrá emitir con esta serie' }}</p>
          </div>
        </label>

      </div>

      <div class="flex gap-2 p-5 border-t">
        <button (click)="cerrarModal()"
                class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">
          Cancelar
        </button>
        <button (click)="guardar()"
                [disabled]="!puedeGuardar() || guardando"
                class="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold">
          {{ guardando ? '⏳ Guardando...' : (editandoId ? '✓ Actualizar' : '✓ Crear serie') }}
        </button>
      </div>

    </div>
  </div>

</div>
  `
})
export class SeriesComprobantesComponent implements OnInit {

  series: SerieComprobante[] = [];
  sucursales: SucursalSimple[] = [];
  tiposComprobante: TipoComprobanteSimple[] = [];

  empresas: EmpresaEstadoFE[] = [];
  tenantSeleccionado = 0;
  esSuperAdmin = false;

  cargando = true;
  guardando = false;
  mostrarModal = false;
  editandoId: number | null = null;

  form: GuardarSerie = this.formVacio();

  private destroyRef = inject(DestroyRef);

  constructor(
    private service: SeriesService,
    private nubefactService: ConfiguracionNubefactService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.esSuperAdmin = this.auth.isSuperAdmin();

    if (this.esSuperAdmin) {
      this.cargarEmpresas();
      this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
        const tId = +(p['tenantId'] ?? 0);
        if (tId > 0) {
          this.tenantSeleccionado = tId;
          this.cargarTodo();
        }
      });
    } else {
      this.cargarTodo();
    }
  }

  formVacio(): GuardarSerie {
    return { sucursal_id: 0, tipo_comprobante_id: 0, serie: '', correlativo_actual: 0, activo: true };
  }

  cargarEmpresas() {
    this.nubefactService.getEmpresas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.empresas = res; this.cd.detectChanges(); }
    });
  }

  cambiarEmpresa(tenantId: number) {
    this.tenantSeleccionado = tenantId;
    this.series = [];
    this.sucursales = [];
    if (tenantId > 0) this.cargarTodo();
    this.cd.detectChanges();
  }

  cargarTodo() {
    this.cargando = true;
    const tId = this.tenantParaRequest();
    this.cargarTiposComprobante();
    this.cargarSucursales(tId);
    this.cargarSeries(tId);
  }

  cargarTiposComprobante() {
    this.service.getTiposComprobante().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.tiposComprobante = res; this.cd.detectChanges(); }
    });
  }

  cargarSucursales(tenantId?: number) {
    this.service.getSucursales(tenantId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.sucursales = res; this.cd.detectChanges(); }
    });
  }

  cargarSeries(tenantId?: number) {
    this.cargando = true;
    this.service.getAll(tenantId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.series = res; this.cargando = false; this.cd.detectChanges(); },
      error: () => { this.cargando = false; this.cd.detectChanges(); }
    });
  }

  private tenantParaRequest(): number | undefined {
    return this.esSuperAdmin ? this.tenantSeleccionado : undefined;
  }

  // ─── Modal ───
  abrirModalCrear() {
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarModal = true;
    this.cd.detectChanges();
  }

  abrirModalEditar(s: SerieComprobante) {
    this.editandoId = s.serie_id;
    this.form = {
      sucursal_id:         s.sucursal_id,
      tipo_comprobante_id: s.tipo_comprobante_id,
      serie:               s.serie,
      correlativo_actual:  s.correlativo_actual,
      activo:              s.activo
    };
    this.mostrarModal = true;
    this.cd.detectChanges();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.editandoId = null;
    this.form = this.formVacio();
    this.cd.detectChanges();
  }

  puedeGuardar(): boolean {
    return this.form.sucursal_id > 0
        && this.form.tipo_comprobante_id > 0
        && this.form.serie.trim().length >= 2;
  }

  guardar() {
    if (!this.puedeGuardar() || this.guardando) return;
    this.guardando = true;

    const tId = this.tenantParaRequest();
    const obs$ = this.editandoId
      ? this.service.actualizar(this.editandoId, this.form, tId)
      : this.service.crear(this.form, tId);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.guardando = false;
        this.cerrarModal();
        Swal.fire({ icon: 'success', title: res.mensaje, timer: 1800, showConfirmButton: false });
        this.cargarSeries(tId);
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error?.mensaje || 'No se pudo guardar', 'error');
        this.cd.detectChanges();
      }
    });
  }

  toggleActivo(s: SerieComprobante) {
    this.service.toggle(s.serie_id, this.tenantParaRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          Swal.fire({ icon: 'success', title: res.mensaje, timer: 1200, showConfirmButton: false });
          this.cargarSeries(this.tenantParaRequest());
        },
        error: () => Swal.fire('Error', 'No se pudo cambiar el estado', 'error')
      });
  }

  eliminar(s: SerieComprobante) {
    Swal.fire({
      title: '¿Eliminar serie?',
      html: `Serie <b>${s.serie}</b> de ${s.tipo_comprobante}<br>
             <small style="color:#64748b">Esta acción no se puede deshacer.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.service.eliminar(s.serie_id, this.tenantParaRequest())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            Swal.fire({ icon: 'success', title: res.mensaje, timer: 1500, showConfirmButton: false });
            this.cargarSeries(this.tenantParaRequest());
          },
          error: (err) => {
            Swal.fire('No se puede eliminar', err.error?.mensaje || 'Error al eliminar', 'warning');
          }
        });
    });
  }
}