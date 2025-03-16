import { Injectable } from '@angular/core';

export interface DeviceModel {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  specs: string[];
  price: number;
  availability: 'In Stock' | 'Limited' | 'Out of Stock';
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  department: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  avatarUrl?: string;
  notes?: string;
}

export interface ShippingAddress {
  id?: string;
  name: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  contactPerson?: string;
  contactPhone?: string;
  specialInstructions?: string;
  buildingName?: string;
  floorNumber?: string;
  roomNumber?: string;
}

export interface DeviceItem {
  model: DeviceModel;
  quantity: number;
}

export interface OrderDetails {
  devices: DeviceItem[];
  recipients: Recipient[];
  shippingAddress?: ShippingAddress;
}

export interface SubmittedOrder {
  orderId: string;
  orderDate: Date;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Processing' | 'Shipped' | 'Delivered';
  items: DeviceItem[];
  recipientCount: number;
  recipientName?: string;
  shippingAddress?: ShippingAddress;
  estimatedDelivery?: Date;
  rejectionReason?: string;
  rejectionNotes?: string;
  department?: string;
  requesterName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private currentOrder: OrderDetails = {
    devices: [],
    recipients: []
  };
  
  private savedAddresses: ShippingAddress[] = [];
  private submittedOrders: SubmittedOrder[] = [];

  constructor() {
    this.initializeMockData();
  }

  initializeMockData() {
    // Initialize some mock addresses
    this.savedAddresses = [
      {
        id: 'addr1',
        name: 'Headquarters',
        street: '123 Corporate Way',
        city: 'Business City',
        state: 'CA',
        zipCode: '94101',
        country: 'United States',
        isDefault: true
      },
      {
        id: 'addr2',
        name: 'Branch Office',
        street: '456 Division Street',
        street2: 'Floor 3',
        city: 'Tech Valley',
        state: 'WA',
        zipCode: '98001',
        country: 'United States'
      }
    ];

    // Initialize some mock orders
    this.submittedOrders = [
      {
        orderId: 'ORD-2023-001',
        orderDate: new Date('2023-09-10'),
        status: 'Delivered',
        items: [
          {
            model: {
              id: 'l1',
              categoryId: 'laptop',
              name: 'Business Ultrabook X1',
              description: 'Lightweight business laptop with all-day battery life',
              imageUrl: 'assets/laptop1.jpg',
              specs: ['Intel Core i7', '16GB RAM', '512GB SSD'],
              price: 1299.99,
              availability: 'In Stock'
            },
            quantity: 5
          }
        ],
        recipientCount: 3,
        recipientName: 'IT Department',
        shippingAddress: this.savedAddresses[0],
        estimatedDelivery: new Date('2023-09-15')
      },
      {
        orderId: 'ORD-2023-002',
        orderDate: new Date('2023-09-15'),
        status: 'Pending Approval',
        items: [
          {
            model: {
              id: 't1',
              categoryId: 'tablet',
              name: 'iPad Pro 12.9"',
              description: 'Powerful tablet for productivity and creativity',
              imageUrl: 'assets/tablet1.jpg',
              specs: ['M1 Chip', '8GB RAM', '256GB Storage'],
              price: 1099.99,
              availability: 'In Stock'
            },
            quantity: 2
          }
        ],
        recipientCount: 1,
        recipientName: 'Sarah Davis',
        shippingAddress: this.savedAddresses[1],
        estimatedDelivery: new Date('2023-09-22')
      }
    ];
  }

  // Methods for current order
  getCurrentOrder(): OrderDetails {
    return { ...this.currentOrder };
  }

  setSelectedDevices(devices: DeviceItem[]): void {
    this.currentOrder.devices = [...devices];
  }

  setRecipients(recipients: Recipient[]): void {
    this.currentOrder.recipients = [...recipients];
  }

  setShippingAddress(address: ShippingAddress): void {
    this.currentOrder.shippingAddress = { ...address };
  }

  getSelectedDevices(): DeviceItem[] {
    return [...this.currentOrder.devices];
  }

  // Methods for saved addresses
  getSavedAddresses(): ShippingAddress[] {
    return [...this.savedAddresses];
  }

  addSavedAddress(address: ShippingAddress): void {
    this.savedAddresses.push({ ...address });
  }

  // Methods for submitted orders
  getOrderHistory(): SubmittedOrder[] {
    return [...this.submittedOrders];
  }

  getOrderById(id: string): SubmittedOrder | undefined {
    return this.submittedOrders.find(order => order.orderId === id);
  }

  submitOrder(orderDetails: OrderDetails): string {
    // Generate order ID
    const orderId = `ORD-${new Date().getFullYear()}-${(this.submittedOrders.length + 1).toString().padStart(3, '0')}`;
    
    // Get recipient count
    const recipientCount = orderDetails.recipients.length;
    
    // Convert devices to order items - preserving per-recipient quantity
    const deviceItems = orderDetails.devices.map(device => ({
      model: device.model,
      quantity: device.quantity
    }));
    
    // Create the department string from recipients if they're all from same department
    let department: string | undefined = undefined;
    if (orderDetails.recipients.length > 0) {
      const departments = new Set(orderDetails.recipients.map(r => r.department));
      if (departments.size === 1) {
        department = orderDetails.recipients[0].department;
      }
    }
    
    // Create submitted order
    const newOrder: SubmittedOrder = {
      orderId,
      orderDate: new Date(),
      status: 'Pending Approval',
      items: deviceItems,
      recipientCount: recipientCount,
      recipientName: orderDetails.recipients.length === 1 ? orderDetails.recipients[0].name : 'Multiple Recipients',
      shippingAddress: orderDetails.shippingAddress ? { ...orderDetails.shippingAddress } : undefined,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      department
    };
    
    // Add to submitted orders
    this.submittedOrders.push(newOrder);
    
    // Reset current order
    this.currentOrder = {
      devices: [],
      recipients: []
    };
    
    return orderId;
  }
}
