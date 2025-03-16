import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
  private router = inject(Router);
  
  isMenuOpen = signal(false);
  currentRoute = signal('');
  
  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute.set(event.urlAfterRedirects);
      this.isMenuOpen.set(false); // Close mobile menu on navigation
    });
  }
  
  toggleMenu(): void {
    this.isMenuOpen.update(isOpen => !isOpen);
  }
  
  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
  
  isActive(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }
}
