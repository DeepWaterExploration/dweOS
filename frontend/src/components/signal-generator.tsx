import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface FrequenecyControlProps {
  pin: number;
}

const FrequencyControl: React.FC<FrequenecyControlProps> = ({ pin }) => {
  return (
    <Card className="my-5">
      <CardHeader>
        <h3 className="font-semibold text-lg">Frequency Control</h3>
        <h3 className="text-m">Pin {pin}</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Label className="truncate">Frequency</Label>
            <Input type="number" id="quantity" defaultValue="0" className="min-w-8" min="0" />
          </div>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Label className="w-fit">Duty Cycle</Label>
            <Input type="number" id="quantity" defaultValue="0" min="0" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Set Frequency</Button>
      </CardFooter>
    </Card>
  );
};

const SignalGeneratorLayout = () => {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-lg">Signal Generator</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          <FrequencyControl pin={12} />
          <FrequencyControl pin={13} />
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalGeneratorLayout;
