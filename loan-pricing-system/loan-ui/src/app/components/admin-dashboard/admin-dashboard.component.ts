import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  loans: Loan[] = [];
  loading = false;
  error: string | null = null;
  
  stats = {
    total: 0,
    draft: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
    approvedAmount: 0
  };

  recentLoans: Loan[] = [];

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.loanService.getLoans(0, 1000).subscribe({
      next: (res: any) => {
        this.loans = res.content || res;
        this.calculateStats();
        this.recentLoans = this.loans.slice(0, 5);
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load dashboard data';
        console.error(err);
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      total: this.loans.length,
      draft: this.loans.filter(l => l.status === 'DRAFT').length,
      submitted: this.loans.filter(l => l.status === 'SUBMITTED').length,
      underReview: this.loans.filter(l => l.status === 'UNDER_REVIEW').length,
      approved: this.loans.filter(l => l.status === 'APPROVED').length,
      rejected: this.loans.filter(l => l.status === 'REJECTED').length,
      totalAmount: this.loans.reduce((sum, l) => sum + (l.requestedAmount || 0), 0),
      approvedAmount: this.loans
        .filter(l => l.status === 'APPROVED')
        .reduce((sum, l) => sum + (l.sanctionedAmount || l.requestedAmount || 0), 0)
    };
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-secondary';
      case 'SUBMITTED':
        return 'bg-info';
      case 'UNDER_REVIEW':
        return 'bg-warning';
      case 'APPROVED':
        return 'bg-success';
      case 'REJECTED':
        return 'bg-danger';
      default:
        return 'bg-light';
    }
  }
}
