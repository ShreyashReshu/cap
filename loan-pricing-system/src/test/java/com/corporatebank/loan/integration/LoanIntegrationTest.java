package com.corporatebank.loan.integration;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.model.LoanAction;
import com.corporatebank.loan.model.enums.LoanStatus;
import com.corporatebank.loan.model.enums.LoanType;
import com.corporatebank.loan.repository.LoanRepository;
import com.corporatebank.loan.service.LoanService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
class LoanIntegrationTest {

    @Container
    static final MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:6.0")
            .withReuse(true);

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        loanRepository.deleteAll();
    }

    @AfterAll
    static void tearDown() {
        if (mongoDBContainer != null && mongoDBContainer.isRunning()) {
            mongoDBContainer.stop();
        }
    }

    @Test
    void testCreateAndRetrieveLoan() {
        // Arrange
        Loan loan = new Loan();
        loan.setClientName("Integration Test Corp");
        loan.setLoanType(LoanType.TERM_LOAN);
        loan.setRequestedAmount(1000000.0);
        loan.setProposedInterestRate(8.5);
        loan.setTenureMonths(36);
        
        Loan.Financials financials = new Loan.Financials();
        financials.setRevenue(5000000.0);
        financials.setEbitda(500000.0);
        financials.setRating("A");
        loan.setFinancials(financials);

        // Act
        Loan created = loanService.createLoan(loan, "user@bank.com");

        // Assert
        assertNotNull(created.getId());
        assertEquals(LoanStatus.DRAFT, created.getStatus());
        assertEquals("user@bank.com", created.getCreatedBy());
        assertNotNull(created.getCreatedAt());
        assertFalse(created.getActions().isEmpty());

        // Verify retrieval
        Loan retrieved = loanService.getLoan(created.getId());
        assertNotNull(retrieved);
        assertEquals("Integration Test Corp", retrieved.getClientName());
    }

    @Test
    void testLoanWorkflow_DraftToSubmittedToApproved() {
        // Arrange
        Loan loan = new Loan();
        loan.setClientName("Workflow Test Corp");
        loan.setLoanType(LoanType.WORKING_CAPITAL);
        loan.setRequestedAmount(2000000.0);
        loan.setProposedInterestRate(9.0);
        loan.setTenureMonths(24);
        
        Loan.Financials financials = new Loan.Financials();
        financials.setRevenue(10000000.0);
        financials.setEbitda(1000000.0);
        financials.setRating("B");
        loan.setFinancials(financials);

        // Act - Create
        Loan created = loanService.createLoan(loan, "user@bank.com");
        assertEquals(LoanStatus.DRAFT, created.getStatus());

        // Act - Submit
        Loan submitted = loanService.submit(created.getId(), "user@bank.com");
        assertEquals(LoanStatus.SUBMITTED, submitted.getStatus());

        // Act - Approve
        Loan approved = loanService.approve(submitted.getId(), "admin@bank.com", 2000000.0, 8.5, true);
        assertEquals(LoanStatus.APPROVED, approved.getStatus());
        assertEquals(2000000.0, approved.getSanctionedAmount());
        assertEquals(8.5, approved.getApprovedInterestRate());
        assertEquals("admin@bank.com", approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());

        // Verify audit trail
        assertTrue(approved.getActions().size() >= 3);
        List<String> actions = approved.getActions().stream()
                .map(LoanAction::getAction)
                .toList();
        assertTrue(actions.contains("CREATED"));
        assertTrue(actions.contains("SUBMITTED"));
        assertTrue(actions.contains("APPROVED"));
    }

    @Test
    void testLoanWorkflow_DraftToSubmittedToRejected() {
        // Arrange
        Loan loan = new Loan();
        loan.setClientName("Rejection Test Corp");
        loan.setLoanType(LoanType.OVERDRAFT);
        loan.setRequestedAmount(500000.0);
        loan.setProposedInterestRate(10.0);
        loan.setTenureMonths(12);
        
        Loan.Financials financials = new Loan.Financials();
        financials.setRevenue(2000000.0);
        financials.setEbitda(200000.0);
        financials.setRating("C");
        loan.setFinancials(financials);

        // Act - Create and Submit
        Loan created = loanService.createLoan(loan, "user@bank.com");
        Loan submitted = loanService.submit(created.getId(), "user@bank.com");

        // Act - Reject
        Loan rejected = loanService.approve(submitted.getId(), "admin@bank.com", null, null, false);
        assertEquals(LoanStatus.REJECTED, rejected.getStatus());
        assertEquals("admin@bank.com", rejected.getApprovedBy());
        assertNull(rejected.getSanctionedAmount());
        assertNull(rejected.getApprovedInterestRate());

        // Verify audit trail
        assertTrue(rejected.getActions().stream()
                .anyMatch(action -> action.getAction().equals("REJECTED")));
    }

    @Test
    void testUpdateLoan_OnlyDraft() {
        // Arrange
        Loan loan = new Loan();
        loan.setClientName("Original Corp");
        loan.setLoanType(LoanType.TERM_LOAN);
        loan.setRequestedAmount(1000000.0);
        loan.setProposedInterestRate(8.5);
        loan.setTenureMonths(36);
        
        Loan.Financials financials = new Loan.Financials();
        financials.setRevenue(5000000.0);
        financials.setEbitda(500000.0);
        financials.setRating("A");
        loan.setFinancials(financials);

        Loan created = loanService.createLoan(loan, "user@bank.com");

        // Act - Update
        Loan updatedLoan = new Loan();
        updatedLoan.setClientName("Updated Corp");
        updatedLoan.setLoanType(LoanType.WORKING_CAPITAL);
        updatedLoan.setRequestedAmount(2000000.0);
        updatedLoan.setFinancials(financials);

        Loan updated = loanService.updateLoan(created.getId(), updatedLoan, "user@bank.com");

        // Assert
        assertEquals("Updated Corp", updated.getClientName());
        assertEquals(LoanType.WORKING_CAPITAL, updated.getLoanType());
        assertEquals(2000000.0, updated.getRequestedAmount());
    }

    @Test
    void testGetAllLoans_Pagination() {
        // Arrange - Create multiple loans
        for (int i = 0; i < 5; i++) {
            Loan loan = new Loan();
            loan.setClientName("Corp " + i);
            loan.setLoanType(LoanType.TERM_LOAN);
            loan.setRequestedAmount(1000000.0 * (i + 1));
            loan.setProposedInterestRate(8.5);
            loan.setTenureMonths(36);
            
            Loan.Financials financials = new Loan.Financials();
            financials.setRevenue(5000000.0);
            financials.setEbitda(500000.0);
            financials.setRating("A");
            loan.setFinancials(financials);

            loanService.createLoan(loan, "user@bank.com");
        }

        // Act
        Page<Loan> page = loanService.getAllLoans(PageRequest.of(0, 2));

        // Assert
        assertNotNull(page);
        assertTrue(page.getTotalElements() >= 5);
        assertEquals(2, page.getContent().size());
    }

    @Test
    void testSoftDelete() {
        // Arrange
        Loan loan = new Loan();
        loan.setClientName("Delete Test Corp");
        loan.setLoanType(LoanType.TERM_LOAN);
        loan.setRequestedAmount(1000000.0);
        loan.setProposedInterestRate(8.5);
        loan.setTenureMonths(36);
        
        Loan.Financials financials = new Loan.Financials();
        financials.setRevenue(5000000.0);
        financials.setEbitda(500000.0);
        financials.setRating("A");
        loan.setFinancials(financials);

        Loan created = loanService.createLoan(loan, "user@bank.com");

        // Act
        loanService.softDelete(created.getId(), "admin@bank.com");

        // Assert - Should not be found by normal query
        assertThrows(RuntimeException.class, () -> {
            loanService.getLoan(created.getId());
        });

        // Verify it's marked as deleted in repository
        Loan deletedLoan = loanRepository.findById(created.getId()).orElse(null);
        assertNotNull(deletedLoan);
        assertTrue(deletedLoan.isDeleted());
    }
}
