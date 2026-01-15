package com.corporatebank.loan.dto;

import com.corporatebank.loan.model.enums.LoanStatus;

import lombok.Data;

@Data
public class StatusUpdateDto {
    private LoanStatus status;
}

