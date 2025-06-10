// src/components/thermostat/ThermostatControl.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Snowflake, Flame, Power, Wind, Zap, Settings, Edit3, Type, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react'; // Ensure Loader2 is imported if used in loading state

type ThermostatMode = "cool" | "heat" | "auto" | "off";
type Preset = "Away" | "Comfort" | "Eco";
export type ThermostatType = "split" | "central";
type FanSpeed = "low" | "medium" | "high" | "auto";
type TemperatureUnit = "C" | "F";

interface ThermostatControlProps {
  initialName: string;
  initialThermostatType: ThermostatType;
  initialTargetTempC: number; // Always pass initial temp in Celsius
  initialBrand?: string;
  initialUnit?: TemperatureUnit;
}

// Helper functions for temperature conversion
const celsiusToFahrenheit = (celsius: number): number => (celsius * 9/5) + 32;
const fahrenheitToCelsius = (fahrenheit: number): number => (fahrenheit - 32) * 5/9;

export function ThermostatControl({ 
  initialName, 
  initialThermostatType, 
  initialTargetTempC = 22,
  initialBrand = "Generic",
  initialUnit = "C"
}: ThermostatControlProps) {
  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState(initialBrand);
  const [thermostatType, setThermostatType] = useState<ThermostatType>(initialThermostatType);
  const [unit, setUnit] = useState<TemperatureUnit>(initialUnit);
  
  const [currentTempC, setCurrentTempC] = useState(22); // Internal state always in Celsius
  const [targetTempC, setTargetTempC] = useState(initialTargetTempC); // Internal state always in Celsius
  
  const [humidity, setHumidity] = useState(45); // Percentage
  const [mode, setMode] = useState<ThermostatMode>("auto");
  const [fanSpeed, setFanSpeed] = useState<FanSpeed>("auto");
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Editable states for popover
  const [editableName, setEditableName] = useState(name);
  const [editableBrand, setEditableBrand] = useState(brand);
  const [editableThermostatType, setEditableThermostatType] = useState<ThermostatType>(thermostatType);
  const [editableUnit, setEditableUnit] = useState<TemperatureUnit>(unit);


  useEffect(() => {
    setIsClient(true);
    const tempInterval = setInterval(() => {
      setCurrentTempC(prev => parseFloat((prev + (Math.random() * 0.2 - 0.1)).toFixed(1)));
    }, 5000);
    const humidityInterval = setInterval(() => {
      setHumidity(prev => Math.max(30, Math.min(70, parseFloat((prev + (Math.random() * 2 - 1)).toFixed(0)))));
    }, 7000);

    return () => {
      clearInterval(tempInterval);
      clearInterval(humidityInterval);
    };
  }, []);
  
  useEffect(() => {
    setEditableName(name);
  }, [name]);

  useEffect(() => {
    setEditableBrand(brand);
  }, [brand]);

  useEffect(() => {
    setEditableThermostatType(thermostatType);
  }, [thermostatType]);

  useEffect(() => {
    setEditableUnit(unit);
  }, [unit]);


  const displayCurrentTemp = useMemo(() => {
    return unit === 'C' ? currentTempC : celsiusToFahrenheit(currentTempC);
  }, [currentTempC, unit]);

  const displayTargetTemp = useMemo(() => {
    return unit === 'C' ? targetTempC : celsiusToFahrenheit(targetTempC);
  }, [targetTempC, unit]);

  const handleModeChange = (newMode: ThermostatMode) => {
    setMode(newMode);
    if (newMode === "off") setIsBoostActive(false);
  };

  const handlePreset = (preset: Preset) => {
    if (mode === 'off') return;
    let newTargetC: number;
    switch (preset) {
      case "Away":
        newTargetC = mode === "heat" ? 18 : 26; // ~64F or ~79F
        break;
      case "Comfort":
        newTargetC = mode === "heat" ? 22 : 21; // ~72F or ~70F
        break;
      case "Eco":
        newTargetC = mode === "heat" ? 20 : 24; // ~68F or ~75F
        break;
      default:
        newTargetC = targetTempC; // Should not happen
    }
    setTargetTempC(newTargetC);
    setIsBoostActive(false);
  };

  const handleFanSpeedChange = (newSpeed: FanSpeed) => setFanSpeed(newSpeed);
  const toggleBoost = () => {
    if (mode === 'off') return;
    setIsBoostActive(!isBoostActive);
  };

  const handleSettingsSave = () => {
    setName(editableName);
    setBrand(editableBrand);
    setThermostatType(editableThermostatType);
    setUnit(editableUnit);
    setIsSettingsOpen(false);
  };
  
  const sliderMinC = 10;
  const sliderMaxC = 30;
  const sliderStepC = 0.5;

  const modeIcons = {
    cool: <Snowflake className="h-5 w-5 text-blue-500" />,
    heat: <Flame className="h-5 w-5 text-orange-500" />,
    auto: <Zap className="h-5 w-5 text-purple-500" />,
    off: <Power className="h-5 w-5 text-muted-foreground" />,
  };

  const getTempColor = (tempInCelsius: number) => {
    if (tempInCelsius < 18) return "text-blue-500";
    if (tempInCelsius > 25) return "text-orange-500";
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
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="text-center flex-grow">
            <CardTitle className="font-headline text-xl">{name}</CardTitle>
            <CardDescription>
              {brand} - {thermostatType === "split" ? "Split Unit" : "Central Air"}
            </CardDescription>
          </div>
          <Popover open={isSettingsOpen} onOpenChange={(open) => {
            setIsSettingsOpen(open);
            if (!open) { // Reset editable fields if popover is closed without saving
              setEditableName(name);
              setEditableBrand(brand);
              setEditableThermostatType(thermostatType);
              setEditableUnit(unit);
            }
          }}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary -mt-2 -mr-2">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none font-headline">Thermostat Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize your thermostat.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor={`name-${initialName}`}>Name</Label>
                    <Input
                      id={`name-${initialName}`}
                      value={editableName}
                      onChange={(e) => setEditableName(e.target.value)}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor={`brand-${initialName}`}>Brand</Label>
                    <Input
                      id={`brand-${initialName}`}
                      value={editableBrand}
                      onChange={(e) => setEditableBrand(e.target.value)}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Type</Label>
                    <Select 
                      value={editableThermostatType} 
                      onValueChange={(value: ThermostatType) => setEditableThermostatType(value)}
                    >
                      <SelectTrigger className="col-span-2 h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central Air</SelectItem>
                        <SelectItem value="split">Split Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Unit</Label>
                    <RadioGroup
                      value={editableUnit}
                      onValueChange={(value: TemperatureUnit) => setEditableUnit(value)}
                      className="col-span-2 flex gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="C" id={`unit-c-${initialName}`} />
                        <Label htmlFor={`unit-c-${initialName}`} className="font-normal">°C</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="F" id={`unit-f-${initialName}`} />
                        <Label htmlFor={`unit-f-${initialName}`} className="font-normal">°F</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <Button onClick={handleSettingsSave} size="sm">Save Changes</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className={cn("text-7xl font-bold tracking-tight transition-colors duration-300", getTempColor(currentTempC))}>
            {displayCurrentTemp.toFixed(1)}°{unit}
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Droplets className="h-5 w-5" />
            <span>Humidity: {humidity.toFixed(0)}%</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor={`target-temp-slider-${name}`} className="text-sm font-medium text-muted-foreground">
              Target: {displayTargetTemp.toFixed(1)}°{unit}
            </label>
            {isBoostActive && thermostatType === 'split' && (
              <span className="text-xs font-semibold text-primary flex items-center">
                <Zap className="h-4 w-4 mr-1" /> BOOST ACTIVE
              </span>
            )}
          </div>
          <Slider
            id={`target-temp-slider-${name}`}
            min={sliderMinC}
            max={sliderMaxC}
            step={sliderStepC}
            value={[targetTempC]}
            onValueChange={(value) => setTargetTempC(value[0])}
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
