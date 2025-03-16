import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  private router = inject(Router);
  
  // Navigation state
  isMobileMenuOpen = signal<boolean>(false);
  
  // Toggle mobile menu
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(val => !val);
  }
  
  // Close mobile menu
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
  
  // Check if route is active
  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
