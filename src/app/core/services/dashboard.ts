import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getDashboard() {
    return this.http.get<any>(`${environment.apiUrl}/dashboard`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
