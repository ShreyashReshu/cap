import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss'
})
export class LoanListComponent implements OnInit {
  loans: Loan[] = [];
  loading = false;
  error: string | null = null;
  statusFilter: string = '';
  page = 0;
  size = 10;
  totalElements = 0;
  isAdmin = false;

  statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

  constructor(
    private loanService: LoanService,
    private auth: AuthService,
    private router: Router
  ) {
    this.isAdmin = this.auth.isAdmin();
  }

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loading = true;
    this.error = null;
    
    // Get all loans (backend doesn't filter by user, so we get all and filter on frontend)
    this.loanService.getLoans(0, 1000).subscribe({
      next: (res: any) => {
        let allLoans = Array.isArray(res) ? res : (res?.content || []);
        
        // Filter: USER sees only their loans, ADMIN sees all
        if (!this.isAdmin) {
          const currentUserEmail = this.auth.getEmail();
          allLoans = allLoans.filter((loan: Loan) => loan.createdBy === currentUserEmail);
        }
        
        // Apply status filter if set
        if (this.statusFilter) {
          allLoans = allLoans.filter((loan: Loan) => loan.status === this.statusFilter);
        }
        
        // Apply pagination
        const startIndex = this.page * this.size;
        const endIndex = startIndex + this.size;
        this.loans = allLoans.slice(startIndex, endIndex);
        this.totalElements = allLoans.length;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load loans';
        console.error(err);
      }
    });
  }

  onStatusFilterChange(): void {
    this.page = 0;
    this.loadLoans();
  }

  viewLoan(loan: Loan): void {
    const loanId = loan.id || loan._id;
    if (loanId) {
      this.router.navigate(['/loans', loanId]);
    }
  }

  editLoan(loan: Loan): void {
    const loanId = loan.id || loan._id;
    if (loanId) {
      this.router.navigate(['/loans', loanId, 'edit']);
    }
  }

  deleteLoan(loan: Loan): void {
    const loanId = loan.id || loan._id;
    if (!loanId) {
      this.error = 'Invalid loan ID';
      return;
    }

    if (confirm('Are you sure you want to delete this loan?')) {
      this.loanService.deleteLoan(loanId).subscribe({
        next: () => {
          this.loadLoans();
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Failed to delete loan';
          console.error(err);
        }
      });
    }
  }

  submitLoanFromList(loan: Loan): void {
    if (loan.status !== 'DRAFT') {
      this.error = 'Only DRAFT loans can be submitted';
      return;
    }

    const loanId = loan.id || loan._id;
    if (!loanId) {
      this.error = 'Invalid loan ID';
      return;
    }

    if (confirm('Are you sure you want to submit this loan for approval? You will not be able to edit it after submission.')) {
      this.loading = true;
      this.error = null;
      
      this.loanService.submitLoan(loanId).subscribe({
        next: () => {
          this.loading = false;
          this.loadLoans();
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Submit loan error:', err);
          
          if (err.status === 0) {
            this.error = 'Network error: Please check if backend is running and CORS allows PATCH method';
          } else if (err.status === 401 || err.status === 403) {
            this.error = 'Authentication failed. Please login again.';
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else if (err.message) {
            this.error = err.message;
          } else {
            this.error = 'Failed to submit loan. Please try again.';
          }
        }
      });
    }
  }

  createNew(): void {
    this.router.navigate(['/loans/new']);
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

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadLoans();
    }
  }

  nextPage(): void {
    if ((this.page + 1) * this.size < this.totalElements) {
      this.page++;
      this.loadLoans();
    }
  }
}