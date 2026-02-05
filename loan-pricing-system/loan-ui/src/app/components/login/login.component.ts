import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;
  returnUrl = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/loans']);
    }
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/loans';
  }

  submit(): void {
    if (!this.email || !this.password) {
      this.error = 'Email and password are required';
      return;
    }

    this.loading = true;
    this.error = null;
    
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Invalid credentials. Please try again.';
        console.error('Login error:', err);
      }
    });
  }

  // Demo credentials
  fillUserDemo(): void {
    this.email = 'user@bank.com';
    this.password = 'password123';
  }

  fillAdminDemo(): void {
    this.email = 'admin@bank.com';
    this.password = 'password123';
  }
}