import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService, SubmittedOrder } from '../../services/order.service';
import { trigger, transition, style, animate, state, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-history.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class OrderHistoryComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  
  // Loading and error states
  isLoading = signal(true);
  hasError = signal(false);
  
  // Orders
  allOrders = signal<SubmittedOrder[]>([]);
  orders = signal<SubmittedOrder[]>([]);
  selectedOrderId = signal<string | null>(null);
  
  // UI state
  expandedOrderId = signal<string | null>(null);
  
  // Filters
  statusFilter = signal<string | null>(null);
  dateFilter = signal<string | null>(null);
  searchQuery = signal<string>('');
  
  // Sort
  sortField = signal<string>('orderDate');
  sortDirection = signal<'asc' | 'desc'>('desc');
  
  // Pagination
  itemsPerPage = signal(10);
  currentPage = signal(1);
  
  // Computed properties
  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.itemsPerPage()));
  
  filteredOrders = computed(() => {
    let result = this.allOrders();
    
    // Apply status filter
    const status = this.statusFilter();
    if (status) {
      result = result.filter(order => order.status === status);
    }
    
    // Apply date filter
    const dateFilter = this.dateFilter();
    if (dateFilter) {
      const today = new Date();
      const startDate = new Date();
      
      if (dateFilter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (dateFilter === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      } else if (dateFilter === 'quarter') {
        startDate.setMonth(today.getMonth() - 3);
      }
      
      result = result.filter(order => new Date(order.orderDate) >= startDate);
    }
    
    // Apply search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(order => 
        order.orderId.toLowerCase().includes(query) || 
        order.status.toLowerCase().includes(query) ||
        (order.recipientName && order.recipientName.toLowerCase().includes(query))
      );
    }
    
    return result;
  });
  
  displayedOrders = computed(() => {
    const filtered = this.filteredOrders();
    const sorted = this.sortOrders(filtered);
    
    // Apply pagination
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return sorted.slice(startIndex, startIndex + this.itemsPerPage());
  });
  
  selectedOrder = computed(() => {
    const id = this.selectedOrderId();
    if (!id) return null;
    return this.allOrders().find(order => order.orderId === id) || null;
  });
  
  ngOnInit() {
    // Check if we should select a specific order from URL
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.selectedOrderId.set(params['orderId']);
        this.expandedOrderId.set(params['orderId']);
      }
    });
    
    // Simulate loading state
    setTimeout(() => {
      try {
        this.loadOrders();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error loading orders', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  loadOrders() {
    const orders = this.orderService.getOrderHistory();
    this.allOrders.set(orders);
    this.updateDisplayedOrders();
  }
  
  updateDisplayedOrders() {
    const filtered = this.filteredOrders();
    const sorted = this.sortOrders(filtered);
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    this.orders.set(sorted.slice(startIndex, startIndex + this.itemsPerPage()));
  }
  
  sortOrders(orders: SubmittedOrder[]): SubmittedOrder[] {
    const field = this.sortField();
    const direction = this.sortDirection();
    
    return [...orders].sort((a, b) => {
      let comparison = 0;
      
      if (field === 'orderDate') {
        comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      } else if (field === 'orderId') {
        comparison = a.orderId.localeCompare(b.orderId);
      } else if (field === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (field === 'items') {
        comparison = a.items.length - b.items.length;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  
  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }
  
  // Add the missing method
  applyStatusFilter(status: string | null) {
    this.statusFilter.set(status);
    this.applyFilter();
  }
  
  applyFilter() {
    this.currentPage.set(1);
    this.updateDisplayedOrders();
  }
  
  clearFilters() {
    this.statusFilter.set(null);
    this.dateFilter.set(null);
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.updateDisplayedOrders();
  }
  
  refreshOrders() {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    setTimeout(() => {
      try {
        this.loadOrders();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error refreshing orders', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  // Add the missing method
  selectOrder(orderId: string) {
    this.selectedOrderId.set(orderId);
    this.expandedOrderId.set(orderId);
  }
  
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.updateDisplayedOrders();
    }
  }
  
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.updateDisplayedOrders();
    }
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updateDisplayedOrders();
    }
  }
  
  toggleOrderExpansion(orderId: string) {
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }
  
  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrderId() === orderId;
  }
  
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  
  startNewOrder() {
    this.router.navigate(['/device-selection']);
  }
  
  // Format date as relative time (e.g., "2 days ago")
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
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
  
  // Added Math utility for template usage
  Math = Math;

  // Helper methods for template usage
  getOrderItemsCount(order: SubmittedOrder | null): number {
    if (!order || !order.items) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  getPaginationUpperBound(): number {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredOrders().length);
  }

  getPageArray(): number[] {
    return Array.from({length: this.totalPages()}, (_, i) => i + 1);
  }
  
  getSpecsString(order: SubmittedOrder | null): string {
    if (!order || !order.items || order.items.length === 0) return '';
    const model = order.items[0].model;
    if (!model || !model.specs) return '';
    
    // Fix the toString error by checking if specs is an array first
    if (Array.isArray(model.specs)) {
      return model.specs.join(', ');
    } else if (typeof model.specs === 'string') {
      return model.specs;
    } else {
      return String(model.specs); // Safe toString conversion for any type
    }
  }

  // Add additional helper methods to improve data display
  getFirstItemName(order: SubmittedOrder): string {
    if (!order.items || order.items.length === 0) {
      return 'No items';
    }
    
    const firstItem = order.items[0];
    if (!firstItem.model || !firstItem.model.name) {
      return 'Unknown item';
    }
    
    return firstItem.model.name;
  }

  formatSpecifications(specs: string[] | string | undefined): string {
    if (!specs) return 'N/A';
    
    if (Array.isArray(specs)) {
      return specs.join(', ');
    } else if (typeof specs === 'string') {
      return specs;
    } else {
      return String(specs);
    }
  }

  // Use this helper function consistently throughout the template
  formatShippingAddress(order: SubmittedOrder | null): string {
    if (!order || !order.shippingAddress) return 'No shipping address';
    
    const addr = order.shippingAddress;
    let formatted = addr.street || '';
    
    if (addr.street2) {
      formatted += ', ' + addr.street2;
    }
    
    if (addr.city || addr.state || addr.zipCode) {
      formatted += ', ' + [addr.city, addr.state, addr.zipCode].filter(Boolean).join(' ');
    }
    
    return formatted;
  }

  // Add these helper methods for avatar display
  getInitials(name: string): string {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getAvatarColorClass(name: string): string {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-gray-100 text-gray-800'
    ];
    
    // Use a simple hash function to consistently pick a color for a name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}
