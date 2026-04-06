import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../core/services/clientes';
import { UbigeoService } from '../../core/services/ubigeos';
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

        <button
          (click)="nuevo()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nuevo
        </button>
      </div>

      <!-- BUSCADOR DNI -->
    <div class="mb-4 flex gap-2">
        <input
            [(ngModel)]="dniBusqueda"
            placeholder="Buscar por DNI..."
            class="border p-2 rounded w-64"
        />

        <button
            (click)="buscarPorDni()"
            class="bg-blue-600 text-white px-4 py-2 rounded"
        >
            Buscar
        </button>

        <button            
            (click)="limpiar()"
            class="bg-gray-300 px-4 py-2 rounded"
        >
            Reset
        </button>
    </div>

      <!-- LOADING -->
      <div *ngIf="loading" class="text-gray-500">Cargando...</div>

      <!-- TABLA -->
      <div class="overflow-x-auto" *ngIf="!loading">
        <table class="min-w-full bg-white rounded-xl overflow-hidden shadow">
          <thead class="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th class="text-center p-3">ID</th>
              <th class="text-center p-3">Nombre</th>
              <th class="text-center p-3">Documento</th>
              <th class="text-center p-3">Teléfono</th>
              <th class="text-center p-3">Dirección</th>   
              <th class="text-center p-3">Departamento</th>
              <th class="text-center p-3">Provincia</th>
              <th class="text-center p-3">Distrito</th>           
              <th class="text-center p-3">Email</th>
              <th class="text-center p-3">Estado</th>
              <th class="text-center p-3 w-32">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let p of clientes" class="border-t hover:bg-gray-50">
              <td class="p-3 text-center">{{ p.cliente_id }}</td>
              <td class="p-3 text-center">{{ p.nombre }}</td>
              <td class="p-3 text-center">{{ p.documento }}</td>
              <td class="p-3 text-center">{{ p.telefono }}</td>
              <td class="p-3 max-w-sm text-center">
                <p class="line-clamp-2">{{ p.direccion }}</p>
              </td>
              <td class="p-3 text-center">{{ p.departamento }}</td>
              <td class="p-3 text-center">{{ p.provincia }}</td>
              <td class="p-3 text-center">{{ p.distrito }}</td>
              <td class="p-3 max-w-sm text-center">
                <p class="line-clamp-2">{{ p.email }}</p>
              </td>
              <td class="p-3 text-center">
                <span
                  [ngClass]="p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="px-2 py-1 rounded text-xs"
                >
                  {{ p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>              
              <td class="p-3 text-center space-x-2">
                <button
                  (click)="editar(p)"
                  class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  ✏️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL PRO -->
      <div
        *ngIf="mostrarForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
          <h3 class="text-lg font-bold mb-4">{{ editando ? 'Editar' : 'Nuevo' }} Clientes</h3>

          <div class="space-y-3">
            <!-- NOMBRE -->
            <div>
              <label class="text-sm text-gray-600">Nombre</label>
              <input [(ngModel)]="form.nombre" class="w-full p-2 border rounded-lg" />
            </div>

            <!-- DOCUMENTO -->
            <div>
              <label class="text-sm text-gray-600">Documento de Identidad</label>
              <input [(ngModel)]="form.documento" class="w-full p-2 border rounded-lg" />
            </div>

            <!-- TELEFONO -->
            <div>
              <label class="text-sm text-gray-600">Telefono</label>
              <input [(ngModel)]="form.telefono" class="w-full p-2 border rounded-lg" />
            </div>

            <!-- DEPARTAMENTO -->
            <div>
              <label class="text-sm text-gray-600">Departamento</label>
              <select
                [(ngModel)]="form.departamento_id"
                (ngModelChange)="onDepartamentoChange($event)"
                class="w-full p-2 border rounded-lg"
              >
                <option [ngValue]="null">-- Selecciona --</option>
                <option *ngFor="let d of departamentos" [ngValue]="d.departamento_id">
                  {{ d.nombre }}
                </option>
              </select>
            </div>

            <!-- PROVINCIA -->
            <div>
              <label class="text-sm text-gray-600">Provincia</label>
              <select
                [(ngModel)]="form.provincia_id"
                (ngModelChange)="onProvinciaChange($event)"
                [disabled]="!form.departamento_id"
                class="w-full p-2 border rounded-lg disabled:opacity-50"
              >
                <option [ngValue]="null">-- Selecciona --</option>
                <option *ngFor="let p of provincias" [ngValue]="p.provincia_id">
                  {{ p.nombre }}
                </option>
              </select>
            </div>

            <!-- DISTRITO -->
            <div>
              <label class="text-sm text-gray-600">Distrito</label>
              <select
                [(ngModel)]="form.distrito_id"
                [disabled]="!form.provincia_id"
                class="w-full p-2 border rounded-lg disabled:opacity-50"
              >
                <option [ngValue]="null">-- Selecciona --</option>
                <option *ngFor="let d of distritos" [ngValue]="d.distrito_id">
                  {{ d.nombre }}
                </option>
              </select>
            </div>

            <!-- DIRECCION -->
            <div>
              <label class="text-sm text-gray-600">Direccion</label>
              <textarea
                [(ngModel)]="form.direccion"
                rows="3"
                class="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del producto..."
              ></textarea>
            </div>    
            
            <!-- EMAIL -->
            <div>
              <label class="text-sm text-gray-600">Correo Electrónico</label>
              <textarea
                [(ngModel)]="form.email"
                rows="3"
                class="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del producto..."
              ></textarea>
            </div>    

            <label class="flex gap-2 items-center mb-4">
              <input type="checkbox" [(ngModel)]="form.activo" />
              Activo
            </label>

            <!-- BOTONES -->
            <div class="flex justify-end gap-2 mt-5">
              <button (click)="cancelar()" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancelar
              </button>

              <button
                (click)="guardar()"
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CLienteComponent implements OnInit {
  clientes: any[] = [];
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  loading = true;
  dniBusqueda: string = '';

  mostrarForm = false;
  editando = false;

  formKey = 0;

  form: any = {
    cliente_id: null,
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
    email: '',
  };

  constructor(
    private clienteService: ClientesService,
    private ubigeoService: UbigeoService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.cargar();
    this.cargarDepartamentos();
  }

  cargarDepartamentos() {
  this.ubigeoService.getDepartamentos().subscribe({
    next: (res) => {
      this.departamentos = res;
      this.cd.detectChanges();
    },
    error: (err) => console.error('Error departamentos:', err)
    });
  }
  

  onDepartamentoChange(departamentoId: number) {
  this.form.provincia_id = null;
  this.form.distrito_id = null;
  this.provincias = [];
  this.distritos = [];

  if (departamentoId) {
    this.ubigeoService.getProvincias(departamentoId).subscribe({
      next: (res) => {
        this.provincias = res;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error provincias:', err),
    });
  }
}

onProvinciaChange(provinciaId: number) {
  this.form.distrito_id = null;
  this.distritos = [];

  if (provinciaId) {
    this.ubigeoService.getDistritos(provinciaId).subscribe({
      next: (res) => {
        this.distritos = res;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error distritos:', err),
    });
  }
}

  cargar() {
    this.loading = true;

    this.clienteService.getClientes().subscribe({
      next: (res: any) => {
        this.clientes = res;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cd.detectChanges();
      },
    });
  }

  nuevo() {
    this.formKey++;

    this.form = {
      usuario_id: null,
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      email: '',
      activo: true,
      departamento_id: null,
      provincia_id: null,
      distrito_id: null,
    };
    this.provincias = [];
    this.distritos = [];
    this.editando = false;
    this.mostrarForm = true;
  }

  editar(p: any) {
    this.formKey++;

    this.form = {
      cliente_id: p.cliente_id,
      nombre: p.nombre,
      documento: p.documento,
      telefono: p.telefono,
      direccion: p.direccion,
      email: p.email,
      activo: p.activo,
      departamento_id: p.departamento_id,
      provincia_id: null,
      distrito_id: null,
    };

    if (p.departamento_id) {
      this.ubigeoService.getProvincias(p.departamento_id).subscribe({
        next: (res) => {
        this.provincias = res;
        this.form.provincia_id = p.provincia_id;
        this.cd.detectChanges();
      if (p.provincia_id) {
          this.ubigeoService.getDistritos(p.provincia_id).subscribe({
            next: (res2) => {
              this.distritos = res2;
              this.form.distrito_id = p.distrito_id; 
              this.cd.detectChanges();
            },
            error: (err) => console.error('Error distritos:', err),
          });
        }
      },
      error: (err) => console.error('Error provincias:', err),
    });
    }

    if (p.provincia_id) {
      this.ubigeoService.getDistritos(p.provincia_id).subscribe({
        next: (res) => this.distritos = res,
      });
    }

    this.editando = true;
    this.mostrarForm = true;
  }

  guardar() {
    if (!this.form.nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del cliente es obligatorio',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    if (this.editando) {
      this.clienteService.updateClientes(this.form.cliente_id, this.form).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Cliente actualizado satisfactoriamente',
            confirmButtonText: 'Aceptar',
          });

          this.cargar();
          this.cancelar();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error || 'Error al actualizar',
            confirmButtonText: 'Aceptar',
          });
        },
      });
    } else {
      this.clienteService.createClientes(this.form).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Registrado',
            text: 'Cliente registrado satisfactoriamente',
            confirmButtonText: 'Aceptar',
          });

          this.cargar();
          this.cancelar();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error || 'Error al registrar',
            confirmButtonText: 'Aceptar',
          });
        },
      });
    }
  }

  cancelar() {
    this.mostrarForm = false;
  }

  buscarPorDni() {
    if (!this.dniBusqueda) {
      this.cargar();
      return;
    }

    this.clienteService.getClienteDNI(this.dniBusqueda).subscribe({
      next: (res: any) => {
        this.clientes = [res]; // 🔥 mostramos solo uno
        this.cd.detectChanges();
      },
      error: () => {
        Swal.fire({
          icon: 'warning',
          title: 'No encontrado',
          text: 'No existe cliente con ese DNI',
        });

        this.clientes = []; // limpia tabla
      },
    });
  }

  limpiar() {
    this.dniBusqueda = '',
      this.cargar();
  }
}
