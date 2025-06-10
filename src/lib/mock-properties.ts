
import type { ThermostatType, TemperatureUnit } from '@/components/thermostat/ThermostatControl'; // Assuming these types can be made available or are simple enough to redefine if not exported

export interface PropertyThermostatConfig {
  id: string; // Unique ID for the thermostat within the property
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
}

export const mockProperties: Property[] = [
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
