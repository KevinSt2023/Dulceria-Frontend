import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export abstract class BaseService {
  protected handleError(err: HttpErrorResponse): Observable<never> {
    console.error('[DulcesERP Error]', err.status, err.message);
    return throwError(() => err);
  }
}
