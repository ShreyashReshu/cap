import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoanCreateComponent } from './loan-create.component';
import { LoanService } from '../../services/loan.service';
import { of, throwError } from 'rxjs';

describe('LoanCreateComponent', () => {
  let component: LoanCreateComponent;
  let fixture: ComponentFixture<LoanCreateComponent>;
  let loanService: jasmine.SpyObj<LoanService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const loanServiceSpy = jasmine.createSpyObj('LoanService', ['createLoan', 'calculateEMI']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoanCreateComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: LoanService, useValue: loanServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoanCreateComponent);
    component = fixture.componentInstance;
    loanService = TestBed.inject(LoanService) as jasmine.SpyObj<LoanService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.loanForm).toBeDefined();
    expect(component.loanForm.get('clientName')).toBeTruthy();
    expect(component.loanForm.get('loanType')?.value).toBe('TERM_LOAN');
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    component.submitted = true;
    component.onSubmit();

    expect(component.loanForm.get('clientName')?.invalid).toBeTrue();
    expect(component.loanForm.get('requestedAmount')?.invalid).toBeTrue();
    expect(component.loanForm.invalid).toBeTrue();
  });

  it('should validate minimum amount', () => {
    component.ngOnInit();
    component.loanForm.patchValue({
      requestedAmount: 50000 // Less than 100000
    });

    expect(component.loanForm.get('requestedAmount')?.invalid).toBeTrue();
  });

  it('should validate interest rate range', () => {
    component.ngOnInit();
    component.loanForm.patchValue({
      proposedInterestRate: 35 // More than 30
    });

    expect(component.loanForm.get('proposedInterestRate')?.invalid).toBeTrue();
  });

  it('should calculate EMI in real-time', () => {
    component.ngOnInit();
    loanService.calculateEMI.and.returnValue(30000);

    component.loanForm.patchValue({
      requestedAmount: 1000000,
      proposedInterestRate: 8.5,
      tenureMonths: 36
    });

    expect(loanService.calculateEMI).toHaveBeenCalled();
    expect(component.showEMI).toBeTrue();
    expect(component.calculatedEMI).toBe(30000);
  });

  it('should create loan successfully', () => {
    component.ngOnInit();
    const mockLoan = { id: '123', clientName: 'Test Corp', status: 'DRAFT' };
    
    component.loanForm.patchValue({
      clientName: 'Test Corp',
      loanType: 'TERM_LOAN',
      requestedAmount: 1000000,
      proposedInterestRate: 8.5,
      tenureMonths: 36,
      'financials.revenue': 5000000,
      'financials.ebitda': 500000,
      'financials.rating': 'A'
    });

    loanService.createLoan.and.returnValue(of(mockLoan as any));

    component.onSubmit();

    expect(loanService.createLoan).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/loans']);
  });

  it('should handle create loan error', () => {
    component.ngOnInit();
    component.loanForm.patchValue({
      clientName: 'Test Corp',
      loanType: 'TERM_LOAN',
      requestedAmount: 1000000,
      proposedInterestRate: 8.5,
      tenureMonths: 36,
      'financials.revenue': 5000000,
      'financials.ebitda': 500000,
      'financials.rating': 'A'
    });

    loanService.createLoan.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

    component.onSubmit();

    expect(component.error).toBe('Error');
    expect(component.loading).toBeFalse();
  });

  it('should cancel and navigate back', () => {
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/loans']);
  });

  it('should have correct loan types', () => {
    expect(component.loanTypes.length).toBe(3);
    expect(component.loanTypes[0].value).toBe('TERM_LOAN');
    expect(component.loanTypes[1].value).toBe('WORKING_CAPITAL');
    expect(component.loanTypes[2].value).toBe('OVERDRAFT');
  });

  it('should have correct ratings', () => {
    expect(component.ratings).toEqual(['A', 'B', 'C', 'D']);
  });
});
