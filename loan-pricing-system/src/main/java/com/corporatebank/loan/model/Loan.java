package com.corporatebank.loan.model;

import com.corporatebank.loan.model.enums.LoanStatus;
import com.corporatebank.loan.model.enums.LoanType;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "loans")
@Data
public class Loan {
    @Id
    private String id;
    private String clientName;
    private LoanType loanType;
    private Double requestedAmount;
    private Integer tenureMonths;
    private Double proposedInterestRate;

    private Financials financials;

    private LoanStatus status = LoanStatus.DRAFT;

    // ADMIN ONLY FIELDS
    private Double sanctionedAmount;
    private Double approvedInterestRate;
    private String approvedBy;
    private Instant approvedAt;

    private String createdBy;
    private Instant createdAt = Instant.now();

    private boolean deleted = false;
    private List<LoanAction> actions = new ArrayList<>();

    @Data
    public static class Financials {
        private Double revenue;
        private Double ebitda;
        private String rating;
    }
}
