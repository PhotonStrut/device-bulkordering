import { Component, OnInit, Output, EventEmitter, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { animate, style, transition, trigger, state } from '@angular/animations';

import { RecipientService } from '../../services/recipient.service';
import { Recipient, Department, Team } from '../../models/recipient.model';

// Import sub-components
import { RecipientListComponent } from './components/recipient-list/recipient-list.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { OrgStructureComponent } from './components/org-structure/org-structure.component';
import { RecentRecipientsComponent } from './components/recent-recipients/recent-recipients.component';

@Component({
  selector: 'app-bulk-recipient-selector',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    RecipientListComponent,
    FilterSidebarComponent,
    OrgStructureComponent,
    RecentRecipientsComponent
  ],
  templateUrl: './bulk-recipient-selector.component.html',
  animations: [
    trigger('modalAnimation', [
      state('closed', style({
        opacity: 0,
        transform: 'scale(0.95)'
      })),
      state('open', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('closed => open', [
        animate('200ms ease-out')
      ]),
      transition('open => closed', [
        animate('150ms ease-in')
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class BulkRecipientSelectorComponent implements OnInit, OnDestroy {
  private recipientService = inject(RecipientService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  @Output() selectionConfirmed = new EventEmitter<Recipient[]>();
  @Output() modalClosed = new EventEmitter<void>();
  
  // UI state
  isOpen = signal(false);
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  activeTab = signal<'all' | 'organization' | 'recent'>('all');
  
  // Form controls
  searchControl = new FormControl('');
  hierarchyForm: FormGroup;
  
  // Data signals
  allRecipients = signal<Recipient[]>([]);
  selectedRecipients = signal<Recipient[]>([]);
  departments = signal<Department[]>([]);
  teams = signal<Team[]>([]);
  locations = signal<string[]>([]);
  recentlySelected = signal<Recipient[]>([]);
  managers = signal<Recipient[]>([]);
  
  // Selection state
  selectedDepartments = signal<string[]>([]);
  selectedLocations = signal<string[]>([]);
  selectedTeams = signal<string[]>([]);
  
  // Organization navigation
  organizationPath = signal<{id: string, name: string}[]>([]);
  currentManagerId = signal<string | null>(null);
  
  // Computed properties
  filteredRecipients = computed(() => {
    let recipients = this.allRecipients();
    const searchQuery = this.searchControl.value || '';
    
    // Apply filters
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      recipients = recipients.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.email.toLowerCase().includes(query) ||
        (r.jobTitle && r.jobTitle.toLowerCase().includes(query))
      );
    }
    
    if (this.selectedDepartments().length > 0) {
      recipients = recipients.filter(r => this.selectedDepartments().includes(r.department));
    }
    
    if (this.selectedLocations().length > 0) {
      recipients = recipients.filter(r => 
        r.location && this.selectedLocations().includes(r.location)
      );
    }
    
    if (this.selectedTeams().length > 0) {
      recipients = recipients.filter(r => 
        r.teamId && this.selectedTeams().includes(r.teamId)
      );
    }
    
    return recipients;
  });
  
  directReports = computed(() => {
    const managerId = this.currentManagerId();
    if (!managerId) return [];
    
    return this.allRecipients().filter(r => r.managerId === managerId);
  });
  
  constructor() {
    this.hierarchyForm = this.fb.group({
      managerId: [''],
      departmentId: ['']
    });
  }
  
  ngOnInit(): void {
    // Initialize search with debounce
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      // The filteredRecipients computed property will handle the filtering
    });
    
    this.hierarchyForm.get('managerId')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(managerId => {
      if (managerId) {
        this.navigateToManager(managerId);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  open(): void {
    this.isOpen.set(true);
    this.loadData();
  }
  
  close(): void {
    this.isOpen.set(false);
    this.modalClosed.emit();
  }
  
  confirm(): void {
    this.selectionConfirmed.emit(this.selectedRecipients());
    this.close();
  }
  
  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    // Load recipients and organization data
    combineLatest([
      this.recipientService.getRecipients(),
      this.recipientService.getDepartments(),
      this.recipientService.getTeams(),
      this.recipientService.getRecentlySelected()
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([recipients, departments, teams, recentlySelected]) => {
        this.allRecipients.set(recipients);
        this.departments.set(departments);
        this.teams.set(teams);
        this.recentlySelected.set(recentlySelected);
        
        // Extract unique locations
        const locationsSet = new Set<string>();
        const managersSet = new Set<string>();
        const managers: Recipient[] = [];
        
        recipients.forEach(r => {
          if (r.location) locationsSet.add(r.location);
          if (r.hasDirectReports) {
            if (!managersSet.has(r.id)) {
              managersSet.add(r.id);
              managers.push(r);
            }
          }
        });
        
        this.locations.set(Array.from(locationsSet));
        this.managers.set(managers);
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading recipient data', err);
        this.hasError.set(true);
        this.errorMessage.set('Failed to load recipients. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
  
  retryLoading(): void {
    this.loadData();
  }
  
  // Selection methods
  toggleRecipientSelection(recipient: Recipient): void {
    const currentSelection = this.selectedRecipients();
    const isSelected = this.isRecipientSelected(recipient);
    
    if (isSelected) {
      // Remove from selection
      this.selectedRecipients.set(
        currentSelection.filter(r => r.id !== recipient.id)
      );
    } else {
      // Add to selection
      this.selectedRecipients.set([...currentSelection, recipient]);
      
      // Add to recently selected in service
      this.recipientService.addToRecentlySelected(recipient.id);
    }
  }
  
  isRecipientSelected(recipient: Recipient): boolean {
    return this.selectedRecipients().some(r => r.id === recipient.id);
  }
  
  toggleSelectAll(): void {
    const filtered = this.filteredRecipients();
    
    if (this.areAllSelected()) {
      // Deselect all visible recipients
      this.selectedRecipients.set(
        this.selectedRecipients().filter(
          selected => !filtered.some(filtered => filtered.id === selected.id)
        )
      );
    } else {
      // Select all visible recipients
      const currentSelection = this.selectedRecipients();
      const newSelection = [...currentSelection];
      
      for (const recipient of filtered) {
        if (!currentSelection.some(r => r.id === recipient.id)) {
          newSelection.push(recipient);
        }
      }
      
      this.selectedRecipients.set(newSelection);
    }
  }
  
  areAllSelected(): boolean {
    const filtered = this.filteredRecipients();
    if (filtered.length === 0) return false;
    
    return filtered.every(recipient => 
      this.selectedRecipients().some(r => r.id === recipient.id)
    );
  }
  
  // Filter methods
  toggleDepartmentFilter(department: string): void {
    const current = this.selectedDepartments();
    if (current.includes(department)) {
      this.selectedDepartments.set(current.filter(d => d !== department));
    } else {
      this.selectedDepartments.set([...current, department]);
    }
  }
  
  toggleLocationFilter(location: string): void {
    const current = this.selectedLocations();
    if (current.includes(location)) {
      this.selectedLocations.set(current.filter(l => l !== location));
    } else {
      this.selectedLocations.set([...current, location]);
    }
  }
  
  toggleTeamFilter(teamId: string): void {
    const current = this.selectedTeams();
    if (current.includes(teamId)) {
      this.selectedTeams.set(current.filter(id => id !== teamId));
    } else {
      this.selectedTeams.set([...current, teamId]);
    }
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedDepartments.set([]);
    this.selectedLocations.set([]);
    this.selectedTeams.set([]);
  }
  
  // Organization navigation methods
  navigateToRoot(): void {
    this.currentManagerId.set(null);
    this.organizationPath.set([]);
  }
  
  navigateToManager(managerId: string): void {
    // Find the manager
    const manager = this.allRecipients().find(r => r.id === managerId);
    if (!manager) return;
    
    this.currentManagerId.set(managerId);
    
    // Update breadcrumb path
    const path = [{ id: manager.id, name: manager.name }];
    this.organizationPath.set(path);
  }
  
  navigateUp(): void {
    // Get the current manager
    const managerId = this.currentManagerId();
    if (!managerId) return;
    
    const manager = this.allRecipients().find(r => r.id === managerId);
    if (!manager || !manager.managerId) {
      this.navigateToRoot();
      return;
    }
    
    // Navigate to the manager's manager
    this.navigateToManager(manager.managerId);
  }
  
  // Team helpers
  getTeamsByManager(managerId: string | null): Team[] {
    if (!managerId) return [];
    return this.teams().filter(team => team.managerId === managerId);
  }
  
  // Selection methods for teams and departments
  selectTeam(teamId: string): void {
    // Get team members by their teamId property
    const teamMembers = this.allRecipients().filter(r => r.teamId === teamId);
    
    // Add all team members to selection (if not already selected)
    const currentSelection = this.selectedRecipients();
    const newSelection = [...currentSelection];
    
    for (const member of teamMembers) {
      if (!currentSelection.some(r => r.id === member.id)) {
        newSelection.push(member);
      }
    }
    
    this.selectedRecipients.set(newSelection);
  }
  
  // UI navigation
  setActiveTab(tab: 'all' | 'organization' | 'recent'): void {
    this.activeTab.set(tab);
    
    if (tab === 'organization') {
      this.navigateToRoot();
    }
  }
}
