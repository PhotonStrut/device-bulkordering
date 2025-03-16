import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipient } from '../../../../models/recipient.model';

@Component({
  selector: 'app-recent-recipients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-recipients.component.html'
})
export class RecentRecipientsComponent {
  @Input() recentlySelected: Recipient[] = [];
  @Input() selectedRecipients: Recipient[] = [];
  @Output() toggleSelection = new EventEmitter<Recipient>();
  
  isRecipientSelected(recipient: Recipient): boolean {
    return this.selectedRecipients.some(r => r.id === recipient.id);
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
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}
