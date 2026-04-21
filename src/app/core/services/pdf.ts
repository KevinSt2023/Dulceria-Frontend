import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { ConfiguracionNegocioService } from '../../core/services/configuracion-negocio';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PdfService {

  constructor(private negocioService: ConfiguracionNegocioService) {}

  async generarComprobante(c: any): Promise<jsPDF> {
    // Cargar config del negocio
    let negocio: any = {};
    let logoBase64   = '';

    try {
      negocio = await firstValueFrom(this.negocioService.getConfig());
    } catch { }

    try {
      const logoRes = await firstValueFrom(this.negocioService.getLogo());
      logoBase64    = logoRes?.logo_base64 ?? '';
    } catch { }

    const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho  = 210;
    const margen = 15;
    let y        = 20;

    // ── Helpers ──
    const texto = (txt: string, x: number, yPos: number,
                   opts?: { size?: number; bold?: boolean;
                            align?: 'left' | 'center' | 'right';
                            color?: string }) => {
      doc.setFontSize(opts?.size ?? 10);
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
      if (opts?.color) {
        const hex = opts.color.replace('#', '');
        doc.setTextColor(
          parseInt(hex.substring(0,2), 16),
          parseInt(hex.substring(2,4), 16),
          parseInt(hex.substring(4,6), 16)
        );
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(txt ?? '', x, yPos, { align: opts?.align ?? 'left' });
    };

    const linea = (yPos: number, color = '#e5e7eb') => {
      const hex = color.replace('#', '');
      doc.setDrawColor(
        parseInt(hex.substring(0,2), 16),
        parseInt(hex.substring(2,4), 16),
        parseInt(hex.substring(4,6), 16)
      );
      doc.line(margen, yPos, ancho - margen, yPos);
    };

    // ── CABECERA ──
    doc.setFillColor(3, 105, 161);
    doc.rect(0, 0, ancho, 42, 'F');

    // Logo SophiTech (derecha)
    // Puedes reemplazar esta URL con tu logo en base64
    const logoSophitech = ''; // ← aquí puedes poner el base64 del logo de SophiTech
    if (logoSophitech) {
      doc.addImage(logoSophitech, 'JPEG', ancho - 40, 4, 25, 25);
    } else {
      texto('SophiTech', ancho - margen, 12,
            { size: 9, align: 'right', color: '#bae6fd' });
      texto('Enterprise Resource Planning', ancho - margen, 17,
            { size: 8, align: 'right', color: '#7dd3fc' });
    }

    // Logo del negocio (izquierda) si existe
    if (logoBase64) {
      try {
      doc.addImage(logoBase64, 'JPEG', margen, 6, 32, 32);
      } catch { }
      }

    // Nombre del negocio (centro)
    const nombreMostrar = negocio.nombre_comercial
                       || negocio.razon_social
                       || 'Mi Negocio';

    texto(nombreMostrar, ancho / 2, 14,
          { size: 14, bold: true, align: 'center', color: '#ffffff' });

    if (negocio.ruc) {
      texto(`RUC: ${negocio.ruc}`, ancho / 2, 21,
            { size: 9, align: 'center', color: '#bae6fd' });
    }

    if (negocio.direccion) {
      texto(negocio.direccion, ancho / 2, 27,
            { size: 8, align: 'center', color: '#e0f2fe' });
    }

    const contacto = [negocio.telefono, negocio.email]
      .filter(Boolean).join(' · ');
    if (contacto) {
      texto(contacto, ancho / 2, 33,
            { size: 7, align: 'center', color: '#bae6fd' });
    }

    // Powered by (abajo derecha del header)
    texto('Ing. Kevin De La Cruz Escate',
          ancho - margen, 39,
          { size: 6, align: 'right', color: '#7dd3fc' });

    y = 54;

    // ── TIPO Y NÚMERO ──
    const esBoleta  = c.codigo_sunat === '03';
    const colorTipo = esBoleta ? '#1d4ed8' : '#7c3aed';
    const hexTipo   = colorTipo.replace('#', '');

    doc.setFillColor(
      parseInt(hexTipo.substring(0,2), 16),
      parseInt(hexTipo.substring(2,4), 16),
      parseInt(hexTipo.substring(4,6), 16)
    );
    doc.roundedRect(margen, y, ancho - margen * 2, 18, 3, 3, 'F');

    texto(c.tipo?.toUpperCase() ?? 'COMPROBANTE',
          ancho / 2, y + 7,
          { size: 13, bold: true, align: 'center', color: '#ffffff' });
    texto(c.numero_formato,
          ancho / 2, y + 14,
          { size: 10, align: 'center', color: '#e0e7ff' });

    y += 26;

    // ── DATOS DEL CLIENTE ──
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margen, y, ancho - margen * 2, 26, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margen, y, ancho - margen * 2, 26, 2, 2, 'S');

    texto('DATOS DEL CLIENTE', margen + 4, y + 6,
          { size: 7, bold: true, color: '#64748b' });
    texto(c.cliente ?? 'Cliente General',
          margen + 4, y + 13, { size: 11, bold: true });
    texto(`Doc: ${c.cliente_doc ?? '00000000'}`,
          margen + 4, y + 19, { size: 9, color: '#64748b' });

    const fecha    = new Date(c.fecha);
    const fechaStr = fecha.toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const horaStr  = fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit'
    });

    texto(`Fecha: ${fechaStr}`, ancho - margen - 4, y + 13,
          { size: 9, align: 'right', color: '#64748b' });
    texto(`Hora: ${horaStr}`, ancho - margen - 4, y + 19,
          { size: 9, align: 'right', color: '#64748b' });

    y += 33;

    // ── TABLA DE PRODUCTOS ──
    doc.setFillColor(15, 23, 42);
    doc.rect(margen, y, ancho - margen * 2, 8, 'F');

    texto('DESCRIPCIÓN',  margen + 4,          y + 5.5,
          { size: 8, bold: true, color: '#ffffff' });
    texto('CANT.',        margen + 100,         y + 5.5,
          { size: 8, bold: true, align: 'center', color: '#ffffff' });
    texto('P. UNIT.',     margen + 130,         y + 5.5,
          { size: 8, bold: true, align: 'right', color: '#ffffff' });
    texto('TOTAL',        ancho - margen - 4,   y + 5.5,
          { size: 8, bold: true, align: 'right', color: '#ffffff' });

    y += 10;

    const detalles = c.detalles ?? [];
    detalles.forEach((d: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margen, y - 2, ancho - margen * 2, 8, 'F');
      }
      texto(d.producto ?? '',  margen + 4,        y + 4, { size: 9 });
      texto(String(d.cantidad), margen + 100,      y + 4,
            { size: 9, align: 'center' });
      texto(`${negocio.simbolo ?? 'S/'} ${Number(d.precio_unitario).toFixed(2)}`,
            margen + 130, y + 4,
            { size: 9, align: 'right', color: '#64748b' });
      texto(`${negocio.simbolo ?? 'S/'} ${Number(d.total).toFixed(2)}`,
            ancho - margen - 4, y + 4,
            { size: 9, bold: true, align: 'right' });
      y += 8;
    });

    y += 4;
    linea(y, '#cbd5e1');
    y += 6;

    // ── TOTALES ──
    const colLabel = ancho - margen - 50;
    const colValue = ancho - margen - 4;
    const simbolo  = negocio.simbolo ?? 'S/';

    texto('Subtotal (sin IGV):',
          colLabel, y, { size: 9, color: '#64748b' });
    texto(`${simbolo} ${Number(c.subtotal).toFixed(2)}`,
          colValue, y, { size: 9, align: 'right' });
    y += 6;

    texto(`IGV (${negocio.igv_porcentaje ?? 18}%):`,
          colLabel, y, { size: 9, color: '#64748b' });
    texto(`${simbolo} ${Number(c.igv).toFixed(2)}`,
          colValue, y, { size: 9, align: 'right' });
    y += 2;

    linea(y + 3, '#94a3b8');
    y += 7;

    doc.setFillColor(3, 105, 161);
    doc.roundedRect(colLabel - 10, y - 3,
                    ancho - margen - colLabel + 14, 12, 2, 2, 'F');
    texto('TOTAL:',
          colLabel - 6, y + 5.5,
          { size: 11, bold: true, color: '#ffffff' });
    texto(`${simbolo} ${Number(c.total).toFixed(2)}`,
          colValue, y + 5.5,
          { size: 12, bold: true, align: 'right', color: '#ffffff' });

    y += 18;

    if (c.metodo_pago) {
      texto(`Método de pago: ${c.metodo_pago}`,
            margen, y, { size: 9, color: '#64748b' });
      y += 7;
    }

    const colorEstado = c.estado_sunat === 'ACEPTADO' ? '#16a34a' : '#d97706';
    texto(`Estado SUNAT: ${c.estado_sunat}`,
          margen, y, { size: 9, color: colorEstado });
    y += 10;

    // ── PIE DE PÁGINA ──
    linea(y, '#e2e8f0');
    y += 7;

    const pie = negocio.pie_comprobante ?? 'Gracias por su preferencia';
    texto(pie, ancho / 2, y,
          { size: 9, align: 'center', color: '#64748b' });
    y += 6;
    texto('Powered by SophiTech ERP · v1.0',
          ancho / 2, y,
          { size: 7, align: 'center', color: '#94a3b8' });

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
}