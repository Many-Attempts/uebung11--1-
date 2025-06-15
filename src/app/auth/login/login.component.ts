import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  returnUrl: string = '/';

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  async onSubmit() {
    if (!this.username || !this.password) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      const success = await this.authService.login(this.username, this.password);
      
      if (success) {
        // Navigate to return url after successful login
        this.router.navigateByUrl(this.returnUrl);
      }
    } finally {
      this.isLoading = false;
    }
  }
}