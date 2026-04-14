import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../core/services/roles';
import { UsuariosService } from '../../core/services/usuarios';
import { SucursalesService } from '../../core/services/sucursales';
import { AuthService } from '../../core/auth/auth';
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
    <button (click)="nuevo()"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
      + Nuevo
    </button>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="text-gray-400 py-6 text-center">Cargando...</div>

  <!-- TABLA -->
  <div *ngIf="!loading" class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white rounded-xl shadow">
      <thead class="bg-gray-100">
        <tr>
          <th class="text-center p-3">ID</th>
          <th class="text-center p-3">Nombre</th>
          <th class="text-center p-3">Email</th>
          <th class="text-center p-3">Estado</th>
          <th class="text-center p-3">Rol</th>
          <th class="text-center p-3">Sucursal</th>
          <th class="text-center p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="usuarios.length === 0">
          <td colspan="7" class="p-6 text-center text-gray-400">Sin usuarios</td>
        </tr>
        <tr *ngFor="let u of usuarios" class="border-t hover:bg-gray-50">
          <td class="p-3 text-center">{{ u.usuario_id }}</td>
          <td class="p-3 text-center">{{ u.nombre }}</td>
          <td class="p-3 text-center text-sm">{{ u.email }}</td>
          <td class="p-3 text-center">
            <span [ngClass]="u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="px-2 py-1 rounded-full text-xs font-medium">
              {{ u.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="p-3 text-center text-sm">{{ u.rol_nombre }}</td>
          <td class="p-3 text-center text-sm">{{ u.sucursal_nombre }}</td>
          <td class="p-3 text-center">
            <button (click)="editar(u)"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm">
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
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">{{ editando ? 'Editar' : 'Nuevo' }} Usuario</h3>
        <button (click)="cancelar()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <form autocomplete="off" class="space-y-3">

        <div>
          <label class="text-sm text-gray-600">Nombre</label>
          <input [(ngModel)]="form.nombre" name="u_nombre"
                 autocomplete="off" class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <div>
          <label class="text-sm text-gray-600">Email</label>
          <input [(ngModel)]="form.email" name="u_email"
                 autocomplete="new-email" class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <div>
          <label class="text-sm text-gray-600">
            Contraseña {{ editando ? '(dejar vacío para no cambiar)' : '' }}
          </label>
          <input [(ngModel)]="form.password_hash" name="u_pass"
                 type="password" autocomplete="new-password"
                 class="w-full p-2 border rounded-lg mt-1"/>
        </div>

        <!-- ROL: SuperAdmin ve todos, Admin no ve SuperAdmin ni Admin -->
        <div>
          <label class="text-sm text-gray-600">Rol</label>
          <select [(ngModel)]="form.rol_id" name="u_rol"
                  class="w-full p-2 border rounded-lg mt-1">
            <option [ngValue]="null">-- Seleccione --</option>
            <option *ngFor="let r of rolesDisponibles" [ngValue]="r.rol_id">
              {{ r.nombre }}
            </option>
          </select>
        </div>

        <!-- SUCURSAL: bloqueado si es Admin (solo ve la suya) -->
        <div>
          <label class="text-sm text-gray-600">Sucursal</label>

          <!-- Admin: solo muestra su sucursal, no puede cambiarla -->
          <div *ngIf="!esSuperAdmin"
               class="w-full p-2 border rounded-lg mt-1 bg-gray-50 text-gray-600 text-sm">
            {{ sucursalNombreAdmin }}
            <span class="text-xs text-gray-400 ml-1">(fija a tu sucursal)</span>
          </div>

          <!-- SuperAdmin: puede elegir cualquier sucursal -->
          <select *ngIf="esSuperAdmin"
                  [(ngModel)]="form.sucursal_id" name="u_sucursal"
                  class="w-full p-2 border rounded-lg mt-1">
            <option [ngValue]="null">-- Seleccione --</option>
            <option *ngFor="let s of sucursales" [ngValue]="s.sucursal_id">
              {{ s.nombre }}
            </option>
          </select>
        </div>

        <label class="flex gap-2 items-center text-sm">
          <input type="checkbox" [(ngModel)]="form.activo" name="u_activo"/>
          Activo
        </label>

      </form>

      <div class="flex justify-end gap-2 mt-5">
        <button (click)="cancelar()"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Cancelar</button>
        <button (click)="guardar()"
                [disabled]="guardando"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50">
          {{ guardando ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>

    </div>
  </div>

</div>
`
})
export class UsuarioComponent implements OnInit {

  usuarios:   any[] = [];
  roles:      any[] = [];
  sucursales: any[] = [];
  loading   = true;
  guardando = false;

  mostrarForm = false;
  editando    = false;

  esSuperAdmin      = false;
  sucursalIdAdmin   = 0;
  sucursalNombreAdmin = '';

  form: any = {
    usuario_id: null, nombre: '', email: '',
    password_hash: '', rol_id: null, sucursal_id: null, activo: true
  };

  // Roles que puede asignar según su nivel
  get rolesDisponibles(): any[] {
    if (this.esSuperAdmin) return this.roles;
    // Admin no puede asignar SuperAdmin (0) ni Admin (1)
    return this.roles.filter(r => r.rol_id !== 0 && r.rol_id !== 1);
  }

  constructor(
    private usuarioservice:  UsuariosService,
    private rolesservice:    RolesService,
    private sucursalService: SucursalesService,
    private auth:            AuthService,
    private cd:              ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.esSuperAdmin    = this.auth.isSuperAdmin();
    this.sucursalIdAdmin = this.auth.getSucursalId();

    this.cargar();

    this.rolesservice.getRoles().subscribe((res: any) => {
      this.roles = res;
      this.cd.detectChanges();
    });

    this.sucursalService.getSucursales().subscribe((res: any) => {
      this.sucursales = res;
      // Guarda el nombre de la sucursal del Admin para mostrarlo en el form
      const s = res.find((x: any) => x.sucursal_id === this.sucursalIdAdmin);
      this.sucursalNombreAdmin = s?.nombre ?? '';
      this.cd.detectChanges();
    });
  }

  cargar() {
    this.loading = true;
    this.usuarioservice.getUsuarios().subscribe({
      next: (res: any) => {
        this.usuarios = res;
        this.loading  = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  nuevo() {
    this.form = {
      usuario_id: null, nombre: '', email: '',
      password_hash: '', rol_id: null,
      // Admin: su sucursal fija; SuperAdmin: elige
      sucursal_id: this.esSuperAdmin ? null : this.sucursalIdAdmin,
      activo: true
    };
    this.editando   = false;
    this.mostrarForm = true;
  }

  editar(u: any) {
    this.form = {
      usuario_id:    u.usuario_id,
      nombre:        u.nombre,
      email:         u.email,
      password_hash: '',
      rol_id:        u.rol_id,
      sucursal_id:   u.sucursal_id,
      activo:        u.activo
    };
    this.editando   = true;
    this.mostrarForm = true;
  }

  guardar() {
    if (!this.form.nombre?.trim()) {
      Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }
    if (!this.form.email?.trim()) {
      Swal.fire('Campo requerido', 'El email es obligatorio', 'warning');
      return;
    }
    if (!this.editando && !this.form.password_hash?.trim()) {
      Swal.fire('Campo requerido', 'La contraseña es obligatoria para nuevos usuarios', 'warning');
      return;
    }

    this.guardando = true;

    const op = this.editando
      ? this.usuarioservice.updateUsuarios(this.form.usuario_id, this.form)
      : this.usuarioservice.createUsuarios(this.form);

    op.subscribe({
      next: () => {
        Swal.fire('Listo', this.editando ? 'Usuario actualizado' : 'Usuario creado', 'success');
        this.guardando   = false;
        this.mostrarForm = false;
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err?.error || 'No se pudo guardar', 'error');
      }
    });
  }

  cancelar() { this.mostrarForm = false; }
}
