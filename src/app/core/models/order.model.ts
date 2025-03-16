import { DeviceType } from './device.model';

export enum OrderStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered'
}

export interface OrderItem {
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  recipientEmployeeId: string;
  recipientName: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  building?: string;
  room?: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: OrderStatus;
  deviceType: DeviceType;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  approvalDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
}
