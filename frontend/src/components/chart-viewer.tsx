"use client";

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
import { Badge } from "./ui/badge";

interface ChartViewerProps {
  label: string;
  unit: string;
  description: string;
  name: string;
  data: ChartData[];
}

export interface ChartData {
  value: number;
  timestamp: number;
}

const ChartViewer: React.FC<ChartViewerProps> = ({
  label,
  unit,
  description,
  name,
  data,
}) => {
  const chartConfig = {
    [label]: {
      label,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // const [chartData, setChartData] = useState([] as ChartData[]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setChartData((prevData) => {
  //       const newData = [
  //         ...prevData,
  //         {
  //           timestamp: new Date().getTime(),
  //           value: (boxMullerRandom() + 5) * 100,
  //         },
  //       ];
  //       // Limit to the last 30 data points (adjust as needed)
  //       return newData.length > 20 ? newData.slice(-20) : newData;
  //     });
  //   }, 500); // Updates every second (adjust as needed)

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
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
              {data.length > 0 ? Math.floor(data[data.length - 1].value) : 0}
              {`${unit}`}
            </Badge>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default ChartViewer;
