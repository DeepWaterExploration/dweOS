"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";

const chartConfig = {
  usb: {
    label: "usb",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface ChartData {
  value: number;
  timestamp: number;
}

const boxMullerRandom = (function () {
  let phase = 0,
    RAND_MAX,
    array,
    random,
    x1,
    x2,
    w,
    z;

  if (crypto && typeof crypto.getRandomValues === "function") {
    RAND_MAX = Math.pow(2, 32) - 1;
    array = new Uint32Array(1);
    random = function () {
      crypto.getRandomValues(array);

      return array[0] / RAND_MAX;
    };
  } else {
    random = Math.random;
  }

  return function () {
    if (!phase) {
      do {
        x1 = 2.0 * random() - 1.0;
        x2 = 2.0 * random() - 1.0;
        w = x1 * x1 + x2 * x2;
      } while (w >= 1.0);

      w = Math.sqrt((-2.0 * Math.log(w)) / w);
      z = x1 * w;
    } else {
      z = x2 * w;
    }

    phase ^= 1;

    return z;
  };
})();

export function CPUViewer() {
  const [chartData, setChartData] = useState([] as ChartData[]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newData = [
          ...prevData,
          {
            timestamp: new Date().getTime(),
            value: (boxMullerRandom() + 5) * 10,
          },
        ];
        // Limit to the last 30 data points (adjust as needed)
        return newData.length > 50 ? newData.slice(-50) : newData;
      });
    }, 100); // Updates every second (adjust as needed)

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CPU Usage</CardTitle>
        <CardDescription>Showing total usage of the CPU</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              scale={"linear"}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={() => ""}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="value"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
        <CardFooter>
          <div className="w-full flex items-center justify-center">
            <Badge variant="secondary">
              {chartData.length > 0
                ? Math.floor(chartData[chartData.length - 1].cpu)
                : 0}
              {"%"}
            </Badge>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
