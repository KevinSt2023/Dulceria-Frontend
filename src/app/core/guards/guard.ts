import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth';

// ─────────────────────────────────────────────────────────────
// Guard base: solo verifica que haya token válido
// ─────────────────────────────────────────────────────────────
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  router.navigate(['/']);
  return false;
};

// ─────────────────────────────────────────────────────────────
// Guard por roles: recibe los rol_id permitidos
// Uso en routes: canActivate: [roleGuard([1, 2])]
// ─────────────────────────────────────────────────────────────
export const roleGuard = (rolesPermitidos: number[]): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/']);
      return false;
    }

    if (rolesPermitidos.includes(auth.getRolId())) {
      return true;
    }

    // Redirige a la ruta principal del rol si intenta acceder a algo no permitido
    router.navigate(['/app/dashboard']);
    return false;
  };
};

// ─────────────────────────────────────────────────────────────
// Roles disponibles (referencia rápida para usar en routes)
// ─────────────────────────────────────────────────────────────
// 1 = Administrador  → todo
// 2 = Vendedor       → pedidos
// 3 = Produccion     → seguimiento
// 4 = Cajero         → facturación
// 5 = Distribuidor   → seguimiento (solo entrega)
