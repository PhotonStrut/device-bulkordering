import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private readonly colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-red-100 text-red-800',
    'bg-gray-100 text-gray-800'
  ];

  private readonly placeholderImages = [
    'assets/avatars/placeholder-1.png',
    'assets/avatars/placeholder-2.png',
    'assets/avatars/placeholder-3.png',
    'assets/avatars/placeholder-4.png',
  ];

  constructor() { }

  /**
   * Get initials from a name
   * @param name Full name to get initials from
   * @returns Up to 2 initials from the name
   */
  getInitials(name: string): string {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get a consistent color class for a specific name
   * @param name The name to generate a color for
   * @returns Tailwind CSS color classes for background and text
   */
  getColorClass(name: string): string {
    if (!name) return this.colors[0];
    
    // Use a simple hash function to consistently pick a color for a name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.colors[hash % this.colors.length];
  }

  /**
   * Get a random placeholder image URL
   * @param seed Optional seed value for consistency
   * @returns URL to a placeholder avatar image
   */
  getPlaceholderImage(seed?: string): string {
    if (seed) {
      const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return this.placeholderImages[hash % this.placeholderImages.length];
    }
    
    // Return random placeholder if no seed provided
    const randomIndex = Math.floor(Math.random() * this.placeholderImages.length);
    return this.placeholderImages[randomIndex];
  }
}
