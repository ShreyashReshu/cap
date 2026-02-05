import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoanListComponent } from './loan-list.component';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { Loan } from '../../models/loan.model';
import { of, throwError } from 'rxjs';

describe('LoanListComponent', () => {
  let component: LoanListComponent;
  let fixture: ComponentFixture<LoanListComponent>;
  let loanService: jasmine.SpyObj<LoanService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockLoans: Loan[] = [
    {
      id: '1',
      clientName: 'Test Corp',
      loanType: 'TERM_LOAN',
      requestedAmount: 1000000,
      proposedInterestRate: 8.5,
      tenureMonths: 36,
      financials: { revenue: 5000000, ebitda: 500000, rating: 'A' },
      status: 'DRAFT',
      createdBy: 'user@bank.com'
    },
    {
      id: '2',
      clientName: 'Another Corp',
      loanType: 'WORKING_CAPITAL',
      requestedAmount: 2000000,
      proposedInterestRate: 9.0,
      tenureMonths: 24,
      financials: { revenue: 10000000, ebitda: 1000000, rating: 'B' },
      status: 'SUBMITTED',
      createdBy: 'user@bank.com'
    }
  ];

  beforeEach(async () => {
    const loanServiceSpy = jasmine.createSpyObj('LoanService', ['getLoans', 'deleteLoan', 'submitLoan']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'getEmail']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoanListComponent, HttpClientTestingModule],
      providers: [
        { provide: LoanService, useValue: loanServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoanListComponent);
    component = fixture.componentInstance;
    loanService = TestBed.inject(LoanService) as jasmine.SpyObj<LoanService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load loans on init', () => {
    authService.isAdmin.and.returnValue(false);
    authService.getEmail.and.returnValue('user@bank.com');
    loanService.getLoans.and.returnValue(of({ content: mockLoans }));

    component.ngOnInit();

    expect(loanService.getLoans).toHaveBeenCalled();
    expect(component.loans.length).toBe(2);
  });

  it('should filter loans by user when not admin', () => {
    authService.isAdmin.and.returnValue(false);
    authService.getEmail.and.returnValue('user@bank.com');
    
    const allLoans = [
      { ...mockLoans[0], createdBy: 'user@bank.com' },
      { ...mockLoans[1], createdBy: 'other@bank.com' }
    ];
    
    loanService.getLoans.and.returnValue(of({ content: allLoans }));

    component.ngOnInit();

    expect(component.loans.length).toBe(1);
    expect(component.loans[0].createdBy).toBe('user@bank.com');
  });

  it('should show all loans when admin', () => {
    authService.isAdmin.and.returnValue(true);
    loanService.getLoans.and.returnValue(of({ content: mockLoans }));

    component.ngOnInit();

    expect(component.loans.length).toBe(2);
  });

  it('should filter by status', () => {
    authService.isAdmin.and.returnValue(true);
    loanService.getLoans.and.returnValue(of({ content: mockLoans }));

    component.statusFilter = 'DRAFT';
    component.onStatusFilterChange();

    expect(component.page).toBe(0);
    expect(loanService.getLoans).toHaveBeenCalled();
  });

  it('should view loan details', () => {
    component.viewLoan(mockLoans[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/loans', '1']);
  });

  it('should edit loan', () => {
    component.editLoan(mockLoans[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/loans', '1', 'edit']);
  });

  it('should delete loan successfully', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    loanService.deleteLoan.and.returnValue(of(undefined));
    loanService.getLoans.and.returnValue(of({ content: [] }));

    component.deleteLoan(mockLoans[0]);

    expect(loanService.deleteLoan).toHaveBeenCalledWith('1');
    expect(loanService.getLoans).toHaveBeenCalled();
  });

  it('should not delete loan if cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteLoan(mockLoans[0]);

    expect(loanService.deleteLoan).not.toHaveBeenCalled();
  });

  it('should submit loan from list', () => {
    authService.isAdmin.and.returnValue(false);
    authService.getEmail.and.returnValue('user@bank.com');
    spyOn(window, 'confirm').and.returnValue(true);
    loanService.submitLoan.and.returnValue(of(mockLoans[0]));
    loanService.getLoans.and.returnValue(of({ content: mockLoans }));

    component.submitLoanFromList(mockLoans[0]);

    expect(loanService.submitLoan).toHaveBeenCalledWith('1');
    expect(loanService.getLoans).toHaveBeenCalled();
  });

  it('should not submit non-draft loan', () => {
    const submittedLoan = { ...mockLoans[1], status: 'SUBMITTED' as const };
    component.submitLoanFromList(submittedLoan);

    expect(component.error).toBe('Only DRAFT loans can be submitted');
    expect(loanService.submitLoan).not.toHaveBeenCalled();
  });

  it('should get correct status badge class', () => {
    expect(component.getStatusBadgeClass('DRAFT')).toBe('bg-secondary');
    expect(component.getStatusBadgeClass('SUBMITTED')).toBe('bg-info');
    expect(component.getStatusBadgeClass('UNDER_REVIEW')).toBe('bg-warning');
    expect(component.getStatusBadgeClass('APPROVED')).toBe('bg-success');
    expect(component.getStatusBadgeClass('REJECTED')).toBe('bg-danger');
    expect(component.getStatusBadgeClass('UNKNOWN')).toBe('bg-light');
  });

  it('should navigate to previous page', () => {
    component.page = 1;
    loanService.getLoans.and.returnValue(of({ content: mockLoans }));

    component.previousPage();

    expect(component.page).toBe(0);
    expect(loanService.getLoans).toHaveBeenCalled();
  });

  it('should navigate to next page', () => {
    component.page = 0;
    component.totalElements = 20;
    loanService.getLoans.and.returnValue(of({ content: mockLoans }));

    component.nextPage();

    expect(component.page).toBe(1);
    expect(loanService.getLoans).toHaveBeenCalled();
  });

  it('should not go to previous page if already at first page', () => {
    component.page = 0;
    const initialCallCount = loanService.getLoans.calls.count();

    component.previousPage();

    expect(component.page).toBe(0);
    expect(loanService.getLoans.calls.count()).toBe(initialCallCount);
  });

  it('should handle load loans error', () => {
    authService.isAdmin.and.returnValue(true);
    loanService.getLoans.and.returnValue(throwError(() => ({ error: 'Error' })));

    component.loadLoans();

    expect(component.error).toBe('Failed to load loans');
    expect(component.loading).toBeFalse();
  });

  it('should create new loan', () => {
    component.createNew();
    expect(router.navigate).toHaveBeenCalledWith(['/loans/new']);
  });
});
