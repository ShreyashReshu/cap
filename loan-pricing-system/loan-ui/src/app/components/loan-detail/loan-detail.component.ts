import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './loan-detail.component.html',
  styleUrl: './loan-detail.component.scss'
})
export class LoanDetailComponent implements OnInit {
  loan: Loan | null = null;
  loading = false;
  error: string | null = null;
  isAdmin = false;
  showApprovalPanel = false;
  approvalForm!: FormGroup;

  constructor(
    private loanService: LoanService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.isAdmin = this.auth.isAdmin();
    this.approvalForm = this.fb.group({
      sanctionedAmount: ['', [Validators.required, Validators.min(0)]],
      approvedInterestRate: ['', [Validators.required, Validators.min(0), Validators.max(30)]],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.loadLoan();
  }

  loadLoan(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Loan ID is required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.loanService.getLoanById(id).subscribe({
      next: (res: Loan) => {
        this.loan = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load loan details';
        console.error(err);
      }
    });
  }

  submitLoan(): void {
    if (!this.loan) return;
    
    if (this.loan.status !== 'DRAFT') {
      this.error = 'Only DRAFT loans can be submitted for approval';
      return;
    }
    
    const loanId = this.loan.id || this.loan._id;
    if (!loanId) {
      this.error = 'Invalid loan ID';
      return;
    }

    if (!confirm('Are you sure you want to submit this loan for approval? You will not be able to edit it after submission.')) {
      return;
    }

    this.loading = true;
    this.error = null;
    
    this.loanService.submitLoan(loanId).subscribe({
      next: (loan: Loan) => {
        this.loan = loan;
        this.loading = false;
        // Reload to get updated status
        this.loadLoan();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Submit loan error:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
          url: err.url
        });
        
        // Better error handling
        if (err.status === 0) {
          this.error = 'Network error: Backend server may not be running or CORS is blocking PATCH requests. Please check: 1) Backend is running on port 9090, 2) CORS allows PATCH method in SecurityConfig.java';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'Authentication failed. Please login again.';
        } else if (err.status === 404) {
          this.error = 'Endpoint not found. Please check if backend endpoint /api/loans/{id}/submit exists.';
        } else if (err.status === 405) {
          this.error = 'Method not allowed. Backend CORS configuration needs to include PATCH method.';
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else if (err.message) {
          this.error = err.message;
        } else {
          this.error = 'Failed to submit loan. Please check browser console for details.';
        }
      }
    });
  }

  approveLoan(): void {
    if (!this.loan) return;

    // Only allow approval for SUBMITTED or UNDER_REVIEW status
    if (this.loan.status !== 'SUBMITTED' && this.loan.status !== 'UNDER_REVIEW') {
      this.error = 'Only SUBMITTED or UNDER_REVIEW loans can be approved';
      return;
    }

    if (this.approvalForm.invalid) {
      this.error = 'Please fill all required fields (Sanctioned Amount and Approved Interest Rate)';
      return;
    }

    const loanId = this.loan.id || this.loan._id;
    if (!loanId) {
      this.error = 'Invalid loan ID';
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.approvalForm.value;
    this.loanService.approveLoan(loanId, {
      sanctionedAmount: formValue.sanctionedAmount,
      approvedInterestRate: formValue.approvedInterestRate,
      comments: formValue.comments
    }).subscribe({
      next: () => {
        this.showApprovalPanel = false;
        this.approvalForm.reset();
        this.loadLoan();
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to approve loan';
        console.error(err);
      }
    });
  }

  rejectLoan(): void {
    if (!this.loan) return;
    
    // Only allow rejection for SUBMITTED or UNDER_REVIEW status
    if (this.loan.status !== 'SUBMITTED' && this.loan.status !== 'UNDER_REVIEW') {
      this.error = 'Only SUBMITTED or UNDER_REVIEW loans can be rejected';
      return;
    }
    
    const loanId = this.loan.id || this.loan._id;
    if (!loanId) {
      this.error = 'Invalid loan ID';
      return;
    }

    const comments = prompt('Enter rejection comments:');
    if (comments !== null) {
      this.loading = true;
      this.error = null;

      this.loanService.rejectLoan(loanId, { comments: comments || undefined }).subscribe({
        next: () => {
          this.loadLoan();
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err?.error?.message || err?.message || 'Failed to reject loan';
          console.error(err);
        }
      });
    }
  }

  back(): void {
    this.router.navigate(['/loans']);
  }
}