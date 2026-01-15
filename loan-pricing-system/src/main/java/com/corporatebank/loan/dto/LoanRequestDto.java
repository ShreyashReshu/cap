package com.corporatebank.loan.dto;

import com.corporatebank.loan.model.enums.LoanType;

import lombok.Data;

@Data
public class LoanRequestDto {
    private String clientName;
    private LoanType loanType;
    private Double requestedAmount;
    private Double proposedInterestRate;
    private Integer tenureMonths;
}
