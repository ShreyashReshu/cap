import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoanService } from './loan.service';
import { Loan } from '../models/loan.model';

describe('LoanService', () => {
  let service: LoanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoanService]
    });
    service = TestBed.inject(LoanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get loans with pagination', () => {
    const mockResponse = {
      content: [
        { id: '1', clientName: 'Test Corp', status: 'DRAFT' },
        { id: '2', clientName: 'Another Corp', status: 'SUBMITTED' }
      ],
      totalElements: 2,
      totalPages: 1
    };

    service.getLoans(0, 10).subscribe(response => {
      expect(response.content.length).toBe(2);
      expect(response.totalElements).toBe(2);
    });

    const req = httpMock.expectOne(req => req.url === 'http://localhost:9090/api/loans' && req.method === 'GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockResponse);
  });

  it('should get loans with status filter', () => {
    const mockResponse = {
      content: [{ id: '1', clientName: 'Test Corp', status: 'DRAFT' }],
      totalElements: 1
    };

    service.getLoans(0, 10, 'DRAFT').subscribe(response => {
      expect(response.content.length).toBe(1);
    });

    const req = httpMock.expectOne(req => req.url === 'http://localhost:9090/api/loans');
    expect(req.request.params.get('status')).toBe('DRAFT');
    req.flush(mockResponse);
  });

  it('should get loan by id', () => {
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
      status: 'DRAFT'
    };

    service.getLoanById('123').subscribe(loan => {
      expect(loan.id).toBe('123');
      expect(loan.clientName).toBe('Test Corp');
    });

    const req = httpMock.expectOne('http://localhost:9090/api/loans/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockLoan);
  });

  it('should create a loan', () => {
    const loanData: Partial<Loan> = {
      clientName: 'New Corp',
      loanType: 'TERM_LOAN',
      requestedAmount: 1000000,
      proposedInterestRate: 8.5,
      tenureMonths: 36,
      financials: {
        revenue: 5000000,
        ebitda: 500000,
        rating: 'A'
      }
    };

    const mockLoan: Loan = {
      id: 'new-id',
      ...loanData as Loan,
      status: 'DRAFT'
    };

    service.createLoan(loanData).subscribe(loan => {
      expect(loan.id).toBe('new-id');
      expect(loan.clientName).toBe('New Corp');
    });

    const req = httpMock.expectOne('http://localhost:9090/api/loans');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loanData);
    req.flush(mockLoan);
  });

  it('should update a loan', () => {
    const updateData: Partial<Loan> = {
      clientName: 'Updated Corp',
      requestedAmount: 2000000
    };

    const mockLoan: Loan = {
      id: '123',
      ...updateData as Loan,
      status: 'DRAFT'
    };

    service.updateLoan('123', updateData).subscribe(loan => {
      expect(loan.clientName).toBe('Updated Corp');
    });

    const req = httpMock.expectOne('http://localhost:9090/api/loans/123');
    expect(req.request.method).toBe('PUT');
    req.flush(mockLoan);
  });

  it('should submit a loan', () => {
    const mockLoan: Loan = {
      id: '123',
      clientName: 'Test Corp',
      status: 'SUBMITTED'
    };

    service.submitLoan('123').subscribe(loan => {
      expect(loan.status).toBe('SUBMITTED');
    });

    const req = httpMock.expectOne('http://localhost:9090/api/loans/123/submit');
    expect(req.request.method).toBe('PATCH');
    req.flush(mockLoan);
  });

  it('should approve a loan', () => {
    const mockLoan: Loan = {
      id: '123',
      status: 'APPROVED',
      sanctionedAmount: 1000000,
      approvedInterestRate: 7.5
    };

    service.approveLoan('123', {
      sanctionedAmount: 1000000,
      approvedInterestRate: 7.5
    }).subscribe(loan => {
      expect(loan.status).toBe('APPROVED');
      expect(loan.sanctionedAmount).toBe(1000000);
    });

    const req = httpMock.expectOne(req => 
      req.url === 'http://localhost:9090/api/admin/loans/123/decision' && 
      req.method === 'PATCH'
    );
    expect(req.request.params.get('approved')).toBe('true');
    expect(req.request.params.get('amount')).toBe('1000000');
    expect(req.request.params.get('rate')).toBe('7.5');
    req.flush(mockLoan);
  });

  it('should reject a loan', () => {
    const mockLoan: Loan = {
      id: '123',
      status: 'REJECTED'
    };

    service.rejectLoan('123', { comments: 'Not approved' }).subscribe(loan => {
      expect(loan.status).toBe('REJECTED');
    });

    const req = httpMock.expectOne(req => 
      req.url === 'http://localhost:9090/api/admin/loans/123/decision' && 
      req.method === 'PATCH'
    );
    expect(req.request.params.get('approved')).toBe('false');
    req.flush(mockLoan);
  });

  it('should delete a loan', () => {
    service.deleteLoan('123').subscribe(() => {
      expect(true).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:9090/api/admin/loans/123');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should calculate EMI correctly', () => {
    const principal = 1000000;
    const rate = 8.5;
    const tenure = 36;

    const emi = service.calculateEMI(principal, rate, tenure);
    
    expect(emi).toBeGreaterThan(0);
    expect(emi).toBeLessThan(principal);
  });

  it('should calculate EMI with zero interest rate', () => {
    const principal = 1000000;
    const rate = 0;
    const tenure = 36;

    const emi = service.calculateEMI(principal, rate, tenure);
    
    expect(emi).toBe(principal / tenure);
  });
});
