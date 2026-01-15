package com.corporatebank.loan.service;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.model.enums.LoanStatus;
import com.corporatebank.loan.model.enums.LoanType;
import com.corporatebank.loan.repository.LoanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @InjectMocks
    private LoanService loanService;

    @Test
    void testCreateLoan_Success() {
        // Arrange
        Loan loan = new Loan();
        loan.setClientName("Test Corp");
        loan.setLoanType(LoanType.TERM_LOAN);
        
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan created = loanService.createLoan(loan, "user@bank.com");

        // Assert
        assertEquals(LoanStatus.DRAFT, created.getStatus());
        assertEquals("user@bank.com", created.getCreatedBy());
        verify(loanRepository, times(1)).save(any(Loan.class));
    }

    @Test
    void testApproveLoan_Success() {
        // Arrange
        String loanId = "123";
        Loan loan = new Loan();
        loan.setId(loanId);
        loan.setStatus(LoanStatus.SUBMITTED); // Must be submitted to be approved

        when(loanRepository.findByIdAndDeletedFalse(loanId)).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan approved = loanService.approve(loanId, "admin@bank.com", 10000.0, 5.0, true);

        // Assert
        assertEquals(LoanStatus.APPROVED, approved.getStatus());
        assertEquals(10000.0, approved.getSanctionedAmount());
        assertEquals("admin@bank.com", approved.getApprovedBy());
    }
}