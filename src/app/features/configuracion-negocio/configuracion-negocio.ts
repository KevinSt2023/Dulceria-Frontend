import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionNegocioService } from '../../core/services/configuracion-negocio';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion-negocio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>
  <div class="mb-6">
    <h2 class="text-xl font-bold text-gray-800">Configuración del negocio</h2>
    <p class="text-sm text-gray-400 mt-0.5">
      Estos datos aparecen en los comprobantes PDF
    </p>
  </div>

  <div *ngIf="loading" class="text-center text-gray-400 py-10">
    Cargando...
  </div>

  <div *ngIf="!loading"
       class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Razón social *
        </label>
        <input [(ngModel)]="form.razon_social"
               placeholder="DULCES ROSITA S.A.C."
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Nombre comercial
        </label>
        <input [(ngModel)]="form.nombre_comercial"
               placeholder="Dulces Rosita"
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          RUC
        </label>
        <input [(ngModel)]="form.ruc"
               maxlength="11"
               placeholder="20123456789"
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm font-mono focus:ring-2 focus:ring-blue-400
                      outline-none"/>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Teléfono
        </label>
        <input [(ngModel)]="form.telefono"
               placeholder="987654321"
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
      </div>

      <div class="md:col-span-2">
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Dirección
        </label>
        <input [(ngModel)]="form.direccion"
               placeholder="Av. Principal 123, Lima"
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Email
        </label>
        <input [(ngModel)]="form.email"
               type="email"
               placeholder="contacto@negocio.com"
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Pie del comprobante
        </label>
        <input [(ngModel)]="form.pie_comprobante"
               placeholder="Gracias por su preferencia"
               class="w-full p-2.5 border border-gray-200 rounded-xl
                      text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
      </div>

      <!-- Logo -->
      <div class="md:col-span-2">
        <label class="text-sm font-medium text-gray-700 block mb-1.5">
          Logo del negocio
        </label>
        <div class="flex items-center gap-4">
          <img *ngIf="logoPreview"
               [src]="logoPreview"
               class="w-24 h-24 object-contain border rounded-xl p-2"/>
          <div *ngIf="!logoPreview"
               class="w-24 h-24 border-2 border-dashed border-gray-200
                      rounded-xl flex items-center justify-center
                      text-gray-400 text-xs text-center">
            Sin logo
          </div>
          <div>
            <input type="file"
                   accept="image/*"
                   (change)="onLogoChange($event)"
                   class="block text-sm text-gray-500
                          file:mr-3 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:bg-blue-50 file:text-blue-700
                          file:text-sm file:font-medium
                          hover:file:bg-blue-100"/>
            <p class="text-xs text-gray-400 mt-1">
              PNG o JPG — máx 500KB recomendado
            </p>
            <button *ngIf="logoPreview"
                    (click)="limpiarLogo()"
                    class="text-xs text-red-500 hover:text-red-700 mt-1">
              Eliminar logo
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Preview del PDF -->
    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <p class="text-xs font-semibold text-blue-700 mb-1">
        💡 Vista previa en comprobantes
      </p>
      <p class="text-xs text-blue-600">
        Los comprobantes PDF mostrarán:
        <strong>{{ form.nombre_comercial || form.razon_social || '—' }}</strong>
        {{ form.ruc ? '· RUC: ' + form.ruc : '' }}
        {{ form.direccion ? '· ' + form.direccion : '' }}
      </p>
    </div>

    <div class="flex justify-end mt-6">
      <button (click)="guardar()"
              [disabled]="guardando || !form.razon_social"
              class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white
                     rounded-xl text-sm font-medium disabled:opacity-40
                     transition-colors">
        {{ guardando ? 'Guardando...' : 'Guardar configuración' }}
      </button>
    </div>

  </div>
</div>
  `
})
export class ConfiguracionNegocioComponent implements OnInit {

  form: any = {
    razon_social:     '',
    nombre_comercial: '',
    ruc:              '',
    direccion:        '',
    telefono:         '',
    email:            '',
    pie_comprobante:  'Gracias por su preferencia',
    logo_base64:      ''
  };

  logoPreview = '';
  loading     = true;
  guardando   = false;

  constructor(
    private service: ConfiguracionNegocioService,
    private cd:      ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.service.getConfig().subscribe({
      next: (res: any) => {
        this.form    = { ...res, logo_base64: '' };
        this.loading = false;
        // Cargar logo si existe
        if (res.tiene_logo) {
          this.service.getLogo().subscribe({
            next: (l: any) => {
              this.logoPreview      = 'data:image/jpeg;base64,' + l.logo_base64;
              this.form.logo_base64 = l.logo_base64;
              this.cd.detectChanges();
            },
            error: () => {}
          });
        }
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 600000) {
      Swal.fire('Imagen muy grande',
        'El logo debe pesar menos de 500KB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64              = e.target.result.split(',')[1];
      this.form.logo_base64     = base64;
      this.logoPreview          = e.target.result;
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  limpiarLogo() {
    this.logoPreview      = '';
    this.form.logo_base64 = '';
    this.cd.detectChanges();
  }

  guardar() {
    if (!this.form.razon_social?.trim()) {
      Swal.fire('Campo requerido', 'La razón social es obligatoria', 'warning');
      return;
    }

    this.guardando = true;
    this.service.updateConfig(this.form).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({
          icon: 'success', title: 'Configuración guardada',
          text: 'Los comprobantes PDF usarán estos datos',
          timer: 2000, showConfirmButton: false
        });
        this.cd.detectChanges();
      },
      error: () => {
        this.guardando = false;
        Swal.fire('Error', 'No se pudo guardar', 'error');
      }
    });
  }
}