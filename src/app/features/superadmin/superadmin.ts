import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../core/services/superadmin';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="superadmin-container">

  <!-- HEADER -->
  <div class="header">
    <div>
      <h1 class="titulo">Panel SuperAdmin</h1>
      <p class="subtitulo">Gestión de empresas registradas en SophiTech ERP</p>
    </div>
    <button (click)="abrirModalCrear()" class="btn-nuevo">
      + Nueva empresa
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Cargando empresas...</p>
  </div>

  <!-- VACÍO -->
  <div *ngIf="!loading && empresas.length === 0" class="vacio-empresas">
    <p>No hay empresas registradas</p>
  </div>

  <!-- LISTA DE EMPRESAS -->
  <div *ngIf="!loading && empresas.length > 0" class="empresas-lista">

    <div *ngFor="let e of empresas"
         class="empresa-card"
         [class.inactiva]="!e.activo">

      <div class="empresa-contenido">

        <!-- Logo/Avatar -->
        <div class="empresa-avatar" [class.con-logo]="e.config?.tiene_logo">
          <img *ngIf="e.config?.tiene_logo" [src]="logosCache[e.tenant_id]" alt="logo" />
          <span *ngIf="!e.config?.tiene_logo">{{ getInicial(e) }}</span>
        </div>

        <!-- Información -->
        <div class="empresa-info">
          <div class="empresa-titulo-row">
            <h3 class="empresa-nombre">{{ e.config?.razon_social || e.nombre }}</h3>
            <span *ngIf="e.config?.nombre_comercial" class="empresa-comercial">
              ({{ e.config.nombre_comercial }})
            </span>
            <span class="badge-estado" [class.activo]="e.activo" [class.inactivo]="!e.activo">
              {{ e.activo ? 'Activo' : 'Inactivo' }}
            </span>
            <span *ngIf="e.config?.facturacion_electronica" class="badge-fe">
              FE activa
            </span>
          </div>

          <div class="empresa-detalles">
            <span *ngIf="e.ruc" class="detalle-item">
              <span class="detalle-label">RUC</span>
              <span class="detalle-valor mono">{{ e.ruc }}</span>
            </span>
            <span *ngIf="e.email" class="detalle-item">
              <span class="detalle-label">Email</span>
              <span class="detalle-valor">{{ e.email }}</span>
            </span>
            <span *ngIf="e.telefono" class="detalle-item">
              <span class="detalle-label">Tel</span>
              <span class="detalle-valor">{{ e.telefono }}</span>
            </span>
            <span *ngIf="e.config?.direccion" class="detalle-item dir">
              <span class="detalle-label">Dirección</span>
              <span class="detalle-valor">{{ e.config.direccion }}</span>
            </span>
          </div>

          <div class="empresa-meta">
            <span class="badge-plan">{{ e.plan_nombre }}</span>
            <span *ngIf="e.plan_fecha_vencimiento" class="badge-fecha"
                  [class.vencido]="estaVencido(e.plan_fecha_vencimiento)">
              {{ estaVencido(e.plan_fecha_vencimiento) ? 'Vencido: ' : 'Vence: ' }}
              {{ e.plan_fecha_vencimiento }}
            </span>
            <span class="meta-info">Registrado: {{ e.create_ad | date:'dd/MM/yyyy':'UTC' }}</span>
            <span class="meta-id mono">ID: {{ e.tenant_id }}</span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="empresa-acciones">
          <button (click)="configurarFE(e)" class="btn-accion">Configurar FE</button>
          <button (click)="configurarSeries(e)" class="btn-accion">Series</button>
          <button (click)="abrirModalEditar(e)" class="btn-accion">Editar</button>
          <button (click)="confirmarToggle(e)" class="btn-accion"
                  [class.btn-peligro]="e.activo"
                  [class.btn-exito]="!e.activo">
            {{ e.activo ? 'Desactivar' : 'Activar' }}
          </button>
        </div>

      </div>
    </div>
  </div>


  <!-- ══ MODAL CREAR EMPRESA ══ -->
  <div *ngIf="mostrarModalCrear" class="modal-backdrop">
    <div class="modal">

      <div class="modal-header">
        <div>
          <h3 class="modal-titulo">Nueva empresa</h3>
          <p class="modal-subtitulo">Completa los datos para registrar una nueva empresa</p>
        </div>
        <button (click)="mostrarModalCrear = false" class="btn-cerrar">✕</button>
      </div>

      <div class="modal-body">

        <div class="seccion-form">
          <p class="seccion-titulo">Datos de la empresa</p>
          <div class="grid-form">
            <div class="campo span-2">
              <label>Nombre / Razón social *</label>
              <input [(ngModel)]="formCrear.nombre" placeholder="PASTELERÍA XYZ S.A.C." class="input"/>
            </div>
            <div class="campo">
              <label>Nombre comercial</label>
              <input [(ngModel)]="formCrear.nombre_comercial" placeholder="Pastelería XYZ" class="input"/>
            </div>
            <div class="campo">
              <label>RUC</label>
              <input [(ngModel)]="formCrear.ruc" maxlength="11" placeholder="20123456789" class="input mono"/>
            </div>
            <div class="campo">
              <label>Email</label>
              <input [(ngModel)]="formCrear.email" type="email" placeholder="contacto@empresa.com" class="input"/>
            </div>
            <div class="campo">
              <label>Teléfono</label>
              <input [(ngModel)]="formCrear.telefono" placeholder="987654321" class="input"/>
            </div>
            <div class="campo span-2">
              <label>Dirección</label>
              <input [(ngModel)]="formCrear.direccion" placeholder="Av. Principal 123, Lima" class="input"/>
            </div>
            <div class="campo span-2">
              <label>Nombre sede principal</label>
              <input [(ngModel)]="formCrear.nombre_sucursal"
                     [placeholder]="formCrear.nombre ? formCrear.nombre + ' - Sede Principal' : 'Sede Principal'"
                     class="input"/>
            </div>
            <div class="span-2">
              <div class="toggle-row">
                <div>
                  <p class="toggle-titulo">Facturación Electrónica</p>
                  <p class="toggle-desc">¿Esta empresa emite comprobantes electrónicos?</p>
                </div>
                <button (click)="formCrear.facturacion_electronica = !formCrear.facturacion_electronica"
                        class="toggle"
                        [class.toggle-on]="formCrear.facturacion_electronica">
                  <span class="toggle-dot" [class.dot-on]="formCrear.facturacion_electronica"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="seccion-form">
          <p class="seccion-titulo">Plan</p>
          <div class="grid-form cols-3">
            <div class="campo">
              <label>Plan *</label>
              <select [(ngModel)]="formCrear.plan_id" class="input">
                <option *ngFor="let p of planes" [value]="p.plan_id">{{ p.nombre }}</option>
              </select>
            </div>
            <div class="campo">
              <label>Inicio plan</label>
              <input type="date" [(ngModel)]="formCrear.plan_fecha_inicio" class="input"/>
            </div>
            <div class="campo">
              <label>Vencimiento plan</label>
              <input type="date" [(ngModel)]="formCrear.plan_fecha_vencimiento" class="input"/>
            </div>
          </div>
        </div>

        <div class="seccion-form">
          <p class="seccion-titulo">Usuario administrador inicial</p>
          <div class="grid-form">
            <div class="campo">
              <label>Nombre del admin</label>
              <input [(ngModel)]="formCrear.admin_nombre" placeholder="Administrador" class="input"/>
            </div>
            <div class="campo">
              <label>Email del admin *</label>
              <input [(ngModel)]="formCrear.admin_email" type="email" placeholder="admin@empresa.com" class="input"/>
            </div>
            <div class="campo span-2">
              <label>Contraseña inicial</label>
              <input [(ngModel)]="formCrear.admin_password" type="text"
                     placeholder="Admin123! (se puede cambiar después)"
                     class="input mono"/>
              <p class="campo-help">
                Si no indicas contraseña se usará <span class="mono">Admin123!</span> por defecto
              </p>
            </div>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button (click)="mostrarModalCrear = false" class="btn-cancelar">Cancelar</button>
        <button (click)="guardarNuevaEmpresa()"
                [disabled]="guardando || !formCrear.nombre || !formCrear.admin_email"
                class="btn-guardar">
          {{ guardando ? 'Creando...' : 'Crear empresa' }}
        </button>
      </div>
    </div>
  </div>


  <!-- ══ MODAL EDITAR EMPRESA ══ -->
  <div *ngIf="mostrarModalEditar && empresaEditando" class="modal-backdrop">
    <div class="modal modal-grande">

      <div class="modal-header">
        <div>
          <h3 class="modal-titulo">Editar empresa</h3>
          <p class="modal-subtitulo">
            {{ empresaEditando.config?.razon_social || empresaEditando.nombre }}
            <span class="mono modal-id">ID: {{ empresaEditando.tenant_id }}</span>
          </p>
        </div>
        <button (click)="mostrarModalEditar = false" class="btn-cerrar">✕</button>
      </div>

      <div class="modal-tabs">
        <button (click)="tabEditar = 'tenant'" [class.tab-activo]="tabEditar === 'tenant'" class="modal-tab">Empresa</button>
        <button (click)="tabEditar = 'config'" [class.tab-activo]="tabEditar === 'config'" class="modal-tab">Configuración</button>
        <button (click)="tabEditar = 'logo'" [class.tab-activo]="tabEditar === 'logo'" class="modal-tab">Logo</button>
        <button (click)="tabEditar = 'plan'" [class.tab-activo]="tabEditar === 'plan'" class="modal-tab">Plan</button>
      </div>

      <div class="modal-body">

        <!-- Tab Empresa -->
        <div *ngIf="tabEditar === 'tenant'" class="grid-form">
          <div class="campo span-2">
            <label>Nombre *</label>
            <input [(ngModel)]="formEditar.nombre" class="input"/>
          </div>
          <div class="campo">
            <label>RUC</label>
            <input [(ngModel)]="formEditar.ruc" maxlength="11" class="input mono"/>
          </div>
          <div class="campo">
            <label>Email</label>
            <input [(ngModel)]="formEditar.email" type="email" class="input"/>
          </div>
          <div class="campo">
            <label>Teléfono</label>
            <input [(ngModel)]="formEditar.telefono" class="input"/>
          </div>
          <div class="campo span-2">
            <label>Dirección</label>
            <input [(ngModel)]="formEditar.direccion" class="input"/>
          </div>
        </div>

        <!-- Tab Configuración -->
        <div *ngIf="tabEditar === 'config'" class="grid-form">
          <div class="campo span-2">
            <label>Razón social *</label>
            <input [(ngModel)]="formConfig.razon_social" class="input"/>
          </div>
          <div class="campo">
            <label>Nombre comercial</label>
            <input [(ngModel)]="formConfig.nombre_comercial" class="input"/>
          </div>
          <div class="campo">
            <label>RUC</label>
            <input [(ngModel)]="formConfig.ruc" maxlength="11" class="input mono"/>
          </div>
          <div class="campo">
            <label>Email</label>
            <input [(ngModel)]="formConfig.email" type="email" class="input"/>
          </div>
          <div class="campo">
            <label>Teléfono</label>
            <input [(ngModel)]="formConfig.telefono" class="input"/>
          </div>
          <div class="campo span-2">
            <label>Dirección</label>
            <input [(ngModel)]="formConfig.direccion" class="input"/>
          </div>
          <div class="campo span-2">
            <label>Pie del comprobante</label>
            <input [(ngModel)]="formConfig.pie_comprobante" class="input"/>
          </div>
          <div class="span-2">
            <div class="toggle-row">
              <div>
                <p class="toggle-titulo">Facturación Electrónica</p>
                <p class="toggle-desc">
                  {{ formConfig.facturacion_electronica ? 'Activa — emite Boleta, Factura y NV' : 'Inactiva — solo Nota de Venta' }}
                </p>
              </div>
              <button (click)="formConfig.facturacion_electronica = !formConfig.facturacion_electronica"
                      class="toggle"
                      [class.toggle-on]="formConfig.facturacion_electronica">
                <span class="toggle-dot" [class.dot-on]="formConfig.facturacion_electronica"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab Logo -->
        <div *ngIf="tabEditar === 'logo'" class="tab-logo">
          <p class="logo-info">
            El logo aparecerá en comprobantes PDF (boletas, facturas, notas de venta) y en los reportes exportados.
            <strong>Recomendado:</strong> PNG con fondo transparente, mínimo 200×200 px, máximo 500 KB.
          </p>

          <div class="logo-preview-area">
            <div class="logo-preview" *ngIf="formConfig.logo_base64 || logoPreviewActual">
              <img [src]="formConfig.logo_base64 || logoPreviewActual" alt="logo preview" />
            </div>
            <div class="logo-preview vacio" *ngIf="!formConfig.logo_base64 && !logoPreviewActual">
              <p>Sin logo configurado</p>
              <p class="logo-sub">Sube una imagen para verla aquí</p>
            </div>
          </div>

          <div class="logo-acciones">
            <label class="btn-subir">
              <input type="file"
                     accept="image/png,image/jpeg,image/jpg,image/webp"
                     (change)="onLogoSeleccionado($event)"
                     hidden/>
              {{ (formConfig.logo_base64 || logoPreviewActual) ? 'Cambiar logo' : 'Subir logo' }}
            </label>
            <button *ngIf="formConfig.logo_base64 || logoPreviewActual"
                    (click)="quitarLogo()" class="btn-quitar-logo">
              Quitar logo
            </button>
          </div>

          <div *ngIf="logoError" class="logo-error">{{ logoError }}</div>
        </div>

        <!-- Tab Plan -->
        <div *ngIf="tabEditar === 'plan'" class="grid-form">
          <div class="campo span-2">
            <label>Plan</label>
            <select [(ngModel)]="formEditar.plan_id" class="input">
              <option *ngFor="let p of planes" [value]="p.plan_id">{{ p.nombre }}</option>
            </select>
          </div>
          <div class="campo">
            <label>Inicio plan</label>
            <input type="date" [(ngModel)]="formEditar.plan_fecha_inicio" class="input"/>
          </div>
          <div class="campo">
            <label>Vencimiento plan</label>
            <input type="date" [(ngModel)]="formEditar.plan_fecha_vencimiento" class="input"/>
          </div>
          <div class="span-2">
            <div class="toggle-row">
              <div>
                <p class="toggle-titulo">Plan activo</p>
                <p class="toggle-desc">{{ formEditar.plan_activo ? 'El plan está vigente' : 'Plan suspendido' }}</p>
              </div>
              <button (click)="formEditar.plan_activo = !formEditar.plan_activo"
                      class="toggle"
                      [class.toggle-on]="formEditar.plan_activo">
                <span class="toggle-dot" [class.dot-on]="formEditar.plan_activo"></span>
              </button>
            </div>
          </div>
          <div class="span-2">
            <div class="toggle-row">
              <div>
                <p class="toggle-titulo">Empresa activa</p>
                <p class="toggle-desc">{{ formEditar.activo ? 'Los usuarios pueden ingresar' : 'Acceso bloqueado' }}</p>
              </div>
              <button (click)="formEditar.activo = !formEditar.activo"
                      class="toggle"
                      [class.toggle-on]="formEditar.activo"
                      [class.toggle-rojo]="!formEditar.activo">
                <span class="toggle-dot" [class.dot-on]="formEditar.activo"></span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button (click)="mostrarModalEditar = false" class="btn-cancelar">Cancelar</button>
        <button (click)="guardarEdicion()" [disabled]="guardando" class="btn-guardar">
          {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>

    </div>
  </div>

</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

    .superadmin-container { color: #0f172a; }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .titulo { font-size: 22px; font-weight: 600; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .subtitulo { font-size: 13px; color: #64748b; margin: 4px 0 0; }

    .btn-nuevo {
      padding: 8px 16px;
      background: #0f172a;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-nuevo:hover { background: #1e293b; }

    /* LOADING / VACÍO */
    .loading-state, .vacio-empresas {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .spinner {
      width: 28px; height: 28px; margin: 0 auto 12px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* LISTA */
    .empresas-lista { display: flex; flex-direction: column; gap: 12px; }
    .empresa-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      transition: border-color 0.15s;
    }
    .empresa-card.inactiva { opacity: 0.7; border-color: #fecaca; }
    .empresa-card:hover { border-color: #cbd5e1; }

    .empresa-contenido {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 18px;
    }

    .empresa-avatar {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      background: #0f172a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      flex-shrink: 0;
      overflow: hidden;
    }
    .empresa-avatar.con-logo { background: #f8fafc; border: 1px solid #e2e8f0; }
    .empresa-avatar img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }

    .empresa-info { flex: 1; min-width: 0; }

    .empresa-titulo-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .empresa-nombre {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .empresa-comercial { font-size: 12px; color: #94a3b8; }

    .badge-estado {
      font-size: 10.5px;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-estado.activo { background: #d1fae5; color: #047857; }
    .badge-estado.inactivo { background: #fee2e2; color: #b91c1c; }

    .badge-fe {
      font-size: 10.5px;
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .empresa-detalles {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 18px;
      margin-bottom: 8px;
    }
    .detalle-item {
      display: flex;
      align-items: baseline;
      gap: 5px;
      font-size: 12px;
    }
    .detalle-item.dir {
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .detalle-label {
      color: #94a3b8;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .detalle-valor {
      color: #475569;
      font-variant-numeric: tabular-nums;
    }
    .detalle-valor.mono, .mono { font-family: 'JetBrains Mono', 'Consolas', monospace; }

    .empresa-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .badge-plan {
      font-size: 10.5px;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-fecha {
      font-size: 11px;
      background: #f8fafc;
      color: #64748b;
      padding: 3px 8px;
      border-radius: 3px;
      font-variant-numeric: tabular-nums;
    }
    .badge-fecha.vencido { background: #fee2e2; color: #b91c1c; font-weight: 600; }
    .meta-info, .meta-id { font-size: 11px; color: #94a3b8; }

    .empresa-acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .btn-accion {
      padding: 6px 12px;
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .btn-accion:hover { background: #0f172a; color: white; border-color: #0f172a; }
    .btn-accion.btn-peligro { color: #b91c1c; border-color: #fecaca; }
    .btn-accion.btn-peligro:hover { background: #b91c1c; color: white; border-color: #b91c1c; }
    .btn-accion.btn-exito { color: #047857; border-color: #a7f3d0; }
    .btn-accion.btn-exito:hover { background: #047857; color: white; border-color: #047857; }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 16px;
    }
    .modal {
      background: white;
      border-radius: 8px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
    }
    .modal-grande { max-width: 720px; }

    .modal-header {
      padding: 18px 22px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-titulo {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .modal-subtitulo {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0;
    }
    .modal-id { color: #94a3b8; margin-left: 6px; font-size: 11px; }

    .btn-cerrar {
      width: 30px;
      height: 30px;
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 18px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-cerrar:hover { background: #f1f5f9; color: #0f172a; }

    .modal-tabs {
      display: flex;
      gap: 4px;
      padding: 12px 22px 0;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .modal-tab {
      padding: 8px 14px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #64748b;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      margin-bottom: -1px;
    }
    .modal-tab:hover { color: #0f172a; }
    .modal-tab.tab-activo {
      color: #0f172a;
      border-bottom-color: #0f172a;
      font-weight: 600;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .seccion-form { display: flex; flex-direction: column; gap: 12px; }
    .seccion-titulo {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0;
    }

    .grid-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-form.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    @media (max-width: 600px) { .grid-form, .grid-form.cols-3 { grid-template-columns: 1fr; } }
    .span-2 { grid-column: span 2; }
    @media (max-width: 600px) { .span-2 { grid-column: span 1; } }

    .campo { display: flex; flex-direction: column; gap: 4px; }
    .campo label {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .campo-help {
      font-size: 11px;
      color: #94a3b8;
      margin: 4px 0 0;
    }

    .input {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      font-size: 13px;
      color: #0f172a;
      background: white;
      outline: none;
      transition: border-color 0.15s;
      font-variant-numeric: tabular-nums;
      font-family: inherit;
    }
    .input.mono { font-family: 'JetBrains Mono', 'Consolas', monospace; }
    .input:focus { border-color: #0f172a; box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05); }

    /* TOGGLE */
    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
    }
    .toggle-titulo {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .toggle-desc {
      font-size: 11.5px;
      color: #64748b;
      margin: 2px 0 0;
    }
    .toggle {
      position: relative;
      width: 40px;
      height: 22px;
      border-radius: 11px;
      background: #cbd5e1;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .toggle.toggle-on { background: #0f172a; }
    .toggle.toggle-rojo { background: #b91c1c; }
    .toggle-dot {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle-dot.dot-on { transform: translateX(18px); }

    /* TAB LOGO */
    .tab-logo { display: flex; flex-direction: column; gap: 16px; }
    .logo-info {
      font-size: 12.5px;
      color: #475569;
      margin: 0;
      padding: 12px 14px;
      background: #f8fafc;
      border-left: 3px solid #0f172a;
      border-radius: 4px;
      line-height: 1.5;
    }
    .logo-info strong { color: #0f172a; }

    .logo-preview-area {
      display: flex;
      justify-content: center;
    }
    .logo-preview {
      width: 220px;
      height: 220px;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      overflow: hidden;
    }
    .logo-preview.vacio {
      flex-direction: column;
      color: #94a3b8;
    }
    .logo-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .logo-preview p { margin: 0; font-size: 13px; font-weight: 500; }
    .logo-sub { font-size: 11px !important; color: #cbd5e1 !important; margin-top: 4px !important; }

    .logo-acciones {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .btn-subir, .btn-quitar-logo {
      padding: 8px 16px;
      border-radius: 5px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid;
    }
    .btn-subir {
      background: #0f172a;
      color: white;
      border-color: #0f172a;
    }
    .btn-subir:hover { background: #1e293b; }
    .btn-quitar-logo {
      background: white;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .btn-quitar-logo:hover { background: #b91c1c; color: white; border-color: #b91c1c; }

    .logo-error {
      text-align: center;
      font-size: 12px;
      color: #b91c1c;
      background: #fee2e2;
      padding: 8px 12px;
      border-radius: 4px;
    }

    /* MODAL FOOTER */
    .modal-footer {
      padding: 16px 22px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .btn-cancelar, .btn-guardar {
      flex: 1;
      padding: 10px;
      border-radius: 5px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-cancelar {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .btn-cancelar:hover { background: #f1f5f9; color: #0f172a; }
    .btn-guardar {
      background: #0f172a;
      color: white;
    }
    .btn-guardar:hover { background: #1e293b; }
    .btn-guardar:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class SuperAdminComponent implements OnInit {

  private superAdminService = inject(SuperAdminService);
  private cd                = inject(ChangeDetectorRef);
  private destroyRef        = inject(DestroyRef);
  private router            = inject(Router);

  empresas:  any[] = [];
  planes:    any[] = [];
  loading        = true;
  guardando      = false;

  mostrarModalCrear  = false;
  mostrarModalEditar = false;
  empresaEditando:   any = null;
  tabEditar          = 'tenant';

  // Cache de logos para mostrarlos en la lista (clave: tenant_id)
  logosCache: Record<number, string> = {};

  // Logo actual cargado en el modal (al editar)
  logoPreviewActual: string | null = null;
  logoError: string = '';

  formCrear: any = {
    nombre: '', nombre_comercial: '', ruc: '', email: '', telefono: '',
    direccion: '', nombre_sucursal: '', facturacion_electronica: false,
    plan_id: 2, plan_fecha_inicio: '', plan_fecha_vencimiento: '',
    admin_email: '', admin_nombre: 'Administrador', admin_password: ''
  };

  formEditar: any = {};
  formConfig: any = {};

  constructor() {}

  ngOnInit() {
    this.cargar();
    this.superAdminService.getPlanes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => { this.planes = res; this.cd.detectChanges(); } });
  }

  cargar() {
    this.loading = true;
    this.superAdminService.getEmpresas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.empresas = res;
          this.loading = false;
          this.cd.detectChanges();
          // Cargar logos en segundo plano para los que los tengan
          this.empresas
            .filter(e => e.config?.tiene_logo)
            .forEach(e => this.cargarLogoEmpresa(e.tenant_id));
        },
        error: () => { this.loading = false; this.cd.detectChanges(); }
      });
  }

  cargarLogoEmpresa(tenantId: number) {
    if (this.logosCache[tenantId]) return;
    this.superAdminService.getLogoEmpresa(tenantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res?.logo_base64) {
            this.logosCache[tenantId] = res.logo_base64;
            this.cd.detectChanges();
          }
        }
      });
  }

  getInicial(e: any): string {
    const nombre = e.config?.nombre_comercial || e.nombre || '?';
    return nombre.charAt(0).toUpperCase();
  }

  abrirModalCrear() {
    this.formCrear = {
      nombre: '', nombre_comercial: '', ruc: '', email: '', telefono: '',
      direccion: '', nombre_sucursal: '', facturacion_electronica: false,
      plan_id: 2, plan_fecha_inicio: '', plan_fecha_vencimiento: '',
      admin_email: '', admin_nombre: 'Administrador', admin_password: ''
    };
    this.mostrarModalCrear = true;
    this.cd.detectChanges();
  }

  abrirModalEditar(e: any) {
    this.empresaEditando = e;
    this.tabEditar = 'tenant';
    this.logoError = '';
    this.logoPreviewActual = this.logosCache[e.tenant_id] || null;

    this.formEditar = {
      nombre:                 e.nombre,
      ruc:                    e.ruc ?? '',
      email:                  e.email ?? '',
      telefono:               e.telefono ?? '',
      direccion:              e.config?.direccion ?? '',
      activo:                 e.activo,
      plan_id:                e.plan_id ?? 1,
      plan_activo:            e.plan_activo ?? true,
      plan_fecha_inicio:      e.plan_fecha_inicio ?? '',
      plan_fecha_vencimiento: e.plan_fecha_vencimiento ?? ''
    };

    this.formConfig = {
      razon_social:            e.config?.razon_social ?? e.nombre,
      nombre_comercial:        e.config?.nombre_comercial ?? '',
      ruc:                     e.config?.ruc ?? e.ruc ?? '',
      email:                   e.email ?? '',
      telefono:                e.telefono ?? '',
      direccion:               e.config?.direccion ?? '',
      pie_comprobante:         'Gracias por su preferencia',
      facturacion_electronica: e.config?.facturacion_electronica ?? false,
      logo_base64:             ''
    };

    // Si tiene logo, cargarlo para el preview
    if (e.config?.tiene_logo && !this.logoPreviewActual) {
      this.cargarLogoEmpresa(e.tenant_id);
    }

    this.superAdminService.getEmpresa(e.tenant_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.config) {
            this.formConfig.pie_comprobante = res.config.pie_comprobante ?? 'Gracias por su preferencia';
          }
          this.cd.detectChanges();
        }
      });

    this.mostrarModalEditar = true;
    this.cd.detectChanges();
  }

  onLogoSeleccionado(event: any) {
    this.logoError = '';
    const file: File = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 500 KB)
    if (file.size > 500 * 1024) {
      this.logoError = 'El archivo es muy grande. Máximo 500 KB.';
      return;
    }

    // Validar tipo
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      this.logoError = 'Formato no soportado. Use PNG, JPG o WebP.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.formConfig.logo_base64 = e.target.result;
      this.logoPreviewActual = e.target.result;
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  quitarLogo() {
    this.formConfig.logo_base64 = 'QUITAR'; // bandera para que backend lo limpie
    this.logoPreviewActual = null;
    if (this.empresaEditando) {
      delete this.logosCache[this.empresaEditando.tenant_id];
    }
    this.cd.detectChanges();
  }

  guardarNuevaEmpresa() {
    if (!this.formCrear.nombre?.trim()) {
      Swal.fire('Campo requerido', 'El nombre de la empresa es obligatorio', 'warning');
      return;
    }
    if (!this.formCrear.admin_email?.trim()) {
      Swal.fire('Campo requerido', 'El email del administrador es obligatorio', 'warning');
      return;
    }

    this.guardando = true;
    this.superAdminService.crearEmpresa(this.formCrear)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.guardando         = false;
          this.mostrarModalCrear = false;
          this.cd.detectChanges();
          Swal.fire({
            icon: 'success', title: '¡Empresa creada!',
            html: `
              <div style="text-align:left;font-size:14px;line-height:2">
                <p><b>Empresa:</b> ${this.formCrear.nombre}</p>
                <p><b>Tenant ID:</b> ${res.tenant_id}</p>
                <hr style="margin:8px 0"/>
                <p style="color:#6b7280;font-size:12px">Credenciales del administrador:</p>
                <p><b>Email:</b> ${res.credenciales.email}</p>
                <p><b>Password:</b> <span style="font-family:monospace">${res.credenciales.password}</span></p>
              </div>`,
            confirmButtonColor: '#0f172a'
          });
          this.cargar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire('Error', err?.error || 'No se pudo crear la empresa', 'error');
          this.cd.detectChanges();
        }
      });
  }

  guardarEdicion() {
    if (!this.empresaEditando) return;
    this.guardando = true;
    const tenantId = this.empresaEditando.tenant_id;

    this.superAdminService.actualizarEmpresa(tenantId, this.formEditar)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.superAdminService.actualizarConfig(tenantId, this.formConfig)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.guardando          = false;
                this.mostrarModalEditar = false;
                // Limpiar cache si se cambió el logo
                if (this.formConfig.logo_base64 && this.formConfig.logo_base64 !== 'QUITAR') {
                  this.logosCache[tenantId] = this.formConfig.logo_base64;
                } else if (this.formConfig.logo_base64 === 'QUITAR') {
                  delete this.logosCache[tenantId];
                }
                this.cd.detectChanges();
                Swal.fire({ icon: 'success', title: 'Cambios guardados', timer: 1800, showConfirmButton: false });
                this.cargar();
              },
              error: (err) => {
                this.guardando = false;
                Swal.fire('Error al guardar config', err?.error || 'Error', 'error');
                this.cd.detectChanges();
              }
            });
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire('Error al guardar empresa', err?.error || 'Error', 'error');
          this.cd.detectChanges();
        }
      });
  }

  confirmarToggle(e: any) {
    Swal.fire({
      title: e.activo ? '¿Desactivar empresa?' : '¿Activar empresa?',
      html: `<b>${e.config?.razon_social || e.nombre}</b><br>
             <small style="color:#6b7280">
               ${e.activo ? 'Los usuarios no podrán ingresar al sistema' : 'Los usuarios podrán volver a ingresar'}
             </small>`,
      icon: e.activo ? 'warning' : 'question',
      showCancelButton:  true,
      confirmButtonText: e.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText:  'Cancelar',
      confirmButtonColor: e.activo ? '#b91c1c' : '#047857'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.superAdminService.toggleEmpresa(e.tenant_id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            Swal.fire({ icon: 'success', title: res.mensaje, timer: 1500, showConfirmButton: false });
            this.cargar();
          },
          error: (err) => Swal.fire('Error', err?.error || 'No se pudo actualizar', 'error')
        });
    });
  }

  estaVencido(fecha: string): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }

  configurarFE(empresa: any) {
    this.router.navigate(['/app/configuracion_nubefact'], {
      queryParams: { tenantId: empresa.tenant_id }
    });
  }

  configurarSeries(empresa: any) {
    this.router.navigate(['/app/series_comprobantes'], {
      queryParams: { tenantId: empresa.tenant_id }
    });
  }
  
}