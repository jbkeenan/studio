// src/components/thermostat/ThermostatControl.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Snowflake, Flame, Power, Wind, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

type ThermostatMode = "cool" | "heat" | "auto" | "off";
type Preset = "Away" | "Comfort" | "Eco";

export function ThermostatControl() {
  const [currentTemp, setCurrentTemp] = useState(22);
  const [targetTemp, setTargetTemp] = useState(22);
  const [humidity, setHumidity] = useState(45); // Percentage
  const [mode, setMode] = useState<ThermostatMode>("auto");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Simulate real-time updates for current temperature and humidity
    const tempInterval = setInterval(() => {
      setCurrentTemp(prev => prev + (Math.random() * 0.2 - 0.1)); // Small random fluctuation
    }, 5000);
    const humidityInterval = setInterval(() => {
      setHumidity(prev => Math.max(30, Math.min(70, prev + (Math.random() * 2 - 1)))); // Fluctuate between 30-70%
    }, 7000);

    return () => {
      clearInterval(tempInterval);
      clearInterval(humidityInterval);
    };
  }, []);

  const handleModeChange = (newMode: ThermostatMode) => {
    setMode(newMode);
    if (newMode === "off") {
      // Optionally adjust targetTemp or display
    }
  };

  const handlePreset = (preset: Preset) => {
    switch (preset) {
      case "Away":
        setTargetTemp(mode === "heat" ? 18 : 26);
        break;
      case "Comfort":
        setTargetTemp(mode === "heat" ? 22 : 21);
        break;
      case "Eco":
        setTargetTemp(mode === "heat" ? 20 : 24);
        break;
    }
  };

  const modeIcons = {
    cool: <Snowflake className="h-5 w-5 text-blue-500" />,
    heat: <Flame className="h-5 w-5 text-orange-500" />,
    auto: <Zap className="h-5 w-5 text-purple-500" />,
    off: <Power className="h-5 w-5 text-muted-foreground" />,
  };

  const getTempColor = (temp: number) => {
    if (temp < 18) return "text-blue-500";
    if (temp > 25) return "text-orange-500";
    return "text-foreground";
  };
  
  if (!isClient) {
    return <Card className="w-full max-w-md mx-auto shadow-xl"><CardHeader><CardTitle>Loading Thermostat...</CardTitle></CardHeader><CardContent><div className="h-64"></div></CardContent></Card>;
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="font-headline text-xl">Living Room Thermostat</CardTitle>
        <CardDescription>Control your climate</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className={cn("text-7xl font-bold tracking-tight transition-colors duration-300", getTempColor(currentTemp))}>
            {currentTemp.toFixed(1)}°C
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Droplets className="h-5 w-5" />
            <span>Humidity: {humidity.toFixed(0)}%</span>
          </div>

          <div className="w-full space-y-2 pt-4">
            <label htmlFor="target-temp-slider" className="text-sm font-medium text-muted-foreground">
              Target: {targetTemp}°C
            </label>
            <Slider
              id="target-temp-slider"
              min={10}
              max={30}
              step={0.5}
              value={[targetTemp]}
              onValueChange={(value) => setTargetTemp(value[0])}
              disabled={mode === 'off'}
              className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:shadow-md"
            />
          </div>

          <div className="w-full pt-2">
            <Select value={mode} onValueChange={(value: ThermostatMode) => handleModeChange(value)}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  {modeIcons[mode]}
                  <SelectValue placeholder="Select mode" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cool"><div className="flex items-center gap-2"><Snowflake className="h-4 w-4 text-blue-500" /> Cool</div></SelectItem>
                <SelectItem value="heat"><div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Heat</div></SelectItem>
                <SelectItem value="auto"><div className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Auto</div></SelectItem>
                <SelectItem value="off"><div className="flex items-center gap-2"><Power className="h-4 w-4 text-muted-foreground" /> Off</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-3 gap-2 p-4 bg-muted/30">
        {(["Away", "Comfort", "Eco"] as Preset[]).map((presetName) => (
          <Button
            key={presetName}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(presetName)}
            className="flex-1 transition-all duration-150 hover:shadow-md"
          >
            {presetName}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
