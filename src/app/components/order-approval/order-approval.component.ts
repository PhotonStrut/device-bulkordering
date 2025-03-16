import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, SubmittedOrder } from '../../services/order.service';
import { animate, style, transition, trigger, state } from '@angular/animations';

@Component({
  selector: 'app-order-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './order-approval.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    trigger('actionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ])
  ]
})
export class OrderApprovalComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);
  
  isLoading = signal(true);
  hasError = signal(false);
  
  // Order data
  orderId = signal<string | null>(null);
  order = signal<SubmittedOrder | null>(null);
  
  // Approval state
  approvalNotes = signal<string>('');
  processingAction = signal(false);
  showRejectionForm = signal(false);
  actionSuccess = signal<boolean | null>(null);
  actionError = signal<string | null>(null);
  
  // Rejection form
  rejectionForm: FormGroup;
  
  // Computed properties
  selectedOrder = computed(() => this.order());
  selectedOrderId = computed(() => this.orderId());
  
  totalItems = computed(() => {
    return this.order()?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  });
  
  departments = computed(() => {
    // Get unique departments from orders
    const deptSet = new Set<string>();
    this.pendingOrders().forEach(order => {
      if (order.recipientName) {
        deptSet.add('IT Department'); // Default department for example
      }
    });
    return Array.from(deptSet);
  });
  
  departmentFilter = signal<string | null>(null);
  
  constructor() {
    // Initialize rejection form
    this.rejectionForm = this.fb.group({
      reason: ['', Validators.required],
      notes: ['']
    });
  }
  
  ngOnInit() {
    // Get order ID from route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.orderId.set(params['id']);
        this.loadOrderDetails();
      } else {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
  
  loadOrderDetails() {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    setTimeout(() => {
      try {
        const id = this.orderId();
        if (!id) {
          throw new Error('No order ID provided');
        }
        
        const orderData = this.orderService.getOrderById(id);
        
        if (!orderData) {
          throw new Error('Order not found');
        }
        
        this.order.set(orderData);
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error loading order details', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  approveOrder() {
    if (!this.order()) return;
    
    this.processingAction.set(true);
    this.actionSuccess.set(null);
    this.actionError.set(null);
    
    // Simulate API call to approve order
    setTimeout(() => {
      try {
        const orderData = this.order();
        if (!orderData) {
          throw new Error('No order data available');
        }
        
        // Update order status to approved
        const updatedOrder: SubmittedOrder = {
          ...orderData,
          status: 'Approved'
        };
        
        // Update the order in the service
        // In a real app, this would happen via API
        this.order.set(updatedOrder);
        this.actionSuccess.set(true);
        this.processingAction.set(false);
      } catch (error) {
        console.error('Error approving order', error);
        this.actionError.set('There was an error when trying to approve this order. Please try again.');
        this.actionSuccess.set(false);
        this.processingAction.set(false);
      }
    }, 1500);
  }
  
  toggleRejectionForm() {
    this.showRejectionForm.update(show => !show);
  }
  
  rejectOrder() {
    if (!this.rejectionForm.valid || !this.order()) return;
    
    this.processingAction.set(true);
    this.actionSuccess.set(null);
    this.actionError.set(null);
    
    // Simulate API call to reject order
    setTimeout(() => {
      try {
        const orderData = this.order();
        const formValue = this.rejectionForm.value;
        
        if (!orderData) {
          throw new Error('No order data available');
        }
        
        // Update order status to rejected
        const updatedOrder: SubmittedOrder = {
          ...orderData,
          status: 'Rejected',
          rejectionReason: formValue.reason,
          rejectionNotes: formValue.notes
        };
        
        // Update the order in the service
        // In a real app, this would happen via API
        this.order.set(updatedOrder);
        this.actionSuccess.set(true);
        this.processingAction.set(false);
        this.showRejectionForm.set(false);
      } catch (error) {
        console.error('Error rejecting order', error);
        this.actionError.set('There was an error when trying to reject this order. Please try again.');
        this.actionSuccess.set(false);
        this.processingAction.set(false);
      }
    }, 1500);
  }
  
  backToPendingOrders() {
    this.router.navigate(['/dashboard']);
  }
  
  filterByDepartment(dept: string | null): void {
    this.departmentFilter.set(dept);
  }
  
  viewOrderDetails(orderId: string): void {
    this.orderId.set(orderId);
    this.loadOrderDetails();
  }
  
  // Helper method to format date
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Helper method for consistent status color classes
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

  // Add a helper method to check order department
  private orderMatchesDepartment(order: SubmittedOrder, department: string | null): boolean {
    if (!department) return true;
    return order.department === department;
  }

  // Update the computed pendingOrders
  pendingOrders = computed(() => {
    // Filter for pending orders
    return this.orderService.getOrderHistory().filter(order => 
      order.status === 'Pending Approval' &&
      this.orderMatchesDepartment(order, this.departmentFilter())
    );
  });

  // Add helper methods to replace arrow functions in templates
  getOrderItemsCount(order: SubmittedOrder | null): number {
    if (!order || !order.items) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }
  
  getSelectedOrderItemsCount(): number {
    return this.getOrderItemsCount(this.order());
  }
  
  // Update the getOrderStatus method to be more robust
  getOrderStatus(order: SubmittedOrder | null): string {
    if (!order || !order.status) return '';
    return order.status.toLowerCase();
  }

  // Fix any issues with displaying model name from items
  getModelName(order: SubmittedOrder | null): string {
    if (!order || !order.items || order.items.length === 0) return 'Unknown';
    return order.items[0]?.model?.name || 'Unknown';
  }

  // Add helper methods for avatar display
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
