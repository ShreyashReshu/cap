import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: ActivatedRoute;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isLoggedIn']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect if already logged in', () => {
    authService.isLoggedIn.and.returnValue(true);

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/loans']);
  });

  it('should set returnUrl from query params', () => {
    authService.isLoggedIn.and.returnValue(false);
    activatedRoute.snapshot.queryParams = { returnUrl: '/admin/dashboard' };

    component.ngOnInit();

    expect(component.returnUrl).toBe('/admin/dashboard');
  });

  it('should set default returnUrl if not provided', () => {
    authService.isLoggedIn.and.returnValue(false);
    activatedRoute.snapshot.queryParams = {};

    component.ngOnInit();

    expect(component.returnUrl).toBe('/loans');
  });

  it('should login successfully', () => {
    authService.isLoggedIn.and.returnValue(false);
    authService.login.and.returnValue(of({ token: 'test-token', role: 'USER' }));

    component.email = 'user@bank.com';
    component.password = 'password123';
    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@bank.com',
      password: 'password123'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/loans']);
    expect(component.loading).toBeFalse();
  });

  it('should handle login error', () => {
    authService.isLoggedIn.and.returnValue(false);
    authService.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    component.email = 'user@bank.com';
    component.password = 'wrong';
    component.submit();

    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBeFalse();
  });

  it('should show error if email is missing', () => {
    component.email = '';
    component.password = 'password123';
    component.submit();

    expect(component.error).toBe('Email and password are required');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should show error if password is missing', () => {
    component.email = 'user@bank.com';
    component.password = '';
    component.submit();

    expect(component.error).toBe('Email and password are required');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should fill user demo credentials', () => {
    component.fillUserDemo();

    expect(component.email).toBe('user@bank.com');
    expect(component.password).toBe('password123');
  });

  it('should fill admin demo credentials', () => {
    component.fillAdminDemo();

    expect(component.email).toBe('admin@bank.com');
    expect(component.password).toBe('password123');
  });
});
