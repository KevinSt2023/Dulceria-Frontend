import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
 
@Component({
  selector: 'app-ticket-interno',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="ticket-page">
  <!-- Controles (no se imprimen) -->
  <div class="controles no-print">
    <button (click)="imprimir()" class="btn-imprimir">🖨️ Imprimir</button>
    <button (click)="cerrar()" class="btn-cerrar">✕ Cerrar</button>
  </div>
 
  <!-- Ticket -->
  <div *ngIf="loading" class="cargando">Cargando ticket...</div>
 
  <div *ngIf="ticket" class="ticket-container print-area">
 
    <!-- Encabezado -->
    <div class="ticket-header">
      <img *ngIf="ticket.logo_base64" [src]="ticket.logo_base64" class="logo"/>
      <h1 class="razon">{{ ticket.razon_social }}</h1>
      <p *ngIf="ticket.ruc" class="ruc">RUC: {{ ticket.ruc }}</p>
      <p *ngIf="ticket.direccion_empresa" class="empresa-direccion">{{ ticket.direccion_empresa }}</p>
      <p *ngIf="ticket.telefono_empresa" class="empresa-telefono">Tel: {{ ticket.telefono_empresa }}</p>
    </div>
 
    <div class="separador-doble"></div>
 
    <!-- Tipo y número -->
    <div class="tipo-doc">
      <p class="tipo-titulo">TICKET INTERNO</p>
      <p class="tipo-nota">DOCUMENTO SIN VALOR FISCAL</p>
      <p class="numero">{{ ticket.numero }}</p>
      <p class="fecha">{{ ticket.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
    </div>
 
    <div class="separador"></div>
 
    <!-- Cliente -->
    <div class="datos">
      <p class="dato-row"><span>Cliente:</span> <b>{{ ticket.cliente_nombre }}</b></p>
      <p class="dato-row"><span>Doc:</span> {{ ticket.cliente_documento }}</p>
      <p *ngIf="ticket.cliente_telefono" class="dato-row"><span>Tel:</span> {{ ticket.cliente_telefono }}</p>
      <p class="dato-row"><span>Cajero:</span> {{ ticket.cajero }}</p>
    </div>
 
    <div class="separador"></div>
 
    <!-- Pedido -->
    <div class="datos">
      <p class="dato-row"><span>Pedido:</span> <b>#{{ ticket.pedido_id }}</b></p>
      <p class="dato-row"><span>Entrega:</span> {{ ticket.tipo_entrega }}</p>
      <p *ngIf="ticket.direccion_entrega" class="dato-row dir"><span>Dir:</span> {{ ticket.direccion_entrega }}</p>
      <p *ngIf="ticket.fecha_recojo_estimada" class="dato-row destacado">
        <span>Recojo:</span> <b>{{ ticket.fecha_recojo_estimada | date:'dd/MM/yyyy HH:mm' }}</b>
      </p>
    </div>
 
    <div *ngIf="ticket.observaciones" class="observaciones">
      <p class="obs-titulo">Observaciones:</p>
      <p class="obs-texto">{{ ticket.observaciones }}</p>
    </div>
 
    <div class="separador-doble"></div>
 
    <!-- Items -->
    <table class="items">
      <thead>
        <tr>
          <th class="th-cant">Cant</th>
          <th class="th-prod">Producto</th>
          <th class="th-total">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of ticket.items">
          <td class="td-cant">{{ item.cantidad }}</td>
          <td class="td-prod">
            {{ item.producto }}
            <span *ngIf="item.es_encargo" class="badge-encargo">ENCARGO</span>
            <div class="precio-unit">S/ {{ item.precio | number:'1.2-2' }} c/u</div>
          </td>
          <td class="td-total">S/ {{ item.subtotal | number:'1.2-2' }}</td>
        </tr>
      </tbody>
    </table>
 
    <div class="separador-doble"></div>
 
    <!-- Totales -->
    <div class="totales">
      <p class="total-row"><span>TOTAL DEL PEDIDO</span> <b>S/ {{ ticket.total | number:'1.2-2' }}</b></p>
      <div class="separador"></div>
      <p class="total-row pagado"><span>Pagado ahora</span> <b>S/ {{ ticket.monto_pagado_ahora | number:'1.2-2' }}</b></p>
      <p *ngIf="ticket.monto_pagado_total > ticket.monto_pagado_ahora" class="total-row">
        <span>Pagado total</span> <b>S/ {{ ticket.monto_pagado_total | number:'1.2-2' }}</b>
      </p>
      <p *ngIf="ticket.saldo_pendiente > 0" class="total-row saldo">
        <span>SALDO PENDIENTE</span> <b>S/ {{ ticket.saldo_pendiente | number:'1.2-2' }}</b>
      </p>
      <p class="total-row">
        <span>Método</span> <b>{{ ticket.metodo_pago }}</b>
      </p>
    </div>
 
    <div class="separador-doble"></div>
 
    <!-- Pie -->
    <div class="pie">
      <p class="pie-importante">
        Este documento NO es comprobante fiscal.
        La boleta/factura/NV se emitirá al entregar el pedido.
      </p>
      <p class="pie-info">Conserva este ticket para recoger tu pedido.</p>
      <p *ngIf="ticket.tipo === 'REIMPRESION'" class="pie-reimp">- REIMPRESIÓN -</p>
    </div>
 
  </div>
</div>
  `,
  styles: [`
    /* PANTALLA */
    .ticket-page {
      min-height: 100vh;
      background: #f1f5f9;
      padding: 20px;
      font-family: 'Courier New', monospace;
    }
 
    .controles {
      max-width: 320px;
      margin: 0 auto 16px;
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .btn-imprimir, .btn-cerrar {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .btn-imprimir { background: #2563eb; color: white; }
    .btn-imprimir:hover { background: #1d4ed8; }
    .btn-cerrar { background: #e2e8f0; color: #475569; }
    .btn-cerrar:hover { background: #cbd5e1; }
 
    .cargando {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
 
    /* TICKET (ancho ~80mm = 302px aprox) */
    .ticket-container {
      width: 320px;
      max-width: 100%;
      margin: 0 auto;
      background: white;
      padding: 12px 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      font-size: 11px;
      line-height: 1.4;
      color: #000;
    }
 
    .ticket-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .logo {
      max-width: 80px;
      max-height: 60px;
      margin-bottom: 4px;
    }
    .razon {
      font-size: 13px;
      font-weight: 700;
      margin: 0;
      text-transform: uppercase;
    }
    .ruc, .empresa-direccion, .empresa-telefono {
      font-size: 10px;
      margin: 1px 0;
    }
 
    .separador {
      border-bottom: 1px dashed #000;
      margin: 6px 0;
    }
    .separador-doble {
      border-bottom: 2px solid #000;
      margin: 6px 0;
    }
 
    .tipo-doc {
      text-align: center;
      margin: 6px 0;
    }
    .tipo-titulo {
      font-size: 13px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 1px;
    }
    .tipo-nota {
      font-size: 9px;
      margin: 2px 0;
      font-style: italic;
    }
    .numero {
      font-size: 14px;
      font-weight: 700;
      margin: 4px 0;
      letter-spacing: 2px;
    }
    .fecha {
      font-size: 10px;
      margin: 0;
    }
 
    .datos {
      margin: 4px 0;
    }
    .dato-row {
      margin: 2px 0;
      display: flex;
      gap: 4px;
      font-size: 11px;
    }
    .dato-row > span:first-child {
      min-width: 60px;
      color: #555;
    }
    .dato-row.dir { word-break: break-word; }
    .dato-row.destacado {
      font-size: 12px;
      background: #f1f5f9;
      padding: 4px 6px;
      border-radius: 3px;
    }
 
    .observaciones {
      margin-top: 6px;
      padding: 6px;
      border: 1px dashed #000;
    }
    .obs-titulo {
      font-size: 10px;
      font-weight: 700;
      margin: 0 0 2px 0;
    }
    .obs-texto {
      font-size: 11px;
      margin: 0;
      word-break: break-word;
    }
 
    .items {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .items th {
      text-align: left;
      padding: 3px 2px;
      border-bottom: 1px solid #000;
      font-size: 10px;
    }
    .items td {
      padding: 4px 2px;
      vertical-align: top;
    }
    .th-cant, .td-cant {
      width: 30px;
      text-align: center;
    }
    .th-total, .td-total {
      width: 70px;
      text-align: right;
      font-weight: 600;
    }
    .precio-unit {
      font-size: 9px;
      color: #666;
      margin-top: 1px;
    }
    .badge-encargo {
      display: inline-block;
      background: #000;
      color: white;
      padding: 1px 4px;
      font-size: 8px;
      border-radius: 2px;
      margin-left: 4px;
    }
 
    .totales { margin-top: 4px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 11px;
    }
    .total-row b { font-weight: 700; }
    .total-row.pagado { color: #047857; }
    .total-row.saldo {
      font-size: 13px;
      background: #fef3c7;
      padding: 5px 6px;
      border: 1px dashed #92400e;
      color: #92400e;
      margin: 4px 0;
    }
 
    .pie {
      text-align: center;
      margin-top: 8px;
      font-size: 9px;
    }
    .pie-importante {
      font-weight: 700;
      text-transform: uppercase;
      margin: 4px 0;
      font-size: 9px;
    }
    .pie-info {
      font-style: italic;
      margin: 4px 0;
    }
    .pie-reimp {
      font-weight: 700;
      margin-top: 6px;
      font-size: 11px;
      letter-spacing: 2px;
    }
 
    /* IMPRESIÓN */
    @media print {
      .ticket-page {
        padding: 0;
        background: white;
      }
      .no-print { display: none !important; }
      .ticket-container {
        width: 80mm;
        box-shadow: none;
        margin: 0;
        padding: 4mm;
      }
      body { background: white; }
      @page {
        margin: 0;
        size: 80mm auto;
      }
    }
  `]
})
export class TicketInternoComponent implements OnInit {
 
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
 
  ticket: any = null;
  loading = true;
 
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
 
    this.http.get<any>(`${environment.apiUrl}/tickets-internos/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ticket = res;
          this.loading = false;
          this.cd.detectChanges();
          // Auto-imprimir al cargar (opcional - quítalo si prefieres botón manual)
          setTimeout(() => this.imprimir(), 500);
        },
        error: () => {
          this.loading = false;
          this.cd.detectChanges();
        }
      });
  }
 
  imprimir() {
    window.print();
  }
 
  cerrar() {
    this.router.navigate(['/app/pos']);
  }
}