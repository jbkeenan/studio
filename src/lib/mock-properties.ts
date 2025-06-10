
import type { ThermostatType, TemperatureUnit } from '@/components/thermostat/ThermostatControl';
import type { IcalEvent } from '@/ai/flows/parse-ical-flow';

export interface PropertyThermostatConfig {
  id: string;
  initialName: string;
  initialThermostatType: ThermostatType;
  initialTargetTempC: number;
  initialBrand?: string;
  initialUnit?: TemperatureUnit;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  imageHint: string;
  thermostats: PropertyThermostatConfig[];
  icalUrl?: string; // Explicitly add icalUrl
  syncedBookingEvents?: IcalEvent[];
  lastSyncTimestamp?: string; // ISO string
}

export let mockProperties: Property[] = [ // Changed to let for in-memory updates
  {
    id: 'property-1',
    name: 'Cozy Downtown Apartment',
    address: '123 Main St, Anytown, USA',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'apartment building',
    thermostats: [
      { id: 'living-room-1', initialName: 'Living Room', initialThermostatType: 'central', initialTargetTempC: 21, initialBrand: 'Nest', initialUnit: 'C' },
      { id: 'bedroom-1', initialName: 'Bedroom', initialThermostatType: 'split', initialTargetTempC: 20, initialBrand: 'Daikin', initialUnit: 'F' },
    ],
    icalUrl: 'https://app.ownerrez.com/feeds/ical/6b5cb4a943524fd1b9231177736b3053', // Sample for property 1
  },
  {
    id: 'property-2',
    name: 'Spacious Suburban House',
    address: '456 Oak Ave, Suburbia, USA',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'suburban house',
    thermostats: [
      { id: 'main-floor-2', initialName: 'Main Floor', initialThermostatType: 'central', initialTargetTempC: 22, initialBrand: 'Ecobee', initialUnit: 'C' },
      { id: 'upstairs-2', initialName: 'Upstairs', initialThermostatType: 'central', initialTargetTempC: 21, initialBrand: 'Ecobee', initialUnit: 'C' },
      { id: 'guest-suite-2', initialName: 'Guest Suite', initialThermostatType: 'split', initialTargetTempC: 20, initialBrand: 'Mitsubishi', initialUnit: 'F' },
    ],
    // No icalUrl for property 2 by default
  },
  {
    id: 'property-3',
    name: 'Beachfront Condo',
    address: '789 Ocean Dr, Beachtown, USA',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'beach condo',
    thermostats: [
      { id: 'living-area-3', initialName: 'Living Area', initialThermostatType: 'split', initialTargetTempC: 24, initialBrand: 'LG', initialUnit: 'C' },
    ],
    icalUrl: 'https://app.ownerrez.com/feeds/ical/6b5cb4a943524fd1b9231177736b3053', // Same sample for demo
  },
  {
    id: 'property-4',
    name: 'Rustic Mountain Cabin',
    address: '101 Pine Ln, Mountainville, USA',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'mountain cabin',
    thermostats: [
      { id: 'main-cabin-4', initialName: 'Main Cabin', initialThermostatType: 'central', initialTargetTempC: 19, initialBrand: 'Honeywell', initialUnit: 'F' },
    ],
  }
];

export function getPropertyById(id: string): Property | undefined {
  return mockProperties.find(p => p.id === id);
}

// Function to update the in-memory mockProperties array.
// This is a workaround for direct modification in API routes which might not persist due to module caching/reloading.
export function updatePropertySyncData(propertyId: string, events: IcalEvent[] | undefined, timestamp: string | undefined, newIcalUrl?: string): boolean {
  const propertyIndex = mockProperties.findIndex(p => p.id === propertyId);
  if (propertyIndex !== -1) {
    mockProperties[propertyIndex] = {
      ...mockProperties[propertyIndex],
      syncedBookingEvents: events,
      lastSyncTimestamp: timestamp,
      icalUrl: newIcalUrl !== undefined ? newIcalUrl : mockProperties[propertyIndex].icalUrl,
    };
    return true;
  }
  return false;
}
