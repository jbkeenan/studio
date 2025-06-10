// src/components/smart-schedule/SmartScheduleForm.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { SmartScheduleSuggestionsInput, SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { Loader2 } from 'lucide-react';

// Schema for form validation
const formSchema = z.object({
  propertyType: z.string().min(1, "Property type is required."),
  location: z.string().min(1, "Location is required."),
  averageOccupancy: z.coerce.number().min(0, "Average occupancy must be a non-negative number."),
  historicalEnergyUsage: z.string().min(1, "Historical energy usage is required (e.g., 1500 kWh)."),
  desiredTemperature: z.string().min(1, "Desired temperature is required (e.g., 70°F)."),
  energySavingPreference: z.string().min(1, "Energy saving preference is required (e.g., 15%)."),
});

type FormValues = z.infer<typeof formSchema>;

interface SmartScheduleFormProps {
  onSubmitSuccess: (data: SmartScheduleSuggestionsOutput) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setServerError: (error: string | null) => void;
}

export function SmartScheduleForm({ onSubmitSuccess, isLoading, setIsLoading, setServerError }: SmartScheduleFormProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: 'House',
      location: 'San Francisco, CA',
      averageOccupancy: 2,
      historicalEnergyUsage: '1200 kWh',
      desiredTemperature: '72°F',
      energySavingPreference: '20%',
    },
  });

  const { getSmartScheduleSuggestionsAction } = require('@/app/actions');


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setServerError(null);
    try {
      // The action name should be `getSmartScheduleSuggestionsAction` as defined in actions.ts
      const result = await getSmartScheduleSuggestionsAction(data as SmartScheduleSuggestionsInput);

      if (result.success && result.data) {
        onSubmitSuccess(result.data);
        toast({
          title: "Schedule Suggested!",
          description: "AI has generated a new schedule.",
        });
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : "An unknown error occurred.";
        setServerError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setServerError(errorMessage);
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="font-headline">Smart Schedule Suggestions</CardTitle>
        <CardDescription>Let AI optimize your thermostat schedule for energy savings and comfort.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., House, Apartment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="averageOccupancy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Average Occupancy</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="historicalEnergyUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Energy Usage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1500 kWh per month" {...field} />
                  </FormControl>
                  <FormDescription>Provide typical monthly or annual usage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="desiredTemperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Occupied Temperature</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 72°F or 22°C" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="energySavingPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Saving Preference</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 15%, Maximize, Balanced" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Get AI Suggestions"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
