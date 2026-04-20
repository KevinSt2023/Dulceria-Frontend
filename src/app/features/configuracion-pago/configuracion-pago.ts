import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionPagoService } from '../../core/services/configuracion-pago';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="mb-6">
    <h2 class="text-xl font-bold text-gray-800">Métodos de pago</h2>
    <p class="text-sm text-gray-400 mt-0.5">
      Configura los QR y datos de pago de tu empresa
    </p>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando...
  </div>

  <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">

    <!-- CARD por cada método -->
    <div *ngFor="let m of metodos"
         class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

      <!-- Cabecera -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ m.icono }}</span>
          <div>
            <p class="font-bold text-gray-800">{{ m.label }}</p>
            <p class="text-xs text-gray-400">{{ m.descripcion }}</p>
          </div>
        </div>
        <!-- Toggle activo -->
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox"
                 [(ngModel)]="m.form.activo"
                 class="sr-only peer"/>
          <div class="w-10 h-5 bg-gray-200 rounded-full peer
                      peer-checked:bg-green-500 transition-colors
                      after:content-[''] after:absolute after:top-0.5
                      after:left-0.5 after:bg-white after:rounded-full
                      after:h-4 after:w-4 after:transition-all
                      peer-checked:after:translate-x-5">
          </div>
        </label>
      </div>

      <!-- Formulario -->
      <div class="space-y-3">

        <div>
          <label class="text-xs text-gray-500 block mb-1">
            Número de {{ m.label }}
          </label>
          <input [(ngModel)]="m.form.numero"
                 [placeholder]="'Ej: 987 654 321'"
                 class="w-full p-2.5 border border-gray-200 rounded-xl
                        text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
        </div>

        <div>
          <label class="text-xs text-gray-500 block mb-1">
            Nombre del titular
          </label>
          <input [(ngModel)]="m.form.titular"
                 placeholder="Ej: María García"
                 class="w-full p-2.5 border border-gray-200 rounded-xl
                        text-sm focus:ring-2 focus:ring-cyan-400 outline-none"/>
        </div>

        <!-- QR actual -->
        <div *ngIf="m.qr_preview || m.tiene_qr">
          <label class="text-xs text-gray-500 block mb-1">QR actual</label>
          <div class="flex items-center gap-3">
            <img *ngIf="m.qr_preview"
                [src]="m.qr_preview"
                class="w-24 h-24 object-contain border rounded-xl p-1"
                alt="QR"/>
            <div *ngIf="!m.qr_preview && m.tiene_qr"
                class="w-24 h-24 border rounded-xl flex items-center
                        justify-center text-gray-400 text-xs">
              Cargando...
            </div>
            <button (click)="limpiarQR(m)"
                    class="text-xs text-red-500 hover:text-red-700">
              Eliminar QR
            </button>
          </div>
        </div>

        <!-- Upload QR -->
        <div>
          <label class="text-xs text-gray-500 block mb-1">
            {{ m.tiene_qr ? 'Cambiar QR' : 'Subir QR' }}
          </label>
          <input type="file"
                 accept="image/*"
                 (change)="onFileChange($event, m)"
                 class="w-full text-sm text-gray-500
                        file:mr-3 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-cyan-50 file:text-cyan-700
                        hover:file:bg-cyan-100"/>
          <p class="text-xs text-gray-400 mt-1">
            PNG o JPG — máx 500KB recomendado
          </p>
        </div>

      </div>

      <!-- Botón guardar -->
      <button (click)="guardar(m)"
              [disabled]="guardando === m.tipo"
              class="w-full mt-4 py-2.5 rounded-xl text-white text-sm
                     font-semibold transition-colors disabled:opacity-50"
              style="background: linear-gradient(135deg, #0369a1, #0ea5e9)">
        {{ guardando === m.tipo ? 'Guardando...' : 'Guardar configuración' }}
      </button>

    </div>

  </div>

</div>
  `
})
export class ConfiguracionPagoComponent implements OnInit {

  loading  = true;
  guardando: string | null = null;

  metodos = [
    {
      tipo:        'yape',
      label:       'Yape',
      icono:       '📱',
      descripcion: 'Pagos mediante Yape',
      tiene_qr:    false,
      qr_preview:  '',
      qr_base64:   '',
      form: { numero: '', titular: '', banco: '', activo: true, qr_base64: '' }
    },
    {
      tipo:        'plin',
      label:       'Plin',
      icono:       '💜',
      descripcion: 'Pagos mediante Plin',
      tiene_qr:    false,
      qr_preview:  '',
      qr_base64:   '',
      form: { numero: '', titular: '', banco: '', activo: true, qr_base64: '' }
    }
  ];

  constructor(
    private service: ConfiguracionPagoService,
    private cd:      ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
  this.loading = true;
  this.service.getConfig().subscribe({
    next: (res: any[]) => {
      res.forEach(c => {
        const m = this.metodos.find(x => x.tipo === c.tipo);
        if (m) {
          m.tiene_qr     = c.tiene_qr;
          m.form.numero  = c.numero  ?? '';
          m.form.titular = c.titular ?? '';
          m.form.banco   = c.banco   ?? '';
          m.form.activo  = c.activo;

          // ← Si tiene QR, cargarlo para mostrarlo
          if (c.tiene_qr) {
            this.service.getQR(c.tipo).subscribe({
              next: (qr: any) => {
                m.qr_base64  = qr.qr_base64;
                m.qr_preview = 'data:image/png;base64,' + qr.qr_base64;
                this.cd.detectChanges();
              },
              error: () => {} // si falla silencioso
            });
          }
        }
      });
      this.loading = false;
      this.cd.detectChanges();
    },
    error: () => {
      this.loading = false;
      this.cd.detectChanges();
    }
  });
}

  onFileChange(event: any, m: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      Swal.fire('Atención', 'La imagen no debe superar 1MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result as string;
      // Guardar solo la parte base64 sin el prefijo data:image/...
      m.form.qr_base64 = base64.split(',')[1];
      m.qr_preview     = base64; // preview con el prefijo completo
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  limpiarQR(m: any) {
    m.qr_preview     = '';
    m.qr_base64      = '';
    m.form.qr_base64 = '';
    m.tiene_qr       = false;
    this.cd.detectChanges();
  }

  guardar(m: any) {
    if (!m.form.numero?.trim()) {
      Swal.fire('Atención', `Ingresa el número de ${m.label}`, 'warning');
      return;
    }
    if (!m.form.titular?.trim()) {
      Swal.fire('Atención', 'Ingresa el nombre del titular', 'warning');
      return;
    }

    this.guardando = m.tipo;

    this.service.updateConfig(m.tipo, m.form).subscribe({
      next: () => {
        this.guardando = null;
        m.tiene_qr     = !!m.form.qr_base64 || m.tiene_qr;
        this.cd.detectChanges();
        Swal.fire({
          icon:              'success',
          title:             'Guardado',
          text:              `${m.label} configurado correctamente`,
          timer:             1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.guardando = null;
        Swal.fire('Error', err?.error || 'No se pudo guardar', 'error');
        this.cd.detectChanges();
      }
    });
  }
}