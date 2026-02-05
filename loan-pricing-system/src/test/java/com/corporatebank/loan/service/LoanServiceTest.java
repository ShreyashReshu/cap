package com.corporatebank.loan.service;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.model.enums.LoanStatus;
import com.corporatebank.loan.model.enums.LoanType;
import com.corporatebank.loan.repository.LoanRepository;
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

import java.util.ArrayList;
import java.util.List;
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

    private Loan testLoan;

    @BeforeEach
    void setUp() {
        testLoan = new Loan();
        testLoan.setId("loan123");
        testLoan.setClientName("Test Corp");
        testLoan.setLoanType(LoanType.TERM_LOAN);
        testLoan.setRequestedAmount(1000000.0);
        testLoan.setProposedInterestRate(8.5);
        testLoan.setTenureMonths(36);
        testLoan.setStatus(LoanStatus.DRAFT);
        testLoan.setCreatedBy("user@bank.com");
        testLoan.setDeleted(false);
        
        Loan.Financials financials = new Loan.Financials();
        financials.setRevenue(5000000.0);
        financials.setEbitda(500000.0);
        financials.setRating("A");
        testLoan.setFinancials(financials);
    }

    @Test
    void testCreateLoan_Success() {
        // Arrange
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan created = loanService.createLoan(testLoan, "user@bank.com");

        // Assert
        assertNotNull(created);
        assertEquals(LoanStatus.DRAFT, created.getStatus());
        assertEquals("user@bank.com", created.getCreatedBy());
        assertNotNull(created.getCreatedAt());
        assertFalse(created.getActions().isEmpty());
        assertEquals("CREATED", created.getActions().get(0).getAction());
        verify(loanRepository, times(1)).save(any(Loan.class));
    }

    @Test
    void testGetAllLoans_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<Loan> loans = new ArrayList<>();
        loans.add(testLoan);
        Page<Loan> loanPage = new PageImpl<>(loans, pageable, 1);
        
        when(loanRepository.findByDeletedFalse(pageable)).thenReturn(loanPage);

        // Act
        Page<Loan> result = loanService.getAllLoans(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        verify(loanRepository, times(1)).findByDeletedFalse(pageable);
    }

    @Test
    void testGetLoan_Success() {
        // Arrange
        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));

        // Act
        Loan result = loanService.getLoan("loan123");

        // Assert
        assertNotNull(result);
        assertEquals("loan123", result.getId());
        assertEquals("Test Corp", result.getClientName());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
    }

    @Test
    void testGetLoan_NotFound() {
        // Arrange
        when(loanRepository.findByIdAndDeletedFalse("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loanService.getLoan("nonexistent");
        });

        assertEquals("Loan not found", exception.getMessage());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("nonexistent");
    }

    @Test
    void testUpdateLoan_Success() {
        // Arrange
        testLoan.setStatus(LoanStatus.DRAFT);
        Loan updatedLoan = new Loan();
        updatedLoan.setClientName("Updated Corp");
        updatedLoan.setLoanType(LoanType.WORKING_CAPITAL);
        updatedLoan.setRequestedAmount(2000000.0);
        
        Loan.Financials newFinancials = new Loan.Financials();
        newFinancials.setRevenue(10000000.0);
        newFinancials.setEbitda(1000000.0);
        newFinancials.setRating("B");
        updatedLoan.setFinancials(newFinancials);

        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan result = loanService.updateLoan("loan123", updatedLoan, "user@bank.com");

        // Assert
        assertNotNull(result);
        assertEquals("Updated Corp", result.getClientName());
        assertEquals(LoanType.WORKING_CAPITAL, result.getLoanType());
        assertEquals(2000000.0, result.getRequestedAmount());
        assertNotNull(result.getFinancials());
        assertEquals("B", result.getFinancials().getRating());
        assertFalse(result.getActions().isEmpty());
        assertEquals("UPDATED", result.getActions().get(result.getActions().size() - 1).getAction());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
        verify(loanRepository, times(1)).save(any(Loan.class));
    }

    @Test
    void testUpdateLoan_NotDraftStatus() {
        // Arrange
        testLoan.setStatus(LoanStatus.SUBMITTED);
        Loan updatedLoan = new Loan();
        updatedLoan.setClientName("Updated Corp");

        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loanService.updateLoan("loan123", updatedLoan, "user@bank.com");
        });

        assertEquals("Only DRAFT loans can be edited.", exception.getMessage());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
        verify(loanRepository, never()).save(any(Loan.class));
    }

    @Test
    void testSubmit_Success() {
        // Arrange
        testLoan.setStatus(LoanStatus.DRAFT);
        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan result = loanService.submit("loan123", "user@bank.com");

        // Assert
        assertNotNull(result);
        assertEquals(LoanStatus.SUBMITTED, result.getStatus());
        assertFalse(result.getActions().isEmpty());
        assertEquals("SUBMITTED", result.getActions().get(result.getActions().size() - 1).getAction());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
        verify(loanRepository, times(1)).save(any(Loan.class));
    }

    @Test
    void testApprove_Success() {
        // Arrange
        testLoan.setStatus(LoanStatus.SUBMITTED);
        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan result = loanService.approve("loan123", "admin@bank.com", 1000000.0, 7.5, true);

        // Assert
        assertNotNull(result);
        assertEquals(LoanStatus.APPROVED, result.getStatus());
        assertEquals(1000000.0, result.getSanctionedAmount());
        assertEquals(7.5, result.getApprovedInterestRate());
        assertEquals("admin@bank.com", result.getApprovedBy());
        assertNotNull(result.getApprovedAt());
        assertFalse(result.getActions().isEmpty());
        assertEquals("APPROVED", result.getActions().get(result.getActions().size() - 1).getAction());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
        verify(loanRepository, times(1)).save(any(Loan.class));
    }

    @Test
    void testReject_Success() {
        // Arrange
        testLoan.setStatus(LoanStatus.SUBMITTED);
        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Loan result = loanService.approve("loan123", "admin@bank.com", null, null, false);

        // Assert
        assertNotNull(result);
        assertEquals(LoanStatus.REJECTED, result.getStatus());
        assertEquals("admin@bank.com", result.getApprovedBy());
        assertNull(result.getSanctionedAmount());
        assertNull(result.getApprovedInterestRate());
        assertFalse(result.getActions().isEmpty());
        assertEquals("REJECTED", result.getActions().get(result.getActions().size() - 1).getAction());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
        verify(loanRepository, times(1)).save(any(Loan.class));
    }

    @Test
    void testSoftDelete_Success() {
        // Arrange
        when(loanRepository.findByIdAndDeletedFalse("loan123")).thenReturn(Optional.of(testLoan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        loanService.softDelete("loan123", "admin@bank.com");

        // Assert
        assertTrue(testLoan.isDeleted());
        assertFalse(testLoan.getActions().isEmpty());
        assertEquals("DELETED", testLoan.getActions().get(testLoan.getActions().size() - 1).getAction());
        verify(loanRepository, times(1)).findByIdAndDeletedFalse("loan123");
        verify(loanRepository, times(1)).save(any(Loan.class));
    }
}
