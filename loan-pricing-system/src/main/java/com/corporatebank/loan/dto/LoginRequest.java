package com.corporatebank.loan.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
