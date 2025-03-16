import { Injectable, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

// Interfaces
export interface DeviceType {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  models: DeviceModel[];
}

export interface DeviceModel {
  id: string;
  name: string;
  specs: string;
  imageUrl: string;
}

export interface Recipient {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

export interface ShippingAddress {
  buildingName: string;
  floorNumber: string;
  roomNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  specialInstructions?: string;
  contactPerson: string;
  contactPhone: string;
}

export interface OrderDetails {
  deviceType: {
    id: string;
    name: string;
  };
  model: {
    id: string;
    name: string;
    specs: string;
  };
  quantity: number;
  recipients: Recipient[];
  shippingAddress?: ShippingAddress;
}

export interface SubmittedOrder extends Omit<OrderDetails, 'shippingAddress'> {
  orderId: string;
  orderDate: Date;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Processing' | 'Shipped' | 'Delivered';
  estimatedDelivery?: Date;
  shippingAddress: ShippingAddress; // Required for submitted orders
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Current order being built
  private currentOrder = signal<OrderDetails>({
    deviceType: { id: '', name: '' },
    model: { id: '', name: '', specs: '' },
    quantity: 0,
    recipients: []
  });

  // Submitted orders history
  private orderHistory = signal<SubmittedOrder[]>([]);
  
  // Expose computed and observables for components
  readonly currentOrderValue = computed(() => this.currentOrder());
  readonly currentOrder$ = toObservable(this.currentOrderValue);
  
  readonly orderHistory$ = toObservable(computed(() => this.orderHistory()));

  // Method to update the current order
  updateCurrentOrder(order: OrderDetails): void {
    // Create a deep copy to ensure we don't have reference issues
    const updatedOrder = JSON.parse(JSON.stringify(order));
    this.currentOrder.set(updatedOrder);
    console.log('Order updated:', updatedOrder); // Add logging for debugging
  }
  
  // Method to retrieve the current order
  getCurrentOrder(): OrderDetails {
    return this.currentOrder();
  }
  
  // Submit an order
  submitOrder(order: OrderDetails): Promise<SubmittedOrder> {
    return new Promise((resolve, reject) => {
      // Validate required fields
      if (!order.deviceType?.id || !order.model?.id || order.recipients.length === 0 || !order.shippingAddress) {
        reject(new Error('Missing required order information'));
        return;
      }
      
      setTimeout(() => {
        try {
          // Create the submitted order with all required fields
          const submittedOrder: SubmittedOrder = {
            ...order,
            // Explicitly cast to remove the 'undefined' possibility since we validated it above
            shippingAddress: order.shippingAddress as ShippingAddress,
            orderId: this.generateOrderId(),
            orderDate: new Date(),
            status: 'Pending Approval',
            estimatedDelivery: this.generateEstimatedDeliveryDate()
          };
          
          // Add to order history
          this.orderHistory.update(history => [...history, submittedOrder]);
          
          // Reset current order
          this.currentOrder.set({
            deviceType: { id: '', name: '' },
            model: { id: '', name: '', specs: '' },
            quantity: 0,
            recipients: []
          });
          
          resolve(submittedOrder);
        } catch (error) {
          reject(error);
        }
      }, 1500);
    });
  }
  
  // Get order history
  getOrderHistory(): SubmittedOrder[] {
    return this.orderHistory();
  }
  
  // Get a specific order by ID
  getOrderById(orderId: string): SubmittedOrder | undefined {
    return this.orderHistory().find(order => order.orderId === orderId);
  }

  // Generate a random order ID
  private generateOrderId(): string {
    const prefix = 'ORD';
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
  
  // Generate an estimated delivery date (2 weeks from now)
  private generateEstimatedDeliveryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  }

  // Get available device types
  getDeviceTypes(): DeviceType[] {
    return [
      {
        id: 'laptop',
        name: 'Laptops',
        description: 'Portable computing devices for work on the go',
        imageUrl: 'https://dummyimage.com/600x400/4a90e2/ffffff?text=Laptop',
        models: [
          { id: 'laptop-1', name: 'Business Ultrabook', specs: 'i7, 16GB RAM, 512GB SSD', imageUrl: 'https://dummyimage.com/600x400/4a90e2/ffffff?text=Ultrabook' },
          { id: 'laptop-2', name: 'Developer Powerhouse', specs: 'i9, 32GB RAM, 1TB SSD', imageUrl: 'https://dummyimage.com/600x400/2e5bac/ffffff?text=Dev+Laptop' },
          { id: 'laptop-3', name: 'Basic Notebook', specs: 'i5, 8GB RAM, 256GB SSD', imageUrl: 'https://dummyimage.com/600x400/6baae8/ffffff?text=Basic+Notebook' }
        ]
      },
      {
        id: 'desktop',
        name: 'Desktops',
        description: 'Powerful workstations for office use',
        imageUrl: 'https://dummyimage.com/600x400/27ae60/ffffff?text=Desktop',
        models: [
          { id: 'desktop-1', name: 'Standard Workstation', specs: 'i5, 16GB RAM, 512GB SSD', imageUrl: 'https://dummyimage.com/600x400/27ae60/ffffff?text=Workstation' },
          { id: 'desktop-2', name: 'Performance Workstation', specs: 'i7, 32GB RAM, 1TB SSD', imageUrl: 'https://dummyimage.com/600x400/1e8449/ffffff?text=Performance+PC' },
          { id: 'desktop-3', name: 'Executive Desktop', specs: 'i9, 64GB RAM, 2TB SSD', imageUrl: 'https://dummyimage.com/600x400/2ecc71/ffffff?text=Executive+PC' }
        ]
      },
      {
        id: 'ipad',
        name: 'iPads',
        description: 'Tablets for mobile productivity',
        imageUrl: 'https://dummyimage.com/600x400/e74c3c/ffffff?text=iPad',
        models: [
          { id: 'ipad-1', name: 'iPad Air', specs: 'A14 Bionic, 64GB', imageUrl: 'https://dummyimage.com/600x400/e74c3c/ffffff?text=iPad+Air' },
          { id: 'ipad-2', name: 'iPad Pro 11"', specs: 'M1, 128GB', imageUrl: 'https://dummyimage.com/600x400/c0392b/ffffff?text=iPad+Pro+11' },
          { id: 'ipad-3', name: 'iPad Pro 12.9"', specs: 'M1, 256GB', imageUrl: 'https://dummyimage.com/600x400/992222/ffffff?text=iPad+Pro+12.9' }
        ]
      }
    ];
  }

  // Search for employees - updated to better handle exact ID matches
  searchEmployees(term: string): Promise<Recipient[]> {
    // Mock database of employees
    const employees = [
      { employeeId: 'EMP001', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', department: 'Engineering' },
      { employeeId: 'EMP002', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', department: 'Marketing' },
      { employeeId: 'EMP003', firstName: 'Michael', lastName: 'Johnson', email: 'michael.johnson@company.com', department: 'IT' },
      { employeeId: 'EMP004', firstName: 'Emily', lastName: 'Williams', email: 'emily.williams@company.com', department: 'HR' },
      { employeeId: 'EMP005', firstName: 'David', lastName: 'Brown', email: 'david.brown@company.com', department: 'Finance' },
      { employeeId: 'EMP006', firstName: 'Sarah', lastName: 'Davis', email: 'sarah.davis@company.com', department: 'Engineering' },
      { employeeId: 'EMP007', firstName: 'Robert', lastName: 'Miller', email: 'robert.miller@company.com', department: 'Sales' },
      { employeeId: 'EMP008', firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer.wilson@company.com', department: 'Customer Support' },
      { employeeId: 'EMP009', firstName: 'James', lastName: 'Moore', email: 'james.moore@company.com', department: 'IT' },
      { employeeId: 'EMP010', firstName: 'Linda', lastName: 'Taylor', email: 'linda.taylor@company.com', department: 'Product' },
      // Add more employees for testing bulk functionality
      { employeeId: 'EMP011', firstName: 'Thomas', lastName: 'Anderson', email: 'thomas.anderson@company.com', department: 'Engineering' },
      { employeeId: 'EMP012', firstName: 'Lisa', lastName: 'Garcia', email: 'lisa.garcia@company.com', department: 'Marketing' },
      { employeeId: 'EMP013', firstName: 'Daniel', lastName: 'Martinez', email: 'daniel.martinez@company.com', department: 'IT' },
      { employeeId: 'EMP014', firstName: 'Karen', lastName: 'Robinson', email: 'karen.robinson@company.com', department: 'HR' },
      { employeeId: 'EMP015', firstName: 'Christopher', lastName: 'Lee', email: 'christopher.lee@company.com', department: 'Finance' },
    ];
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if the term is exactly an employee ID
        const exactMatch = employees.filter(emp => 
          emp.employeeId.toLowerCase() === term.toLowerCase()
        );
        
        // If we have an exact match on ID, return just that
        if (exactMatch.length > 0) {
          resolve(exactMatch);
          return;
        }
        
        // Otherwise filter by ID, first name, or last name (case insensitive)
        const lowercaseTerm = term.toLowerCase();
        const results = employees.filter(emp => 
          emp.employeeId.toLowerCase().includes(lowercaseTerm) ||
          emp.firstName.toLowerCase().includes(lowercaseTerm) ||
          emp.lastName.toLowerCase().includes(lowercaseTerm)
        );
        resolve(results);
      }, 500);
    });
  }

  // Get saved addresses
  getSavedAddresses(): ShippingAddress[] {
    return [
      {
        buildingName: 'Main Office',
        floorNumber: '3',
        roomNumber: '305',
        streetAddress: '123 Corporate Blvd',
        city: 'Tech City',
        state: 'CA',
        zipCode: '92123',
        specialInstructions: 'Badge required for entry',
        contactPerson: 'John Smith',
        contactPhone: '(555) 123-4567'
      },
      {
        buildingName: 'Development Center',
        floorNumber: '2',
        roomNumber: '201',
        streetAddress: '456 Innovation Way',
        city: 'Tech City',
        state: 'CA',
        zipCode: '92124',
        specialInstructions: 'Use side entrance',
        contactPerson: 'Jane Doe',
        contactPhone: '(555) 987-6543'
      }
    ];
  }

  // Initialize with some mock orders for testing
  initializeMockData(): void {
    // Check if we've already initialized to avoid duplicates
    if (this.orderHistory().length > 0) {
      console.log('Mock data already initialized');
      return;
    }
    
    console.log('Initializing mock data');
    
    // Mock orders for demonstration purposes
    const mockOrders: SubmittedOrder[] = [
      {
        orderId: 'ORD-123456-7890',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
        deviceType: { 
          id: 'laptop', 
          name: 'Laptop' 
        },
        model: { 
          id: 'laptop-1', 
          name: 'Business Ultrabook', 
          specs: 'i7, 16GB RAM, 512GB SSD' 
        },
        quantity: 5,
        recipients: [
          { employeeId: 'EMP001', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', department: 'Engineering' },
          { employeeId: 'EMP002', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', department: 'Marketing' },
          { employeeId: 'EMP003', firstName: 'Michael', lastName: 'Johnson', email: 'michael.j@company.com', department: 'IT' },
          { employeeId: 'EMP004', firstName: 'Emily', lastName: 'Williams', email: 'emily.w@company.com', department: 'HR' },
          { employeeId: 'EMP005', firstName: 'David', lastName: 'Brown', email: 'david.b@company.com', department: 'Finance' }
        ],
        shippingAddress: {
          buildingName: 'Main Office',
          floorNumber: '3',
          roomNumber: '305',
          streetAddress: '123 Corporate Blvd',
          city: 'Tech City',
          state: 'CA',
          zipCode: '92123',
          specialInstructions: 'Badge required for entry',
          contactPerson: 'John Smith',
          contactPhone: '(555) 123-4567'
        },
        status: 'Approved',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days from now
      },
      {
        orderId: 'ORD-234567-8901',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        deviceType: { 
          id: 'desktop', 
          name: 'Desktop' 
        },
        model: { 
          id: 'desktop-2', 
          name: 'Performance Workstation', 
          specs: 'i7, 32GB RAM, 1TB SSD' 
        },
        quantity: 3,
        recipients: [
          { employeeId: 'EMP006', firstName: 'Sarah', lastName: 'Davis', email: 'sarah.d@company.com', department: 'Design' },
          { employeeId: 'EMP007', firstName: 'Robert', lastName: 'Miller', email: 'robert.m@company.com', department: 'Design' },
          { employeeId: 'EMP008', firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer.w@company.com', department: 'Design' }
        ],
        shippingAddress: {
          buildingName: 'Design Studio',
          floorNumber: '2',
          roomNumber: '201',
          streetAddress: '456 Innovation Way',
          city: 'Tech City',
          state: 'CA',
          zipCode: '92124',
          specialInstructions: 'Use side entrance',
          contactPerson: 'Sarah Davis',
          contactPhone: '(555) 987-6543'
        },
        status: 'Shipped',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // 2 days from now
      },
      {
        orderId: 'ORD-345678-9012',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        deviceType: { 
          id: 'ipad', 
          name: 'iPad' 
        },
        model: { 
          id: 'ipad-3', 
          name: 'iPad Pro 12.9"', 
          specs: 'M1, 256GB' 
        },
        quantity: 8,
        recipients: [
          { employeeId: 'EMP010', firstName: 'Linda', lastName: 'Taylor', email: 'linda.t@company.com', department: 'Marketing' },
          { employeeId: 'EMP011', firstName: 'Alex', lastName: 'Lee', email: 'alex.l@company.com', department: 'Marketing' },
          { employeeId: 'EMP012', firstName: 'Catherine', lastName: 'Chen', email: 'catherine.c@company.com', department: 'Marketing' },
          { employeeId: 'EMP013', firstName: 'Brandon', lastName: 'Wong', email: 'brandon.w@company.com', department: 'Marketing' },
          { employeeId: 'EMP014', firstName: 'Nicole', lastName: 'Garcia', email: 'nicole.g@company.com', department: 'Marketing' },
          { employeeId: 'EMP015', firstName: 'Jason', lastName: 'Kim', email: 'jason.k@company.com', department: 'Marketing' },
          { employeeId: 'EMP016', firstName: 'Amanda', lastName: 'Lopez', email: 'amanda.l@company.com', department: 'Marketing' },
          { employeeId: 'EMP017', firstName: 'Patrick', lastName: 'Wilson', email: 'patrick.w@company.com', department: 'Marketing' }
        ],
        shippingAddress: {
          buildingName: 'Marketing Building',
          floorNumber: '4',
          roomNumber: '422',
          streetAddress: '789 Branding Avenue',
          city: 'Tech City',
          state: 'CA',
          zipCode: '92125',
          contactPerson: 'Linda Taylor',
          contactPhone: '(555) 456-7890'
        },
        status: 'Pending Approval',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 14 days from now
      },
      {
        orderId: 'ORD-456789-0123',
        orderDate: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        deviceType: { 
          id: 'laptop', 
          name: 'Laptop' 
        },
        model: { 
          id: 'laptop-2', 
          name: 'Developer Powerhouse', 
          specs: 'i9, 32GB RAM, 1TB SSD' 
        },
        quantity: 2,
        recipients: [
          { employeeId: 'EMP020', firstName: 'Eric', lastName: 'Martinez', email: 'eric.m@company.com', department: 'Engineering' },
          { employeeId: 'EMP021', firstName: 'Rachel', lastName: 'Thompson', email: 'rachel.t@company.com', department: 'Engineering' }
        ],
        shippingAddress: {
          buildingName: 'Engineering Center',
          floorNumber: '5',
          roomNumber: '512',
          streetAddress: '101 Tech Drive',
          city: 'Silicon Valley',
          state: 'CA',
          zipCode: '94040',
          contactPerson: 'Eric Martinez',
          contactPhone: '(555) 234-5678'
        },
        status: 'Pending Approval',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 14 days from now
      },
      {
        orderId: 'ORD-987654-3210',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        deviceType: { 
          id: 'desktop', 
          name: 'Desktop' 
        },
        model: { 
          id: 'desktop-1', 
          name: 'Standard Workstation', 
          specs: 'i5, 16GB RAM, 512GB SSD' 
        },
        quantity: 3,
        recipients: [
          { employeeId: 'EMP031', firstName: 'Daniel', lastName: 'Lewis', email: 'daniel.l@company.com', department: 'Finance' },
          { employeeId: 'EMP032', firstName: 'Victoria', lastName: 'Clark', email: 'victoria.c@company.com', department: 'Finance' },
          { employeeId: 'EMP033', firstName: 'Matthew', lastName: 'Hall', email: 'matthew.h@company.com', department: 'Finance' }
        ],
        shippingAddress: {
          buildingName: 'Finance Building',
          floorNumber: '6',
          roomNumber: '601',
          streetAddress: '789 Money Lane',
          city: 'Tech City',
          state: 'CA',
          zipCode: '92129',
          contactPerson: 'Daniel Lewis',
          contactPhone: '(555) 876-5432'
        },
        status: 'Pending Approval',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 14 days from now
      },
      {
        orderId: 'ORD-246810-1357',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        deviceType: { 
          id: 'ipad', 
          name: 'iPad' 
        },
        model: { 
          id: 'ipad-2', 
          name: 'iPad Pro 11"', 
          specs: 'M1, 128GB' 
        },
        quantity: 5,
        recipients: [
          { employeeId: 'EMP041', firstName: 'Laura', lastName: 'Edwards', email: 'laura.e@company.com', department: 'Design' },
          { employeeId: 'EMP042', firstName: 'Ryan', lastName: 'Walker', email: 'ryan.w@company.com', department: 'Design' },
          { employeeId: 'EMP043', firstName: 'Sophia', lastName: 'Green', email: 'sophia.g@company.com', department: 'Design' },
          { employeeId: 'EMP044', firstName: 'Ethan', lastName: 'Baker', email: 'ethan.b@company.com', department: 'Design' },
          { employeeId: 'EMP045', firstName: 'Olivia', lastName: 'Ross', email: 'olivia.r@company.com', department: 'Design' }
        ],
        shippingAddress: {
          buildingName: 'Design Center',
          floorNumber: '4',
          roomNumber: '412',
          streetAddress: '101 Creative Drive',
          city: 'Tech City',
          state: 'CA',
          zipCode: '92126',
          contactPerson: 'Laura Edwards',
          contactPhone: '(555) 345-6789'
        },
        status: 'Pending Approval',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 14 days from now
      }
    ];
    
    // Set the mock orders to our state
    this.orderHistory.set(mockOrders);
    console.log('Mock orders initialized:', mockOrders);
  }
}
