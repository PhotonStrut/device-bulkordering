import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { RecipientService } from '../../services/recipient.service';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';
import { BulkRecipientSelectorComponent } from '../bulk-recipient-selector/bulk-recipient-selector.component';
import { Recipient } from '../../models/recipient.model';

@Component({
  selector: 'app-recipient-selection',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    BulkRecipientSelectorComponent
  ],
  templateUrl: './recipient-selection.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
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
    trigger('recipientCard', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
      ])
    ])
  ]
})
export class RecipientSelectionComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);
  private recipientService = inject(RecipientService);
  
  @ViewChild(BulkRecipientSelectorComponent) bulkSelector!: BulkRecipientSelectorComponent;
  
  isLoading = signal(true);
  hasError = signal(false);
  
  // Recipients data
  availableRecipients = signal<Recipient[]>([]);
  filteredRecipients = signal<Recipient[]>([]);
  selectedRecipients = signal<Recipient[]>([]);
  
  // UI state
  searchQuery = signal<string>('');
  departmentFilter = signal<string | null>(null);
  showAddNewForm = signal(false);
  
  // Forms
  recipientForm!: FormGroup;
  deviceAssignmentForm!: FormGroup;
  
  ngOnInit() {
    this.initializeForms();
    
    // Fix this line to use the correct method that exists in the service
    const currentOrder = this.orderService.getCurrentOrder();
    if (!currentOrder.devices || currentOrder.devices.length === 0) {
      this.router.navigate(['/device-selection']);
      return;
    }
    
    // Simulate loading of recipients
    setTimeout(() => {
      try {
        this.loadRecipients();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error loading recipients', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  initializeForms() {
    // Form for adding a new recipient
    this.recipientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      department: ['', Validators.required],
      notes: ['']
    });
    
    // Form for device assignments
    this.deviceAssignmentForm = this.fb.group({
      assignments: this.fb.array([])
    });
  }
  
  loadRecipients() {
    // This would typically come from a service - using mock data for now
    const mockRecipients: Recipient[] = [
      {
        id: 'r1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        department: 'Engineering'
      },
      {
        id: 'r2',
        name: 'Emily Johnson',
        email: 'emily.johnson@company.com',
        department: 'Marketing'
      },
      {
        id: 'r3',
        name: 'Michael Brown',
        email: 'michael.brown@company.com',
        department: 'Engineering'
      },
      {
        id: 'r4',
        name: 'Sarah Davis',
        email: 'sarah.davis@company.com',
        department: 'HR'
      },
      {
        id: 'r5',
        name: 'David Wilson',
        email: 'david.wilson@company.com',
        department: 'Finance'
      }
    ];
    
    this.availableRecipients.set(mockRecipients);
    this.filteredRecipients.set(mockRecipients);
  }
  
  filterRecipients() {
    let filtered = this.availableRecipients();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      filtered = filtered.filter(recipient => 
        recipient.name.toLowerCase().includes(query) ||
        recipient.email.toLowerCase().includes(query)
      );
    }
    
    if (this.departmentFilter()) {
      filtered = filtered.filter(recipient => 
        recipient.department === this.departmentFilter()
      );
    }
    
    this.filteredRecipients.set(filtered);
  }
  
  // Recipient selection methods
  toggleRecipientSelection(recipient: Recipient) {
    const currentSelection = this.selectedRecipients();
    const isSelected = currentSelection.some(r => r.id === recipient.id);
    
    if (isSelected) {
      this.selectedRecipients.set(currentSelection.filter(r => r.id !== recipient.id));
    } else {
      this.selectedRecipients.set([...currentSelection, recipient]);
    }
  }
  
  isRecipientSelected(recipient: Recipient): boolean {
    return this.selectedRecipients().some(r => r.id === recipient.id);
  }
  
  // Form methods
  addNewRecipient() {
    if (this.recipientForm.valid) {
      const formValue = this.recipientForm.value;
      const newRecipient: Recipient = {
        id: 'new-' + Date.now(),
        name: formValue.name,
        email: formValue.email,
        department: formValue.department
      };
      
      // Add to available recipients
      this.availableRecipients.update(recipients => [...recipients, newRecipient]);
      this.filterRecipients();
      
      // Select the new recipient
      this.selectedRecipients.update(recipients => [...recipients, newRecipient]);
      
      // Reset form and hide it
      this.recipientForm.reset();
      this.showAddNewForm.set(false);
    }
  }
  
  toggleAddNewForm() {
    this.showAddNewForm.update(show => !show);
  }
  
  cancelAddNew() {
    this.recipientForm.reset();
    this.showAddNewForm.set(false);
  }
  
  // Navigation
  goBack() {
    this.router.navigate(['/device-selection']);
  }
  
  continueToShipping() {
    if (this.selectedRecipients().length > 0) {
      this.orderService.setRecipients(this.selectedRecipients());
      this.router.navigate(['/shipping']);
    }
  }
  
  get departments(): string[] {
    const uniqueDepartments = new Set<string>();
    this.availableRecipients().forEach(r => uniqueDepartments.add(r.department));
    return Array.from(uniqueDepartments);
  }
  
  // Helper methods for template
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  }
  
  // Improved color generation for more vibrant avatars
  getColorClass(name: string): string {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-amber-100 text-amber-800'
    ];
    
    // Simple hash function to consistently pick a color based on name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  // Bulk selection methods
  openBulkSelector(): void {
    this.bulkSelector.open();
    // Initialize with currently selected recipients
    this.bulkSelector.selectedRecipients.set([...this.selectedRecipients()]);
  }
  
  closeBulkSelector(): void {
    // No action needed - modal handles its own closing
  }
  
  handleBulkSelection(recipients: Recipient[]): void {
    this.selectedRecipients.set(recipients);
  }
  
  clearAllRecipients(): void {
    this.selectedRecipients.set([]);
  }
  
  // Org hierarchy view
  openHierarchyView(): void {
    this.bulkSelector.open();
    this.bulkSelector.setActiveTab('organization');
    // Initialize with currently selected recipients
    this.bulkSelector.selectedRecipients.set([...this.selectedRecipients()]);
  }
}
