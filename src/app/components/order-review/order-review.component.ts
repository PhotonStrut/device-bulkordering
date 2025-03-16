import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, state, sequence } from '@angular/animations';
import { OrderService } from '../../services/order.service';

// Import types from service
import type { OrderDetails as ServiceOrderDetails, SubmittedOrder as ServiceSubmittedOrder, ShippingAddress, Recipient } from '../../services/order.service';

@Component({
  selector: 'app-order-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-review.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('expandSection', [
      state('collapsed', style({ height: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    trigger('successAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        sequence([
          animate('400ms ease', style({ opacity: 1, transform: 'scale(1.05)' })),
          animate('200ms ease', style({ transform: 'scale(1)' }))
        ])
      ])
    ])
  ]
})
export class OrderReviewComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  // State signals
  orderDetails = signal<ServiceOrderDetails | null>(null);
  expandedSection = signal<string | null>(null);
  submitting = signal<boolean>(false);
  orderSubmitted = signal<boolean>(false);
  submittedOrder = signal<ServiceSubmittedOrder | null>(null);
  
  ngOnInit(): void {
    // Get current order from service
    const currentOrder = this.orderService.getCurrentOrder();
    
    // Verify we have complete order data
    if (!currentOrder.deviceType.id || 
        !currentOrder.model.id || 
        currentOrder.recipients.length === 0 || 
        !currentOrder.shippingAddress) {
      // If not, redirect to shipping
      this.router.navigate(['/shipping']);
      return;
    }
    
    this.orderDetails.set(currentOrder);
  }
  
  // Toggle section expansion
  toggleSection(section: string): void {
    if (this.expandedSection() === section) {
      this.expandedSection.set(null);
    } else {
      this.expandedSection.set(section);
    }
  }
  
  // Check if section is expanded
  isSectionExpanded(section: string): boolean {
    return this.expandedSection() === section;
  }
  
  // Go back to shipping page
  goBack(): void {
    this.router.navigate(['/shipping']);
  }
  
  // Submit the order
  submitOrder(): void {
    if (!this.orderDetails()) return;
    
    this.submitting.set(true);
    
    // Use the service to submit the order
    this.orderService.submitOrder(this.orderDetails()!)
      .then(submittedOrder => {
        this.submittedOrder.set(submittedOrder);
        this.submitting.set(false);
        this.orderSubmitted.set(true);
      })
      .catch(error => {
        // Handle error scenario
        console.error('Error submitting order:', error);
        this.submitting.set(false);
        // Could display error message to user here
      });
  }
  
  // Return to home/dashboard
  returnToDashboard(): void {
    this.router.navigate(['/']);
  }
  
  // View order details in order history
  viewOrderDetails(): void {
    // Navigate to order history with the order ID
    this.router.navigate(['/history']);
  }
  
  // Start a new order
  startNewOrder(): void {
    this.router.navigate(['/device-selection']);
  }
}
