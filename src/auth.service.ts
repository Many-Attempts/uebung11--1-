import { Injectable, signal, computed, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private _loginErrorMessage = signal<string | null>(null);
  public loginErrorMessage = this._loginErrorMessage.asReadonly();

  public isAuthenticated = computed(() => this.apiService.loginStatus().loggedIn);
  
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      this.checkSavedAuth();
    }
  }


  public loginStatus() {
    return this.apiService.loginStatus();
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      this._loginErrorMessage.set(null);
      await this.apiService.login(username, password);
      
      // If login succeeded, save to localStorage (only in browser)
      if (this.apiService.loginStatus().loggedIn && this.isBrowser) {
        this.saveAuthToLocalStorage();
        return true;
      } else if (this.apiService.loginStatus().loggedIn) {
        return true;
      } else {
        this._loginErrorMessage.set('Invalid username or password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      this._loginErrorMessage.set('An error occurred during login. Please try again.');
      return false;
    }
  }


  logout(): void {
    this.apiService.logout();
    
    if (this.isBrowser) {
      this.clearSavedAuth();
    }
    
    this.router.navigate(['/login']);
  }

  private saveAuthToLocalStorage(): void {
    if (!this.isBrowser) return;
    
    const { id, username, token } = this.apiService.loginStatus();
    localStorage.setItem('auth', JSON.stringify({ id, username, token }));
  }


  private clearSavedAuth(): void {
    if (!this.isBrowser) return;
    
    localStorage.removeItem('auth');
  }


  private checkSavedAuth(): void {
    if (!this.isBrowser) return;
    
    try {
      const savedAuth = localStorage.getItem('auth');
      if (savedAuth) {
        const { id, username, token } = JSON.parse(savedAuth);
        if (id && username && token) {
          this.apiService['_loginStatus'].set({
            loggedIn: true,
            loginError: false,
            id,
            username,
            token
          });
        }
      }
    } catch (error) {
      console.error('Error restoring auth from localStorage:', error);
      this.clearSavedAuth();
    }
  }
}