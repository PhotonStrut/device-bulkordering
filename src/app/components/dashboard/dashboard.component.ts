import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService, SubmittedOrder } from '../../services/order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  // Recent orders - limit to last 5
  recentOrders = signal<SubmittedOrder[]>(
    this.orderService.getOrderHistory().slice(0, 5)
  );
  
  // Counts for dashboard stats
  pendingCount = signal<number>(
    this.orderService.getOrderHistory().filter(o => o.status === 'Pending Approval').length
  );
  
  approvedCount = signal<number>(
    this.orderService.getOrderHistory().filter(o => o.status === 'Approved').length
  );
  
  processingCount = signal<number>(
    this.orderService.getOrderHistory().filter(o => o.status === 'Processing').length
  );
  
  shippedCount = signal<number>(
    this.orderService.getOrderHistory().filter(o => o.status === 'Shipped').length
  );
  
  // Navigate to different sections
  startNewOrder(): void {
    this.router.navigate(['/device-selection']);
  }
  
  viewOrderHistory(): void {
    this.router.navigate(['/history']);
  }
  
  viewPendingApprovals(): void {
    this.router.navigate(['/approval']);
  }
  
  // Get status badge classes
  getStatusClasses(status: string): string {
    switch (status) {
      case 'Pending Approval': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
