import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlmacenesService } from '../../core/services/almacenes';
import { SucursalesService } from '../../core/services/sucursales';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- HEADER -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-700">Almacenes</h2>

        <button
          (click)="nuevo()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nuevo
        </button>
      </div>

      <!-- LOADING -->
      <div *ngIf="loading" class="text-gray-500">Cargando...</div>

      <!-- TABLA -->
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full bg-white rounded-xl shadow">
          <thead class="bg-gray-100">
            <tr>
              <th class="text-center p-3">ID</th>
              <th class="text-center p-3">Nombre</th>
              <th class="text-center p-3">Estado</th> 
              <th class="text-center p-3">Sucursal</th>        
              <th class="text-center p-3 w-32">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let p of almacenes" class="border-t hover:bg-gray-50">
              <td class="p-3 text-center">{{ p.almacen_id }}</td>
              <td class="p-3 text-center">{{ p.nombre }}</td>              
              <td class="p-3 text-center">
                <span
                  [ngClass]="p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="px-2 py-1 rounded text-xs"
                >
                  {{ p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>  
              <td class="p-3 text-center">{{ p.sucursalnombre }}</td>            
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
          <h3 class="text-lg font-bold mb-4">{{ editando ? 'Editar' : 'Nuevo' }} Almacenes</h3>

          <div class="space-y-3">
            <!-- NOMBRE -->
            <div>
              <label class="text-sm text-gray-600">Nombre</label>
              <input [(ngModel)]="form.nombre" class="w-full p-2 border rounded-lg" />
            </div>  

            <!-- SUCURSAL -->
            <div>
              <label class="text-sm text-gray-600">Sucursal</label>
              <select [(ngModel)]="form.sucursal_id" class="w-full p-2 border rounded-lg">
                <option value="">Seleccione</option>
                <option *ngFor="let c of sucursales" [value]="c.sucursal_id">
                  {{ c.nombre }}
                </option>
              </select>
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
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AlmacenesComponent implements OnInit {
  almacenes: any[] = [];
  sucursales: any[] = [];
  loading = true;

  mostrarForm = false;
  editando = false;

  form: any = {
    almacen_id: null,
    sucursal_id: null,
    nombre: ''      
  };

  constructor(
    private almacenservice: AlmacenesService,
    private sucursalesservice : SucursalesService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.sucursalesservice.getSucursales().subscribe((res: any) => {
    this.sucursales = res;
    this.cd.detectChanges();
    });
  }

  cargar() {
    this.loading = true;

    this.almacenservice.getAlmacenes().subscribe({
      next: (res: any) => {
        this.almacenes = res;        
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
    this.form = {
      almacen_id: null,
      nombre: '',   
      sucursal_id: null,        
      activo: true
    };
    this.editando = false;
    this.mostrarForm = true;
  }

  editar(p: any) {
    this.form = { ...p };
    this.editando = true;
    this.mostrarForm = true;
  }

  guardar() {
    
      if (!this.form.nombre) {
        Swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'El nombre es obligatorio',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
    
      if (this.editando) {
        this.almacenservice.updateAlmacenes(this.form.almacen_id, this.form).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'Almacen actualizado correctamente',
              confirmButtonText: 'Aceptar'
            });
    
            this.cargar();
            this.cancelar();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error || 'Error al actualizar',
              confirmButtonText: 'Aceptar'
            });
          }
        });
    
      } else {
    
        this.almacenservice.createAlmacenes(this.form).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Registrado',
              text: 'Almacen creado correctamente',
              confirmButtonText: 'Aceptar'
            });
    
            this.cargar();
            this.cancelar();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error || 'Error al registrar',
              confirmButtonText: 'Aceptar'
            });
          }
        });
    
      } 
    }  

  cancelar() {
    this.mostrarForm = false;
  }
}
