package com.corporatebank.loan.controller;

import com.corporatebank.loan.dto.LoginRequest;
import com.corporatebank.loan.dto.LoginResponse;
import com.corporatebank.loan.model.User;
import com.corporatebank.loan.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Allow Angular
public class AuthController {

    private final AuthService service;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        return service.login(req);
    }

    // ✅ NEW ENDPOINT FOR POSTMAN
    @PostMapping("/register")
    public User register(
            @RequestBody LoginRequest req,
            @RequestParam String role) {
        return service.register(req.getEmail(), req.getPassword(), role);
    }
}