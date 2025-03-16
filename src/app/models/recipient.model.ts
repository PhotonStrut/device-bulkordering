/**
 * Recipient model representing an individual who will receive devices
 */
export interface Recipient {
  id: string;
  name: string;
  email: string;
  department: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  location?: string;
  teamId?: string;
  managerId?: string;
  hasDirectReports?: boolean;
  directReportCount?: number;
  avatarUrl?: string;
  notes?: string;
}

/**
 * Team model for organizational structure
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  departmentId?: string;
  managerId?: string;
}

/**
 * Department model for organizational structure
 */
export interface Department {
  id: string;
  name: string;
  headCount: number;
  managerId?: string;
  parentDepartmentId?: string;
}

/**
 * Location model for organizational structure
 */
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  headCount: number;
}

/**
 * Filter options for recipient queries
 */
export interface RecipientFilters {
  search?: string;
  departments?: string[];
  locations?: string[];
  teams?: string[];
  jobTitles?: string[];
  managerId?: string;
  teamId?: string;
  status?: ('active' | 'inactive' | 'onLeave')[];
}

/**
 * Hierarchical node for organization structure view
 */
export interface OrgNode {
  id: string;
  name: string;
  title: string;
  email?: string;
  department?: string;
  type: 'manager' | 'employee';
  hasChildren: boolean;
  children?: OrgNode[];
  parent?: OrgNode;
  level: number;
}

/**
 * Group of recipients for bulk selection
 */
export interface RecipientGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  members: string[]; // recipient IDs
  createdAt: Date;
  updatedAt: Date;
  type: 'team' | 'department' | 'custom' | 'saved';
}
