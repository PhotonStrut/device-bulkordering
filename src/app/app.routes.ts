import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'device-selection', 
    loadComponent: () => import('./components/device-selection/device-selection.component').then(m => m.DeviceSelectionComponent) 
  },
  { 
    path: 'recipients', 
    loadComponent: () => import('./components/recipient-selection/recipient-selection.component').then(m => m.RecipientSelectionComponent) 
  },
  { 
    path: 'shipping', 
    loadComponent: () => import('./components/shipping-address/shipping-address.component').then(m => m.ShippingAddressComponent) 
  },
  { 
    path: 'review', 
    loadComponent: () => import('./components/order-review/order-review.component').then(m => m.OrderReviewComponent) 
  },
  {
    path: 'approval',
    loadComponent: () => import('./components/order-approval/order-approval.component').then(m => m.OrderApprovalComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./components/order-history/order-history.component').then(m => m.OrderHistoryComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];