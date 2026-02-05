import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/loan.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse: AuthResponse = {
      token: 'jwt-token-123',
      role: 'USER'
    };

    service.login({ email: 'user@bank.com', password: 'password123' }).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('token')).toBe('jwt-token-123');
      expect(localStorage.getItem('role')).toBe('USER');
      expect(localStorage.getItem('email')).toBe('user@bank.com');
    });

    const req = httpMock.expectOne('http://localhost:9090/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle login error', () => {
    service.login({ email: 'user@bank.com', password: 'wrong' }).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://localhost:9090/api/auth/login');
    req.error(new ErrorEvent('Network error'), { status: 401 });
  });

  it('should check if user is logged in', () => {
    expect(service.isLoggedIn()).toBeFalse();
    
    localStorage.setItem('token', 'test-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should get user role', () => {
    expect(service.getRole()).toBeNull();
    
    localStorage.setItem('role', 'ADMIN');
    expect(service.getRole()).toBe('ADMIN');
  });

  it('should check if user is admin', () => {
    expect(service.isAdmin()).toBeFalse();
    
    localStorage.setItem('role', 'ADMIN');
    expect(service.isAdmin()).toBeTrue();
    
    localStorage.setItem('role', 'USER');
    expect(service.isAdmin()).toBeFalse();
  });

  it('should check if user is regular user', () => {
    expect(service.isUser()).toBeFalse();
    
    localStorage.setItem('role', 'USER');
    expect(service.isUser()).toBeTrue();
  });

  it('should get token', () => {
    expect(service.getToken()).toBeNull();
    
    localStorage.setItem('token', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should get user email', () => {
    expect(service.getEmail()).toBeNull();
    
    localStorage.setItem('email', 'user@bank.com');
    expect(service.getEmail()).toBe('user@bank.com');
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('role', 'USER');
    localStorage.setItem('email', 'user@bank.com');
    localStorage.setItem('userId', '123');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
  });

  it('should get current user', () => {
    service.user$.subscribe(user => {
      if (localStorage.getItem('token')) {
        expect(user).toBeTruthy();
      } else {
        expect(user).toBeNull();
      }
    });
  });
});
