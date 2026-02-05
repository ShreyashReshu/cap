import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoanDetailComponent } from './loan-detail.component';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { Loan } from '../../models/loan.model';
import { of, throwError } from 'rxjs';

describe('LoanDetailComponent', () => {
  let component: LoanDetailComponent;
  let fixture: ComponentFixture<LoanDetailComponent>;
  let loanService: jasmine.SpyObj<LoanService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: ActivatedRoute;

  const mockLoan: Loan = {
    id: '123',
    clientName: 'Test Corp',
    loanType: 'TERM_LOAN',
    requestedAmount: 1000000,
    proposedInterestRate: 8.5,
    tenureMonths: 36,
    financials: {
      revenue: 5000000,
      ebitda: 500000,
      rating: 'A'
    },
    status: 'DRAFT',
    createdBy: 'user@bank.com'
  };

  beforeEach(async () => {
    const loanServiceSpy = jasmine.createSpyObj('LoanService', ['getLoanById', 'submitLoan', 'approveLoan', 'rejectLoan']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoanDetailComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: LoanService, useValue: loanServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? '123' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoanDetailComponent);
    component = fixture.componentInstance;
    loanService = TestBed.inject(LoanService) as jasmine.SpyObj<LoanService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load loan on init', () => {
    loanService.getLoanById.and.returnValue(of(mockLoan));

    component.ngOnInit();

    expect(loanService.getLoanById).toHaveBeenCalledWith('123');
    expect(component.loan).toEqual(mockLoan);
    expect(component.loading).toBeFalse();
  });

  it('should handle load loan error', () => {
    loanService.getLoanById.and.returnValue(throwError(() => ({ error: 'Error' })));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load loan details');
    expect(component.loading).toBeFalse();
  });

  it('should show error if loan ID is missing', () => {
    activatedRoute.snapshot.paramMap.get = () => null;
    component.loadLoan();

    expect(component.error).toBe('Loan ID is required');
  });

  it('should submit loan successfully', () => {
    component.loan = { ...mockLoan, status: 'DRAFT' };
    const submittedLoan = { ...mockLoan, status: 'SUBMITTED' };
    spyOn(window, 'confirm').and.returnValue(true);
    loanService.submitLoan.and.returnValue(of(submittedLoan));
    loanService.getLoanById.and.returnValue(of(submittedLoan));

    component.submitLoan();

    expect(loanService.submitLoan).toHaveBeenCalledWith('123');
    expect(loanService.getLoanById).toHaveBeenCalled();
  });

  it('should not submit non-draft loan', () => {
    component.loan = { ...mockLoan, status: 'SUBMITTED' };

    component.submitLoan();

    expect(component.error).toBe('Only DRAFT loans can be submitted for approval');
    expect(loanService.submitLoan).not.toHaveBeenCalled();
  });

  it('should not submit if cancelled', () => {
    component.loan = { ...mockLoan, status: 'DRAFT' };
    spyOn(window, 'confirm').and.returnValue(false);

    component.submitLoan();

    expect(loanService.submitLoan).not.toHaveBeenCalled();
  });

  it('should approve loan successfully', () => {
    component.loan = { ...mockLoan, status: 'SUBMITTED' };
    component.approvalForm.patchValue({
      sanctionedAmount: 1000000,
      approvedInterestRate: 7.5
    });
    const approvedLoan = { ...mockLoan, status: 'APPROVED' };
    loanService.approveLoan.and.returnValue(of(approvedLoan));
    loanService.getLoanById.and.returnValue(of(approvedLoan));

    component.approveLoan();

    expect(loanService.approveLoan).toHaveBeenCalled();
    expect(component.showApprovalPanel).toBeFalse();
  });

  it('should not approve if form is invalid', () => {
    component.loan = { ...mockLoan, status: 'SUBMITTED' };
    component.approvalForm.patchValue({
      sanctionedAmount: '',
      approvedInterestRate: ''
    });

    component.approveLoan();

    expect(component.error).toBe('Please fill all required fields (Sanctioned Amount and Approved Interest Rate)');
    expect(loanService.approveLoan).not.toHaveBeenCalled();
  });

  it('should not approve non-submitted loan', () => {
    component.loan = { ...mockLoan, status: 'DRAFT' };
    component.approvalForm.patchValue({
      sanctionedAmount: 1000000,
      approvedInterestRate: 7.5
    });

    component.approveLoan();

    expect(component.error).toBe('Only SUBMITTED or UNDER_REVIEW loans can be approved');
    expect(loanService.approveLoan).not.toHaveBeenCalled();
  });

  it('should reject loan successfully', () => {
    component.loan = { ...mockLoan, status: 'SUBMITTED' };
    spyOn(window, 'prompt').and.returnValue('Not approved');
    const rejectedLoan = { ...mockLoan, status: 'REJECTED' };
    loanService.rejectLoan.and.returnValue(of(rejectedLoan));
    loanService.getLoanById.and.returnValue(of(rejectedLoan));

    component.rejectLoan();

    expect(loanService.rejectLoan).toHaveBeenCalled();
    expect(loanService.getLoanById).toHaveBeenCalled();
  });

  it('should not reject if cancelled', () => {
    component.loan = { ...mockLoan, status: 'SUBMITTED' };
    spyOn(window, 'prompt').and.returnValue(null);

    component.rejectLoan();

    expect(loanService.rejectLoan).not.toHaveBeenCalled();
  });

  it('should not reject non-submitted loan', () => {
    component.loan = { ...mockLoan, status: 'DRAFT' };

    component.rejectLoan();

    expect(component.error).toBe('Only SUBMITTED or UNDER_REVIEW loans can be rejected');
    expect(loanService.rejectLoan).not.toHaveBeenCalled();
  });

  it('should navigate back', () => {
    component.back();
    expect(router.navigate).toHaveBeenCalledWith(['/loans']);
  });

  it('should initialize approval form', () => {
    expect(component.approvalForm).toBeDefined();
    expect(component.approvalForm.get('sanctionedAmount')).toBeTruthy();
    expect(component.approvalForm.get('approvedInterestRate')).toBeTruthy();
  });

  it('should set isAdmin correctly', () => {
    authService.isAdmin.and.returnValue(true);
    fixture = TestBed.createComponent(LoanDetailComponent);
    component = fixture.componentInstance;
    
    expect(component.isAdmin).toBeTrue();
  });
});
