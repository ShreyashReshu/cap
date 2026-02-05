package com.corporatebank.loan.service;

import com.corporatebank.loan.config.JwtUtil;
import com.corporatebank.loan.dto.LoginRequest;
import com.corporatebank.loan.dto.LoginResponse;
import com.corporatebank.loan.model.User;
import com.corporatebank.loan.model.enums.Role;
import com.corporatebank.loan.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user123");
        testUser.setEmail("user@bank.com");
        testUser.setPassword("$2a$10$hashedPassword");
        testUser.setRole(Role.USER);
        testUser.setActive(true);

        loginRequest = new LoginRequest();
        loginRequest.setEmail("user@bank.com");
        loginRequest.setPassword("password123");
    }

    @Test
    void testLogin_Success() {
        // Arrange
        when(userRepository.findByEmail("user@bank.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPassword")).thenReturn(true);
        when(jwtUtil.generateToken("user@bank.com", "USER")).thenReturn("jwt-token-123");

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals("USER", response.getRole());
        verify(userRepository, times(1)).findByEmail("user@bank.com");
        verify(passwordEncoder, times(1)).matches("password123", "$2a$10$hashedPassword");
        verify(jwtUtil, times(1)).generateToken("user@bank.com", "USER");
    }

    @Test
    void testLogin_UserNotFound() {
        // Arrange
        when(userRepository.findByEmail("user@bank.com")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("User not found", exception.getMessage());
        verify(userRepository, times(1)).findByEmail("user@bank.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void testLogin_InvalidPassword() {
        // Arrange
        when(userRepository.findByEmail("user@bank.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", "$2a$10$hashedPassword")).thenReturn(false);

        loginRequest.setPassword("wrongpassword");

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("Invalid credentials", exception.getMessage());
        verify(userRepository, times(1)).findByEmail("user@bank.com");
        verify(passwordEncoder, times(1)).matches("wrongpassword", "$2a$10$hashedPassword");
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    @Test
    void testRegister_Success() {
        // Arrange
        when(userRepository.findByEmail("newuser@bank.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("new-user-id");
            return user;
        });

        // Act
        User registered = authService.register("newuser@bank.com", "password123", "USER");

        // Assert
        assertNotNull(registered);
        assertEquals("newuser@bank.com", registered.getEmail());
        assertEquals(Role.USER, registered.getRole());
        verify(userRepository, times(1)).findByEmail("newuser@bank.com");
        verify(passwordEncoder, times(1)).encode("password123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        // Arrange
        when(userRepository.findByEmail("existing@bank.com")).thenReturn(Optional.of(testUser));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.register("existing@bank.com", "password123", "USER");
        });

        assertEquals("Email already exists", exception.getMessage());
        verify(userRepository, times(1)).findByEmail("existing@bank.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegister_AdminRole() {
        // Arrange
        when(userRepository.findByEmail("admin@bank.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("admin123")).thenReturn("$2a$10$encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("admin-id");
            return user;
        });

        // Act
        User registered = authService.register("admin@bank.com", "admin123", "ADMIN");

        // Assert
        assertNotNull(registered);
        assertEquals("admin@bank.com", registered.getEmail());
        assertEquals(Role.ADMIN, registered.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }
}
