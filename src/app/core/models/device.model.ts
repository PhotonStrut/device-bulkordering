export enum DeviceType {
  STANDARD_LAPTOP = 'Standard Laptop',
  RUGGED_LAPTOP = 'Rugged Laptop',
  DESKTOP = 'Desktop',
  IPAD = 'iPad'
}

export interface DeviceModel {
  id: string;
  name: string;
  type: DeviceType;
  description: string;
  imageUrl: string;
  specifications: Record<string, string>;
  features: string[];
}
