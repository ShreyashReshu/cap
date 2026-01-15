package com.corporatebank.loan.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoanAction {

    private String by;
    private String action;
    private Instant timestamp;
}
