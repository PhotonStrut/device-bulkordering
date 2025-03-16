import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { OrderService, OrderDetails, ShippingAddress } from '../../services/order.service';

@Component({
  selector: 'app-shipping-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shipping-address.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('200ms ease-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, height: '*', overflow: 'hidden' }),
        animate('200ms ease-in', style({ opacity: 0, height: 0 })),
      ]),
    ]),
  ]
})
export class ShippingAddressComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private orderService = inject(OrderService);

  // State signals
  orderDetails = signal<OrderDetails | null>(null);
  isLoading = signal(true);
  hasError = signal(false);
  
  // UI state
  showNewAddressForm = signal(false);
  selectedAddressId = signal<string | null>(null);
  
  // Saved addresses
  savedAddressesSignal = signal<ShippingAddress[]>([]);

  // Form
  addressForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();

    // Get current order from service
    const currentOrder = this.orderService.getCurrentOrder();
    
    // Verify we have device and recipients data
    if (!currentOrder.devices || currentOrder.devices.length === 0 || 
        !currentOrder.recipients || currentOrder.recipients.length === 0) {
      // If not, redirect to recipients
      this.router.navigate(['/recipients']);
      return;
    }
    
    this.orderDetails.set(currentOrder);
    
    // Simulate loading
    setTimeout(() => {
      try {
        this.loadSavedAddresses();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error loading addresses', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }

  initForm() {
    this.addressForm = this.fb.group({
      name: ['', [Validators.required]],
      street: ['', [Validators.required]],
      street2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      country: ['United States', [Validators.required]],
      saveAddress: [true]
    });
  }

  loadSavedAddresses() {
    // Load addresses from service
    const savedAddresses = this.orderService.getSavedAddresses();
    this.savedAddressesSignal.set(savedAddresses);
    
    // Select default address
    const defaultAddress = savedAddresses.find(addr => addr.isDefault);
    if (defaultAddress && defaultAddress.id) {
      this.selectedAddressId.set(defaultAddress.id);
    }
  }

  selectAddress(address: ShippingAddress) {
    if (address.id) {
      this.selectedAddressId.set(address.id);
    }
    this.showNewAddressForm.set(false);
  }

  toggleNewAddressForm() {
    const showForm = this.showNewAddressForm();
    this.showNewAddressForm.set(!showForm);
    
    if (!showForm) {
      // Clear selection when showing form
      this.selectedAddressId.set(null);
    }
  }

  saveNewAddress() {
    if (this.addressForm.valid) {
      const formValue = this.addressForm.value;
      
      // Create new address with a guaranteed ID
      const newId = 'new-' + Date.now();
      const newAddress: ShippingAddress = {
        id: newId,
        name: formValue.name,
        street: formValue.street,
        street2: formValue.street2,
        city: formValue.city,
        state: formValue.state,
        zipCode: formValue.zipCode,
        country: formValue.country
      };
      
      // Add to saved addresses if requested
      if (formValue.saveAddress) {
        this.orderService.addSavedAddress(newAddress);
        this.savedAddressesSignal.update(addresses => [...addresses, newAddress]);
      }
      
      // Select the new address
      this.selectedAddressId.set(newId);
      
      // Hide form after saving
      this.showNewAddressForm.set(false);
      
      // Reset form
      this.addressForm.reset({ 
        country: 'United States',
        saveAddress: true
      });
    }
  }

  cancelNewAddress() {
    this.showNewAddressForm.set(false);
    this.addressForm.reset({ 
      country: 'United States',
      saveAddress: true
    });
    
    // Select default address if available
    const defaultAddress = this.savedAddressesSignal().find(addr => addr.isDefault);
    if (defaultAddress && defaultAddress.id) {
      this.selectedAddressId.set(defaultAddress.id);
    }
  }

  getSelectedAddress(): ShippingAddress | null {
    return this.savedAddressesSignal().find(addr => addr.id === this.selectedAddressId()) || null;
  }

  // Go back to recipients page
  goBack(): void {
    this.router.navigate(['/recipients']);
  }

  // Submit and continue to review
  continueToReview(): void {
    const selectedAddress = this.getSelectedAddress();
    
    if (selectedAddress && this.orderDetails()) {
      // Set the shipping address in the order service
      this.orderService.setShippingAddress(selectedAddress);
      
      // Navigate to review page
      this.router.navigate(['/review']);
    }
  }

  // Add this helper method to get the total recipients
  getTotalRecipients(): number {
    return this.orderDetails()?.recipients?.length || 0;
  }

  // Add this helper method to calculate the total quantity of items
  getTotalItemQuantity(item: any): number {
    const recipientCount = this.orderDetails()?.recipients?.length || 0;
    return item.quantity * recipientCount;
  }

  // Add this helper to get the grand total of all devices
  getTotalDeviceCount(): number {
    // Calculate the total items based on device quantity and recipient count
    const devices = this.orderDetails()?.devices || [];
    const recipientCount = this.orderDetails()?.recipients?.length || 0;
    
    if (recipientCount === 0) return 0;
    
    // Sum all devices × their quantity × recipient count
    return devices.reduce((total: number, item: any) => total + (item.quantity * recipientCount), 0);
  }
}
