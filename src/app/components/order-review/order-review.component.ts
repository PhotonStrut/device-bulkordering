import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { animate, style, transition, trigger, state } from '@angular/animations';

@Component({
  selector: 'app-order-review',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-review.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('submissionAnimation', [
      state('submitting', style({
        transform: 'scale(0.95)',
        opacity: 0.8
      })),
      state('success', style({
        transform: 'scale(1)',
        opacity: 1
      })),
      state('error', style({
        transform: 'scale(1)',
        opacity: 1
      })),
      transition('* => submitting', animate('200ms ease-in')),
      transition('submitting => *', animate('300ms ease-out'))
    ])
  ]
})
export class OrderReviewComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  isLoading = signal(true);
  hasError = signal(false);
  
  // Order data
  orderDetails = signal<any>(null);
  
  // Submission state
  submissionState = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  submissionError = signal<string | null>(null);
  orderConfirmationId = signal<string | null>(null);
  
  ngOnInit() {
    // Load order details
    try {
      const orderData = this.orderService.getCurrentOrder();
      
      // Check if we have all required data
      if (!orderData.devices || orderData.devices.length === 0 || 
          !orderData.recipients || orderData.recipients.length === 0 ||
          !orderData.shippingAddress) {
        this.router.navigate(['/device-selection']);
        return;
      }
      
      this.orderDetails.set(orderData);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading order details', error);
      this.hasError.set(true);
      this.isLoading.set(false);
    }
  }
  
  // Add helper methods to handle template expressions
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  }
  
  // Calculate order totals
  getTotalDeviceCount(): number {
    // Calculate the total items based on device quantity and recipient count
    const devices = this.orderDetails()?.devices || [];
    const recipientCount = this.orderDetails()?.recipients?.length || 0;
    
    if (recipientCount === 0) return 0;
    
    // Sum all devices × their quantity × recipient count
    return devices.reduce((total: number, item: any) => total + (item.quantity * recipientCount), 0);
  }

  // Get the display quantity for a single item
  getItemDisplayQuantity(item: any): number {
    return item.quantity;
  }

  // Calculate total quantity for an item across all recipients
  getItemTotalQuantity(item: any): number {
    const recipientCount = this.orderDetails()?.recipients?.length || 0;
    return item.quantity * recipientCount;
  }

  // Calculate the total price for an item
  getItemPrice(item: any): string {
    const recipientCount = this.orderDetails()?.recipients?.length || 0;
    const totalQuantity = item.quantity * recipientCount;
    return (item.model.price * totalQuantity).toFixed(2);
  }

  // Calculate the subtotal for all items
  getOrderSubtotal(): string {
    const devices = this.orderDetails()?.devices || [];
    const recipientCount = this.orderDetails()?.recipients?.length || 0;
    
    const subtotal = devices.reduce((total: number, item: any) => {
      const itemTotal = item.model.price * item.quantity * recipientCount;
      return total + itemTotal;
    }, 0);
    
    return subtotal.toFixed(2);
  }
  
  // Navigation
  goBack() {
    this.router.navigate(['/shipping']);
  }
  
  // Order submission
  submitOrder() {
    this.submissionState.set('submitting');
    
    // Simulate API call
    setTimeout(() => {
      try {
        const confirmationId = this.orderService.submitOrder(this.orderDetails());
        this.orderConfirmationId.set(confirmationId);
        this.submissionState.set('success');
      } catch (error) {
        console.error('Error submitting order', error);
        this.submissionError.set('There was an error submitting your order. Please try again.');
        this.submissionState.set('error');
      }
    }, 1500);
  }
  
  isSubmitting(): boolean {
    return this.submissionState() === 'submitting';
  }
  
  continueToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
