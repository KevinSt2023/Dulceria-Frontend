import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
<div [ngClass]="darkMode ? 'dark' : ''"
     class="min-h-screen flex transition-colors duration-300">

  <!-- PANEL IZQUIERDO — Branding -->
<div class="hidden lg:flex lg:w-1/2 flex-col items-center
              justify-center relative overflow-hidden"
      [style]="darkMode
        ? 'background: linear-gradient(160deg, #0d1117 0%, #161b22 50%, #0d1b2a 100%)'
        : 'background: linear-gradient(160deg, #e8f4fd 0%, #c8e6f5 40%, #7bb8e0 100%)'">

    <!-- Círculos decorativos suaves -->
    <div class="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full"
        [style]="darkMode
          ? 'background: radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%)'
          : 'background: radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)'">
    </div>
    <div class="absolute bottom-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full"
        [style]="darkMode
          ? 'background: radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%)'
          : 'background: radial-gradient(circle, rgba(186,230,253,0.6), transparent 70%)'">
    </div>

    <!-- Logo sin card — flota directo sobre el fondo -->
    <div class="relative z-10 flex flex-col items-center justify-center w-full px-16">

      <img src="assets/images/sophitech.jpeg"
          alt="SophiTech ERP"
          class="w-full max-w-lg object-contain transition-transform
                  duration-500 hover:scale-105"
          [style]="darkMode
            ? 'filter: brightness(0.95) drop-shadow(0 0 40px rgba(14,165,233,0.15))'
            : 'filter: drop-shadow(0 8px 32px rgba(14,165,233,0.15))'"
          onerror="this.style.display='none'"/>

      <!-- Badges de módulos -->
      <div class="flex flex-wrap justify-center gap-2 mt-10">
        <span *ngFor="let m of modulos"
              class="px-3 py-1.5 rounded-full text-xs font-medium
                    backdrop-blur-sm border transition-all duration-200
                    hover:scale-105 cursor-default"
              [ngClass]="darkMode
                ? 'bg-white/5 border-white/8 text-slate-400 hover:bg-white/10'
                : 'bg-white/50 border-white/70 text-slate-600 hover:bg-white/70'">
          {{ m }}
        </span>
      </div>

      <p class="mt-8 text-xs tracking-[0.2em] uppercase font-light"
        [ngClass]="darkMode ? 'text-slate-600' : 'text-slate-500'">
        Solución para negocios en crecimiento
      </p>
    </div>

  </div>

  <!-- PANEL DERECHO — Formulario -->
  <div class="w-full lg:w-1/2 flex items-center justify-center
              p-6 lg:p-12 relative transition-colors duration-300"
       [ngClass]="darkMode ? 'bg-slate-900' : 'bg-gray-50'">

    <!-- Botón modo oscuro -->
    <button (click)="darkMode = !darkMode"
            class="absolute top-4 right-4 p-2.5 rounded-xl
                   transition-all duration-200 hover:scale-110 border"
            [ngClass]="darkMode
              ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
              : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-100'"
            title="Cambiar modo">
      {{ darkMode ? '☀️' : '🌙' }}
    </button>

    <div class="w-full max-w-md">

      <!-- Logo móvil -->
      <div class="lg:hidden text-center mb-8">
        <img src="assets/images/sophitech.jpeg"
             alt="SophiTech"
             class="w-40 mx-auto mb-2 rounded-xl"
             onerror="this.style.display='none'"/>
        <p class="text-2xl font-bold mt-2"
           [ngClass]="darkMode ? 'text-white' : 'text-slate-800'">
          <span>Sophi</span><span class="text-cyan-500">Tech</span>
        </p>
      </div>

      <!-- Cabecera -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold"
            [ngClass]="darkMode ? 'text-white' : 'text-gray-800'">
          Bienvenido
        </h1>
        <p class="text-sm mt-1"
           [ngClass]="darkMode ? 'text-slate-400' : 'text-gray-400'">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <!-- Error -->
      <div *ngIf="errorMsg"
           class="mb-4 px-4 py-3 bg-red-50 border border-red-200
                  rounded-xl text-sm text-red-600 flex items-center gap-2">
        <span>⚠️</span> {{ errorMsg }}
      </div>

      <!-- Formulario -->
      <div class="space-y-4">

        <!-- Email -->
        <div>
          <label class="text-sm font-medium block mb-1.5"
                 [ngClass]="darkMode ? 'text-slate-300' : 'text-gray-700'">
            Correo electrónico
          </label>
          <input [(ngModel)]="email"
                 type="email"
                 placeholder="usuario@empresa.com"
                 (keyup.enter)="login()"
                 class="w-full p-3 rounded-xl border outline-none
                        transition-all duration-200 text-sm"
                 [ngClass]="darkMode
                   ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                   : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'"/>
        </div>

        <!-- Contraseña -->
        <div>
          <label class="text-sm font-medium block mb-1.5"
                 [ngClass]="darkMode ? 'text-slate-300' : 'text-gray-700'">
            Contraseña
          </label>
          <div class="relative">
            <input [(ngModel)]="password"
                   [type]="mostrarPassword ? 'text' : 'password'"
                   placeholder="••••••••"
                   (keyup.enter)="login()"
                   class="w-full p-3 pr-11 rounded-xl border outline-none
                          transition-all duration-200 text-sm"
                   [ngClass]="darkMode
                     ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                     : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'"/>
            <button (click)="mostrarPassword = !mostrarPassword"
                    type="button"
                    class="absolute right-3 top-3 text-sm transition-colors"
                    [ngClass]="darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'">
              {{ mostrarPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- Botón ingresar -->
        <button (click)="login()"
                [disabled]="cargando"
                class="w-full p-3 rounded-xl font-semibold text-white
                       transition-all duration-200 mt-2 relative overflow-hidden
                       disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-95"
                style="background: linear-gradient(135deg, #0369a1, #0ea5e9, #06b6d4)">

          <!-- Shimmer al cargar -->
          <span *ngIf="cargando"
                class="absolute inset-0 bg-gradient-to-r from-transparent
                       via-white/20 to-transparent animate-pulse">
          </span>

          <span class="relative">
            {{ cargando ? 'Ingresando...' : 'Ingresar al sistema' }}
          </span>
        </button>

      </div>

      <!-- Divider info -->
      <div class="mt-6 pt-6 border-t text-center"
           [ngClass]="darkMode ? 'border-slate-800' : 'border-gray-100'">
        <div class="flex justify-center gap-4 flex-wrap">
          <span *ngFor="let badge of badges"
                class="text-xs px-2 py-1 rounded-full"
                [ngClass]="darkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-gray-100 text-gray-500'">
            {{ badge }}
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-4 text-center">
        <p class="text-xs"
           [ngClass]="darkMode ? 'text-slate-600' : 'text-gray-400'">
          SophiTech ERP · Todos los derechos reservados · v1.0
        </p>
      </div>

    </div>
  </div>

</div>
  `
})
export class Login {

  email           = '';
  password        = '';
  errorMsg        = '';
  cargando        = false;
  mostrarPassword = false;
  darkMode        = false;

  modulos = [
    '📦 Inventario', '🛵 Pedidos', '🧾 Facturación',
    '👥 Usuarios',   '📊 Reportes', '🏪 Sucursales'
  ];

  badges = ['🔒 Seguro', '☁️ SaaS', '🇵🇪 Perú'];

  constructor(
    private auth:   AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMsg = 'Ingresa tu correo y contraseña';
      return;
    }

    this.cargando = true;
    this.errorMsg = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMsg = err?.error?.message
                        ?? err?.error
                        ?? 'Credenciales incorrectas';
      }
    });
  }
}