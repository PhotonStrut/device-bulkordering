import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { Recipient, Team } from '../../../../models/recipient.model';

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './org-structure.component.html',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(30, [
            animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class OrgStructureComponent {
  @Input() hierarchyForm!: FormGroup;
  @Input() currentManagerId: string | null = null;
  @Input() organizationPath: {id: string, name: string}[] = [];
  @Input() managers: Recipient[] = [];
  @Input() directReports: Recipient[] = [];
  @Input() teams: Team[] = [];
  @Input() selectedRecipients: Recipient[] = [];
  
  @Output() navigateToRoot = new EventEmitter<void>();
  @Output() navigateToManager = new EventEmitter<string>();
  @Output() navigateUp = new EventEmitter<void>();
  @Output() selectTeam = new EventEmitter<string>();
  @Output() toggleRecipientSelection = new EventEmitter<Recipient>();
  
  // Add this property for ngModel binding
  selectedManagerId: string = '';
  
  handleManagerChange(value: string): void {
    if (value) {
      this.navigateToManager.emit(value);
    }
  }
  
  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase();
  }

  getAvatarColorClass(name: string): string {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
    ];
    
    if (!name) return colors[0];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  
  isRecipientSelected(recipient: Recipient): boolean {
    return this.selectedRecipients.some(r => r.id === recipient.id);
  }
}
