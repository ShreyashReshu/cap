package com.corporatebank.loan.controller;

import com.corporatebank.loan.dto.LoginRequest;
import com.corporatebank.loan.dto.LoginResponse;
import com.corporatebank.loan.model.User;
import com.corporatebank.loan.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private LoginRequest loginRequest;
    private LoginResponse loginResponse;
    private User user;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("user@bank.com");
        loginRequest.setPassword("password123");

        loginResponse = new LoginResponse("jwt-token-123", "USER");

        user = new User();
        user.setId("user123");
        user.setEmail("newuser@bank.com");
    }

    @Test
    void testLogin_Success() {
        // Arrange
        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        // Act
        LoginResponse response = authController.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals("USER", response.getRole());
        verify(authService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    void testRegister_Success() {
        // Arrange
        when(authService.register("newuser@bank.com", "password123", "USER")).thenReturn(user);

        // Act
        User result = authController.register(loginRequest, "USER");

        // Assert
        assertNotNull(result);
        assertEquals("newuser@bank.com", result.getEmail());
        verify(authService, times(1)).register("newuser@bank.com", "password123", "USER");
    }

    @Test
    void testRegister_AdminRole() {
        // Arrange
        user.setEmail("admin@bank.com");
        when(authService.register("admin@bank.com", "admin123", "ADMIN")).thenReturn(user);

        loginRequest.setEmail("admin@bank.com");
        loginRequest.setPassword("admin123");

        // Act
        User result = authController.register(loginRequest, "ADMIN");

        // Assert
        assertNotNull(result);
        assertEquals("admin@bank.com", result.getEmail());
        verify(authService, times(1)).register("admin@bank.com", "admin123", "ADMIN");
    }
}
