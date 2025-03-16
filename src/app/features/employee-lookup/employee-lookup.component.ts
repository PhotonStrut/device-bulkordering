import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { DeviceType } from '../../core/models/device.model';
import { Employee } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-lookup.component.html',
})
export class EmployeeLookupComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);

  // Signals
  deviceType = signal<DeviceType | null>(null);
  searchQuery = signal<string>('');
  searchResults = signal<Employee[]>([]);
  isLoading = signal<boolean>(false);

  // Observable for search input
  private searchSubject = new Subject<string>();
  private subscription = new Subscription();

  // Computed values
  selectedEmployees = this.employeeService.selectedEmployees;
  hasSelectedEmployees = computed(() => this.selectedEmployees().length > 0);

  ngOnInit(): void {
    // Get device type from query params
    this.route.queryParams.subscribe(params => {
      const deviceTypeParam = params['deviceType'];
      if (deviceTypeParam && Object.values(DeviceType).includes(deviceTypeParam as DeviceType)) {
        this.deviceType.set(deviceTypeParam as DeviceType);
      } else {
        // Redirect back to device selection if no valid device type
        this.router.navigate(['/select-device']);
      }
    });

    // Setup search with debounce
    this.subscription.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(query => query.length >= 2 || query.length === 0),
        switchMap(query => {
          this.isLoading.set(true);
          return this.employeeService.searchEmployees(query);
        })
      ).subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error searching employees:', err);
          this.isLoading.set(false);
        }
      })
    );
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  selectEmployee(employee: Employee): void {
    this.employeeService.addSelectedEmployee(employee);
    // Clear search results after selection
    this.searchResults.set([]);
    this.searchQuery.set('');
  }

  removeEmployee(employeeId: string): void {
    this.employeeService.removeSelectedEmployee(employeeId);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  continueToShipping(): void {
    if (this.hasSelectedEmployees()) {
      this.router.navigate(['/shipping-info'], {
        queryParams: { deviceType: this.deviceType() }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/select-device']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
