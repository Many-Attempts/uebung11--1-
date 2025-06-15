import { Injectable, inject } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router, 
  UrlTree 
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    // Redirect to login page with the return url
    return this.router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
  }
}