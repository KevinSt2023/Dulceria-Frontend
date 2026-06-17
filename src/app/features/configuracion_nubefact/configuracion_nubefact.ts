import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ConfiguracionNubefactService,
  ConfiguracionNubefact,
  GuardarConfiguracionNubefact,
  ResultadoProbarConexion,
  EmpresaEstadoFE
} from '../../core/services/configuracion_nubefact';
import { AuthService } from '../../core/auth/auth';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-configuracion-nubefact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="max-w-4xl mx-auto p-6">

  <!-- HEADER -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
      <span class="text-3xl">🧾</span> Facturación Electrónica
    </h1>
    <p class="text-sm text-slate-500 mt-1">
      Configura las credenciales de Nubefact por empresa para emitir comprobantes electrónicos SUNAT.
    </p>
  </div>

  <!-- SELECTOR DE EMPRESA (solo SuperAdmin) -->
  <div *ngIf="esSuperAdmin" class="mb-5 p-4 bg-slate-900 text-white rounded-xl">
    <label class="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-2">
      🏢 Empresa a configurar
    </label>
    <select [(ngModel)]="tenantSeleccionado"
            (ngModelChange)="cambiarEmpresa($event)"
            class="w-full p-2.5 bg-slate-800 text-white border-2 border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none">
      <option [ngValue]="0">— Selecciona una empresa —</option>
      <option *ngFor="let e of empresas" [ngValue]="e.tenant_id">
        {{ e.nombre }} ({{ e.ruc }}){{
          e.nubefact_configurado
            ? (e.nubefact_activo ? ' · ✅ FE Activa' : ' · ⚠️ Configurada sin activar')
            : ' · ❌ Sin configurar'
        }}
      </option>
    </select>
  </div>

  <!-- Mensaje sin empresa seleccionada -->
  <div *ngIf="esSuperAdmin && !tenantSeleccionado"
       class="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
    <p class="text-blue-700 font-medium">👆 Selecciona una empresa arriba para configurar su Facturación Electrónica</p>
  </div>

  <!-- CONTENIDO PRINCIPAL -->
  <ng-container *ngIf="!esSuperAdmin || tenantSeleccionado">

    <!-- Estado actual -->
    <div *ngIf="configuracionExistente" class="mb-6 p-4 rounded-xl border-2"
         [ngClass]="configuracionExistente.activo
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide"
             [ngClass]="configuracionExistente.activo ? 'text-emerald-700' : 'text-amber-700'">
            Estado actual
          </p>
          <p class="text-lg font-bold mt-1"
             [ngClass]="configuracionExistente.activo ? 'text-emerald-800' : 'text-amber-800'">
            {{ configuracionExistente.activo
                ? '✅ FE Activa — emitiendo Boletas y Facturas'
                : (configuracionExistente.validado
                    ? '⚠️ Validada pero NO activa'
                    : '⚠️ Sin validar — Probar conexión primero') }}
          </p>
          <p class="text-xs text-slate-600 mt-1">
            Modo: <b>{{ configuracionExistente.modo }}</b> · RUC: <b>{{ configuracionExistente.ruc }}</b>
          </p>
        </div>
        <div class="flex gap-2">
          <button *ngIf="configuracionExistente.validado && !configuracionExistente.activo"
                  (click)="activar()"
                  class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">Activar</button>
          <button *ngIf="configuracionExistente.activo"
                  (click)="desactivar()"
                  class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold">Desactivar</button>
        </div>
      </div>
    </div>

    <!-- Aviso sin config -->
    <div *ngIf="!configuracionExistente && !cargando"
         class="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
      <p class="text-sm text-blue-700">
        📌 No hay configuración de Facturación Electrónica para esta empresa. Completa los datos a continuación.
      </p>
    </div>

    <!-- FORMULARIO -->
    <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">

      <!-- Emisor -->
      <div>
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b pb-2">Datos del emisor</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">RUC <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.ruc" maxlength="11" placeholder="20123456789"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Razón social <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.razon_social" placeholder="MI EMPRESA S.A.C."
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Nombre comercial</label>
            <input [(ngModel)]="form.nombre_comercial" placeholder="(Opcional)"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Ubigeo</label>
            <input [(ngModel)]="form.ubigeo" maxlength="6" placeholder="150101"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div class="md:col-span-2">
            <label class="text-xs font-semibold text-slate-600 block mb-1">Dirección fiscal <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.direccion_fiscal" placeholder="Av. Principal 123, Lima"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Departamento</label>
            <input [(ngModel)]="form.departamento" placeholder="LIMA"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Provincia</label>
            <input [(ngModel)]="form.provincia" placeholder="LIMA"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Distrito</label>
            <input [(ngModel)]="form.distrito" placeholder="LIMA"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
        </div>
      </div>

      <!-- Credenciales -->
      <div>
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b pb-2 flex items-center gap-2">
          🔐 Credenciales Nubefact
          <span class="text-xs font-normal text-slate-500 normal-case ml-2">(Del panel Nubefact de la empresa)</span>
        </h3>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">URL única <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.nubefact_url"
                   placeholder="https://api.nubefact.com/api/v1/XXXXX-XXXX-XXXX-XXXX"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              Token API
              <span *ngIf="!configuracionExistente" class="text-red-500">*</span>
              <span *ngIf="configuracionExistente" class="text-slate-400 font-normal ml-2">(Vacío para conservar el actual)</span>
            </label>
            <input [(ngModel)]="form.nubefact_token" type="password"
                   placeholder="Token de autenticación"
                   class="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-400 outline-none"/>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Modo de operación</label>
            <div class="grid grid-cols-2 gap-2">
              <button (click)="form.modo = 'TEST'"
                      [ngClass]="form.modo === 'TEST' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'"
                      class="border-2 rounded-lg p-3 text-center transition-all">
                <p class="text-lg">🧪</p><p class="text-sm font-bold">TEST</p>
                <p class="text-xs">Pruebas (no SUNAT real)</p>
              </button>
              <button (click)="form.modo = 'PROD'"
                      [ngClass]="form.modo === 'PROD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'"
                      class="border-2 rounded-lg p-3 text-center transition-all">
                <p class="text-lg">🚀</p><p class="text-sm font-bold">PRODUCCIÓN</p>
                <p class="text-xs">Real — se envían a SUNAT</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Opciones -->
      <div>
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b pb-2">Opciones de envío</h3>
        <div class="space-y-2">
          <label class="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer">
            <input type="checkbox" [(ngModel)]="form.enviar_automatico_sunat" class="w-4 h-4 accent-cyan-500"/>
            <div>
              <p class="text-sm font-semibold text-slate-800">Enviar automáticamente a SUNAT</p>
              <p class="text-xs text-slate-500">Recomendado. Cada comprobante se envía al instante.</p>
            </div>
          </label>
          <label class="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer">
            <input type="checkbox" [(ngModel)]="form.enviar_automatico_cliente" class="w-4 h-4 accent-cyan-500"/>
            <div>
              <p class="text-sm font-semibold text-slate-800">Enviar PDF por email al cliente</p>
              <p class="text-xs text-slate-500">Nubefact envía el comprobante al email del cliente.</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <button (click)="probarConexion()"
                [disabled]="!form.nubefact_url.trim() || !form.nubefact_token.trim() || probando"
                class="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-all">
          {{ probando ? '⏳ Probando...' : '🔍 Probar conexión' }}
        </button>
        <button (click)="guardar()"
                [disabled]="!puedeGuardar() || guardando"
                class="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-all">
          {{ guardando ? '⏳ Guardando...' : '💾 Guardar configuración' }}
        </button>
      </div>

      <!-- Resultado prueba -->
      <div *ngIf="resultadoPrueba" class="mt-4 p-3 rounded-lg border-2"
           [ngClass]="resultadoPrueba.conectado ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'">
        <p class="text-sm font-bold"
           [ngClass]="resultadoPrueba.conectado ? 'text-emerald-700' : 'text-red-700'">
          {{ resultadoPrueba.conectado ? '✅' : '❌' }} {{ resultadoPrueba.mensaje }}
        </p>
        <p *ngIf="resultadoPrueba.duracion_ms" class="text-xs text-slate-500 mt-1">Tiempo: {{ resultadoPrueba.duracion_ms }}ms</p>
      </div>

    </div>
  </ng-container>

</div>
  `
})
export class ConfiguracionNubefactComponent implements OnInit {

  configuracionExistente: ConfiguracionNubefact | null = null;
  empresas: EmpresaEstadoFE[] = [];
  tenantSeleccionado = 0;
  esSuperAdmin = false;

  cargando = true;
  probando = false;
  guardando = false;

  resultadoPrueba: ResultadoProbarConexion | null = null;

  form: GuardarConfiguracionNubefact = this.formVacio();

  private destroyRef = inject(DestroyRef);

  constructor(
    private service: ConfiguracionNubefactService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.esSuperAdmin = this.auth.isSuperAdmin();

    if (this.esSuperAdmin) {
      this.cargarEmpresas();
      // Permite entrar con ?tenantId=X desde Panel SuperAdmin
      this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
        const tId = +(p['tenantId'] ?? 0);
        if (tId > 0) {
          this.tenantSeleccionado = tId;
          this.cargar();
        }
      });
    } else {
      this.cargar();
    }
  }

  formVacio(): GuardarConfiguracionNubefact {
    return {
      ruc: '', razon_social: '', nombre_comercial: '', direccion_fiscal: '',
      ubigeo: '', departamento: '', provincia: '', distrito: '',
      nubefact_url: '', nubefact_token: '', modo: 'TEST',
      enviar_automatico_sunat: true, enviar_automatico_cliente: false,
      logo_url: '', color_primario: '', pie_pagina: ''
    };
  }

  cargarEmpresas() {
    this.service.getEmpresas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.empresas = res; this.cd.detectChanges(); }
    });
  }

  cambiarEmpresa(tenantId: number) {
    this.tenantSeleccionado = tenantId;
    this.configuracionExistente = null;
    this.form = this.formVacio();
    this.resultadoPrueba = null;
    if (tenantId > 0) this.cargar();
    this.cd.detectChanges();
  }

  cargar() {
    const tId = this.esSuperAdmin ? this.tenantSeleccionado : undefined;
    if (this.esSuperAdmin && !tId) return;

    this.cargando = true;
    this.service.get(tId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        if (config) {
          this.configuracionExistente = config;
          this.form = {
            ruc: config.ruc,
            razon_social: config.razon_social,
            nombre_comercial: config.nombre_comercial ?? '',
            direccion_fiscal: config.direccion_fiscal,
            ubigeo: config.ubigeo ?? '',
            departamento: config.departamento ?? '',
            provincia: config.provincia ?? '',
            distrito: config.distrito ?? '',
            nubefact_url: config.nubefact_url,
            nubefact_token: '',
            modo: config.modo,
            enviar_automatico_sunat: config.enviar_automatico_sunat,
            enviar_automatico_cliente: config.enviar_automatico_cliente,
            logo_url: config.logo_url ?? '',
            color_primario: config.color_primario ?? '',
            pie_pagina: config.pie_pagina ?? ''
          };
        } else {
          this.configuracionExistente = null;
          this.form = this.formVacio();
        }
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => { this.cargando = false; this.cd.detectChanges(); }
    });
  }

  puedeGuardar(): boolean {
    if (!this.form.ruc?.trim() || this.form.ruc.length !== 11) return false;
    if (!this.form.razon_social?.trim()) return false;
    if (!this.form.direccion_fiscal?.trim()) return false;
    if (!this.form.nubefact_url?.trim()) return false;
    if (!this.configuracionExistente && !this.form.nubefact_token?.trim()) return false;
    return true;
  }

  private tenantParaRequest(): number | undefined {
    return this.esSuperAdmin ? this.tenantSeleccionado : undefined;
  }

  probarConexion() {
    if (this.probando) return;
    if (!this.form.nubefact_url?.trim() || !this.form.nubefact_token?.trim()) {
      Swal.fire('Falta información', 'Completa la URL y el Token antes de probar la conexión.', 'warning');
      return;
    }

    this.probando = true;
    this.resultadoPrueba = null;

    this.service.probar({
      nubefact_url: this.form.nubefact_url,
      nubefact_token: this.form.nubefact_token
    }, this.tenantParaRequest()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.resultadoPrueba = res;
        this.probando = false;
        if (res.conectado) {
          Swal.fire({ icon: 'success', title: '¡Conexión exitosa!', text: res.mensaje, timer: 2500, showConfirmButton: false });
          this.cargar();
        } else {
          Swal.fire('No se pudo conectar', res.mensaje, 'error');
        }
        this.cd.detectChanges();
      },
      error: () => {
        this.probando = false;
        Swal.fire('Error', 'No se pudo realizar la prueba', 'error');
        this.cd.detectChanges();
      }
    });
  }

  guardar() {
    if (!this.puedeGuardar() || this.guardando) return;
    this.guardando = true;

    this.service.guardar(this.form, this.tenantParaRequest()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: 'Configuración almacenada. Recuerda probar la conexión antes de activar.',
          confirmButtonColor: '#0ea5e9'
        }).then(() => {
          this.cargar();
          if (this.esSuperAdmin) this.cargarEmpresas();
        });
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error?.mensaje || err.error || 'No se pudo guardar', 'error');
        this.cd.detectChanges();
      }
    });
  }

  activar() {
    Swal.fire({
      title: '¿Activar Facturación Electrónica?',
      text: 'Los comprobantes se enviarán a SUNAT automáticamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.service.activar(this.tenantParaRequest()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          Swal.fire('Activada', res.mensaje, 'success');
          this.cargar();
          if (this.esSuperAdmin) this.cargarEmpresas();
        },
        error: (err) => Swal.fire('Error', err.error?.mensaje || 'No se pudo activar', 'error')
      });
    });
  }

  desactivar() {
    Swal.fire({
      title: '¿Desactivar Facturación Electrónica?',
      text: 'El negocio volverá a emitir solo Notas de Venta.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.service.desactivar(this.tenantParaRequest()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          Swal.fire('Desactivada', res.mensaje, 'info');
          this.cargar();
          if (this.esSuperAdmin) this.cargarEmpresas();
        },
        error: () => Swal.fire('Error', 'No se pudo desactivar', 'error')
      });
    });
  }
}