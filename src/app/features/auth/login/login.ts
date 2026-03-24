import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html'
})
export class Login {

  email: string = '';
  password: string = '';

  constructor(private auth: Auth, private router: Router) {}

  login() {
    console.log('EMAIL:', this.email);
    console.log('PASSWORD:', this.password);

    this.auth.login(this.email, this.password)
      .subscribe({
        next: (res: any) => {
          console.log('LOGIN OK', res);

          // guardar token
          localStorage.setItem('token', res.token);

          // 🚀 redirección correcta ERP
          this.router.navigate(['/app']);
        },
        error: (err) => {
          console.error('ERROR LOGIN', err);
          alert('Credenciales incorrectas');
        }
      });
  }
}