import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { OrderService, Recipient, ShippingAddress, SubmittedOrder } from '../../services/order.service';

interface OrderSummary {
  orderId: string;
  orderDate: Date;
  deviceType: string;
  modelName: string;
  quantity: number;
  department: string;
  requesterName: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Processing' | 'Shipped' | 'Delivered';
}

@Component({
  selector: 'app-order-approval',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-approval.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ])
  ]
})
export class OrderApprovalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  
  // State signals
  pendingOrders = signal<OrderSummary[]>([]);
  selectedOrderId = signal<string | null>(null);
  selectedOrder = signal<SubmittedOrder | null>(null);
  expandedSection = signal<string | null>(null);
  processingAction = signal<boolean>(false);
  showRejectionForm = signal<boolean>(false);
  
  // Form
  rejectionForm: FormGroup = this.fb.group({
    reason: ['']
  });
  
  // Filters
  departmentFilter = signal<string | null>(null);
  departments = signal<string[]>([]);
  
  ngOnInit(): void {
    // Initialize orders with some mock data for testing
    // This is needed to show some data in the approval dashboard
    this.orderService.initializeMockData();
    
    // Load orders data
    this.loadOrderData();
    
    console.log('Pending orders:', this.pendingOrders());
  }
  
  // Load orders data from service
  loadOrderData(): void {
    // Get orders from service
    const orders = this.orderService.getOrderHistory();
    console.log('Orders from service:', orders);
    
    // Transform to summary format
    const summaries: OrderSummary[] = orders.map(order => {
      const firstRecipient = order.recipients && order.recipients.length > 0 ? order.recipients[0] : null;
      
      return {
        orderId: order.orderId,
        orderDate: order.orderDate,
        deviceType: order.deviceType?.name || 'Unknown Device',
        modelName: order.model?.name || 'Unknown Model',
        quantity: order.quantity,
        department: firstRecipient?.department || 'Unknown', 
        requesterName: firstRecipient ? 
          `${firstRecipient.firstName || ''} ${firstRecipient.lastName || ''}`.trim() : 
          'Unknown Requester',
        status: order.status
      };
    });
    
    console.log('Transformed summaries:', summaries);
    
    // Filter to only show pending approval orders
    const pendingApprovalOrders = summaries.filter(order => order.status === 'Pending Approval');
    this.pendingOrders.set(pendingApprovalOrders);
    
    // Extract unique departments for filtering
    const depts = Array.from(new Set(pendingApprovalOrders.map(order => order.department)));
    this.departments.set(depts);
    
    console.log('Pending approval orders:', pendingApprovalOrders);
    console.log('Departments:', depts);
  }
  
  // View details of an order
  viewOrderDetails(orderId: string): void {
    this.selectedOrderId.set(orderId);
    
    // Get order from service
    const order = this.orderService.getOrderById(orderId);
    if (order) {
      this.selectedOrder.set(order);
    }
  }
  
  // Approve an order
  approveOrder(orderId: string): void {
    this.processingAction.set(true);
    
    setTimeout(() => {
      // In a real application, this would call a service method to update the order status
      // For now, we'll just update our local state
      
      // Update the selected order
      if (this.selectedOrder()) {
        const updatedOrder = {
          ...this.selectedOrder()!,
          status: 'Approved' as const
        };
        this.selectedOrder.set(updatedOrder);
      }
      
      // Update the order in the list
      const updatedOrders = this.pendingOrders().map(order => {
        if (order.orderId === orderId) {
          return { ...order, status: 'Approved' as const };
        }
        return order;
      });
      
      this.pendingOrders.set(updatedOrders);
      this.processingAction.set(false);
    }, 1000);
  }
  
  // Reject an order
  rejectOrder(orderId: string): void {
    this.processingAction.set(true);
    
    setTimeout(() => {
      // In a real application, this would call a service method with the rejection reason
      
      // Update the selected order
      if (this.selectedOrder()) {
        const updatedOrder = {
          ...this.selectedOrder()!,
          status: 'Rejected' as const
        };
        this.selectedOrder.set(updatedOrder);
      }
      
      // Update the order in the list
      const updatedOrders = this.pendingOrders().map(order => {
        if (order.orderId === orderId) {
          return { ...order, status: 'Rejected' as const };
        }
        return order;
      });
      
      this.pendingOrders.set(updatedOrders);
      this.processingAction.set(false);
      this.showRejectionForm.set(false);
    }, 1000);
  }
  
  // Toggle rejection form
  toggleRejectionForm(): void {
    this.showRejectionForm.update(val => !val);
  }
  
  // Filter orders by department
  filterByDepartment(department: string | null): void {
    this.departmentFilter.set(department);
  }
}
