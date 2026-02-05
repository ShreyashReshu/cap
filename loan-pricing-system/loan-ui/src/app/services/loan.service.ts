import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private apiUrl = 'http://localhost:9090/api/loans';
  private adminApiUrl = 'http://localhost:9090/api/admin';

  constructor(private http: HttpClient) {}

  // Get all loans with pagination and filters
  getLoans(page: number = 0, size: number = 10, status?: string, sortBy: string = 'createdAt'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},desc`);
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<any>(this.apiUrl, { params });
  }

  // Get single loan by ID
  getLoanById(id: string): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/${id}`);
  }

  // Create new loan (USER)
  createLoan(data: Partial<Loan>): Observable<Loan> {
    return this.http.post<Loan>(this.apiUrl, data);
  }

  // Update loan (USER - DRAFT only, ADMIN - always)
  updateLoan(id: string, data: Partial<Loan>): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/${id}`, data);
  }

  // Submit loan for approval (USER)
  submitLoan(id: string): Observable<Loan> {
    // Send empty object for PATCH request
    const url = `${this.apiUrl}/${id}/submit`;
    console.log('Submitting loan:', url);
    return this.http.patch<Loan>(url, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Approve loan (ADMIN) - matches backend /api/admin/loans/{id}/decision?approved=true&amount=...&rate=...
  approveLoan(id: string, data: { sanctionedAmount: number; approvedInterestRate: number; comments?: string }): Observable<Loan> {
    let params = new HttpParams()
      .set('approved', 'true')
      .set('amount', data.sanctionedAmount.toString())
      .set('rate', data.approvedInterestRate.toString());
    
    return this.http.patch<Loan>(`${this.adminApiUrl}/loans/${id}/decision`, {}, { params });
  }

  // Reject loan (ADMIN) - matches backend /api/admin/loans/{id}/decision?approved=false
  rejectLoan(id: string, data: { comments?: string }): Observable<Loan> {
    const params = new HttpParams()
      .set('approved', 'false');
    
    return this.http.patch<Loan>(`${this.adminApiUrl}/loans/${id}/decision`, {}, { params });
  }

  // Delete loan (ADMIN - soft delete)
  deleteLoan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/loans/${id}`);
  }

  // Calculate EMI
  calculateEMI(principal: number, rate: number, tenure: number): number {
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) {
      return principal / tenure;
    }
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
           (Math.pow(1 + monthlyRate, tenure) - 1);
  }
}
