import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../auth/auth';

const refrescando$ = new BehaviorSubject<boolean>(false);
const nuevoToken$  = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // No interceptar endpoints de auth
  if (req.url.includes('/auth/login')   ||
      req.url.includes('/auth/refresh') ||
      req.url.includes('/auth/logout')) {
    return next(req);
  }

  const token = authService.getToken();
  const reqConToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqConToken).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status !== 401 || !authService.getRefreshToken()) {
        return throwError(() => error);
      }

      // Si ya hay un refresh en curso — esperar al nuevo token
      if (refrescando$.getValue()) {
        return nuevoToken$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t => next(req.clone({
            setHeaders: { Authorization: `Bearer ${t!}` }
          })))
        );
      }

      // Iniciar refresh
      refrescando$.next(true);
      nuevoToken$.next(null);

      return authService.refreshToken().pipe(
        switchMap(res => {
          refrescando$.next(false);
          nuevoToken$.next(res.token);
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${res.token}` }
          }));
        }),
        catchError(refreshError => {
          refrescando$.next(false);
          nuevoToken$.next(null);
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};