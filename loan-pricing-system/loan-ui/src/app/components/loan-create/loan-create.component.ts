import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-create.component.html',
  styleUrl: './loan-create.component.scss'
})
export class LoanCreateComponent implements OnInit {
  loanForm!: FormGroup;
  submitted = false;
  loading = false;
  error: string | null = null;
  calculatedEMI = 0;
  showEMI = false;

  loanTypes = [
    { value: 'TERM_LOAN', label: 'Term Loan' },
    { value: 'WORKING_CAPITAL', label: 'Working Capital' },
    { value: 'OVERDRAFT', label: 'Overdraft' }
  ];

  ratings = ['A', 'B', 'C', 'D'];

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loanForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(3)]],
      loanType: ['TERM_LOAN', Validators.required],
      requestedAmount: ['', [Validators.required, Validators.min(100000)]],
      proposedInterestRate: ['', [Validators.required, Validators.min(1), Validators.max(30)]],
      tenureMonths: ['', [Validators.required, Validators.min(1), Validators.max(360)]],
      'financials.revenue': ['', [Validators.required, Validators.min(0)]],
      'financials.ebitda': ['', [Validators.required, Validators.min(0)]],
      'financials.rating': ['A', Validators.required]
    });

    // Real-time EMI calculation on form value changes
    this.loanForm.valueChanges.subscribe(() => {
      this.calculateEMIRealTime();
    });
  }

  get f() {
    return this.loanForm.controls;
  }

  calculateEMIRealTime(): void {
    const amount = this.f['requestedAmount'].value;
    const rate = this.f['proposedInterestRate'].value;
    const tenure = this.f['tenureMonths'].value;

    if (amount && rate && tenure && amount > 0 && rate > 0 && tenure > 0) {
      this.calculatedEMI = this.loanService.calculateEMI(amount, rate, tenure);
      this.showEMI = true;
    } else {
      this.showEMI = false;
      this.calculatedEMI = 0;
    }
  }

  calculateEMIValue(): void {
    this.calculateEMIRealTime();
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = null;

    if (this.loanForm.invalid) {
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

    this.loanService.createLoan(loanData).subscribe({
      next: (loan: Loan) => {
        this.loading = false;
        this.router.navigate(['/loans']);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to create loan';
        console.error(err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/loans']);
  }
}