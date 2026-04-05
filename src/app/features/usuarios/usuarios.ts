import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../core/services/roles';
import { UsuariosService } from '../../core/services/usuarios';
import { SucursalesService } from '../../core/services/sucursales';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- HEADER -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-700">Usuarios</h2>

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
      <div class="overflow-x-auto" *ngIf="!loading">
        <table class="min-w-full bg-white rounded-xl overflow-hidden shadow">
          <thead class="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th class="text-center p-3">ID</th>
              <th class="text-center p-3">Nombre</th>
              <th class="text-center p-3">Email</th>
              <th class="text-center p-3">Estado</th>
              <th class="text-center p-3">Rol</th>
              <th class="text-center p-3">Sucursal</th>
              <th class="text-center p-3 w-32">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let p of usuarios" class="border-t hover:bg-gray-50">
              <td class="p-3 text-center">{{ p.usuario_id }}</td>
              <td class="p-3 text-center">{{ p.nombre }}</td>
              <td class="p-3 max-w-sm">
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
              <td class="p-3 text-center">{{ p.rolnombre }}</td>
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

      <!-- MODAL -->
      <div
        *ngIf="mostrarForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold mb-4">{{ editando ? 'Editar' : 'Nuevo' }} Usuario</h3>

          <!-- 🔥 FORM AQUI -->
          <form autocomplete="off">
            <div class="space-y-3">
              <!-- NOMBRE -->
              <div>
                <label>Nombre</label>
                <input
                  [(ngModel)]="form.nombre"
                  name="random_name_1"
                  autocomplete="off"
                  class="w-full p-2 border rounded-lg"
                />
              </div>

              <!-- EMAIL -->
              <div>
                <label>Email</label>
                <input
                  [(ngModel)]="form.email"
                  name="random_email_123"
                  autocomplete="new-email"
                  class="w-full p-2 border rounded-lg"
                />
              </div>

              <!-- PASSWORD -->
              <div>
                <label>Contraseña</label>
                <input
                  [(ngModel)]="form.password_hash"
                  name="random_pass_456"
                  type="password"
                  autocomplete="new-password"
                  class="w-full p-2 border rounded-lg"
                />
              </div>

              <!-- ROL -->
              <div>
                <label>Rol</label>
                <select
                  [(ngModel)]="form.rol_id"
                  name="rol_select"
                  class="w-full p-2 border rounded-lg"
                >
                  <option value="">Seleccione</option>
                  <option *ngFor="let c of roles" [value]="c.rol_id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <!-- SUCURSAL -->
              <div>
                <label>Sucursal</label>
                <select
                  [(ngModel)]="form.sucursal_id"
                  name="sucursal_select"
                  class="w-full p-2 border rounded-lg"
                >
                  <option value="">Seleccione</option>
                  <option *ngFor="let c of sucursales" [value]="c.sucursal_id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <label class="flex gap-2 items-center">
                <input type="checkbox" [(ngModel)]="form.activo" name="activo_check" />
                Activo
              </label>
            </div>
          </form>

          <!-- BOTONES -->
          <div class="flex justify-end gap-2 mt-5">
            <button (click)="cancelar()" class="px-4 py-2 bg-gray-300 rounded">Cancelar</button>

            <button (click)="guardar()" class="px-4 py-2 bg-green-600 text-white rounded">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsuarioComponent implements OnInit {
  usuarios: any[] = [];
  roles: any[] = [];
  sucursales: any[] = [];
  loading = true;

  mostrarForm = false;
  editando = false;

  formKey = 0; // 👈 clave mágica

  form: any = {
    usuario_id: null,
    nombre: '',
    email: '',
    password_hash: '',
    rol_id: null,
    sucursal_id: null,
  };

  constructor(
    private usuarioservice: UsuariosService,
    private rolesservice: RolesService,
    private sucursalService: SucursalesService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.cargar();

    this.rolesservice.getRoles().subscribe((res: any) => {
      this.roles = res;
    });

    this.sucursalService.getSucursales().subscribe((res: any) => {
      this.sucursales = res;
    });
  }

  cargar() {
    this.loading = true;

    this.usuarioservice.getUsuarios().subscribe({
      next: (res: any) => {
        this.usuarios = res;
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
    this.formKey++; // 💥 fuerza reinicio real

    this.form = {
      usuario_id: null,
      nombre: '',
      email: '',
      password_hash: '',
      rol_id: null,
      sucursal_id: null,
      activo: true,
    };

    this.editando = false;
    this.mostrarForm = true;
  }

  editar(p: any) {
    this.formKey++; // 💥 evita residuos

    this.form = {
      usuario_id: p.usuario_id,
      nombre: p.nombre,
      email: p.email,
      password_hash: '',
      rol_id: p.rol_id,
      sucursal_id: p.sucursal_id,
      activo: p.activo,
    };

    this.editando = true;
    this.mostrarForm = true;
  }

  guardar() {
    if (!this.form.nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre es obligatorio',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    if (this.editando) {
      this.usuarioservice.updateUsuarios(this.form.usuario_id, this.form).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Usuario actualizado correctamente',
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
      this.usuarioservice.createUsuarios(this.form).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Registrado',
            text: 'Usuario creado correctamente',
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
}
