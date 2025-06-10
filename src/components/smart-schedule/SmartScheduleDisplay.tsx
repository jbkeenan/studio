// src/components/smart-schedule/SmartScheduleDisplay.tsx
import type { SmartScheduleSuggestionsOutput } from '@/ai/flows/smart-schedule-suggestions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Smile } from 'lucide-react';

interface SmartScheduleDisplayProps {
  data: SmartScheduleSuggestionsOutput;
}

function formatSchedule(scheduleString: string) {
  try {
    const schedule = JSON.parse(scheduleString);
    return (
      <ul className="space-y-1 text-sm">
        {Object.entries(schedule).map(([time, temp]) => (
          <li key={time} className="flex justify-between">
            <span>{time}:</span>
            <span className="font-medium">{temp as string}</span>
          </li>
        ))}
      </ul>
    );
  } catch (error) {
    // If JSON is invalid, display as preformatted text
    return <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded-md">{scheduleString}</pre>;
  }
}

export function SmartScheduleDisplay({ data }: SmartScheduleDisplayProps) {
  return (
    <Card className="mt-8 shadow-xl rounded-xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6 text-accent" />
          <CardTitle className="font-headline">AI Schedule Recommendation</CardTitle>
        </div>
        <CardDescription>Here's what our AI suggests for optimal performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Projected Energy Savings
          </h3>
          <Badge variant="secondary" className="text-lg bg-accent/20 text-accent-foreground border-accent">
            {data.projectedEnergySavings}
          </Badge>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Smile className="h-5 w-5 mr-2 text-primary" />
            Guest Comfort Score
          </h3>
          <Badge variant="secondary" className="text-lg bg-primary/20 text-primary-foreground border-primary">
            {data.comfortScore} / 10
          </Badge>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Suggested Schedule</h3>
          <div className="p-4 border rounded-md bg-muted/30">
            {formatSchedule(data.suggestedSchedule)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
