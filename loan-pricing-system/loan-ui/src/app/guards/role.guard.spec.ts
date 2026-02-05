import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let guard: CanActivateFn;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    guard = roleGuard;
  });

  it('should allow access when user is admin', () => {
    authService.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => 
      guard({} as any, { url: '/admin/dashboard' } as any)
    );

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to loans when user is not admin', () => {
    authService.isAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => 
      guard({} as any, { url: '/admin/dashboard' } as any)
    );

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/loans']);
  });
});
