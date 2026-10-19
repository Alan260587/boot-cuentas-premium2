export type CountryCode = 'mexico' | 'venezuela' | 'colombia' | 'otro';

export type UserProfile = 'comprador' | 'afiliado' | 'atencion';

export interface Product {
  id: string;
  name: string;
  category: string;
  priceMxn: number;
  priceUsd: number;
  currencyType: 'USD' | 'USDT';
  description: string;
  highlights: string[];
  duration: string;
  iconName: string;
  popular?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppointmentData {
  name: string;
  country: CountryCode;
  serviceInterest: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface DayAvailability {
  dayId: string;
  name: string;
  enabled: boolean;
}

export interface ScheduleConfig {
  availableDays: DayAvailability[];
  timeSlots: string[];
  maxWaitMinutes: number;
}
