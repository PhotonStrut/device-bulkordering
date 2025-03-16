import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
import { Employee } from '../models/employee.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

// Mock data for development purposes
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@photonstrut.com',
    department: 'Engineering',
    employeeId: 'EMP001'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@photonstrut.com',
    department: 'Marketing',
    employeeId: 'EMP002'
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@photonstrut.com',
    department: 'Sales',
    employeeId: 'EMP003'
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@photonstrut.com',
    department: 'Engineering',
    employeeId: 'EMP004'
  },
  {
    id: '5',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@photonstrut.com',
    department: 'IT',
    employeeId: 'EMP005'
  }
];

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = 'api/employees'; // Would be replaced with real API endpoint

  // Signal for selected employees
  private selectedEmployeesSignal = signal<Employee[]>([]);
  selectedEmployees = this.selectedEmployeesSignal.asReadonly();

  searchEmployees(query: string): Observable<Employee[]> {
    // In production, this would call the actual API
    // Using mock data with simulated delay for development
    return of(MOCK_EMPLOYEES).pipe(
      delay(300), // Simulate network latency
      map(employees => {
        if (!query || query.trim() === '') {
          return [];
        }
        
        const lowercaseQuery = query.toLowerCase();
        return employees.filter(emp => 
          emp.employeeId.toLowerCase().includes(lowercaseQuery) ||
          emp.firstName.toLowerCase().includes(lowercaseQuery) ||
          emp.lastName.toLowerCase().includes(lowercaseQuery) ||
          emp.email.toLowerCase().includes(lowercaseQuery)
        );
      }),
      catchError(error => {
        console.error('Error searching employees:', error);
        return of([]);
      })
    );
  }

  getEmployeeById(id: string): Observable<Employee | undefined> {
    // In production, this would call the actual API
    return of(MOCK_EMPLOYEES.find(emp => emp.id === id)).pipe(
      delay(200) // Simulate network latency
    );
  }

  addSelectedEmployee(employee: Employee): void {
    if (!this.isEmployeeSelected(employee.id)) {
      this.selectedEmployeesSignal.update(employees => [...employees, employee]);
    }
  }

  removeSelectedEmployee(employeeId: string): void {
    this.selectedEmployeesSignal.update(employees => 
      employees.filter(emp => emp.id !== employeeId)
    );
  }

  clearSelectedEmployees(): void {
    this.selectedEmployeesSignal.set([]);
  }

  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployeesSignal().some(emp => emp.id === employeeId);
  }

  getSelectedEmployeesCount(): number {
    return this.selectedEmployeesSignal().length;
  }
}
