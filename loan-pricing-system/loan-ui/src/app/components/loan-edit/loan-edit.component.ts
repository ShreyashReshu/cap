import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-edit.component.html',
  styleUrl: './loan-edit.component.scss'
})
export class LoanEditComponent implements OnInit {
  loanForm!: FormGroup;
  loading = false;
  error: string | null = null;
  submitted = false;
  loan: Loan | null = null;
  loanId: string | null = null;

  loanTypes = [
    { value: 'TermLoan', label: 'Term Loan' },
    { value: 'WorkingCapital', label: 'Working Capital' },
    { value: 'Overdraft', label: 'Overdraft' },
    { value: 'StructuredCredit', label: 'Structured Credit' }
  ];

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loanId = this.route.snapshot.paramMap.get('id');
    if (this.loanId) {
      this.loadLoan();
    }
  }

  loadLoan(): void {
    if (!this.loanId) return;
    
    this.loading = true;
    this.loanService.getLoanById(this.loanId).subscribe({
      next: (loan: Loan) => {
        this.loan = loan;
        this.initializeForm(loan);
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load loan';
        console.error(err);
      }
    });
  }

  initializeForm(loan: Loan): void {
    this.loanForm = this.fb.group({
      clientName: [loan.clientName, [Validators.required, Validators.minLength(3)]],
      loanType: [loan.loanType, [Validators.required]],
      requestedAmount: [loan.requestedAmount, [Validators.required, Validators.min(100000)]],
      proposedInterestRate: [loan.proposedInterestRate, [Validators.required, Validators.min(1), Validators.max(30)]],
      tenureMonths: [loan.tenureMonths, [Validators.required, Validators.min(1), Validators.max(360)]],
      'financials.revenue': [loan.financials?.revenue, [Validators.required, Validators.min(0)]],
      'financials.ebitda': [loan.financials?.ebitda, [Validators.required, Validators.min(0)]],
      'financials.rating': [loan.financials?.rating, Validators.required]
    });
  }

  get f() {
    return this.loanForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = null;

    if (this.loanForm.invalid || !this.loanId) {
      return;
    }

    this.loading = true;

    const formValue = this.loanForm.value;
    const loanData = {
      clientName: formValue.clientName,
      loanType: formValue.loanType,
      requestedAmount: formValue.requestedAmount,
      proposedInterestRate: formValue.proposedInterestRate,
      tenureMonths: formValue.tenureMonths,
      financials: {
        revenue: formValue['financials.revenue'],
        ebitda: formValue['financials.ebitda'],
        rating: formValue['financials.rating']
      }
    };

    this.loanService.updateLoan(this.loanId, loanData).subscribe({
      next: () => {
        this.router.navigate(['/loans', this.loanId]);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to update loan';
        console.error(err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/loans', this.loanId]);
  }
}
