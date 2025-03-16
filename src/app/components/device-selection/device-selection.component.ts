import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { OrderService, DeviceModel } from '../../services/order.service';
import { animate, style, transition, trigger, state, stagger, query } from '@angular/animations';

interface DeviceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
  models?: DeviceModel[];
}

@Component({
  selector: 'app-device-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './device-selection.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    // Add the missing fadeInOut animation trigger
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('staggeredFade', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger('50ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('buttonHover', [
      transition('* => hovered', [
        animate('200ms ease-out', style({ transform: 'translateY(-3px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }))
      ]),
      transition('hovered => *', [
        animate('200ms ease-out', style({ transform: 'translateY(0)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }))
      ])
    ]),
    trigger('cardHover', [
      state('default', style({
        transform: 'translateY(0)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      })),
      state('hovered', style({
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      })),
      transition('default => hovered', animate('200ms ease-out')),
      transition('hovered => default', animate('150ms ease-in'))
    ]),
    trigger('pageTransition', [
      state('type', style({ opacity: 1, transform: 'translateY(0)' })),
      state('model', style({ opacity: 1, transform: 'translateY(0)' })),
      state('quantity', style({ opacity: 1 })),
      transition('type => model', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition('model => type', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class DeviceSelectionComponent implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  isLoading = signal(true);
  hasError = signal(false);
  
  // Filter and selection state
  selectedCategoryId = signal<string | null>(null);
  searchQuery = signal<string>('');
  availabilityFilter = signal<string | null>(null);
  hoveredCardId = signal<string | null>(null);
  
  // Device data
  deviceCategories = signal<DeviceCategory[]>([]);
  deviceModels = signal<DeviceModel[]>([]);
  deviceTypes = signal<DeviceCategory[]>([]);
  
  // Cart state
  selectedDevices = signal<{model: DeviceModel, quantity: number}[]>([]);
  
  // Progress steps
  currentStep = signal<'type' | 'model' | 'quantity'>('type');
  selectedDeviceType = signal<DeviceCategory | null>(null);
  selectedModel = signal<DeviceModel | null>(null);
  
  // Computed properties
  filteredDevices = computed(() => {
    let models = this.deviceModels();
    
    // Filter by category
    if (this.selectedCategoryId()) {
      models = models.filter(model => model.categoryId === this.selectedCategoryId());
    }
    
    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      models = models.filter(model => 
        model.name.toLowerCase().includes(query) || 
        model.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by availability
    if (this.availabilityFilter()) {
      models = models.filter(model => model.availability === this.availabilityFilter());
    }
    
    return models;
  });
  
  availableModels = computed(() => {
    if (!this.selectedDeviceType()) return [];
    return this.deviceModels().filter(model => model.categoryId === this.selectedDeviceType()?.id);
  });
  
  totalDevices = computed(() => {
    return this.selectedDevices().reduce((sum, item) => sum + item.quantity, 0);
  });
  
  ngOnInit(): void {
    // Simulate loading delay
    setTimeout(() => {
      try {
        this.loadDeviceData();
        this.isLoading.set(false);
      } catch (error) {
        console.error('Error loading device data', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    }, 600);
  }
  
  loadDeviceData(): void {
    // First set the device models data
    this.deviceModels.set([
      {
        id: 'l1',
        categoryId: 'laptop',
        name: 'Business Ultrabook X1',
        description: 'Lightweight business laptop with all-day battery life',
        imageUrl: '', // Remove broken image URLs
        specs: ['Intel Core i7', '16GB RAM', '512GB SSD', '14" 1080p Display'],
        price: 1299.99,
        availability: 'In Stock'
      },
      {
        id: 'l2',
        categoryId: 'laptop',
        name: 'Rugged Field Laptop R5',
        description: 'Military-grade durability for field operations',
        imageUrl: '', // Remove broken image URLs
        specs: ['Intel Core i5', '8GB RAM', '256GB SSD', 'Waterproof', 'Shockproof'],
        price: 1899.99,
        availability: 'Limited'
      },
      {
        id: 'd1',
        categoryId: 'desktop',
        name: 'Workstation Pro Tower',
        description: 'High-performance desktop for demanding applications',
        imageUrl: '', // Remove broken image URLs
        specs: ['Intel Core i9', '32GB RAM', '1TB SSD', 'NVIDIA Quadro RTX 4000'],
        price: 2499.99,
        availability: 'In Stock'
      },
      {
        id: 't1',
        categoryId: 'tablet',
        name: 'iPad Pro 12.9"',
        description: 'Powerful tablet for productivity and creativity',
        imageUrl: '', // Remove broken image URLs
        specs: ['M1 Chip', '8GB RAM', '256GB Storage', '12.9" Retina Display'],
        price: 1099.99,
        availability: 'In Stock'
      }
    ]);

    // Next create the categories
    const categories: DeviceCategory[] = [
      {
        id: 'laptop',
        name: 'Laptops',
        description: 'Standard and rugged laptops for all use cases',
        icon: 'laptop',
        imageUrl: '' // Remove broken image URLs
      },
      {
        id: 'desktop',
        name: 'Desktops',
        description: 'Powerful desktop workstations',
        icon: 'desktop',
        imageUrl: '' // Remove broken image URLs
      },
      {
        id: 'tablet',
        name: 'Tablets',
        description: 'iPads and Android tablets',
        icon: 'tablet',
        imageUrl: '' // Remove broken image URLs
      },
      {
        id: 'accessories',
        name: 'Accessories',
        description: 'Monitors, docks, and peripherals',
        icon: 'accessories',
        imageUrl: '' // Remove broken image URLs
      }
    ];
    
    // Now set the models for each category after both arrays have been populated
    categories.forEach(cat => {
      cat.models = this.deviceModels().filter(model => model.categoryId === cat.id);
    });
    
    this.deviceCategories.set(categories);
    this.deviceTypes.set(categories); // For backward compatibility
  }
  
  // Device type selection methods
  selectDeviceType(deviceType: DeviceCategory): void {
    this.selectedDeviceType.set(deviceType);
    this.currentStep.set('model');
  }
  
  goBackToTypes(): void {
    this.selectedDeviceType.set(null);
    this.selectedModel.set(null);
    this.currentStep.set('type');
  }
  
  selectModel(model: DeviceModel): void {
    this.selectedModel.set(model);
    this.addToSelection(model);
  }
  
  // Cart methods
  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }
  
  addToSelection(model: DeviceModel): void {
    const currentSelection = this.selectedDevices();
    const existingItem = currentSelection.find(item => item.model.id === model.id);
    
    if (existingItem) {
      // Increase quantity if already in cart
      this.selectedDevices.update(items => 
        items.map(item => 
          item.model.id === model.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new item with quantity 1
      this.selectedDevices.update(items => [...items, { model, quantity: 1 }]);
    }
  }
  
  removeFromSelection(modelId: string): void {
    this.selectedDevices.update(items => items.filter(item => item.model.id !== modelId));
  }
  
  updateQuantity(modelId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromSelection(modelId);
      return;
    }
    
    this.selectedDevices.update(items => 
      items.map(item => 
        item.model.id === modelId 
          ? { ...item, quantity }
          : item
      )
    );
  }
  
  continueToRecipients(): void {
    if (this.selectedDevices().length > 0) {
      // Save selection to order service and navigate to recipient selection
      this.orderService.setSelectedDevices(this.selectedDevices());
      this.router.navigate(['/recipients']);
    }
  }
  
  clearSelection(): void {
    this.selectedDevices.set([]);
  }
  
  // UI interaction methods
  setHoveredCard(id: string | null): void {
    this.hoveredCardId.set(id);
  }
  
  getIconForCategory(iconName: string): string {
    // Map icon names to SVG paths or classes
    switch (iconName) {
      case 'laptop':
        return 'M4 6h16v10H4V6zm16 12H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2h16a2 2 0 012 2v10a2 2 0 01-2 2z M2 18h20';
      case 'desktop':
        return 'M8 6v8h8V6H8zM7 18h10m-5-4v4M4 4h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z';
      case 'tablet':
        return 'M12 18v-1m-6-9h12M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z';
      case 'accessories':
        return 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z';
      default:
        return 'M4 6h16M4 10h16M4 14h16M4 18h16';
    }
  }

  // Add this helper method to handle image loading errors
  handleImageError(event: any): void {
    event.target.style.display = 'none';
    const parentElement = event.target.parentElement;
    
    // Add a fallback SVG icon
    if (parentElement) {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('class', 'h-24 w-24 text-gray-400');
      svgElement.setAttribute('fill', 'none');
      svgElement.setAttribute('viewBox', '0 0 24 24');
      svgElement.setAttribute('stroke', 'currentColor');
      
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('stroke-linecap', 'round');
      pathElement.setAttribute('stroke-linejoin', 'round');
      pathElement.setAttribute('stroke-width', '1.5');
      pathElement.setAttribute('d', 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z');
      
      svgElement.appendChild(pathElement);
      parentElement.appendChild(svgElement);
    }
  }

  // Add a method to get the view height for dynamic min-height
  getMinHeightStyle(): object {
    return {
      'min-height': this.currentStep() === 'model' && this.availableModels().length > 3 
        ? `${Math.ceil(this.availableModels().length / 3) * 400}px` 
        : '640px'
    };
  }
}
