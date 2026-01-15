package com.corporatebank.loan.service;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.model.LoanAction;
import com.corporatebank.loan.model.enums.LoanStatus;
import com.corporatebank.loan.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepo;

    public Loan createLoan(Loan loan, String user) {
        loan.setCreatedBy(user);
        loan.setCreatedAt(Instant.now());
        loan.setStatus(LoanStatus.DRAFT);
        loan.getActions().add(new LoanAction(user, "CREATED", Instant.now()));
        return loanRepo.save(loan);
    }

    public Page<Loan> getAllLoans(Pageable page) {
        return loanRepo.findByDeletedFalse(page);
    }
    
    public Loan getLoan(String id) {
        return loanRepo.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
    }

    public Loan updateLoan(String id, Loan updated, String user) {
        Loan loan = getLoan(id);
        if (loan.getStatus() != LoanStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT loans can be edited.");
        }
        loan.setClientName(updated.getClientName());
        loan.setLoanType(updated.getLoanType());
        loan.setRequestedAmount(updated.getRequestedAmount());
        loan.setFinancials(updated.getFinancials()); // Update financials
        loan.getActions().add(new LoanAction(user, "UPDATED", Instant.now()));
        return loanRepo.save(loan);
    }

    public Loan submit(String id, String user) {
        Loan loan = getLoan(id);
        loan.setStatus(LoanStatus.SUBMITTED);
        loan.getActions().add(new LoanAction(user, "SUBMITTED", Instant.now()));
        return loanRepo.save(loan);
    }

    public Loan approve(String id, String admin, Double amount, Double rate, boolean approved) {
        Loan loan = getLoan(id);
        if (approved) {
            loan.setStatus(LoanStatus.APPROVED);
            loan.setSanctionedAmount(amount);
            loan.setApprovedInterestRate(rate);
            loan.setApprovedBy(admin);
            loan.setApprovedAt(Instant.now());
            loan.getActions().add(new LoanAction(admin, "APPROVED", Instant.now()));
        } else {
            loan.setStatus(LoanStatus.REJECTED);
            loan.setApprovedBy(admin);
            loan.getActions().add(new LoanAction(admin, "REJECTED", Instant.now()));
        }
        return loanRepo.save(loan);
    }

    public void softDelete(String id, String admin) {
        Loan loan = getLoan(id);
        loan.setDeleted(true);
        loan.getActions().add(new LoanAction(admin, "DELETED", Instant.now()));
        loanRepo.save(loan);
    }
}
