import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { User } from './models/loan.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Corporate Banking - Loan Pricing System';
  currentUser: User | null = null;
  isLoggedIn = false;
  isAdmin = false;
  showNavbar = false;
  private userSubscription?: Subscription;

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.auth.user$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = this.auth.isLoggedIn();
      this.isAdmin = this.auth.isAdmin();
      this.showNavbar = this.isLoggedIn;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}