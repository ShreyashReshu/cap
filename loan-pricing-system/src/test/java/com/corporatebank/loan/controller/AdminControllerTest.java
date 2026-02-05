package com.corporatebank.loan.controller;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.model.enums.LoanStatus;
import com.corporatebank.loan.model.enums.LoanType;
import com.corporatebank.loan.service.LoanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private LoanService loanService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AdminController adminController;

    private Loan testLoan;

    @BeforeEach
    void setUp() {
        testLoan = new Loan();
        testLoan.setId("loan123");
        testLoan.setClientName("Test Corp");
        testLoan.setLoanType(LoanType.TERM_LOAN);
        testLoan.setStatus(LoanStatus.SUBMITTED);

        when(authentication.getName()).thenReturn("admin@bank.com");
    }

    @Test
    void testDecision_Approve() {
        // Arrange
        testLoan.setStatus(LoanStatus.APPROVED);
        testLoan.setSanctionedAmount(1000000.0);
        testLoan.setApprovedInterestRate(7.5);
        
        when(loanService.approve("loan123", "admin@bank.com", 1000000.0, 7.5, true))
                .thenReturn(testLoan);

        // Act
        Loan result = adminController.decision("loan123", true, 1000000.0, 7.5, authentication);

        // Assert
        assertNotNull(result);
        assertEquals(LoanStatus.APPROVED, result.getStatus());
        assertEquals(1000000.0, result.getSanctionedAmount());
        assertEquals(7.5, result.getApprovedInterestRate());
        verify(loanService, times(1)).approve("loan123", "admin@bank.com", 1000000.0, 7.5, true);
    }

    @Test
    void testDecision_Reject() {
        // Arrange
        testLoan.setStatus(LoanStatus.REJECTED);
        when(loanService.approve("loan123", "admin@bank.com", null, null, false))
                .thenReturn(testLoan);

        // Act
        Loan result = adminController.decision("loan123", false, null, null, authentication);

        // Assert
        assertNotNull(result);
        assertEquals(LoanStatus.REJECTED, result.getStatus());
        verify(loanService, times(1)).approve("loan123", "admin@bank.com", null, null, false);
    }

    @Test
    void testDelete_Success() {
        // Arrange
        doNothing().when(loanService).softDelete("loan123", "admin@bank.com");

        // Act
        adminController.delete("loan123", authentication);

        // Assert
        verify(loanService, times(1)).softDelete("loan123", "admin@bank.com");
    }
}
