export interface Loan {
  id?: string;
  _id?: string; // For compatibility
  clientName: string;
  loanType: 'TERM_LOAN' | 'WORKING_CAPITAL' | 'OVERDRAFT';
  requestedAmount: number;
  proposedInterestRate: number;
  tenureMonths: number;
  financials: Financials;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  sanctionedAmount?: number;
  approvedInterestRate?: number;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  actions?: AuditAction[];
  createdAt?: Date | string;
  deleted?: boolean;
}

export interface Financials {
  revenue: number;
  ebitda: number;
  rating: 'A' | 'B' | 'C' | 'D';
}

export interface AuditAction {
  by: string;
  action: string;
  timestamp: Date | string;
}

export interface User {
  _id?: string;
  id?: string;
  email: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  token: string;
  role: string;
}