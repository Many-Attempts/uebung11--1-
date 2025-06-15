import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';

interface Message {
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: number;
  isMe?: boolean;
}

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit {
  private apiUrl = "http://webp-ilv-backend.cs.technikum-wien.at/messenger/";
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // State signals updates when changed automaticly
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly messages = signal<Message[]>([]);
  
  // Component properties
  conversationId = '';
  receiverId = '';
  receiverName = '';
  newMessage = '';
  
  // FIXED: Removed empty constructor
  
  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // listener that will run the code inside whenever the URL parameters change
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.receiverId = idParam;
        this.loadConversation();
      } else {
        this.errorMessage.set('No conversation ID provided');
        this.isLoading.set(false);
      }
    });
  }

  loadConversation(): void {
    const { id: currentUserId, token } = this.authService.loginStatus();
    
    if (!token || !currentUserId) {
      this.errorMessage.set('Authentication required');
      this.isLoading.set(false);
      return;
    }
    
    // Set loading state
    this.isLoading.set(true);
    
    // Construct URL for GET request
    const url = new URL(`${this.apiUrl}get_conversation.php`);
    url.searchParams.append('token', token);
    url.searchParams.append('user1_id', currentUserId);
    url.searchParams.append('user2_id', this.receiverId);
    
    fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Conversation data:', data);
        
        if (Array.isArray(data)) {
          // Transform message array to add an 'isMe' flag indicating messages sent by current user (... spreader)
          const processedMessages = data.map(msg => ({
            ...msg,
            isMe: msg.sender_id === currentUserId
          }));
          
          this.messages.set(processedMessages);
          
          this.receiverName = 'User ' + this.receiverId;
          
        } else if (data && data.error) {
          throw new Error(data.error);
        } else {
          this.messages.set([]);
        }
        
        this.isLoading.set(false);
        this.scrollToBottom();
      })
      .catch(error => {
        console.error('Error loading conversation:', error);
        this.errorMessage.set(`Failed to load conversation: ${error.message}`);
        this.isLoading.set(false);
      });
  }
  
  /**
   * Send a new message via API
   */
  sendMessage(): void {
    if (this.newMessage.trim() === '') return;
    
    const { id: senderId, token } = this.authService.loginStatus();
    
    if (!token || !senderId) {
      this.errorMessage.set('Authentication required');
      return;
    }
    
    // Get current timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Create FormData for the request
    const formData = new FormData();
    formData.append('token', token);
    formData.append('sender_id', senderId);
    formData.append('receiver_id', this.receiverId);
    formData.append('message', this.newMessage);
    formData.append('timestamp', currentTimestamp.toString());
    
    fetch(`${this.apiUrl}send_message.php`, {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        console.log('Send message response:', data);
        
        if (data && data.success) {
          // Clear message input
          this.newMessage = '';
          
          // Load conversation to get the newly sent message
          this.loadConversation();
        } else if (data && data.error) {
          this.errorMessage.set(`Failed to send message: ${data.error}`);
        } else {
          this.errorMessage.set('Failed to send message');
        }
      })
      .catch(error => {
        console.error('Error sending message:', error);
        this.errorMessage.set(`Failed to send message: ${error.message}`);
      });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = document.getElementById('messageContainer');
      // Force scroll to bottom of container
      if (container) container.scrollTop = container.scrollHeight;
    }, 0);
  }
}