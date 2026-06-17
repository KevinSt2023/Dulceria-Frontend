import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard';
import { AuthService } from '../../core/auth/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="dashboard-container">

  <!-- HEADER -->
  <div class="header">
    <div>
      <h1 class="titulo">Dashboard</h1>
      <p class="subtitulo">
        {{ hoy | date:'EEEE, dd MMMM yyyy':'':'es' }} · {{ sucursalNombre }}
      </p>
    </div>
    <button (click)="cargar()" class="btn-refrescar">
      Actualizar
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Cargando métricas...</p>
  </div>

  <div *ngIf="!loading" class="contenido">

    <!-- ══ FILA 1: KPIs operación ══ -->
    <div class="kpis-grid cols-4">
      <div class="kpi-card">
        <span class="kpi-label">Pedidos hoy</span>
        <span class="kpi-valor">{{ data?.pedidos_hoy ?? 0 }}</span>
        <div class="kpi-tags">
          <span class="tag">{{ data?.pedidos_pendientes ?? 0 }} pendientes</span>
          <span class="tag">{{ data?.pedidos_listos ?? 0 }} listos</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">En producción</span>
        <span class="kpi-valor">{{ data?.pedidos_en_produccion ?? 0 }}</span>
        <div class="kpi-tags">
          <span class="tag">en preparación</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Transacciones</span>
        <span class="kpi-valor">{{ data?.transacciones_hoy ?? 0 }}</span>
        <div class="kpi-tags">
          <span class="tag">ventas registradas hoy</span>
        </div>
      </div>

      <div class="kpi-card" [class.alerta-card]="(data?.stock_bajo?.length ?? 0) > 0">
        <span class="kpi-label">Stock bajo</span>
        <span class="kpi-valor">{{ data?.stock_bajo?.length ?? 0 }}</span>
        <div class="kpi-tags">
          <span class="tag">
            {{ (data?.stock_bajo?.length ?? 0) > 0 ? 'productos bajo mínimo' : 'niveles normales' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ══ FILA 2: Panel financiero ══ -->
    <div class="panel-financiero">

      <div class="panel-header">
        <div>
          <p class="panel-titulo">Panel financiero</p>
          <p class="panel-subtitulo">Resumen de caja del día</p>
        </div>
        <span class="panel-fecha">{{ hoy | date:'dd/MM/yyyy':'UTC' }}</span>
      </div>

      <!-- 4 métricas financieras -->
      <div class="metricas-grid">

        <div class="metrica">
          <div class="metrica-header">
            <span class="dot dot-emerald"></span>
            <p class="metrica-label">Ventas hoy</p>
          </div>
          <p class="metrica-valor">S/ {{ data?.cobrado_hoy ?? 0 | number:'1.2-2' }}</p>
          <p class="metrica-desc">Total de ventas del día</p>
          <div class="metrica-detalle">
            <p class="detalle-label">Este mes</p>
            <p class="detalle-valor valor-emerald">S/ {{ data?.cobrado_mes ?? 0 | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="metrica">
          <div class="metrica-header">
            <span class="dot dot-blue"></span>
            <p class="metrica-label">Recibido hoy</p>
          </div>
          <p class="metrica-valor">S/ {{ data?.recibido_hoy ?? 0 | number:'1.2-2' }}</p>
          <p class="metrica-desc">Efectivo + digital recibido</p>
          <div class="metrica-detalle">
            <p class="detalle-label">Vuelto entregado</p>
            <p class="detalle-valor valor-muted">− S/ {{ data?.vuelto_hoy ?? 0 | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="metrica">
          <div class="metrica-header">
            <span class="dot dot-cyan"></span>
            <p class="metrica-label">Neto caja</p>
          </div>
          <p class="metrica-valor valor-cyan">S/ {{ data?.facturado_hoy ?? 0 | number:'1.2-2' }}</p>
          <p class="metrica-desc">Recibido menos vuelto</p>
          <div class="metrica-detalle">
            <p class="detalle-valor" [class.valor-emerald]="netoCuadra" [class.valor-amber]="!netoCuadra">
              {{ netoCuadra ? 'Cuadra con ventas' : 'Revisar diferencia' }}
            </p>
          </div>
        </div>

        <div class="metrica">
          <div class="metrica-header">
            <span class="dot" [class.dot-amber]="(data?.creditos_pendientes ?? 0) > 0" [class.dot-emerald]="(data?.creditos_pendientes ?? 0) === 0"></span>
            <p class="metrica-label">Por cobrar</p>
          </div>
          <p class="metrica-valor" [class.valor-amber]="(data?.creditos_pendientes ?? 0) > 0">
            S/ {{ data?.creditos_pendientes ?? 0 | number:'1.2-2' }}
          </p>
          <p class="metrica-desc">Saldo pendiente de créditos</p>
          <div class="metrica-detalle">
            <p class="detalle-valor" [class.valor-amber]="(data?.cantidad_creditos ?? 0) > 0" [class.valor-emerald]="(data?.cantidad_creditos ?? 0) === 0">
              {{ data?.cantidad_creditos ?? 0 }} crédito(s) abierto(s)
            </p>
          </div>
        </div>

      </div>

      <!-- Ecuación de caja -->
      <div class="ecuacion-caja">
        <div class="ecuacion-grid">
          <div class="ecuacion-item">
            <p class="ecuacion-label">Recibido</p>
            <p class="ecuacion-valor">S/ {{ data?.recibido_hoy ?? 0 | number:'1.2-2' }}</p>
          </div>
          <span class="ecuacion-operador">−</span>
          <div class="ecuacion-item">
            <p class="ecuacion-label">Vuelto</p>
            <p class="ecuacion-valor valor-amber">S/ {{ data?.vuelto_hoy ?? 0 | number:'1.2-2' }}</p>
          </div>
          <span class="ecuacion-operador">=</span>
          <div class="ecuacion-item">
            <p class="ecuacion-label">Neto caja</p>
            <p class="ecuacion-valor valor-cyan">S/ {{ data?.facturado_hoy ?? 0 | number:'1.2-2' }}</p>
          </div>
          <span class="ecuacion-operador">≈</span>
          <div class="ecuacion-item">
            <p class="ecuacion-label">Ventas</p>
            <p class="ecuacion-valor valor-emerald">S/ {{ data?.cobrado_hoy ?? 0 | number:'1.2-2' }}</p>
          </div>
        </div>
        <p class="ecuacion-mensaje" [class.mensaje-ok]="netoCuadra" [class.mensaje-alerta]="!netoCuadra">
          {{ netoCuadra
              ? 'Caja cuadrada — todo en orden'
              : 'Diferencia de S/ ' + diferenciaCaja.toFixed(2) + ' — puede haber créditos o pagos parciales' }}
        </p>
      </div>

      <!-- Desglose por método de pago -->
      <div *ngIf="(data?.pagos_por_metodo?.length ?? 0) > 0" class="desglose-metodos">
        <p class="desglose-titulo">Desglose por método de pago</p>
        <div class="metodos-grid">
          <div *ngFor="let m of data?.pagos_por_metodo" class="metodo-card">
            <p class="metodo-nombre">{{ m.nombre }}</p>
            <p class="metodo-monto">S/ {{ m.monto | number:'1.2-2' }}</p>
            <p class="metodo-trx">{{ m.count }} trx</p>
            <div class="barra-metodo">
              <div class="barra-metodo-fill" [style.width.%]="getPorcentajeMetodo(m.monto)"></div>
            </div>
          </div>
        </div>

        <!-- Total efectivo vs digital -->
        <div class="totales-canal">
          <div class="canal-card canal-efectivo">
            <div>
              <p class="canal-label">Efectivo</p>
              <p class="canal-desc">Para cuadre de caja física</p>
            </div>
            <p class="canal-valor">S/ {{ totalEfectivo | number:'1.2-2' }}</p>
          </div>
          <div class="canal-card canal-digital">
            <div>
              <p class="canal-label">Digital</p>
              <p class="canal-desc">Yape · Plin · Tarjeta · Transferencia</p>
            </div>
            <p class="canal-valor">S/ {{ totalDigital | number:'1.2-2' }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="(data?.pagos_por_metodo?.length ?? 0) === 0" class="sin-datos">
        Sin transacciones registradas hoy
      </div>

    </div>

    <!-- ══ FILA 3: Resumen + Alertas ══ -->
    <div class="grid-3col">

      <div class="sub-card">
        <p class="sub-card-titulo">Resumen general</p>
        <div class="resumen-lista">
          <div class="resumen-item">
            <span class="resumen-label">Productos activos</span>
            <span class="resumen-valor">{{ data?.total_productos ?? 0 }}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Usuarios activos</span>
            <span class="resumen-valor">{{ data?.total_usuarios ?? 0 }}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Sede</span>
            <span class="resumen-valor resumen-truncado" [title]="sucursalNombre">{{ sucursalNombre }}</span>
          </div>
        </div>
      </div>

      <div class="sub-card span-2" [class.card-alerta]="(data?.stock_bajo?.length ?? 0) > 0">
        <div class="sub-card-header">
          <p class="sub-card-titulo">Alertas de stock</p>
          <span *ngIf="(data?.stock_bajo?.length ?? 0) > 0" class="contador-alerta">
            {{ data?.stock_bajo?.length }} productos
          </span>
        </div>
        <div *ngIf="(data?.stock_bajo?.length ?? 0) === 0" class="vacio-card">
          Todo el stock está en niveles normales
        </div>
        <div *ngIf="(data?.stock_bajo?.length ?? 0) > 0" class="stock-lista">
          <div *ngFor="let s of data?.stock_bajo" class="stock-item">
            <div>
              <p class="stock-producto">{{ s.producto }}</p>
              <p class="stock-almacen">{{ s.almacen }}</p>
            </div>
            <div class="stock-cantidades">
              <p class="stock-actual">{{ s.stock }}</p>
              <p class="stock-minimo">mín: {{ s.minimo }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ══ FILA 4: Pedidos recientes ══ -->
    <div class="sub-card">
      <div class="sub-card-header">
        <p class="sub-card-titulo">Últimos pedidos</p>
        <a routerLink="/app/pedidos" class="ver-todos">Ver todos →</a>
      </div>
      <div *ngIf="(data?.pedidos_recientes?.length ?? 0) === 0" class="vacio-card">
        No hay pedidos registrados aún
      </div>
      <div *ngIf="(data?.pedidos_recientes?.length ?? 0) > 0" class="tabla-wrapper">
        <table class="tabla-data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th class="hide-mobile">Sucursal</th>
              <th>Estado</th>
              <th class="num">Total</th>
              <th class="num hide-mobile">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of data?.pedidos_recientes">
              <td class="mono bold">#{{ p.pedido_id }}</td>
              <td>{{ p.cliente }}</td>
              <td class="hide-mobile">
                <span class="badge-sucursal">{{ p.sucursal }}</span>
              </td>
              <td>
                <span class="badge-estado" [ngClass]="getEstadoClase(p.estado)">{{ p.estado }}</span>
              </td>
              <td class="num bold valor-emerald">S/ {{ p.total | number:'1.2-2' }}</td>
              <td class="num muted hide-mobile">{{ p.fecha | date:'dd/MM HH:mm':'UTC' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ ACCESOS RÁPIDOS ══ -->
    <div *ngIf="isAdminOrSuper" class="accesos-grid">
      <a routerLink="/app/pedidos" class="acceso">Nuevo pedido</a>
      <a routerLink="/app/inventario" class="acceso">Inventario</a>
      <a routerLink="/app/usuarios" class="acceso">Usuarios</a>
      <a routerLink="/app/seguimiento" class="acceso">Producción</a>
    </div>

  </div>

</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

    .dashboard-container { color: #0f172a; }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .titulo { font-size: 22px; font-weight: 600; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .subtitulo { font-size: 13px; color: #64748b; margin: 4px 0 0; text-transform: capitalize; }

    .btn-refrescar {
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
    .btn-refrescar:hover { background: #1e293b; }

    /* LOADING */
    .loading-state { text-align: center; padding: 60px 20px; color: #64748b; }
    .spinner {
      width: 28px; height: 28px; margin: 0 auto 12px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .contenido { display: flex; flex-direction: column; gap: 20px; }

    /* KPIs */
    .kpis-grid { display: grid; gap: 12px; }
    .cols-4 { grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 900px) { .cols-4 { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-card.alerta-card { border-color: #fecaca; }
    .kpi-card.alerta-card .kpi-valor { color: #b91c1c; }

    .kpi-label {
      font-size: 10.5px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .kpi-valor {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
    }
    .kpi-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .tag {
      font-size: 10.5px;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 500;
    }

    /* PANEL FINANCIERO */
    .panel-financiero {
      background: #0f172a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #1e293b;
    }
    .panel-header {
      padding: 14px 18px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-titulo { color: white; font-size: 13px; font-weight: 600; margin: 0; }
    .panel-subtitulo { color: #64748b; font-size: 11px; margin: 2px 0 0; }
    .panel-fecha {
      font-size: 11px;
      color: #94a3b8;
      background: #1e293b;
      padding: 4px 10px;
      border-radius: 4px;
      font-variant-numeric: tabular-nums;
    }

    .metricas-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
    @media (max-width: 900px) { .metricas-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) { .metricas-grid { grid-template-columns: 1fr; } }

    .metrica {
      padding: 18px;
      border-right: 1px solid #1e293b;
    }
    .metrica:last-child { border-right: none; }
    @media (max-width: 900px) {
      .metrica:nth-child(2) { border-right: none; }
      .metrica:nth-child(1), .metrica:nth-child(2) { border-bottom: 1px solid #1e293b; }
    }

    .metrica-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .dot-emerald { background: #10b981; }
    .dot-blue { background: #3b82f6; }
    .dot-cyan { background: #06b6d4; }
    .dot-amber { background: #f59e0b; }

    .metrica-label {
      font-size: 10.5px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      margin: 0;
    }
    .metrica-valor {
      font-size: 22px;
      font-weight: 700;
      color: white;
      margin: 0 0 6px;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }
    .metrica-desc { font-size: 11px; color: #64748b; margin: 0; }
    .metrica-detalle {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #1e293b;
    }
    .detalle-label { font-size: 10.5px; color: #94a3b8; margin: 0; }
    .detalle-valor {
      font-size: 12px;
      color: #cbd5e1;
      font-weight: 600;
      margin: 2px 0 0;
      font-variant-numeric: tabular-nums;
    }

    .valor-cyan { color: #22d3ee; }
    .valor-emerald { color: #10b981; }
    .valor-amber { color: #f59e0b; }
    .valor-muted { color: #94a3b8; }

    /* ECUACIÓN DE CAJA */
    .ecuacion-caja {
      padding: 14px 18px;
      border-top: 1px solid #1e293b;
    }
    .ecuacion-grid {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .ecuacion-item { text-align: center; }
    .ecuacion-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 4px;
    }
    .ecuacion-valor {
      font-size: 13px;
      color: white;
      font-weight: 700;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .ecuacion-operador { color: #475569; font-size: 18px; font-weight: 300; }
    .ecuacion-mensaje {
      text-align: center;
      font-size: 11px;
      margin: 12px 0 0;
      padding: 6px 12px;
      border-radius: 4px;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
    }
    .mensaje-ok { color: #10b981; }
    .mensaje-alerta { color: #f59e0b; }

    /* DESGLOSE MÉTODOS */
    .desglose-metodos {
      padding: 14px 18px;
      border-top: 1px solid #1e293b;
    }
    .desglose-titulo {
      font-size: 10.5px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      margin: 0 0 12px;
    }
    .metodos-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
    }
    @media (max-width: 1100px) { .metodos-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px) { .metodos-grid { grid-template-columns: 1fr 1fr; } }

    .metodo-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 5px;
      padding: 10px;
      text-align: center;
      transition: background 0.15s;
    }
    .metodo-card:hover { background: rgba(255, 255, 255, 0.08); }
    .metodo-nombre {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
      margin: 0 0 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .metodo-monto {
      font-size: 13px;
      font-weight: 700;
      color: white;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .metodo-trx {
      font-size: 10.5px;
      color: #64748b;
      margin: 2px 0 0;
    }
    .barra-metodo {
      margin-top: 8px;
      height: 3px;
      background: #1e293b;
      border-radius: 2px;
      overflow: hidden;
    }
    .barra-metodo-fill {
      height: 100%;
      background: #22d3ee;
    }

    .totales-canal {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }
    @media (max-width: 600px) { .totales-canal { grid-template-columns: 1fr; } }

    .canal-card {
      padding: 10px 14px;
      border-radius: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .canal-efectivo {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .canal-digital {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .canal-label {
      font-size: 11px;
      font-weight: 600;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .canal-efectivo .canal-label { color: #10b981; }
    .canal-digital .canal-label { color: #3b82f6; }
    .canal-desc { font-size: 10.5px; color: #64748b; margin: 2px 0 0; }
    .canal-valor {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .canal-efectivo .canal-valor { color: #10b981; }
    .canal-digital .canal-valor { color: #3b82f6; }

    .sin-datos {
      padding: 18px;
      border-top: 1px solid #1e293b;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }

    /* GRID 3 COLUMNAS */
    .grid-3col {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 16px;
    }
    @media (max-width: 900px) { .grid-3col { grid-template-columns: 1fr; } }
    .span-2 { /* sub-card que ocupa 2 columnas en grid-3col */ }

    /* SUB CARDS */
    .sub-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
    }
    .sub-card.card-alerta { border-color: #fecaca; }
    .sub-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .sub-card-titulo {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 12px;
    }
    .sub-card-header .sub-card-titulo { margin-bottom: 0; }

    .contador-alerta {
      font-size: 11px;
      background: #fee2e2;
      color: #b91c1c;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 600;
    }

    .ver-todos {
      font-size: 12px;
      font-weight: 500;
      color: #0f172a;
      text-decoration: none;
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .ver-todos:hover { background: #e2e8f0; }

    .vacio-card {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 13px;
      font-style: italic;
    }

    /* RESUMEN */
    .resumen-lista { display: flex; flex-direction: column; gap: 4px; }
    .resumen-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .resumen-item:last-child { border-bottom: none; }
    .resumen-label { font-size: 13px; color: #475569; }
    .resumen-valor {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    .resumen-truncado {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
    }

    /* STOCK */
    .stock-lista {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
    }
    .stock-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 5px;
    }
    .stock-producto { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0; }
    .stock-almacen { font-size: 11px; color: #94a3b8; margin: 2px 0 0; }
    .stock-cantidades { text-align: right; }
    .stock-actual {
      font-size: 14px;
      font-weight: 700;
      color: #b91c1c;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .stock-minimo {
      font-size: 11px;
      color: #94a3b8;
      margin: 2px 0 0;
      font-variant-numeric: tabular-nums;
    }

    /* TABLA */
    .tabla-wrapper { overflow: auto; }
    .tabla-data {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }
    .tabla-data thead th {
      padding: 10px 12px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .tabla-data thead th.num { text-align: right; }
    .tabla-data tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
    }
    .tabla-data tbody tr:last-child td { border-bottom: none; }
    .tabla-data tbody tr:hover { background: #f8fafc; }
    .num { text-align: right; }
    .bold { font-weight: 600; }
    .mono { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 12px; }
    .muted { color: #64748b; }

    .badge-sucursal {
      font-size: 10.5px;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 500;
    }
    .badge-estado {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .estado-pendiente { background: #fef3c7; color: #92400e; }
    .estado-confirmado { background: #dbeafe; color: #1e40af; }
    .estado-preparacion { background: #f3e8ff; color: #6b21a8; }
    .estado-listo { background: #cffafe; color: #155e75; }
    .estado-entregado { background: #d1fae5; color: #047857; }
    .estado-cancelado { background: #fee2e2; color: #b91c1c; }
    .estado-default { background: #f1f5f9; color: #475569; }

    @media (max-width: 700px) { .hide-mobile { display: none; } }

    /* ACCESOS RÁPIDOS */
    .accesos-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    @media (max-width: 700px) { .accesos-grid { grid-template-columns: repeat(2, 1fr); } }

    .acceso {
      padding: 12px 16px;
      background: white;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      transition: all 0.15s;
    }
    .acceso:hover {
      background: #0f172a;
      color: white;
      border-color: #0f172a;
    }
  `]
})
export class DashboardComponent implements OnInit {

  data:          any = null;
  loading            = true;
  hoy                = new Date();
  isAdminOrSuper     = false;
  sucursalNombre     = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private dashboardService: DashboardService,
    private authService:      AuthService,
    private cd:               ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isAdminOrSuper = this.authService.isAdminOrSuper();
    this.sucursalNombre = this.authService.getSucursalNombre();
    this.cargar();
  }

  get netoCuadra(): boolean {
    return Math.abs((this.data?.cobrado_hoy ?? 0) - (this.data?.facturado_hoy ?? 0)) < 0.01;
  }

  get diferenciaCaja(): number {
    return Math.abs((this.data?.cobrado_hoy ?? 0) - (this.data?.facturado_hoy ?? 0));
  }

  get totalEfectivo(): number {
    const metodos: any[] = this.data?.pagos_por_metodo ?? [];
    return metodos
      .filter(m => m.codigo === 'EFECTIVO')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  get totalDigital(): number {
    const metodos: any[] = this.data?.pagos_por_metodo ?? [];
    return metodos
      .filter(m => m.codigo !== 'EFECTIVO')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  get totalRecibidoMetodos(): number {
    const metodos: any[] = this.data?.pagos_por_metodo ?? [];
    return metodos.reduce((sum, m) => sum + m.monto, 0);
  }

  getPorcentajeMetodo(monto: number): number {
    const total = this.totalRecibidoMetodos;
    if (total === 0) return 0;
    return Math.round((monto / total) * 100);
  }

  cargar() {
    this.loading = true;
    this.dashboardService.getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.data = res; this.loading = false; this.cd.detectChanges(); },
        error: ()   => { this.loading = false; this.cd.detectChanges(); }
      });
  }

  getEstadoClase(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE':      'estado-pendiente',
      'CONFIRMADO':     'estado-confirmado',
      'EN_PREPARACION': 'estado-preparacion',
      'LISTO':          'estado-listo',
      'ENTREGADO':      'estado-entregado',
      'CANCELADO':      'estado-cancelado'
    };
    return m[estado] ?? 'estado-default';
  }
}