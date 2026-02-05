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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanControllerTest {

    @Mock
    private LoanService loanService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private LoanController loanController;

    private Loan testLoan;

    @BeforeEach
    void setUp() {
        testLoan = new Loan();
        testLoan.setId("loan123");
        testLoan.setClientName("Test Corp");
        testLoan.setLoanType(LoanType.TERM_LOAN);
        testLoan.setRequestedAmount(1000000.0);
        testLoan.setStatus(LoanStatus.DRAFT);
        testLoan.setCreatedBy("user@bank.com");

        when(authentication.getName()).thenReturn("user@bank.com");
    }

    @Test
    void testCreate_Success() {
        // Arrange
        when(loanService.createLoan(any(Loan.class), anyString())).thenReturn(testLoan);

        // Act
        Loan result = loanController.create(testLoan, authentication);

        // Assert
        assertNotNull(result);
        assertEquals("loan123", result.getId());
        verify(loanService, times(1)).createLoan(testLoan, "user@bank.com");
    }

    @Test
    void testList_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<Loan> loans = new ArrayList<>();
        loans.add(testLoan);
        Page<Loan> loanPage = new PageImpl<>(loans, pageable, 1);
        
        when(loanService.getAllLoans(pageable)).thenReturn(loanPage);

        // Act
        Page<Loan> result = loanController.list(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(loanService, times(1)).getAllLoans(pageable);
    }

    @Test
    void testGetOne_Success() {
        // Arrange
        when(loanService.getLoan("loan123")).thenReturn(testLoan);

        // Act
        Loan result = loanController.getOne("loan123");

        // Assert
        assertNotNull(result);
        assertEquals("loan123", result.getId());
        verify(loanService, times(1)).getLoan("loan123");
    }

    @Test
    void testUpdate_Success() {
        // Arrange
        Loan updatedLoan = new Loan();
        updatedLoan.setClientName("Updated Corp");
        updatedLoan.setLoanType(LoanType.WORKING_CAPITAL);
        
        when(loanService.updateLoan("loan123", updatedLoan, "user@bank.com")).thenReturn(testLoan);

        // Act
        Loan result = loanController.update("loan123", updatedLoan, authentication);

        // Assert
        assertNotNull(result);
        verify(loanService, times(1)).updateLoan("loan123", updatedLoan, "user@bank.com");
    }

    @Test
    void testSubmit_Success() {
        // Arrange
        testLoan.setStatus(LoanStatus.SUBMITTED);
        when(loanService.submit("loan123", "user@bank.com")).thenReturn(testLoan);

        // Act
        Loan result = loanController.submit("loan123", authentication);

        // Assert
        assertNotNull(result);
        assertEquals(LoanStatus.SUBMITTED, result.getStatus());
        verify(loanService, times(1)).submit("loan123", "user@bank.com");
    }
}
