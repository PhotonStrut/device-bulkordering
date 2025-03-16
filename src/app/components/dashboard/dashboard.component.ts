import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { OrderService, SubmittedOrder } from '../../services/order.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('countAnimation', [
      transition(':increment', [
        style({ color: '#4ade80', transform: 'scale(1.2)' }),
        animate('300ms ease-out', style({ color: 'inherit', transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  isLoading = signal(true);
  hasError = signal(false);
  
  // Recent orders - limit to last 5
  recentOrders = signal<SubmittedOrder[]>([]);
  
  // Counts for dashboard stats
  pendingCount = signal<number>(0);
  approvedCount = signal<number>(0);
  processingCount = signal<number>(0);
  shippedCount = signal<number>(0);
  
  ngOnInit() {
    // Simulate loading state
    setTimeout(() => {
      try {
        this.loadDashboardData();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error loading dashboard data', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  loadDashboardData() {
    const orderHistory = this.orderService.getOrderHistory();
    
    this.recentOrders.set(orderHistory.slice(0, 5));
    this.pendingCount.set(orderHistory.filter(o => o.status === 'Pending Approval').length);
    this.approvedCount.set(orderHistory.filter(o => o.status === 'Approved').length);
    this.processingCount.set(orderHistory.filter(o => o.status === 'Processing').length);
    this.shippedCount.set(orderHistory.filter(o => o.status === 'Shipped').length);
  }
  
  refreshDashboard() {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    setTimeout(() => {
      try {
        this.loadDashboardData();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error refreshing dashboard data', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  // Navigate to different sections
  startNewOrder() {
    this.router.navigate(['/device-selection']);
  }
  
  viewAllOrders() {
    this.router.navigate(['/history']);
  }
  
  viewOrderDetails(orderId: string) {
    // Navigate to order details or expand in place
    this.router.navigate(['/history'], { queryParams: { orderId } });
  }
}
