import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../core/services/clientes';
import { UbigeoService } from '../../core/services/ubigeos';
import { ColorService } from '../../core/services/color';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div>

  <!-- HEADER -->
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-bold text-gray-700">Clientes</h2>
    <button (click)="nuevo()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg
                   hover:bg-blue-700 transition">
      + Nuevo
    </button>
  </div>

  <!-- BUSCADOR -->
  <div class="mb-4 flex gap-2">
    <input [(ngModel)]="dniBusqueda"
           placeholder="Buscar por DNI..."
           class="border p-2 rounded w-64"
           (keyup.enter)="buscarPorDni()"/>
    <button (click)="buscarPorDni()"
            class="bg-blue-600 text-white px-4 py-2 rounded">
      Buscar
    </button>
    <button (click)="limpiar()"
            class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
      Reset
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-gray-500 py-6 text-center">
    Cargando...
  </div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="text-center p-3 text-sm">ID</th>
          <th class="text-center p-3 text-sm">Nombre</th>
          <th class="text-center p-3 text-sm">Documento</th>
          <th class="text-center p-3 text-sm">Teléfono</th>
          <th class="text-center p-3 text-sm">Ubicación</th>
          <th class="text-center p-3 text-sm">Dirección</th>
          <th class="text-center p-3 text-sm">Email</th>
          <th class="text-center p-3 text-sm">Estado</th>
          <th class="text-center p-3 text-sm w-24">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="clientes.length === 0">
          <td colspan="9" class="p-6 text-center text-gray-400">
            No hay clientes registrados
          </td>
        </tr>
        <tr *ngFor="let c of clientes"
            class="border-t hover:bg-gray-50">
          <td class="p-3 text-center text-sm text-gray-500">
            {{ c.cliente_id }}
          </td>
          <td class="p-3 text-center font-medium">{{ c.nombre }}</td>
          <td class="p-3 text-center text-sm">{{ c.documento }}</td>
          <td class="p-3 text-center text-sm">{{ c.telefono }}</td>

          <!-- Ubicación agrupada -->
          <td class="p-3 text-center">
            <div *ngIf="c.distrito || c.provincia || c.departamento"
                 class="flex flex-col gap-0.5 items-center">
              <span *ngIf="c.distrito"
                    class="text-xs text-gray-700 font-medium">
                {{ c.distrito }}
              </span>
              <span *ngIf="c.provincia"
                    class="text-xs text-gray-500">
                {{ c.provincia }}
              </span>
              <span *ngIf="c.departamento"
                    [ngClass]="colors.getSucursalClase(c.departamento)"
                    class="text-xs px-2 py-0.5 rounded-full font-medium mt-0.5">
                {{ c.departamento }}
              </span>
            </div>
            <span *ngIf="!c.distrito && !c.provincia && !c.departamento"
                  class="text-gray-300 text-xs">—</span>
          </td>

          <td class="p-3 text-center text-sm text-gray-600 max-w-[160px]">
            <p class="line-clamp-2">{{ c.direccion || '—' }}</p>
          </td>
          <td class="p-3 text-center text-sm text-gray-500 max-w-[140px]">
            <p class="line-clamp-1">{{ c.email || '—' }}</p>
          </td>

          <td class="p-3 text-center">
            <span [ngClass]="c.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ c.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>

          <td class="p-3 text-center">
            <button (click)="editar(c)"
                    class="bg-blue-500 hover:bg-blue-600 text-white
                           px-2 py-1 rounded text-sm">
              ✏️
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- MODAL -->
  <div *ngIf="mostrarForm"
       class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6
                max-h-screen overflow-y-auto">

      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">
          {{ editando ? 'Editar' : 'Nuevo' }} Cliente
        </h3>
        <button (click)="cancelar()"
                class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
          &times;
        </button>
      </div>

      <div class="space-y-3">

        <div>
          <label class="text-sm text-gray-600">Nombre</label>
          <input [(ngModel)]="form.nombre"
                 class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <div>
          <label class="text-sm text-gray-600">Documento de identidad</label>
          <input [(ngModel)]="form.documento"
                 class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <div>
          <label class="text-sm text-gray-600">Teléfono</label>
          <input [(ngModel)]="form.telefono"
                 class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <!-- Departamento -->
        <div>
          <label class="text-sm text-gray-600">Departamento</label>
          <select [(ngModel)]="form.departamento_id"
                  (ngModelChange)="onDepartamentoChange($event)"
                  class="w-full p-2 border rounded-lg mt-1">
            <option [ngValue]="null">-- Selecciona --</option>
            <option *ngFor="let d of departamentos"
                    [ngValue]="d.departamento_id">
              {{ d.nombre }}
            </option>
          </select>
        </div>

        <!-- Provincia -->
        <div>
          <label class="text-sm text-gray-600">Provincia</label>
          <select [(ngModel)]="form.provincia_id"
                  (ngModelChange)="onProvinciaChange($event)"
                  [disabled]="!form.departamento_id"
                  class="w-full p-2 border rounded-lg mt-1 disabled:opacity-50">
            <option [ngValue]="null">-- Selecciona --</option>
            <option *ngFor="let p of provincias"
                    [ngValue]="p.provincia_id">
              {{ p.nombre }}
            </option>
          </select>
        </div>

        <!-- Distrito -->
        <div>
          <label class="text-sm text-gray-600">Distrito</label>
          <select [(ngModel)]="form.distrito_id"
                  [disabled]="!form.provincia_id"
                  class="w-full p-2 border rounded-lg mt-1 disabled:opacity-50">
            <option [ngValue]="null">-- Selecciona --</option>
            <option *ngFor="let d of distritos"
                    [ngValue]="d.distrito_id">
              {{ d.nombre }}
            </option>
          </select>
        </div>

        <!-- Dirección -->
        <div>
          <label class="text-sm text-gray-600">Dirección</label>
          <textarea [(ngModel)]="form.direccion"
                    rows="2"
                    placeholder="Av. Lima 123..."
                    class="w-full p-2 border rounded-lg mt-1 resize-none">
          </textarea>
        </div>

        <!-- Email -->
        <div>
          <label class="text-sm text-gray-600">Correo electrónico</label>
          <input [(ngModel)]="form.email"
                 type="email"
                 class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <label class="flex gap-2 items-center text-sm">
          <input type="checkbox" [(ngModel)]="form.activo"/>
          Activo
        </label>

        <div class="flex justify-end gap-2 mt-5">
          <button (click)="cancelar()"
                  class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
            Cancelar
          </button>
          <button (click)="guardar()"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700
                         text-white rounded">
            Guardar
          </button>
        </div>

      </div>
    </div>
  </div>

</div>
  `
})
export class CLienteComponent implements OnInit {

  clientes:      any[] = [];
  departamentos: any[] = [];
  provincias:    any[] = [];
  distritos:     any[] = [];
  loading        = true;
  dniBusqueda    = '';
  mostrarForm    = false;
  editando       = false;

  form: any = {
    cliente_id:      null,
    nombre:          '',
    documento:       '',
    telefono:        '',
    direccion:       '',
    email:           '',
    activo:          true,
    departamento_id: null,
    provincia_id:    null,
    distrito_id:     null
  };

  constructor(
    private clienteService: ClientesService,
    private ubigeoService:  UbigeoService,
    public  colors:         ColorService,
    private cd:             ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
    this.ubigeoService.getDepartamentos().subscribe(res => {
      this.departamentos = res;
      this.cd.detectChanges();
    });
  }

  cargar() {
    this.loading = true;
    this.clienteService.getClientes().subscribe({
      next: (res: any) => {
        this.clientes = res;
        this.loading  = false;
        this.cd.detectChanges();
      },
      error: () => { this.loading = false; this.cd.detectChanges(); }
    });
  }

  onDepartamentoChange(id: number) {
    this.form.provincia_id = null;
    this.form.distrito_id  = null;
    this.provincias        = [];
    this.distritos         = [];
    if (!id) return;
    this.ubigeoService.getProvincias(id).subscribe(res => {
      this.provincias = res;
      this.cd.detectChanges();
    });
  }

  onProvinciaChange(id: number) {
    this.form.distrito_id = null;
    this.distritos        = [];
    if (!id) return;
    this.ubigeoService.getDistritos(id).subscribe(res => {
      this.distritos = res;
      this.cd.detectChanges();
    });
  }

  nuevo() {
    this.form = {
      cliente_id: null, nombre: '', documento: '', telefono: '',
      direccion: '', email: '', activo: true,
      departamento_id: null, provincia_id: null, distrito_id: null
    };
    this.provincias  = [];
    this.distritos   = [];
    this.editando    = false;
    this.mostrarForm = true;
  }

  editar(c: any) {
    this.form = {
      cliente_id:      c.cliente_id,
      nombre:          c.nombre,
      documento:       c.documento,
      telefono:        c.telefono,
      direccion:       c.direccion,
      email:           c.email,
      activo:          c.activo,
      departamento_id: c.departamento_id,
      provincia_id:    null,
      distrito_id:     null
    };
    this.provincias = [];
    this.distritos  = [];

    if (c.departamento_id) {
      this.ubigeoService.getProvincias(c.departamento_id).subscribe(res => {
        this.provincias      = res;
        this.form.provincia_id = c.provincia_id;
        this.cd.detectChanges();

        if (c.provincia_id) {
          this.ubigeoService.getDistritos(c.provincia_id).subscribe(res2 => {
            this.distritos       = res2;
            this.form.distrito_id = c.distrito_id;
            this.cd.detectChanges();
          });
        }
      });
    }

    this.editando    = true;
    this.mostrarForm = true;
  }

  guardar() {
    if (!this.form.nombre?.trim()) {
      Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }

    const op = this.editando
      ? this.clienteService.updateClientes(this.form.cliente_id, this.form)
      : this.clienteService.createClientes(this.form);

    op.subscribe({
      next: () => {
        Swal.fire('Listo',
          this.editando ? 'Cliente actualizado' : 'Cliente registrado',
          'success');
        this.cargar();
        this.cancelar();
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo guardar', 'error')
    });
  }

  cancelar() { this.mostrarForm = false; }

  buscarPorDni() {
    if (!this.dniBusqueda.trim()) { this.cargar(); return; }
    this.clienteService.getClienteDNI(this.dniBusqueda).subscribe({
      next: (res: any) => {
        this.clientes = [res];
        this.cd.detectChanges();
      },
      error: () => {
        Swal.fire('No encontrado', 'No existe cliente con ese DNI', 'warning');
        this.clientes = [];
      }
    });
  }

  limpiar() {
    this.dniBusqueda = '';
    this.cargar();
  }
}