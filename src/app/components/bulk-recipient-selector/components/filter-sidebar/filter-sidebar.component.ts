import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Department, Team } from '../../../../models/recipient.model';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './filter-sidebar.component.html'
})
export class FilterSidebarComponent {
  @Input() searchControl!: FormControl;
  @Input() departments: Department[] = [];
  @Input() locations: string[] = [];
  @Input() teams: Team[] = [];
  @Input() selectedDepartments: string[] = [];
  @Input() selectedLocations: string[] = [];
  @Input() selectedTeams: string[] = [];
  
  @Output() toggleDepartment = new EventEmitter<string>();
  @Output() toggleLocation = new EventEmitter<string>();
  @Output() toggleTeam = new EventEmitter<string>();
  @Output() clearAllFilters = new EventEmitter<void>();
  
  isDepartmentSelected(department: string): boolean {
    return this.selectedDepartments.includes(department);
  }
  
  isLocationSelected(location: string): boolean {
    return this.selectedLocations.includes(location);
  }
  
  isTeamSelected(teamId: string): boolean {
    return this.selectedTeams.includes(teamId);
  }
  
  // Helper method to generate IDs without using regex in template
  getLocationId(location: string): string {
    return 'loc-' + location.toLowerCase().replace(' ', '-');
  }
}
