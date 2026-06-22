import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, DestroyRef, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
 
@Component({
  selector: 'app-ticket-interno-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="ticket-modal-backdrop" (click)="cerrar()">
  <div class="ticket-modal-content" (click)="$event.stopPropagation()">
 
    <div class="controles">
      <h3 class="modal-titulo">🖨️ Ticket interno generado</h3>
      <div class="botones">
        <button (click)="imprimir()" [disabled]="!ticket" class="btn-imprimir">🖨️ Imprimir</button>
        <button (click)="cerrar()" class="btn-cerrar">✕ Cerrar</button>
      </div>
    </div>
 
    <div *ngIf="loading" class="cargando">Cargando ticket...</div>
 
    <!-- TICKET VISIBLE EN PANTALLA (vista previa) -->
    <div #ticketPreview *ngIf="ticket" class="ticket-zona">
 
      <div class="ticket-header">
        <img *ngIf="ticket.logo_base64" [src]="ticket.logo_base64" class="logo"/>
        <h1 class="razon">{{ ticket.razon_social }}</h1>
        <p *ngIf="ticket.ruc" class="ruc">RUC: {{ ticket.ruc }}</p>
        <p *ngIf="ticket.direccion_empresa" class="empresa-direccion">{{ ticket.direccion_empresa }}</p>
        <p *ngIf="ticket.telefono_empresa" class="empresa-telefono">Tel: {{ ticket.telefono_empresa }}</p>
      </div>
 
      <div class="separador-doble"></div>
 
      <div class="tipo-doc">
        <p class="tipo-titulo">TICKET INTERNO</p>
        <p class="tipo-nota">DOCUMENTO SIN VALOR FISCAL</p>
        <p class="numero">{{ ticket.numero }}</p>
        <p class="fecha">{{ ticket.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
      </div>
 
      <div class="separador"></div>
 
      <div class="datos">
        <p class="dato-row"><span>Cliente:</span> <b>{{ ticket.cliente_nombre }}</b></p>
        <p class="dato-row"><span>Doc:</span> {{ ticket.cliente_documento }}</p>
        <p *ngIf="ticket.cliente_telefono" class="dato-row"><span>Tel:</span> {{ ticket.cliente_telefono }}</p>
        <p class="dato-row"><span>Cajero:</span> {{ ticket.cajero }}</p>
      </div>
 
      <div class="separador"></div>
 
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
</div>
  `,
  styles: [`
    .ticket-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }
 
    .ticket-modal-content {
      background: white;
      border-radius: 12px;
      max-width: 380px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
 
    .controles {
      padding: 16px 18px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      background: #f8fafc;
      border-radius: 12px 12px 0 0;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .modal-titulo { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
    .botones { display: flex; gap: 6px; }
    .btn-imprimir, .btn-cerrar {
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    .btn-imprimir { background: #2563eb; color: white; }
    .btn-imprimir:hover { background: #1d4ed8; }
    .btn-imprimir:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cerrar { background: #e2e8f0; color: #475569; }
    .btn-cerrar:hover { background: #cbd5e1; }
 
    .cargando { text-align: center; padding: 40px; color: #64748b; font-size: 13px; }
 
    .ticket-zona {
      padding: 14px 16px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      background: white;
    }
 
    .ticket-header { text-align: center; margin-bottom: 8px; }
    .logo { max-width: 80px; max-height: 60px; margin-bottom: 4px; }
    .razon { font-size: 13px; font-weight: 700; margin: 0; text-transform: uppercase; }
    .ruc, .empresa-direccion, .empresa-telefono { font-size: 10px; margin: 1px 0; }
 
    .separador { border-bottom: 1px dashed #000; margin: 6px 0; }
    .separador-doble { border-bottom: 2px solid #000; margin: 6px 0; }
 
    .tipo-doc { text-align: center; margin: 6px 0; }
    .tipo-titulo { font-size: 13px; font-weight: 700; margin: 0; letter-spacing: 1px; }
    .tipo-nota { font-size: 9px; margin: 2px 0; font-style: italic; }
    .numero { font-size: 14px; font-weight: 700; margin: 4px 0; letter-spacing: 2px; }
    .fecha { font-size: 10px; margin: 0; }
 
    .datos { margin: 4px 0; }
    .dato-row { margin: 2px 0; display: flex; gap: 4px; font-size: 11px; }
    .dato-row > span:first-child { min-width: 60px; color: #555; }
    .dato-row.dir { word-break: break-word; }
    .dato-row.destacado {
      font-size: 12px;
      background: #f1f5f9;
      padding: 4px 6px;
      border-radius: 3px;
    }
 
    .observaciones { margin-top: 6px; padding: 6px; border: 1px dashed #000; }
    .obs-titulo { font-size: 10px; font-weight: 700; margin: 0 0 2px 0; }
    .obs-texto { font-size: 11px; margin: 0; word-break: break-word; }
 
    .items { width: 100%; border-collapse: collapse; font-size: 11px; }
    .items th { text-align: left; padding: 3px 2px; border-bottom: 1px solid #000; font-size: 10px; }
    .items td { padding: 4px 2px; vertical-align: top; }
    .th-cant, .td-cant { width: 30px; text-align: center; }
    .th-total, .td-total { width: 70px; text-align: right; font-weight: 600; }
    .precio-unit { font-size: 9px; color: #666; margin-top: 1px; }
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
    .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
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
 
    .pie { text-align: center; margin-top: 8px; font-size: 9px; }
    .pie-importante { font-weight: 700; text-transform: uppercase; margin: 4px 0; font-size: 9px; }
    .pie-info { font-style: italic; margin: 4px 0; }
    .pie-reimp { font-weight: 700; margin-top: 6px; font-size: 11px; letter-spacing: 2px; }
  `]
})
export class TicketInternoModalComponent implements OnInit {
 
  @Input() ticketId!: number;
  @Output() onCerrar = new EventEmitter<void>();
  @ViewChild('ticketPreview') ticketPreview!: ElementRef<HTMLDivElement>;
 
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
 
  ticket: any = null;
  loading = true;
 
  ngOnInit() {
    if (!this.ticketId) return;
    this.http.get<any>(`${environment.apiUrl}/tickets-internos/${this.ticketId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ticket = res;
          this.loading = false;
          this.cd.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cd.detectChanges();
        }
      });
  }
 
  /**
   * Imprime SOLO el contenido del ticket usando un iframe oculto.
   * No interfiere con el POS detrás. Funciona igual en pantalla y PDF.
   */
  imprimir() {
    if (!this.ticketPreview) return;
 
    // 1. Clonar el HTML del ticket
    const ticketHTML = this.ticketPreview.nativeElement.innerHTML;
 
    // 2. Crear iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
 
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
 
    // 3. Escribir el HTML completo del ticket en el iframe
    doc.open();
    doc.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${this.ticket?.numero || ''}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 4mm;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      width: 80mm;
    }
    img { max-width: 80px; max-height: 60px; margin-bottom: 4px; }
    .ticket-header { text-align: center; margin-bottom: 8px; }
    .razon { font-size: 13px; font-weight: 700; margin: 0; text-transform: uppercase; }
    .ruc, .empresa-direccion, .empresa-telefono { font-size: 10px; margin: 1px 0; }
    .separador { border-bottom: 1px dashed #000; margin: 6px 0; }
    .separador-doble { border-bottom: 2px solid #000; margin: 6px 0; }
    .tipo-doc { text-align: center; margin: 6px 0; }
    .tipo-titulo { font-size: 13px; font-weight: 700; margin: 0; letter-spacing: 1px; }
    .tipo-nota { font-size: 9px; margin: 2px 0; font-style: italic; }
    .numero { font-size: 14px; font-weight: 700; margin: 4px 0; letter-spacing: 2px; }
    .fecha { font-size: 10px; margin: 0; }
    .datos { margin: 4px 0; }
    .dato-row { margin: 2px 0; display: flex; gap: 4px; font-size: 11px; }
    .dato-row > span:first-child { min-width: 60px; color: #555; }
    .dato-row.dir { word-break: break-word; }
    .dato-row.destacado {
      font-size: 12px; background: #f1f5f9;
      padding: 4px 6px; border-radius: 3px;
    }
    .observaciones { margin-top: 6px; padding: 6px; border: 1px dashed #000; }
    .obs-titulo { font-size: 10px; font-weight: 700; margin: 0 0 2px 0; }
    .obs-texto { font-size: 11px; margin: 0; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 3px 2px; border-bottom: 1px solid #000; font-size: 10px; }
    td { padding: 4px 2px; vertical-align: top; }
    .th-cant, .td-cant { width: 30px; text-align: center; }
    .th-total, .td-total { width: 70px; text-align: right; font-weight: 600; }
    .precio-unit { font-size: 9px; color: #666; margin-top: 1px; }
    .badge-encargo {
      display: inline-block; background: #000; color: white;
      padding: 1px 4px; font-size: 8px; border-radius: 2px; margin-left: 4px;
    }
    .totales { margin-top: 4px; }
    .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
    .total-row b { font-weight: 700; }
    .total-row.pagado { color: #047857; }
    .total-row.saldo {
      font-size: 13px; background: #fef3c7;
      padding: 5px 6px; border: 1px dashed #92400e;
      color: #92400e; margin: 4px 0;
    }
    .pie { text-align: center; margin-top: 8px; font-size: 9px; }
    .pie-importante { font-weight: 700; text-transform: uppercase; margin: 4px 0; font-size: 9px; }
    .pie-info { font-style: italic; margin: 4px 0; }
    .pie-reimp { font-weight: 700; margin-top: 6px; font-size: 11px; letter-spacing: 2px; }
 
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      body { width: 80mm; padding: 2mm; }
    }
  </style>
</head>
<body>
  ${ticketHTML}
</body>
</html>
    `);
    doc.close();
 
    // 4. Esperar a que cargue (especialmente si hay imágenes/logo) e imprimir
    const intentarImprimir = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Error al imprimir:', e);
      }
 
      // 5. Remover iframe después de imprimir
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
 
    // Si hay imagen, esperar a que cargue
    const img = doc.querySelector('img');
    if (img && !img.complete) {
      img.onload = () => setTimeout(intentarImprimir, 100);
      img.onerror = () => setTimeout(intentarImprimir, 100);
    } else {
      setTimeout(intentarImprimir, 200);
    }
  }
 
  cerrar() {
    this.onCerrar.emit();
  }
}