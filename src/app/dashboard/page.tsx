
// src/app/dashboard/page.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockProperties } from '@/lib/mock-properties';
import { MapPin, Home as HomeIcon } from 'lucide-react'; // Renamed Home to HomeIcon to avoid conflict

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-headline font-semibold text-primary">Your Properties</h1>
          <p className="text-muted-foreground">Select a property to view and manage its thermostats and schedules.</p>
        </div>
        
        {mockProperties.length === 0 ? (
          <div className="text-center py-10">
            <HomeIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No properties found. Add your first property to get started.</p>
            {/* Potential "Add Property" button can be added here in the future */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.map((property) => (
              <Link href={`/dashboard/property/${property.id}`} key={property.id} passHref legacyBehavior>
                <a className="block h-full">
                  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col rounded-xl bg-card hover:bg-card/90">
                    <div className="relative w-full h-48">
                      <Image
                        src={property.imageUrl}
                        alt={`Image of ${property.name}`}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={property.imageHint}
                        className="rounded-t-xl"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="font-headline text-lg text-primary">{property.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow pt-0">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{property.address}</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
        © {new Date().getFullYear()} ThermoAI. All rights reserved.
      </footer>
    </div>
  );
}
