package com.corporatebank.loan.service;

import com.corporatebank.loan.config.JwtUtil;
import com.corporatebank.loan.dto.LoginRequest;
import com.corporatebank.loan.dto.LoginResponse;
import com.corporatebank.loan.model.User;
import com.corporatebank.loan.model.enums.Role; // ✅ Import Role
import com.corporatebank.loan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder encoder;

    public LoginResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(req.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid credentials");

        return new LoginResponse(
                jwtUtil.generateToken(user.getEmail(), user.getRole().name()),
                user.getRole().name()
        );
    }

    // ✅ NEW REGISTER METHOD FOR POSTMAN
    public User register(String email, String password, String role) {
        if(userRepo.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setRole(Role.valueOf(role)); // "ADMIN" or "USER"
        return userRepo.save(user);
    }
}