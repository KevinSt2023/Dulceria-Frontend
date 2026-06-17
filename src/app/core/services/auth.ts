import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class Auth extends BaseService {

  constructor(private http: HttpClient) { super(); }

  login(email: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/login`, {
      email: email,
      password: password
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
