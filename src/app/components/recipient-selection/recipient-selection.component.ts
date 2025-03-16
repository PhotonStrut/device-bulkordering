import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, concatMap, from } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderService, Recipient, OrderDetails } from '../../services/order.service';
import { injectDestroy } from 'ngxtension/inject-destroy'

@Component({
  selector: 'app-recipient-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recipient-selection.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class RecipientSelectionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private destroy = injectDestroy();
  private cdr = inject(ChangeDetectorRef); // Add change detector reference

  // State signals
  orderDetails = signal<OrderDetails>(this.orderService.getCurrentOrder());

  searchResults = signal<Recipient[]>([]);
  isSearching = signal<boolean>(false);
  searchError = signal<string | null>(null);
  
  // Fix the computed properties to use proper tracking
  recipientCount = computed(() => {
    return this.recipients.controls.length;
  });
  
  recipientRemaining = computed(() => {
    return this.orderDetails().quantity - this.recipientCount();
  });

  // Form
  recipientForm: FormGroup = this.fb.group({
    recipients: this.fb.array([]),
    employeeIdSearch: ['', [Validators.minLength(3)]]
  });

  // Add quantity form control
  quantityForm: FormGroup = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(100)]]
  });

  // Add properties for batch processing
  processingBatch = signal<boolean>(false);
  batchResults = signal<{
    success: number, 
    failed: number,
    failedIds: Array<{id: string, reason: string}>
  }>({ 
    success: 0, 
    failed: 0,
    failedIds: []
  });
  showBatchResults = signal<boolean>(false);

  get recipients(): FormArray {
    return this.recipientForm.get('recipients') as FormArray;
  }

  ngOnInit(): void {
    // Check if we have device and model selected
    const currentOrder = this.orderService.getCurrentOrder();

    if (!currentOrder.deviceType.id || !currentOrder.model.id) {
      // If not, redirect to device selection
      this.router.navigate(['/device-selection']);
      return;
    }

    this.orderDetails.set(currentOrder);

    // Initialize quantity form with current value
    this.quantityForm.get('quantity')?.setValue(currentOrder.quantity || 1);

    // Setup employee ID search
    this.recipientForm.get('employeeIdSearch')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
        switchMap(term => {
          if (!term || term.length < 3) {
            this.searchResults.set([]);
            return of([]);
          }

          this.isSearching.set(true);
          this.searchError.set(null);

          // Use the service instead of mock data
          return this.orderService.searchEmployees(term).then(
            results => results,
            error => {
              this.searchError.set('An error occurred while searching. Please try again.');
              return [];
            }
          );
        })
      )
      .subscribe(results => {
        this.searchResults.set(results as Recipient[]);
        this.isSearching.set(false);
      });

    // Update recipient count when quantity changes
    this.quantityForm.get('quantity')?.valueChanges.subscribe(value => {
      if (value && value > 0) {
        // Update the order with new quantity
        const updatedOrder = {
          ...this.orderDetails(),
          quantity: value
        };
        this.orderDetails.set(updatedOrder);
        this.orderService.updateCurrentOrder(updatedOrder);
        
        // Force refresh the UI
        this.cdr.detectChanges();
      }
    });
  }

  // Add recipient from search results
  addRecipient(recipient: Recipient, clearSearch: boolean = false): void {
    // Check if recipient already added
    const isDuplicate = this.recipients.controls.some(
      control => control.get('employeeId')?.value === recipient.employeeId
    );

    if (isDuplicate) {
      this.searchError.set('This employee has already been added to the recipients list.');
      return;
    }

    // Check if we've reached the quantity limit
    if (this.recipients.controls.length >= this.orderDetails().quantity) {
      this.searchError.set(`You can only add ${this.orderDetails().quantity} recipients for this order.`);
      return;
    }

    // Add recipient to form array
    this.recipients.push(
      this.fb.group({
        employeeId: [recipient.employeeId, Validators.required],
        firstName: [recipient.firstName, Validators.required],
        lastName: [recipient.lastName, Validators.required],
        email: [recipient.email, [Validators.required, Validators.email]],
        department: [recipient.department, Validators.required]
      })
    );

    // Only clear search if explicitly requested
    if (clearSearch) {
      this.recipientForm.get('employeeIdSearch')?.setValue('');
      this.searchResults.set([]);
    }
    this.searchError.set(null);
    
    // Force update of the FormArray to trigger change detection
    this.recipientForm.updateValueAndValidity();
    this.recipientForm.markAsDirty();
    
    // Force Angular to detect the changes
    this.cdr.detectChanges();
    
    console.log('Recipients count after adding:', this.recipients.controls.length);
  }

  // Process multiple IDs at once (enhanced error feedback)
  processMultipleIds(): void {
    const searchInput = this.recipientForm.get('employeeIdSearch')?.value;
    if (!searchInput) return;
    
    // Split by commas, new lines, or spaces
    const ids = searchInput
      .split(/[,\n\s]+/)
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);
    
    if (ids.length === 0) return;
    
    // Calculate how many more we can add
    const remainingSlots = this.orderDetails().quantity - this.recipients.controls.length;
    if (remainingSlots <= 0) {
      this.searchError.set(`You can only add ${this.orderDetails().quantity} recipients for this order.`);
      return;
    }
    
    // Limit to available slots
    const idsToProcess = ids.slice(0, remainingSlots);
    
    this.processingBatch.set(true);
    this.searchError.set(null);
    this.batchResults.set({ success: 0, failed: 0, failedIds: [] });
    
    // Process each ID sequentially - fixed by providing type to from operator
    from(idsToProcess as string[])  // Explicitly type the array for 'from'
      .pipe(
        concatMap((id: string) => {
          return this.orderService.searchEmployees(id as string).then(
            results => {
              // If exactly one match found, add it
              if (results.length === 1) {
                // Check if already added
                const isDuplicate = this.recipients.controls.some(
                  control => control.get('employeeId')?.value === results[0].employeeId
                );
                
                if (!isDuplicate) {
                  this.addRecipient(results[0], false);
                  this.batchResults.update(val => ({ ...val, success: val.success + 1 }));
                  return { id, success: true };
                } else {
                  this.batchResults.update(val => ({ 
                    ...val, 
                    failed: val.failed + 1,
                    failedIds: [...val.failedIds, { id, reason: 'already added' }]
                  }));
                  return { id, success: false, reason: 'duplicate' };
                }
              } else {
                const reason = results.length > 1 ? 'multiple matches' : 'not found';
                this.batchResults.update(val => ({ 
                  ...val, 
                  failed: val.failed + 1,
                  failedIds: [...val.failedIds, { id, reason }]
                }));
                return { id, success: false, reason };
              }
            },
            error => {
              this.batchResults.update(val => ({ 
                ...val, 
                failed: val.failed + 1,
                failedIds: [...val.failedIds, { id, reason: 'error' }]
              }));
              return { id, success: false, reason: 'error' };
            }
          );
        })
      )
      .subscribe({
        complete: () => {
          this.processingBatch.set(false);
          this.showBatchResults.set(true);
          
          // Clear input but keep search results visible
          this.recipientForm.get('employeeIdSearch')?.setValue('');
          
          // Auto-hide results after 8 seconds (increased to give more time to see the failures)
          setTimeout(() => {
            this.showBatchResults.set(false);
          }, 8000);
        }
      });
  }

  // Remove recipient from form array
  removeRecipient(index: number): void {
    this.recipients.removeAt(index);
    // Force Angular to detect the changes
    this.cdr.detectChanges();
    
    console.log('Recipients count after removing:', this.recipients.controls.length);
  }

  // Handle "Continue to Shipping" button click
  continueToShipping(): void {
    if (this.recipientForm.invalid) {
      return;
    }

    // Check if we have the correct number of recipients
    if (this.recipientCount() !== this.orderDetails().quantity) {
      this.searchError.set(`Please add exactly ${this.orderDetails().quantity} recipients to continue.`);
      return;
    }

    // Get recipients from form controls
    const recipientValues = this.recipients.controls.map(control => control.value);
    
    // Update order details with recipients
    const updatedOrderDetails = {
      ...this.orderDetails(),
      recipients: recipientValues
    };

    // Save to service
    this.orderService.updateCurrentOrder(updatedOrderDetails);

    // Navigate to shipping
    this.router.navigate(['/shipping']);
  }

  // Return to device selection page
  goBack(): void {
    this.router.navigate(['/device-selection']);
  }
}
