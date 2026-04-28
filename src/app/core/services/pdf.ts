import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { ConfiguracionNegocioService } from '../../core/services/configuracion-negocio';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor(private negocioService: ConfiguracionNegocioService) {}

  async generarComprobante(c: any): Promise<jsPDF> {
    let negocio: any = {};
    let logoBase64 = '';

    try { negocio = await firstValueFrom(this.negocioService.getConfig()); } catch {}
    try {
      const logoRes = await firstValueFrom(this.negocioService.getLogo());
      logoBase64 = logoRes?.logo_base64 ?? '';
    } catch {}

    const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho  = 210;
    const margen = 15;
    let y        = 20;

    const texto = (
      txt: string, x: number, yPos: number,
      opts?: { size?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; color?: string }
    ) => {
      doc.setFontSize(opts?.size ?? 10);
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
      if (opts?.color) {
        const hex = opts.color.replace('#', '');
        doc.setTextColor(parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16));
      } else { doc.setTextColor(0,0,0); }
      doc.text(txt ?? '', x, yPos, { align: opts?.align ?? 'left' });
    };

    const linea = (yPos: number, color = '#e5e7eb') => {
      const hex = color.replace('#', '');
      doc.setDrawColor(parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16));
      doc.line(margen, yPos, ancho - margen, yPos);
    };

    doc.setFillColor(3, 105, 161);
    doc.rect(0, 0, ancho, 42, 'F');

    const logoSophitech = '';
    if (logoSophitech) {
      doc.addImage(logoSophitech, 'JPEG', ancho - 40, 4, 25, 25);
    } else {
      texto('SophiTech', ancho - margen, 12, { size: 9, align: 'right', color: '#bae6fd' });
      texto('Enterprise Resource Planning', ancho - margen, 17, { size: 8, align: 'right', color: '#7dd3fc' });
    }

    if (logoBase64) { try { doc.addImage(logoBase64, 'JPEG', margen, 6, 32, 32); } catch {} }

    const nombreMostrar = negocio.nombre_comercial || negocio.razon_social || 'Mi Negocio';
    texto(nombreMostrar, ancho / 2, 14, { size: 14, bold: true, align: 'center', color: '#ffffff' });
    if (negocio.ruc)       texto(`RUC: ${negocio.ruc}`, ancho / 2, 21, { size: 9, align: 'center', color: '#bae6fd' });
    if (negocio.direccion) texto(negocio.direccion,      ancho / 2, 27, { size: 8, align: 'center', color: '#e0f2fe' });
    const contacto = [negocio.telefono, negocio.email].filter(Boolean).join(' · ');
    if (contacto) texto(contacto, ancho / 2, 33, { size: 7, align: 'center', color: '#bae6fd' });
    texto('Ing. Kevin De La Cruz Escate', ancho - margen, 39, { size: 6, align: 'right', color: '#7dd3fc' });
    y = 54;

    const colorTipo = c.codigo_sunat === '03' ? '#1d4ed8' : '#7c3aed';
    const hexTipo   = colorTipo.replace('#', '');
    doc.setFillColor(parseInt(hexTipo.substring(0,2),16), parseInt(hexTipo.substring(2,4),16), parseInt(hexTipo.substring(4,6),16));
    doc.roundedRect(margen, y, ancho - margen * 2, 18, 3, 3, 'F');
    texto(c.tipo?.toUpperCase() ?? 'COMPROBANTE', ancho / 2, y + 7,  { size: 13, bold: true, align: 'center', color: '#ffffff' });
    texto(c.numero_formato,                        ancho / 2, y + 14, { size: 10, align: 'center', color: '#e0e7ff' });
    y += 26;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margen, y, ancho - margen * 2, 26, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margen, y, ancho - margen * 2, 26, 2, 2, 'S');
    texto('DATOS DEL CLIENTE',                  margen + 4, y + 6,  { size: 7, bold: true, color: '#64748b' });
    texto(c.cliente ?? 'Cliente General',         margen + 4, y + 13, { size: 11, bold: true });
    texto(`Doc: ${c.cliente_doc ?? '00000000'}`,  margen + 4, y + 19, { size: 9, color: '#64748b' });

    const fecha    = new Date(c.fecha);
    const fechaStr = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr  = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    texto(`Fecha: ${fechaStr}`, ancho - margen - 4, y + 13, { size: 9, align: 'right', color: '#64748b' });
    texto(`Hora: ${horaStr}`,   ancho - margen - 4, y + 19, { size: 9, align: 'right', color: '#64748b' });
    y += 33;

    doc.setFillColor(15, 23, 42);
    doc.rect(margen, y, ancho - margen * 2, 8, 'F');
    texto('DESCRIPCIÓN',  margen + 4,         y + 5.5, { size: 8, bold: true, color: '#ffffff' });
    texto('CANT.',         margen + 100,       y + 5.5, { size: 8, bold: true, align: 'center', color: '#ffffff' });
    texto('P. UNIT.',      margen + 130,       y + 5.5, { size: 8, bold: true, align: 'right',  color: '#ffffff' });
    texto('TOTAL',         ancho - margen - 4, y + 5.5, { size: 8, bold: true, align: 'right',  color: '#ffffff' });
    y += 10;

    const simbolo  = negocio.simbolo ?? 'S/';
    const detalles = c.detalles ?? [];
    detalles.forEach((d: any, idx: number) => {
      if (idx % 2 === 0) { doc.setFillColor(248,250,252); doc.rect(margen, y - 2, ancho - margen * 2, 8, 'F'); }
      texto(d.producto ?? '',                                           margen + 4,         y + 4, { size: 9 });
      texto(String(d.cantidad),                                          margen + 100,       y + 4, { size: 9, align: 'center' });
      texto(`${simbolo} ${Number(d.precio_unitario).toFixed(2)}`,        margen + 130,       y + 4, { size: 9, align: 'right', color: '#64748b' });
      texto(`${simbolo} ${Number(d.total).toFixed(2)}`,                  ancho - margen - 4, y + 4, { size: 9, bold: true, align: 'right' });
      y += 8;
    });

    y += 4; linea(y, '#cbd5e1'); y += 6;

    const colLabel = ancho - margen - 50;
    const colValue = ancho - margen - 4;
    texto('Subtotal (sin IGV):', colLabel, y, { size: 9, color: '#64748b' });
    texto(`${simbolo} ${Number(c.subtotal).toFixed(2)}`, colValue, y, { size: 9, align: 'right' });
    y += 6;
    texto(`IGV (${negocio.igv_porcentaje ?? 18}%):`, colLabel, y, { size: 9, color: '#64748b' });
    texto(`${simbolo} ${Number(c.igv).toFixed(2)}`,   colValue, y, { size: 9, align: 'right' });
    y += 2; linea(y + 3, '#94a3b8'); y += 7;

    doc.setFillColor(3, 105, 161);
    doc.roundedRect(colLabel - 10, y - 3, ancho - margen - colLabel + 14, 12, 2, 2, 'F');
    texto('TOTAL:',                                   colLabel - 6, y + 5.5, { size: 11, bold: true, color: '#ffffff' });
    texto(`${simbolo} ${Number(c.total).toFixed(2)}`, colValue,     y + 5.5, { size: 12, bold: true, align: 'right', color: '#ffffff' });
    y += 18;

    if (c.metodo_pago) { texto(`Método de pago: ${c.metodo_pago}`, margen, y, { size: 9, color: '#64748b' }); y += 7; }

    if (c.tipo_pago === 'CREDITO' && c.saldo_pendiente > 0) {
      texto(`Pagado: ${simbolo} ${Number(c.monto_pagado ?? 0).toFixed(2)}`,        margen, y, { size: 9, color: '#16a34a' }); y += 6;
      texto(`Saldo pendiente: ${simbolo} ${Number(c.saldo_pendiente).toFixed(2)}`, margen, y, { size: 9, bold: true, color: '#dc2626' }); y += 7;
    }

    const colorEstado = c.estado_sunat === 'ACEPTADO' ? '#16a34a' : '#d97706';
    texto(`Estado SUNAT: ${c.estado_sunat}`, margen, y, { size: 9, color: colorEstado });
    y += 10;

    linea(y, '#e2e8f0'); y += 7;
    texto(negocio.pie_comprobante ?? 'Gracias por su preferencia', ancho / 2, y, { size: 9, align: 'center', color: '#64748b' });
    y += 6;
    texto('Powered by SophiTech ERP · v1.0', ancho / 2, y, { size: 7, align: 'center', color: '#94a3b8' });

    return doc;
  }

  async descargar(c: any) {
    const doc = await this.generarComprobante(c);
    doc.save(`${c.numero_formato}.pdf`);
  }

  async imprimir(c: any) {
    const doc = await this.generarComprobante(c);
    const url = doc.output('bloburl');
    window.open(url as unknown as string, '_blank');
  }

  // ── TICKET TÉRMICO ──────────────────────────────────────────────────────────
  async generarTicket(c: any): Promise<void> {
    let negocio: any = {};
    try { negocio = await firstValueFrom(this.negocioService.getConfig()); } catch {}

    const fecha    = new Date(c.fecha);
    const fechaStr = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr  = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const simbolo  = negocio.simbolo ?? 'S/';
    const igvPct   = negocio.igv_porcentaje ?? 18;
    const nombre   = negocio.nombre_comercial || negocio.razon_social || 'Mi Negocio';
    const detalles = c.detalles ?? [];
    const sep      = '-----------------------------------------';

    // Filas de productos como HTML
    const rowsHtml = detalles.map((d: any) => {
      const prod = (d.producto ?? '').substring(0, 16);
      const cant = d.cantidad;
      const tot  = `${simbolo}${Number(d.total).toFixed(2)}`;
      return `<div class="row-prod">
        <span class="prod-name">${prod}</span>
        <span class="prod-cant">${cant}</span>
        <span class="prod-tot">${tot}</span>
      </div>`;
    }).join('');

    // Crédito
    const creditoHtml = c.tipo_pago === 'CREDITO' && c.saldo_pendiente > 0
      ? `<div class="row-2col"><span>Pagado:</span><span>${simbolo}${Number(c.monto_pagado ?? 0).toFixed(2)}</span></div>
         <div class="row-2col saldo"><span>** SALDO DEBE:</span><span>${simbolo}${Number(c.saldo_pendiente).toFixed(2)} **</span></div>`
      : '';

    const win = window.open('', '_blank', 'width=400,height=720');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Ticket ${c.numero_formato}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #f1f5f9;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: Arial, sans-serif;
    padding: 16px;
    gap: 12px;
  }
  .toolbar { display: flex; gap: 10px; width: 100%; max-width: 320px; }
  .btn { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; }
  .btn-print { background: #2563eb; color: white; }
  .btn-close  { background: #e2e8f0; color: #475569; }

  .ticket {
    background: white;
    width: 300px;
    padding: 14px 12px;
    border-radius: 4px;
    box-shadow: 0 2px 14px rgba(0,0,0,.15);
    border-top: 5px dashed #cbd5e1;
    border-bottom: 5px dashed #cbd5e1;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #1e293b;
    line-height: 1.55;
  }

  /* CENTRADOS */
  .tc { text-align: center; display: block; }
  .tc.negocio  { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
  .tc.sub      { font-size: 11px; color: #475569; }
  .tc.tipo     { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
  .tc.numero   { font-size: 11px; color: #475569; margin-bottom: 4px; }
  .tc.footer   { font-size: 11px; color: #475569; margin-top: 4px; }
  .tc.powered  { font-size: 10px; color: #94a3b8; }

  /* SEPARADOR */
  .sep { text-align: center; display: block; font-family: 'Courier New', monospace; font-size: 11px; color: #94a3b8; margin: 3px 0; }

  /* FILAS IZQUIERDA */
  .row { display: flex; justify-content: space-between; font-size: 11px; padding: 1px 0; }
  .row .lbl { color: #475569; }
  .row .val { font-weight: normal; }

  /* ENCABEZADO TABLA */
  .row-head { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; padding: 3px 0; border-bottom: 1px solid #e2e8f0; }

  /* PRODUCTOS */
  .row-prod { display: flex; align-items: center; font-size: 11px; padding: 2px 0; border-bottom: 1px solid #f1f5f9; }
  .prod-name { flex: 1; }
  .prod-cant { width: 30px; text-align: center; }
  .prod-tot  { width: 70px; text-align: right; font-weight: bold; }

  /* TOTALES */
  .row-2col { display: flex; justify-content: space-between; font-size: 11px; padding: 1px 0; }
  .row-2col span:last-child { font-weight: bold; }
  .row-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; padding: 4px 0; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b; margin: 3px 0; }
  .saldo { color: #dc2626; font-weight: bold; }

  @media print {
    body { background: white; padding: 0; }
    .toolbar { display: none; }
    .ticket { box-shadow: none; border: none; width: 80mm; padding: 2mm; }
    @page { margin: 0; size: 80mm auto; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir</button>
    <button class="btn btn-close"  onclick="window.close()">✕ Cerrar</button>
  </div>

  <div class="ticket">

    <!-- ENCABEZADO -->
    <span class="tc negocio">${nombre}</span>
    ${negocio.ruc       ? `<span class="tc sub">RUC: ${negocio.ruc}</span>` : ''}
    ${negocio.direccion ? `<span class="tc sub">${(negocio.direccion).substring(0, 45)}</span>` : ''}
    ${negocio.telefono  ? `<span class="tc sub">Tel: ${negocio.telefono}</span>` : ''}

    <span class="sep">${sep}</span>

    <!-- TIPO Y NÚMERO -->
    <span class="tc tipo">${c.tipo?.toUpperCase() ?? 'COMPROBANTE'}</span>
    <span class="tc numero">${c.numero_formato ?? ''}</span>

    <span class="sep">${sep}</span>

    <!-- DATOS -->
    <div class="row"><span class="lbl">Fecha  :</span><span class="val">${fechaStr}</span></div>
    <div class="row"><span class="lbl">Hora   :</span><span class="val">${horaStr}</span></div>
    <div class="row"><span class="lbl">Cajero :</span><span class="val">${(c.cajero ?? '').substring(0, 22)}</span></div>
    <div class="row"><span class="lbl">Cliente:</span><span class="val">${(c.cliente ?? 'Cliente General').substring(0, 22)}</span></div>
    <div class="row"><span class="lbl">Doc    :</span><span class="val">${c.cliente_doc ?? '--------'}</span></div>

    <span class="sep">${sep}</span>

    <!-- TABLA PRODUCTOS -->
    <div class="row-head">
      <span style="flex:1">PRODUCTO</span>
      <span style="width:30px;text-align:center">CNT</span>
      <span style="width:70px;text-align:right">TOTAL</span>
    </div>
    ${rowsHtml}

    <span class="sep">${sep}</span>

    <!-- TOTALES -->
    <div class="row-2col"><span>Subtotal (sin IGV):</span><span>${simbolo}${Number(c.subtotal).toFixed(2)}</span></div>
    <div class="row-2col"><span>IGV (${igvPct}%):</span><span>${simbolo}${Number(c.igv).toFixed(2)}</span></div>
    <div class="row-total"><span>TOTAL:</span><span>${simbolo}${Number(c.total).toFixed(2)}</span></div>

    <!-- PAGO -->
    <div class="row"><span class="lbl">Pago   :</span><span class="val">${c.metodo_pago ?? '---'}</span></div>
    ${creditoHtml}
    <div class="row"><span class="lbl">SUNAT  :</span><span class="val">${c.estado_sunat ?? 'SIN_ENVIAR'}</span></div>

    <span class="sep">${sep}</span>

    <!-- PIE -->
    <span class="tc footer">${negocio.pie_comprobante ?? 'Gracias por su preferencia'}</span>
    <span class="tc powered">SophiTech ERP v1.0 · sophitecherp.com</span>

  </div>
</body>
</html>`);
    win.document.close();
  }

  async imprimirTicket(c: any) {
    await this.generarTicket(c);
  }
}
