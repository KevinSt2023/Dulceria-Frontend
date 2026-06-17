import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService, FiltrosReporte, FiltrosHistorialCreditos } from '../../core/services/reportes';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="reportes-container">

  <!-- HEADER -->
  <div class="header">
    <div>
      <h1 class="titulo">Reportes y Análisis</h1>
      <p class="subtitulo">Información operativa y financiera del negocio</p>
    </div>
  </div>

  <!-- TABS -->
  <div class="tabs-wrapper">
    <button *ngFor="let t of tabs"
            (click)="cambiarTab(t.id)"
            [class.activo]="tabActivo === t.id"
            class="tab-btn">
      {{ t.label }}
    </button>
  </div>

  <!-- FILTROS -->
  <div class="filtros-card">
    <div class="filtros-row">
      <div class="filtro-grupo">
        <label>Desde</label>
        <input type="date"
               [ngModel]="tabActivo === 'historial-creditos' ? filtrosHistorial.fecha_desde : filtros.fecha_desde"
               (ngModelChange)="setFechaDesde($event)"
               class="input"/>
      </div>
      <div class="filtro-grupo">
        <label>Hasta</label>
        <input type="date"
               [ngModel]="tabActivo === 'historial-creditos' ? filtrosHistorial.fecha_hasta : filtros.fecha_hasta"
               (ngModelChange)="setFechaHasta($event)"
               class="input"/>
      </div>

      <div *ngIf="tabActivo === 'ventas'" class="filtro-grupo">
        <label>Agrupar</label>
        <select [(ngModel)]="filtros.agrupar_por" class="input">
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
          <option value="anio">Año</option>
        </select>
      </div>

      <div *ngIf="tabActivo === 'ventas'" class="filtro-grupo">
        <label>Tipo comprobante</label>
        <select [(ngModel)]="filtros.tipo_comprobante" class="input">
          <option value="">Todos</option>
          <option value="01">Factura</option>
          <option value="03">Boleta</option>
          <option value="NV">Nota de Venta</option>
        </select>
      </div>

      <div *ngIf="tabActivo === 'ventas'" class="filtro-grupo">
        <label>Estado SUNAT</label>
        <select [(ngModel)]="filtros.estado_sunat" class="input">
          <option value="">Todos</option>
          <option value="ACEPTADO">Aceptado</option>
          <option value="RECHAZADO">Rechazado</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="SIN_ENVIAR">Sin enviar</option>
        </select>
      </div>

      <div *ngIf="tabActivo === 'clientes'" class="filtro-grupo">
        <label class="check-label">
          <input type="checkbox" [(ngModel)]="filtros.incluir_todos_clientes"/>
          Incluir clientes sin compras
        </label>
      </div>

      <div *ngIf="tabActivo === 'historial-creditos'" class="filtro-grupo">
        <label>Estado</label>
        <select [(ngModel)]="filtrosHistorial.estado" class="input">
          <option value="">Todos</option>
          <option value="PAGADO">Pagado</option>
          <option value="PARCIAL">Parcial</option>
          <option value="PENDIENTE">Pendiente</option>
        </select>
      </div>

      <button (click)="cargarReporte()" class="btn-aplicar">Aplicar</button>
    </div>

    <div class="filtros-row secundaria">
      <span class="label-rapido">Rangos rápidos:</span>
      <button (click)="aplicarRangoRapido('hoy')"    class="chip">Hoy</button>
      <button (click)="aplicarRangoRapido('ayer')"   class="chip">Ayer</button>
      <button (click)="aplicarRangoRapido('semana')" class="chip">Esta semana</button>
      <button (click)="aplicarRangoRapido('mes')"    class="chip">Este mes</button>
      <button (click)="aplicarRangoRapido('trimestre')" class="chip">Últimos 3 meses</button>
      <button (click)="aplicarRangoRapido('anio')"   class="chip">Este año</button>

      <div class="flex-1"></div>

      <button (click)="exportar('excel')" [disabled]="exportando" class="btn-export excel">
        Exportar Excel
      </button>
      <button (click)="exportar('pdf')" [disabled]="exportando" class="btn-export pdf">
        Exportar PDF
      </button>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="cargando" class="loading-state">
    <div class="spinner"></div>
    <p>Cargando información...</p>
  </div>

  <!-- ═══════════════════ VENTAS ═══════════════════ -->
  <div *ngIf="tabActivo === 'ventas' && !cargando && ventasData" class="reporte-seccion">
    <div class="kpis-grid cols-4">
      <div class="kpi-card">
        <span class="kpi-label">Total ventas</span>
        <span class="kpi-valor">S/ {{ ventasData.total_ventas | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Comprobantes</span>
        <span class="kpi-valor">{{ ventasData.cantidad_comprobantes }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Ticket promedio</span>
        <span class="kpi-valor">S/ {{ ventasData.ticket_promedio | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">IGV total</span>
        <span class="kpi-valor">S/ {{ ventasData.total_igv | number:'1.2-2' }}</span>
      </div>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-data">
        <thead>
          <tr>
            <th>Período</th>
            <th class="num">Cantidad</th>
            <th class="num">Subtotal</th>
            <th class="num">IGV</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let v of ventasData.items">
            <td>{{ v.periodo }}</td>
            <td class="num">{{ v.cantidad }}</td>
            <td class="num">S/ {{ v.subtotal | number:'1.2-2' }}</td>
            <td class="num">S/ {{ v.igv | number:'1.2-2' }}</td>
            <td class="num bold">S/ {{ v.total | number:'1.2-2' }}</td>
          </tr>
          <tr *ngIf="ventasData.items.length === 0">
            <td colspan="5" class="vacio">Sin datos para el rango seleccionado</td>
          </tr>
        </tbody>
        <tfoot *ngIf="ventasData.items.length > 0">
          <tr>
            <td>TOTAL</td>
            <td class="num">{{ ventasData.cantidad_comprobantes }}</td>
            <td class="num">S/ {{ ventasData.total_subtotal | number:'1.2-2' }}</td>
            <td class="num">S/ {{ ventasData.total_igv | number:'1.2-2' }}</td>
            <td class="num">S/ {{ ventasData.total_ventas | number:'1.2-2' }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="grid-2col">
      <div class="sub-seccion">
        <h3 class="sub-titulo">Ventas por tipo de comprobante</h3>
        <table class="tabla-data compacta">
          <thead><tr><th>Tipo</th><th class="num">Total</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of objToArray(ventasData.ventas_por_tipo)">
              <td>{{ v.key }}</td>
              <td class="num">S/ {{ v.value | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="sub-seccion">
        <h3 class="sub-titulo">Ventas por método de pago</h3>
        <table class="tabla-data compacta">
          <thead><tr><th>Método</th><th class="num">Monto</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of objToArray(ventasData.ventas_por_metodo_pago)">
              <td>{{ v.key }}</td>
              <td class="num">S/ {{ v.value | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══════════════════ PRODUCTOS ═══════════════════ -->
  <div *ngIf="tabActivo === 'productos' && !cargando && productosData" class="reporte-seccion">
    <div class="kpis-grid cols-3">
      <div class="kpi-card">
        <span class="kpi-label">Total facturado</span>
        <span class="kpi-valor">S/ {{ productosData.total_facturado | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Unidades vendidas</span>
        <span class="kpi-valor">{{ productosData.total_unidades | number:'1.0-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Productos distintos</span>
        <span class="kpi-valor">{{ productosData.items.length }}</span>
      </div>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-data">
        <thead>
          <tr>
            <th class="num small">#</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th class="num">Cantidad</th>
            <th class="num">Precio prom.</th>
            <th class="num">Total</th>
            <th class="num">% del total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of productosData.items; let i = index">
            <td class="num small">{{ i + 1 }}</td>
            <td class="bold">{{ p.nombre }}</td>
            <td class="muted">{{ p.categoria }}</td>
            <td class="num">{{ p.cantidad_vendida | number:'1.0-2' }} {{ p.unidad }}</td>
            <td class="num">S/ {{ p.precio_promedio | number:'1.2-2' }}</td>
            <td class="num bold">S/ {{ p.total_facturado | number:'1.2-2' }}</td>
            <td class="num">
              <div class="barra-wrapper">
                <span class="num-small">{{ p.porcentaje_del_total | number:'1.1-1' }}%</span>
                <div class="barra"><div class="barra-fill" [style.width.%]="p.porcentaje_del_total"></div></div>
              </div>
            </td>
          </tr>
          <tr *ngIf="productosData.items.length === 0">
            <td colspan="7" class="vacio">Sin productos vendidos en el rango</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════ CLIENTES ═══════════════════ -->
  <div *ngIf="tabActivo === 'clientes' && !cargando && clientesData" class="reporte-seccion">
    <div class="kpis-grid cols-4">
      <div class="kpi-card">
        <span class="kpi-label">Total facturado</span>
        <span class="kpi-valor">S/ {{ clientesData.total_facturado | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Total clientes</span>
        <span class="kpi-valor">{{ clientesData.total_clientes }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Con compras</span>
        <span class="kpi-valor">{{ clientesData.clientes_con_compras }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Sin compras</span>
        <span class="kpi-valor">{{ clientesData.clientes_sin_compras }}</span>
      </div>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-data">
        <thead>
          <tr>
            <th class="num small">#</th>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th class="num">Compras</th>
            <th class="num">Ticket prom.</th>
            <th class="num">Total facturado</th>
            <th class="num">Deuda</th>
            <th>Última compra</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of clientesData.items; let i = index">
            <td class="num small">{{ i + 1 }}</td>
            <td class="bold">{{ c.nombre }}</td>
            <td class="mono muted">{{ c.documento || '—' }}</td>
            <td class="muted">{{ c.telefono || '—' }}</td>
            <td class="num">{{ c.cantidad_compras }}</td>
            <td class="num">{{ c.ticket_promedio > 0 ? 'S/ ' + (c.ticket_promedio | number:'1.2-2') : '—' }}</td>
            <td class="num bold">{{ c.total_facturado > 0 ? 'S/ ' + (c.total_facturado | number:'1.2-2') : '—' }}</td>
            <td class="num">
              <span [class.alerta]="c.deuda_pendiente > 0">
                {{ c.deuda_pendiente > 0 ? 'S/ ' + (c.deuda_pendiente | number:'1.2-2') : '—' }}
              </span>
            </td>
            <td class="muted">{{ c.ultima_compra ? (c.ultima_compra | date:'dd/MM/yyyy') : '—' }}</td>
          </tr>
          <tr *ngIf="clientesData.items.length === 0">
            <td colspan="9" class="vacio">Sin clientes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════ CAJA ═══════════════════ -->
  <div *ngIf="tabActivo === 'caja' && !cargando && cajaData" class="reporte-seccion">
    <div class="info-banner">
      <span class="banner-label">Reporte de caja</span>
      <span class="banner-fecha">{{ cajaData.fecha | date:'EEEE, dd MMMM yyyy':'UTC' }}</span>
      <span class="banner-sucursal">{{ cajaData.sucursal }}</span>
    </div>

    <div class="kpis-grid cols-5">
      <div class="kpi-card">
        <span class="kpi-label">Efectivo</span>
        <span class="kpi-valor">S/ {{ cajaData.total_efectivo | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Yape / Plin</span>
        <span class="kpi-valor">S/ {{ cajaData.total_yape | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Tarjeta</span>
        <span class="kpi-valor">S/ {{ cajaData.total_tarjeta | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Transferencia</span>
        <span class="kpi-valor">S/ {{ cajaData.total_transferencia | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Otros</span>
        <span class="kpi-valor">S/ {{ cajaData.total_otros | number:'1.2-2' }}</span>
      </div>
    </div>

    <div class="kpis-grid cols-3 destacado">
      <div class="kpi-card highlight">
        <span class="kpi-label">Total ventas</span>
        <span class="kpi-valor grande">S/ {{ cajaData.total_ventas | number:'1.2-2' }}</span>
        <span class="kpi-sub">{{ cajaData.cantidad_ventas }} transacciones</span>
      </div>
      <div class="kpi-card highlight">
        <span class="kpi-label">Total recibido</span>
        <span class="kpi-valor grande">S/ {{ cajaData.total_recibido | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card highlight alerta-card">
        <span class="kpi-label">Crédito pendiente</span>
        <span class="kpi-valor grande">S/ {{ cajaData.total_credito | number:'1.2-2' }}</span>
      </div>
    </div>

    <div class="grid-2col">
      <div class="sub-seccion">
        <h3 class="sub-titulo">Desglose por método de pago</h3>
        <table class="tabla-data compacta">
          <thead>
            <tr>
              <th>Método</th>
              <th class="num">Trans.</th>
              <th class="num">Monto</th>
              <th class="num">%</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of cajaData.desglose_metodos">
              <td>{{ m.metodo_pago }}</td>
              <td class="num">{{ m.transacciones }}</td>
              <td class="num">S/ {{ m.monto | number:'1.2-2' }}</td>
              <td class="num">{{ m.porcentaje | number:'1.1-1' }}%</td>
            </tr>
            <tr *ngIf="cajaData.desglose_metodos.length === 0">
              <td colspan="4" class="vacio">Sin movimientos</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sub-seccion">
        <h3 class="sub-titulo">Detalle por cajero</h3>
        <table class="tabla-data compacta">
          <thead>
            <tr>
              <th>Cajero</th>
              <th class="num">Ventas</th>
              <th class="num">Efectivo</th>
              <th class="num">Otros</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of cajaData.cajeros">
              <td class="bold">{{ c.nombre }}</td>
              <td class="num">{{ c.cantidad_ventas }}</td>
              <td class="num">S/ {{ c.total_efectivo | number:'1.2-2' }}</td>
              <td class="num">S/ {{ c.total_otros_pagos | number:'1.2-2' }}</td>
              <td class="num bold">S/ {{ c.total_facturado | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="cajaData.cajeros.length === 0">
              <td colspan="5" class="vacio">Sin movimientos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══════════════════ CRÉDITOS ═══════════════════ -->
  <div *ngIf="tabActivo === 'creditos' && !cargando && creditosData" class="reporte-seccion">
    <div class="kpis-grid cols-4">
      <div class="kpi-card alerta-card">
        <span class="kpi-label">Por cobrar</span>
        <span class="kpi-valor">S/ {{ creditosData.total_por_cobrar | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Ya cobrado</span>
        <span class="kpi-valor">S/ {{ creditosData.total_ya_cobrado | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Cant. créditos</span>
        <span class="kpi-valor">{{ creditosData.cantidad_creditos }}</span>
      </div>
      <div class="kpi-card alerta-card">
        <span class="kpi-label">Vencidos (>30d)</span>
        <span class="kpi-valor">{{ creditosData.cantidad_vencidos }}</span>
      </div>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-data">
        <thead>
          <tr>
            <th>Origen</th>
            <th>Referencia</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th class="num">Total</th>
            <th class="num">Pagado</th>
            <th class="num">Saldo</th>
            <th class="num">Días</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of creditosData.items">
            <td><span class="badge" [class.badge-pos]="c.origen === 'POS'" [class.badge-pedido]="c.origen === 'PEDIDO'">{{ c.origen }}</span></td>
            <td class="mono">{{ c.comprobante }}</td>
            <td>
              <div class="bold">{{ c.cliente }}</div>
              <div class="muted mono">{{ c.cliente_doc }}</div>
            </td>
            <td class="muted">{{ c.telefono || '—' }}</td>
            <td class="num">S/ {{ c.total | number:'1.2-2' }}</td>
            <td class="num">S/ {{ c.pagado | number:'1.2-2' }}</td>
            <td class="num bold alerta">S/ {{ c.saldo | number:'1.2-2' }}</td>
            <td class="num">
              <span class="dias-badge"
                    [class.dias-vencido]="c.dias_transcurridos > 30"
                    [class.dias-alerta]="c.dias_transcurridos > 15 && c.dias_transcurridos <= 30">
                {{ c.dias_transcurridos }}d
              </span>
            </td>
            <td class="muted">{{ c.fecha_venta | date:'dd/MM/yyyy' }}</td>
          </tr>
          <tr *ngIf="creditosData.items.length === 0">
            <td colspan="9" class="vacio">No hay créditos pendientes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════ HISTORIAL CRÉDITOS ═══════════════════ -->
  <div *ngIf="tabActivo === 'historial-creditos' && !cargando && historialData" class="reporte-seccion">

    <div class="kpis-grid cols-4">
      <div class="kpi-card">
        <span class="kpi-label">Total otorgado</span>
        <span class="kpi-valor">S/ {{ historialData.total_otorgado | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Total cobrado</span>
        <span class="kpi-valor">S/ {{ historialData.total_cobrado | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card alerta-card">
        <span class="kpi-label">Pendiente</span>
        <span class="kpi-valor">S/ {{ historialData.total_pendiente | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card highlight">
        <span class="kpi-label">% Recuperación</span>
        <span class="kpi-valor">{{ historialData.porcentaje_recuperacion | number:'1.1-1' }}%</span>
      </div>
    </div>

    <div class="kpis-grid cols-4 destacado">
      <div class="kpi-card">
        <span class="kpi-label">Créditos totales</span>
        <span class="kpi-valor">{{ historialData.creditos_totales }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Pagados</span>
        <span class="kpi-valor estado-pagado">{{ historialData.creditos_pagados }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Parciales</span>
        <span class="kpi-valor estado-parcial">{{ historialData.creditos_parciales }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Pendientes</span>
        <span class="kpi-valor estado-pendiente">{{ historialData.creditos_pendientes }}</span>
      </div>
    </div>

    <div class="info-cobranza">
      Tiempo promedio de cobranza:
      <strong>{{ historialData.tiempo_promedio_cobranza_dias }} días</strong>
      <span class="muted">(calculado sobre créditos completamente pagados)</span>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-data">
        <thead>
          <tr>
            <th>Origen</th>
            <th>Referencia</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Emisión</th>
            <th>Último pago</th>
            <th class="num">Total</th>
            <th class="num">Cobrado</th>
            <th class="num">Saldo</th>
            <th class="num">Abonos</th>
            <th class="num">Días</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of historialData.items">
            <td>
              <span class="badge"
                    [class.badge-pos]="c.origen === 'POS'"
                    [class.badge-pedido]="c.origen === 'PEDIDO'">
                {{ c.origen }}
              </span>
            </td>
            <td class="mono">{{ c.comprobante }}</td>
            <td>
              <div class="bold">{{ c.cliente }}</div>
              <div class="muted mono">{{ c.cliente_doc }}</div>
            </td>
            <td class="muted">{{ c.telefono || '—' }}</td>
            <td class="muted">{{ c.fecha_emision | date:'dd/MM/yyyy' }}</td>
            <td class="muted">{{ c.fecha_ultimo_pago ? (c.fecha_ultimo_pago | date:'dd/MM/yyyy') : '—' }}</td>
            <td class="num">S/ {{ c.total | number:'1.2-2' }}</td>
            <td class="num">S/ {{ c.total_cobrado | number:'1.2-2' }}</td>
            <td class="num bold" [class.alerta]="c.saldo > 0">
              {{ c.saldo > 0 ? 'S/ ' + (c.saldo | number:'1.2-2') : '—' }}
            </td>
            <td class="num">{{ c.cantidad_abonos }}</td>
            <td class="num">{{ c.dias_en_cobranza }}d</td>
            <td>
              <span class="badge-estado"
                    [class.estado-ok]="c.estado === 'PAGADO'"
                    [class.estado-bajo]="c.estado === 'PARCIAL'"
                    [class.estado-agotado]="c.estado === 'PENDIENTE'">
                {{ c.estado }}
              </span>
            </td>
          </tr>
          <tr *ngIf="historialData.items.length === 0">
            <td colspan="12" class="vacio">No hay créditos en el rango seleccionado</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════ INVENTARIO ═══════════════════ -->
  <div *ngIf="tabActivo === 'inventario' && !cargando && inventarioData" class="reporte-seccion">
    <div class="kpis-grid cols-5">
      <div class="kpi-card">
        <span class="kpi-label">Valor inventario</span>
        <span class="kpi-valor">S/ {{ inventarioData.valor_total_inventario | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Valor de venta</span>
        <span class="kpi-valor">S/ {{ inventarioData.valor_total_venta | number:'1.2-2' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Productos</span>
        <span class="kpi-valor">{{ inventarioData.total_productos }}</span>
      </div>
      <div class="kpi-card alerta-card">
        <span class="kpi-label">Stock bajo</span>
        <span class="kpi-valor">{{ inventarioData.productos_stock_bajo }}</span>
      </div>
      <div class="kpi-card alerta-card">
        <span class="kpi-label">Sin stock</span>
        <span class="kpi-valor">{{ inventarioData.productos_sin_stock }}</span>
      </div>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-data">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th class="num">Stock</th>
            <th class="num">P. Compra</th>
            <th class="num">P. Venta</th>
            <th class="num">Margen</th>
            <th class="num">Valor inventario</th>
            <th class="num">Valor venta</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let i of inventarioData.items">
            <td class="bold">{{ i.nombre }}</td>
            <td class="muted">{{ i.categoria }}</td>
            <td class="num">{{ i.stock_actual | number:'1.0-2' }} {{ i.unidad }}</td>
            <td class="num">S/ {{ i.precio_compra | number:'1.2-2' }}</td>
            <td class="num">S/ {{ i.precio_venta | number:'1.2-2' }}</td>
            <td class="num">
              <span [class.margen-bueno]="i.margen_porcentaje > 30"
                    [class.margen-medio]="i.margen_porcentaje > 10 && i.margen_porcentaje <= 30"
                    [class.margen-bajo]="i.margen_porcentaje <= 10">
                {{ i.margen_porcentaje | number:'1.1-1' }}%
              </span>
            </td>
            <td class="num bold">S/ {{ i.valor_inventario | number:'1.2-2' }}</td>
            <td class="num">S/ {{ i.valor_venta | number:'1.2-2' }}</td>
            <td>
              <span class="badge-estado"
                    [class.estado-ok]="i.estado === 'OK'"
                    [class.estado-bajo]="i.estado === 'BAJO'"
                    [class.estado-agotado]="i.estado === 'AGOTADO'">
                {{ i.estado }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

    .reportes-container { color: #0f172a; }

    .header { margin-bottom: 24px; }
    .titulo { font-size: 22px; font-weight: 600; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .subtitulo { font-size: 13px; color: #64748b; margin: 4px 0 0; }

    .tabs-wrapper {
      display: flex;
      gap: 2px;
      margin-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 10px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .tab-btn:hover { color: #0f172a; }
    .tab-btn.activo {
      color: #0f172a;
      border-bottom-color: #0f172a;
      font-weight: 600;
    }

    .filtros-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .filtros-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: end;
    }
    .filtros-row.secundaria {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      align-items: center;
    }
    .filtro-grupo { display: flex; flex-direction: column; gap: 4px; }
    .filtro-grupo label {
      font-size: 11px;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .input {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      font-size: 13px;
      background: white;
      color: #0f172a;
      outline: none;
      transition: border-color 0.15s;
      font-variant-numeric: tabular-nums;
    }
    .input:focus { border-color: #0f172a; box-shadow: 0 0 0 2px rgba(15,23,42,0.05); }

    .check-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #0f172a; cursor: pointer;
      padding: 7px 10px;
      text-transform: none; letter-spacing: 0;
    }
    .check-label input { cursor: pointer; }

    .btn-aplicar {
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
    .btn-aplicar:hover { background: #1e293b; }

    .label-rapido { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 500; }
    .chip {
      padding: 5px 10px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 12px;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover { background: #e2e8f0; color: #0f172a; }

    .flex-1 { flex: 1; }

    .btn-export {
      padding: 7px 14px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid;
      letter-spacing: 0.02em;
    }
    .btn-export.excel { background: white; color: #047857; border-color: #047857; }
    .btn-export.excel:hover { background: #047857; color: white; }
    .btn-export.pdf { background: white; color: #b91c1c; border-color: #b91c1c; }
    .btn-export.pdf:hover { background: #b91c1c; color: white; }
    .btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

    .loading-state { text-align: center; padding: 60px 20px; color: #64748b; }
    .spinner {
      width: 28px; height: 28px; margin: 0 auto 12px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .kpis-grid { display: grid; gap: 12px; margin-bottom: 20px; }
    .cols-3 { grid-template-columns: repeat(3, 1fr); }
    .cols-4 { grid-template-columns: repeat(4, 1fr); }
    .cols-5 { grid-template-columns: repeat(5, 1fr); }
    @media (max-width: 900px) { .cols-3, .cols-4, .cols-5 { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-card.highlight { border-color: #cbd5e1; background: #f8fafc; }
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
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
    }
    .kpi-valor.grande { font-size: 22px; }
    .kpi-valor.estado-pagado { color: #047857; }
    .kpi-valor.estado-parcial { color: #92400e; }
    .kpi-valor.estado-pendiente { color: #b91c1c; }
    .kpi-sub { font-size: 11px; color: #94a3b8; font-weight: 500; }

    .destacado { margin-top: 20px; }

    .info-cobranza {
      font-size: 12px;
      color: #0f172a;
      margin: 0 0 16px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
    }
    .info-cobranza strong { color: #0f172a; font-weight: 700; }

    .info-banner {
      background: #0f172a;
      color: white;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .banner-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      font-weight: 600;
    }
    .banner-fecha {
      font-size: 14px;
      font-weight: 600;
      text-transform: capitalize;
    }
    .banner-sucursal { font-size: 13px; color: #cbd5e1; margin-left: auto; }

    .tabla-wrapper {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: auto;
    }
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
    .tabla-data thead th.small { width: 40px; text-align: center; }
    .tabla-data tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
      vertical-align: middle;
    }
    .tabla-data tbody tr:last-child td { border-bottom: none; }
    .tabla-data tbody tr:hover { background: #f8fafc; }
    .tabla-data tfoot td {
      padding: 12px;
      background: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
    }

    .num { text-align: right; }
    .num.bold, td.bold { font-weight: 600; }
    .mono { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 12px; }
    .muted { color: #64748b; }
    .small { font-size: 12px; }
    .num-small { font-size: 11px; color: #64748b; }
    .alerta { color: #b91c1c; }

    .vacio {
      text-align: center !important;
      padding: 32px !important;
      color: #94a3b8 !important;
      font-style: italic;
    }

    .tabla-data.compacta { font-size: 12.5px; }
    .tabla-data.compacta th, .tabla-data.compacta td { padding: 8px 10px; }

    .barra-wrapper {
      display: flex; flex-direction: column; gap: 3px; align-items: flex-end;
    }
    .barra {
      width: 60px;
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
    }
    .barra-fill { height: 100%; background: #0f172a; }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-pos { background: #dbeafe; color: #1e40af; }
    .badge-pedido { background: #fef3c7; color: #92400e; }

    .badge-estado {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .estado-ok { background: #d1fae5; color: #047857; }
    .estado-bajo { background: #fef3c7; color: #92400e; }
    .estado-agotado { background: #fee2e2; color: #b91c1c; }

    .dias-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      background: #f1f5f9;
      color: #64748b;
    }
    .dias-alerta { background: #fef3c7; color: #92400e; }
    .dias-vencido { background: #fee2e2; color: #b91c1c; }

    .margen-bueno { color: #047857; font-weight: 600; }
    .margen-medio { color: #92400e; font-weight: 600; }
    .margen-bajo { color: #b91c1c; font-weight: 600; }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 20px;
    }
    @media (max-width: 900px) { .grid-2col { grid-template-columns: 1fr; } }

    .sub-seccion {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .sub-titulo {
      margin: 0;
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
    }
    .sub-seccion .tabla-data { border-radius: 0; }
  `]
})
export class ReportesComponent implements OnInit {

  tabs = [
    { id: 'ventas',             label: 'Ventas' },
    { id: 'productos',          label: 'Productos' },
    { id: 'clientes',           label: 'Clientes' },
    { id: 'caja',               label: 'Caja' },
    { id: 'creditos',           label: 'Créditos' },
    { id: 'historial-creditos', label: 'Historial créditos' },
    { id: 'inventario',         label: 'Inventario' }
  ];

  tabActivo = 'ventas';
  cargando = false;
  exportando = false;

  filtros: FiltrosReporte = {
    fecha_desde: this.primerDiaMes(),
    fecha_hasta: this.hoyStr(),
    agrupar_por: 'dia',
    tipo_comprobante: '',
    estado_sunat: '',
    incluir_todos_clientes: false
  };

  filtrosHistorial: FiltrosHistorialCreditos = {
    fecha_desde: this.primerDiaAnio(),
    fecha_hasta: this.hoyStr(),
    estado: ''
  };

  ventasData:     any = null;
  productosData:  any = null;
  clientesData:   any = null;
  cajaData:       any = null;
  creditosData:   any = null;
  historialData:  any = null;
  inventarioData: any = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    private service: ReportesService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarReporte();
  }

  cambiarTab(tab: string) {
    this.tabActivo = tab;
    this.cargarReporte();
  }

  cargarReporte() {
    this.cargando = true;
    const obs$ = this.obtenerObservable();
    if (!obs$) { this.cargando = false; return; }

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.asignarData(res);
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cd.detectChanges();
        Swal.fire('Error', 'No se pudo cargar el reporte', 'error');
      }
    });
  }

  private obtenerObservable() {
    switch (this.tabActivo) {
      case 'ventas':             return this.service.ventasPorPeriodo(this.filtros);
      case 'productos':          return this.service.productosVendidos(this.filtros);
      case 'clientes':           return this.service.ventasPorCliente(this.filtros);
      case 'caja':               return this.service.reporteCaja(this.filtros);
      case 'creditos':           return this.service.reporteCreditos(this.filtros);
      case 'historial-creditos': return this.service.historialCreditos(this.filtrosHistorial);
      case 'inventario':         return this.service.reporteInventario(this.filtros);
      default: return null;
    }
  }

  private asignarData(res: any) {
    switch (this.tabActivo) {
      case 'ventas':             this.ventasData = res; break;
      case 'productos':          this.productosData = res; break;
      case 'clientes':           this.clientesData = res; break;
      case 'caja':               this.cajaData = res; break;
      case 'creditos':           this.creditosData = res; break;
      case 'historial-creditos': this.historialData = res; break;
      case 'inventario':         this.inventarioData = res; break;
    }
  }

  setFechaDesde(valor: string) {
    if (this.tabActivo === 'historial-creditos') this.filtrosHistorial.fecha_desde = valor;
    else this.filtros.fecha_desde = valor;
  }

  setFechaHasta(valor: string) {
    if (this.tabActivo === 'historial-creditos') this.filtrosHistorial.fecha_hasta = valor;
    else this.filtros.fecha_hasta = valor;
  }

  aplicarRangoRapido(rango: string) {
    const hoy = new Date();
    let desde = new Date();
    let hasta = new Date();

    switch (rango) {
      case 'hoy':
        desde = new Date(); hasta = new Date();
        break;
      case 'ayer':
        desde.setDate(hoy.getDate() - 1);
        hasta.setDate(hoy.getDate() - 1);
        break;
      case 'semana':
        desde = new Date(hoy.getTime() - 6 * 86400000);
        break;
      case 'mes':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'trimestre':
        desde = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
        break;
      case 'anio':
        desde = new Date(hoy.getFullYear(), 0, 1);
        break;
    }

    const desdeStr = desde.toISOString().split('T')[0];
    const hastaStr = hasta.toISOString().split('T')[0];

    if (this.tabActivo === 'historial-creditos') {
      this.filtrosHistorial.fecha_desde = desdeStr;
      this.filtrosHistorial.fecha_hasta = hastaStr;
    } else {
      this.filtros.fecha_desde = desdeStr;
      this.filtros.fecha_hasta = hastaStr;
    }
    this.cargarReporte();
  }

  exportar(formato: 'excel' | 'pdf') {
    if (this.exportando) return;

    const endpoints: Record<string, string> = {
      'ventas':             'ventas-periodo',
      'productos':          'productos-vendidos',
      'clientes':           'ventas-cliente',
      'caja':               'caja',
      'creditos':           'creditos',
      'historial-creditos': 'historial-creditos',
      'inventario':         'inventario'
    };
    const endpoint = endpoints[this.tabActivo];
    if (!endpoint) return;

    this.exportando = true;
    Swal.fire({
      title: 'Generando archivo...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const filtrosUsados = this.tabActivo === 'historial-creditos'
      ? this.filtrosHistorial
      : this.filtros;

    const obs$ = formato === 'excel'
      ? this.service.exportarExcel(endpoint, filtrosUsados)
      : this.service.exportarPDF(endpoint, filtrosUsados);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        const fecha = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const ext = formato === 'excel' ? 'xlsx' : 'pdf';
        this.service.descargarArchivo(blob, `${endpoint}_${fecha}.${ext}`);
        this.exportando = false;
        Swal.close();
      },
      error: () => {
        this.exportando = false;
        Swal.fire('Error', 'No se pudo generar el archivo', 'error');
      }
    });
  }

  objToArray(obj: any): { key: string, value: any }[] {
    if (!obj) return [];
    return Object.keys(obj).map(k => ({ key: k, value: obj[k] }));
  }

  private hoyStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private primerDiaMes(): string {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  }

  private primerDiaAnio(): string {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
}