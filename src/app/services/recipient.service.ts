import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Recipient, Department, Team } from '../models/recipient.model';

@Injectable({
  providedIn: 'root'
})
export class RecipientService {
  private recipients: Recipient[] = [];
  private departments: Department[] = [];
  private teams: Team[] = [];
  private recentlySelected: string[] = [];

  constructor() {
    this.initMockData();
  }

  private initMockData(): void {
    // Initialize mock departments
    this.departments = [
      { id: 'dept1', name: 'Engineering', headCount: 45 },
      { id: 'dept2', name: 'Marketing', headCount: 18 },
      { id: 'dept3', name: 'Sales', headCount: 32 },
      { id: 'dept4', name: 'Human Resources', headCount: 12 },
      { id: 'dept5', name: 'Finance', headCount: 15 },
      { id: 'dept6', name: 'Operations', headCount: 23 }
    ];

    // Initialize mock teams
    this.teams = [
      { id: 'team1', name: 'Frontend', description: 'Web and mobile interfaces', memberCount: 12, departmentId: 'dept1', managerId: 'rec1' },
      { id: 'team2', name: 'Backend', description: 'APIs and services', memberCount: 15, departmentId: 'dept1', managerId: 'rec2' },
      { id: 'team3', name: 'DevOps', description: 'Infrastructure and deployment', memberCount: 8, departmentId: 'dept1', managerId: 'rec3' },
      { id: 'team4', name: 'Digital Marketing', description: 'Online campaigns', memberCount: 6, departmentId: 'dept2', managerId: 'rec7' },
      { id: 'team5', name: 'Enterprise Sales', description: 'Large business accounts', memberCount: 14, departmentId: 'dept3', managerId: 'rec10' },
      { id: 'team6', name: 'Recruitment', description: 'Talent acquisition', memberCount: 5, departmentId: 'dept4', managerId: 'rec13' }
    ];

    // Initialize mock recipients with org structure
    this.recipients = [
      // Engineering Department
      { id: 'rec1', name: 'John Smith', email: 'john.smith@company.com', department: 'Engineering', jobTitle: 'Engineering Director', location: 'San Francisco', hasDirectReports: true, directReportCount: 3, teamId: 'team1', managerId: '' },
      { id: 'rec2', name: 'Emily Johnson', email: 'emily.johnson@company.com', department: 'Engineering', jobTitle: 'Lead Developer', location: 'San Francisco', hasDirectReports: true, directReportCount: 5, teamId: 'team2', managerId: 'rec1' },
      { id: 'rec3', name: 'Michael Brown', email: 'michael.brown@company.com', department: 'Engineering', jobTitle: 'DevOps Manager', location: 'Portland', hasDirectReports: true, directReportCount: 4, teamId: 'team3', managerId: 'rec1' },
      { id: 'rec4', name: 'Sarah Davis', email: 'sarah.davis@company.com', department: 'Engineering', jobTitle: 'Senior Developer', location: 'San Francisco', hasDirectReports: false, teamId: 'team2', managerId: 'rec2' },
      { id: 'rec5', name: 'David Wilson', email: 'david.wilson@company.com', department: 'Engineering', jobTitle: 'Frontend Developer', location: 'San Francisco', hasDirectReports: false, teamId: 'team1', managerId: 'rec2' },
      { id: 'rec6', name: 'Jessica Lee', email: 'jessica.lee@company.com', department: 'Engineering', jobTitle: 'QA Engineer', location: 'Portland', hasDirectReports: false, teamId: 'team3', managerId: 'rec3' },
      
      // Marketing Department
      { id: 'rec7', name: 'Robert Martinez', email: 'robert.martinez@company.com', department: 'Marketing', jobTitle: 'Marketing Director', location: 'New York', hasDirectReports: true, directReportCount: 4, teamId: 'team4', managerId: '' },
      { id: 'rec8', name: 'Jennifer Taylor', email: 'jennifer.taylor@company.com', department: 'Marketing', jobTitle: 'Digital Marketing Manager', location: 'New York', hasDirectReports: false, teamId: 'team4', managerId: 'rec7' },
      { id: 'rec9', name: 'Thomas Anderson', email: 'thomas.anderson@company.com', department: 'Marketing', jobTitle: 'Content Strategist', location: 'New York', hasDirectReports: false, teamId: 'team4', managerId: 'rec7' },
      
      // Sales Department
      { id: 'rec10', name: 'Amanda Clark', email: 'amanda.clark@company.com', department: 'Sales', jobTitle: 'Sales Director', location: 'Chicago', hasDirectReports: true, directReportCount: 7, teamId: 'team5', managerId: '' },
      { id: 'rec11', name: 'Christopher Rodriguez', email: 'christopher.rodriguez@company.com', department: 'Sales', jobTitle: 'Account Manager', location: 'Chicago', hasDirectReports: false, teamId: 'team5', managerId: 'rec10' },
      { id: 'rec12', name: 'Elizabeth White', email: 'elizabeth.white@company.com', department: 'Sales', jobTitle: 'Sales Representative', location: 'Chicago', hasDirectReports: false, teamId: 'team5', managerId: 'rec10' },
      
      // HR Department
      { id: 'rec13', name: 'Daniel Harris', email: 'daniel.harris@company.com', department: 'Human Resources', jobTitle: 'HR Director', location: 'Boston', hasDirectReports: true, directReportCount: 3, teamId: 'team6', managerId: '' },
      { id: 'rec14', name: 'Melissa Lewis', email: 'melissa.lewis@company.com', department: 'Human Resources', jobTitle: 'Recruiter', location: 'Boston', hasDirectReports: false, teamId: 'team6', managerId: 'rec13' },
      
      // Finance Department
      { id: 'rec15', name: 'Kevin Walker', email: 'kevin.walker@company.com', department: 'Finance', jobTitle: 'Finance Director', location: 'Austin', hasDirectReports: true, directReportCount: 4, managerId: '' },
      { id: 'rec16', name: 'Patricia Young', email: 'patricia.young@company.com', department: 'Finance', jobTitle: 'Financial Analyst', location: 'Austin', hasDirectReports: false, managerId: 'rec15' },
      
      // Operations Department
      { id: 'rec17', name: 'James Martin', email: 'james.martin@company.com', department: 'Operations', jobTitle: 'Operations Director', location: 'Seattle', hasDirectReports: true, directReportCount: 5, managerId: '' },
      { id: 'rec18', name: 'Lisa Garcia', email: 'lisa.garcia@company.com', department: 'Operations', jobTitle: 'Logistics Manager', location: 'Seattle', hasDirectReports: false, managerId: 'rec17' }
    ];
  }

  // Public methods for accessing data
  getRecipients(): Observable<Recipient[]> {
    return of([...this.recipients]).pipe(delay(500));
  }

  getDepartments(): Observable<Department[]> {
    return of([...this.departments]).pipe(delay(300));
  }

  getTeams(): Observable<Team[]> {
    return of([...this.teams]).pipe(delay(300));
  }

  getRecentlySelected(): Observable<Recipient[]> {
    // Filter recipients by the recently selected IDs
    const recentRecipients = this.recentlySelected
      .map(id => this.recipients.find(r => r.id === id))
      .filter((r): r is Recipient => r !== undefined);
    
    return of(recentRecipients).pipe(delay(200));
  }

  // Method to add a recipient to the recently selected list
  addToRecentlySelected(recipientId: string): void {
    // Remove if already exists (to move to the front)
    this.recentlySelected = this.recentlySelected.filter(id => id !== recipientId);
    
    // Add to the front
    this.recentlySelected.unshift(recipientId);
    
    // Limit to 10 recent selections
    if (this.recentlySelected.length > 10) {
      this.recentlySelected = this.recentlySelected.slice(0, 10);
    }
  }

  // Method to search recipients
  searchRecipients(query: string): Observable<Recipient[]> {
    if (!query.trim()) {
      return of([]);
    }
    
    const filteredRecipients = this.recipients.filter(recipient => 
      recipient.name.toLowerCase().includes(query.toLowerCase()) ||
      recipient.email.toLowerCase().includes(query.toLowerCase()) ||
      (recipient.jobTitle && recipient.jobTitle.toLowerCase().includes(query.toLowerCase()))
    );
    
    return of(filteredRecipients).pipe(delay(300));
  }

  // Method to get a recipient by ID
  getRecipientById(id: string): Observable<Recipient | undefined> {
    return of(this.recipients.find(r => r.id === id)).pipe(delay(100));
  }

  // Method to get all direct reports for a manager
  getDirectReports(managerId: string): Observable<Recipient[]> {
    const directReports = this.recipients.filter(r => r.managerId === managerId);
    return of(directReports).pipe(delay(300));
  }
}
