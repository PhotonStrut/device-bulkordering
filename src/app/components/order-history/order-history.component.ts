import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService, SubmittedOrder } from '../../services/order.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ])
  ]
})
export class OrderHistoryComponent {
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  // Orders
  orders = signal<SubmittedOrder[]>(this.orderService.getOrderHistory());
  selectedOrderId = signal<string | null>(null);
  selectedOrder = computed(() => {
    const id = this.selectedOrderId();
    if (!id) return null;
    return this.orders().find(order => order.orderId === id) || null;
  });
  
  // Status filters
  statusFilter = signal<string | null>(null);
  filteredOrders = computed(() => {
    const status = this.statusFilter();
    if (!status) return this.orders();
    return this.orders().filter(order => order.status === status);
  });
  
  // Select an order to view details
  selectOrder(orderId: string): void {
    this.selectedOrderId.set(orderId);
  }
  
  // Apply a status filter
  applyStatusFilter(status: string | null): void {
    this.statusFilter.set(status);
  }
  
  // Start a new order
  startNewOrder(): void {
    this.router.navigate(['/device-selection']);
  }
  
  // Format date as relative time (e.g., "2 days ago")
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  // Get CSS classes for status badges
  getStatusClasses(status: string): string {
    switch (status) {
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      case 'Delivered':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
