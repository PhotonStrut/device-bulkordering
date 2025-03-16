import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

// Device type definition
interface DeviceType {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  options: string[];
}

@Component({
  selector: 'app-device-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-selection.component.html',
  animations: [
    trigger('cardHover', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ]),
    trigger('selectionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class DeviceSelectionComponent {
  private router = inject(Router);
  
  // Available device types for ordering
  deviceTypes = signal<DeviceType[]>([
    {
      id: 'laptop',
      name: 'Laptop',
      description: 'Portable computers suitable for work on the go',
      imageUrl: 'assets/images/laptop.svg',
      options: ['Standard (14")', 'Performance (15.6")', 'Ultralight (13")']
    },
    {
      id: 'desktop',
      name: 'Desktop',
      description: 'High-performance workstations for office use',
      imageUrl: 'assets/images/desktop.svg',
      options: ['Standard Tower', 'Mini PC', 'Performance Workstation']
    },
    {
      id: 'ipad',
      name: 'iPad',
      description: 'Tablets for mobility and lightweight computing needs',
      imageUrl: 'assets/images/ipad.svg',
      options: ['iPad', 'iPad Pro', 'iPad Air']
    }
  ]);

  // Currently selected device type
  selectedDeviceType = signal<DeviceType | null>(null);
  
  // Computed state to check if user can proceed
  canProceed = computed(() => this.selectedDeviceType() !== null);

  // Method to handle device type selection
  selectDeviceType(deviceType: DeviceType): void {
    this.selectedDeviceType.set(deviceType);
  }

  // Method to clear selection
  clearSelection(): void {
    this.selectedDeviceType.set(null);
  }

  // Method to proceed to next step (recipient selection)
  proceedToNextStep(): void {
    if (this.canProceed()) {
      // Store selected device type in state or service before navigating
      // Here you would typically inject a service and store the selection
      this.router.navigate(['/order/recipients'], { 
        state: { deviceTypeId: this.selectedDeviceType()?.id }
      });
    }
  }

  // Method to check if a device is the currently selected one
  isSelected(deviceType: DeviceType): boolean {
    return this.selectedDeviceType()?.id === deviceType.id;
  }
}
