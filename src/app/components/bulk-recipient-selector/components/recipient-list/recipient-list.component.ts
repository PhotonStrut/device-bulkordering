import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';
import { Recipient } from '../../../../models/recipient.model';

@Component({
  selector: 'app-recipient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipient-list.component.html',
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
export class RecipientListComponent {
  @Input() recipients: Recipient[] = [];
  @Input() selectedRecipients: Recipient[] = [];
  @Output() toggleSelection = new EventEmitter<Recipient>();
  @Output() toggleSelectAll = new EventEmitter<void>();

  areAllSelected(): boolean {
    if (this.recipients.length === 0) return false;
    return this.recipients.every(recipient => 
      this.selectedRecipients.some(r => r.id === recipient.id)
    );
  }

  isRecipientSelected(recipient: Recipient): boolean {
    return this.selectedRecipients.some(r => r.id === recipient.id);
  }

  selectAll(): void {
    this.toggleSelectAll.emit();
  }

  getInitials(name: string): string {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
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
    
    // Simple hash function
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}
