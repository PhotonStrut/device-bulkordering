import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { OrderService, OrderDetails, ShippingAddress } from '../../services/order.service';

// Interfaces
// Removed the Recipient interface as it is already defined in OrderService

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
    ])
  ]
})
export class ShippingAddressComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private orderService = inject(OrderService);

  // State signals
  orderDetails = signal<OrderDetails | null>(null);
  showSavedAddresses = signal<boolean>(false);
  selectedSavedAddress = signal<number | null>(null);

  // Form
  shippingForm: FormGroup = this.fb.group({
    buildingName: ['', Validators.required],
    floorNumber: ['', Validators.required],
    roomNumber: ['', Validators.required],
    streetAddress: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(?:[-\s]\d{4})?$/)]],
    specialInstructions: [''],
    contactPerson: ['', Validators.required],
    contactPhone: ['', [Validators.required, Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]]
  });

  // Get saved addresses from service
  savedAddresses: ShippingAddress[] = [];

  ngOnInit(): void {
    // Get current order from service
    const currentOrder = this.orderService.getCurrentOrder();
    
    // Verify we have device and recipients data
    if (!currentOrder.deviceType.id || !currentOrder.model.id || currentOrder.recipients.length === 0) {
      // If not, redirect to recipients
      this.router.navigate(['/recipients']);
      return;
    }
    
    this.orderDetails.set(currentOrder);
    
    // Load saved addresses from service
    this.savedAddresses = this.orderService.getSavedAddresses();
    
    // Format phone number as user types
    this.shippingForm.get('contactPhone')?.valueChanges.subscribe(value => {
      if (!value) return;
      
      // Strip all non-numeric characters
      let numbers = value.replace(/\D/g, '');
      
      // Don't format if deleting
      if (numbers.length > 10) numbers = numbers.slice(0, 10);
      
      // Format the phone number
      if (numbers.length <= 3) {
        // Do nothing yet
      } else if (numbers.length <= 6) {
        numbers = `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
      } else {
        numbers = `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
      
      // Update the form value without triggering another valueChanges event
      if (numbers !== value) {
        this.shippingForm.get('contactPhone')?.setValue(numbers, { emitEvent: false });
      }
    });
  }

  // Toggle saved addresses list
  toggleSavedAddresses(): void {
    this.showSavedAddresses.update(value => !value);
    if (!this.showSavedAddresses()) {
      this.selectedSavedAddress.set(null);
    }
  }

  // Select a saved address
  selectSavedAddress(index: number): void {
    this.selectedSavedAddress.set(index);
    const address = this.savedAddresses[index];
    this.shippingForm.patchValue(address);
  }

  // Clear form
  clearForm(): void {
    this.shippingForm.reset();
    this.selectedSavedAddress.set(null);
  }

  // Go back to recipients page
  goBack(): void {
    this.router.navigate(['/recipients']);
  }

  // Submit and continue to review
  continueToReview(): void {
    if (this.shippingForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.shippingForm.controls).forEach(key => {
        const control = this.shippingForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Get the shipping address data
    const shippingAddress: ShippingAddress = this.shippingForm.value;
    
    // Update the order details with shipping info
    const updatedOrderDetails = {
      ...this.orderDetails()!,
      shippingAddress
    };
    
    // Update order in service
    this.orderService.updateCurrentOrder(updatedOrderDetails);
    
    // Navigate to review
    this.router.navigate(['/review']);
  }
}
