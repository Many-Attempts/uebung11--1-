import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../auth.service';

// User interface based on API response
interface User {
  id: string;
  name: string;
  group_id: string;
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.css']
})
export class MessageListComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiUrl = "http://webp-ilv-backend.cs.technikum-wien.at/messenger/";
  
  // Signals for state management
  readonly contacts = signal<User[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  
  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Load contacts when component initializes
    this.fetchContacts();
  }
  

  fetchContacts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const { id, token } = this.authService.loginStatus();
    
    if (!token || !id) {
      this.errorMessage.set('Authentication required. Please log in again.');
      this.isLoading.set(false);
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Fetching contacts with ID:', id, 'and token:', token);
    
    this.fetchWithGet(id, token);
  }
    

  private fetchWithGet(id: string, token: string): void {
    const url = new URL(`${this.apiUrl}get_users.php`);
    url.searchParams.append('token', token);
    url.searchParams.append('id', id);
    
    fetch(url.toString())
    .then(response => response.json())
    .then(data => this.handleApiResponse(data))
    .catch(error => {
      console.error('Error fetching contacts with GET:', error);
      this.handleApiError('Failed to load contacts. Please try again later.');
    });
  }
  

  private handleApiResponse(data: any): void {
    console.log('API Response:', data);
    
    // Check if there's an error in the response
    if (data && data.error) {
      this.handleApiError(`Authentication error: ${data.error}`);
      
      // If unauthorized, redirect to login
      if (data.error.includes('Unauthorized')) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
      return;
    }
    
    // Check if data is an array
    if (Array.isArray(data)) {
      this.contacts.set(data as User[]);
      this.isLoading.set(false);
    } else {
      this.handleApiError('Unexpected response format: expected an array of users');
    }
  }
  

  private handleApiError(message: string): void {
    this.errorMessage.set(message);
    this.isLoading.set(false);
    
    // Use mock data for testing if API fails
    this.contacts.set([
      { id: '1', name: 'Alice', group_id: '1' },
      { id: '2', name: 'Bob', group_id: '1' },
      { id: '3', name: 'Charlie', group_id: '2' },
      { id: '4', name: 'Diana', group_id: '2' }
    ]);
  }
}