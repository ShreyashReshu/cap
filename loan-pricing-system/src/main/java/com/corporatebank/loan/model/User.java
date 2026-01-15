package com.corporatebank.loan.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.corporatebank.loan.model.enums.Role;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Document("users")
@Data
public class User {

    @Id
    private String id;

    @Email
    private String email;

    private String password;

    private Role role;

    private boolean active = true;

    private Instant createdAt = Instant.now();
}

