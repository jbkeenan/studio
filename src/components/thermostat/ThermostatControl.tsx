// src/components/thermostat/ThermostatControl.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Snowflake, Flame, Power, Wind, Zap, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type ThermostatMode = "cool" | "heat" | "auto" | "off";
type Preset = "Away" | "Comfort" | "Eco";
type ThermostatType = "split" | "central";
type FanSpeed = "low" | "medium" | "high" | "auto";

interface ThermostatControlProps {
  name: string;
  thermostatType: ThermostatType;
  initialTargetTemp?: number;
}

export function ThermostatControl({ name, thermostatType, initialTargetTemp = 22 }: ThermostatControlProps) {
  const [currentTemp, setCurrentTemp] = useState(22);
  const [targetTemp, setTargetTemp] = useState(initialTargetTemp);
  const [humidity, setHumidity] = useState(45); // Percentage
  const [mode, setMode] = useState<ThermostatMode>("auto");
  const [fanSpeed, setFanSpeed] = useState<FanSpeed>("auto");
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Simulate real-time updates for current temperature and humidity
    const tempInterval = setInterval(() => {
      setCurrentTemp(prev => parseFloat((prev + (Math.random() * 0.2 - 0.1)).toFixed(1)));
    }, 5000);
    const humidityInterval = setInterval(() => {
      setHumidity(prev => Math.max(30, Math.min(70, parseFloat((prev + (Math.random() * 2 - 1)).toFixed(0)))));
    }, 7000);

    return () => {
      clearInterval(tempInterval);
      clearInterval(humidityInterval);
    };
  }, []);

  const handleModeChange = (newMode: ThermostatMode) => {
    setMode(newMode);
    if (newMode === "off") {
      setIsBoostActive(false); // Turn off boost if thermostat is off
    }
  };

  const handlePreset = (preset: Preset) => {
    if (mode === 'off') return;
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
    setIsBoostActive(false); // Presets might override boost
  };

  const handleFanSpeedChange = (newSpeed: FanSpeed) => {
    setFanSpeed(newSpeed);
  };

  const toggleBoost = () => {
    if (mode === 'off') return;
    setIsBoostActive(!isBoostActive);
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
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>Loading {name}...</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="font-headline text-xl">{name}</CardTitle>
        <CardDescription>
          {thermostatType === "split" ? "Split Unit Air Conditioner" : "Central Air System"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className={cn("text-7xl font-bold tracking-tight transition-colors duration-300", getTempColor(currentTemp))}>
            {currentTemp.toFixed(1)}°C
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Droplets className="h-5 w-5" />
            <span>Humidity: {humidity.toFixed(0)}%</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor={`target-temp-slider-${name}`} className="text-sm font-medium text-muted-foreground">
              Target: {targetTemp}°C
            </label>
            {isBoostActive && thermostatType === 'split' && (
              <span className="text-xs font-semibold text-primary flex items-center">
                <Zap className="h-4 w-4 mr-1" /> BOOST ACTIVE
              </span>
            )}
          </div>
          <Slider
            id={`target-temp-slider-${name}`}
            min={10}
            max={30}
            step={0.5}
            value={[targetTemp]}
            onValueChange={(value) => setTargetTemp(value[0])}
            disabled={mode === 'off'}
            className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:shadow-md"
          />
        </div>

        <div className="w-full">
          <Label className="text-xs text-muted-foreground mb-1 block">Mode</Label>
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

        {thermostatType === "split" && (
          <>
            <div className="w-full">
              <Label className="text-xs text-muted-foreground mb-1 block">Fan Speed</Label>
              <Select value={fanSpeed} onValueChange={(value: FanSpeed) => handleFanSpeedChange(value)} disabled={mode === 'off'}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-primary" />
                    <SelectValue placeholder="Select fan speed" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor={`boost-switch-${name}`} className="flex flex-col gap-0.5">
                <span className="font-medium">Boost Mode</span>
                <span className="text-xs text-muted-foreground">Quickly reach target temperature</span>
              </Label>
              <Switch
                id={`boost-switch-${name}`}
                checked={isBoostActive}
                onCheckedChange={toggleBoost}
                disabled={mode === 'off'}
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="grid grid-cols-3 gap-2 p-4 bg-muted/30">
        {(["Away", "Comfort", "Eco"] as Preset[]).map((presetName) => (
          <Button
            key={presetName}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(presetName)}
            disabled={mode === 'off'}
            className="flex-1 transition-all duration-150 hover:shadow-md disabled:bg-muted/50 disabled:cursor-not-allowed"
          >
            {presetName}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}

// Helper for loading state if needed elsewhere, or can be kept local.
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  )
}
