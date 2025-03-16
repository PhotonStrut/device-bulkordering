import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, state, query, group, animateChild } from '@angular/animations';
import { injectNavigationEnd } from 'ngxtension/navigation-end';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { OrderService, DeviceType, DeviceModel } from '../../services/order.service';

@Component({
  selector: 'app-device-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './device-selection.component.html',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
    trigger('cardHover', [
      state('default', style({ transform: 'scale(1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' })),
      state('hovered', style({ transform: 'scale(1.03)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' })),
      transition('default <=> hovered', animate('200ms ease-in-out')),
    ]),
    // New page transition animation
    trigger('pageTransition', [
      state('type', style({ position: 'relative' })),
      state('model', style({ position: 'relative' })),
      transition('type => model', [
        style({ position: 'relative', height: '*' }),
        query(':enter', style({ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%' })),
        query(':leave', style({ opacity: 1, position: 'relative' })),
        group([
          query(':leave', animate('200ms ease-out', style({ opacity: 0 }))),
          query(':enter', animate('300ms ease-in', style({ opacity: 1 }))),
        ]),
      ]),
      transition('model => type', [
        style({ position: 'relative', height: '*' }),
        query(':enter', style({ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%' })),
        query(':leave', style({ opacity: 1, position: 'relative' })),
        group([
          query(':leave', animate('200ms ease-out', style({ opacity: 0 }))),
          query(':enter', animate('300ms ease-in', style({ opacity: 1 }))),
        ]),
      ]),
    ])
  ]
})
export class DeviceSelectionComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  // Get device types from service instead of hardcoding
  deviceTypes = signal<DeviceType[]>(this.orderService.getDeviceTypes());
  
  // UI state signals
  selectedDeviceType = signal<DeviceType | null>(null);
  selectedModel = signal<DeviceModel | null>(null);
  currentStep = signal<'type' | 'model'>('type');
  hoveredCardId = signal<string | null>(null);
  
  // Derived state
  availableModels = computed(() => this.selectedDeviceType()?.models || []);
  
  // Remove the quantity form
  
  // Handle device type selection
  selectDeviceType(deviceType: DeviceType): void {
    this.selectedDeviceType.set(deviceType);
    this.currentStep.set('model');
    this.selectedModel.set(null);
  }
  
  // Handle model selection
  selectModel(model: DeviceModel): void {
    this.selectedModel.set(model);
  }
  
  // Go back to device type selection
  goBackToTypes(): void {
    this.currentStep.set('type');
  }
  
  // Handle card hover states for animations
  setHoveredCard(id: string | null): void {
    this.hoveredCardId.set(id);
  }
  
  // Continue to recipient selection
  continueToRecipients(): void {
    if (!this.selectedModel()) {
      return;
    }
    
    // Update order in the service without a specific quantity
    this.orderService.updateCurrentOrder({
      deviceType: {
        id: this.selectedDeviceType()!.id,
        name: this.selectedDeviceType()!.name
      },
      model: {
        id: this.selectedModel()!.id,
        name: this.selectedModel()!.name,
        specs: this.selectedModel()!.specs
      },
      quantity: 1, // Set default quantity to 1
      recipients: []
    });
    
    // Navigate to recipients component
    this.router.navigate(['/recipients']);
  }
  
  // Constructor with effects
  constructor() {
    // Reset selection when navigating back to this component
    injectNavigationEnd()
      .pipe(
        filter(event => event?.url === '/device-selection'),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.currentStep.set('type');
        this.selectedDeviceType.set(null);
        this.selectedModel.set(null);
      });
    
    // Effect to log selection changes (for development)
    effect(() => {
      const deviceType = this.selectedDeviceType();
      const model = this.selectedModel();
      console.log('Selection changed:', { deviceType, model });
    });
  }
}
