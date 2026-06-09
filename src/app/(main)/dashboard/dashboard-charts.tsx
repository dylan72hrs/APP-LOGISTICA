'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type ChartPoint = {
  name: string;
  total: number;
};

type DashboardChartsProps = {
  weeklyChartData: ChartPoint[];
  monthlyChartData: ChartPoint[];
  yearlyChartData: ChartPoint[];
  weeklyTitle: string;
  weeklyDescription: string;
  monthlyTitle: string;
  yearlyTitle: string;
};

type ChartCardProps = {
  data: ChartPoint[];
  title: string;
  description?: string;
  barFill: string;
};

function ChartCard({ data, title, description, barFill }: ChartCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-1 md:col-span-2 lg:col-span-7">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--background))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="total" fill={barFill} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardCharts({
  weeklyChartData,
  monthlyChartData,
  yearlyChartData,
  weeklyTitle,
  weeklyDescription,
  monthlyTitle,
  yearlyTitle,
}: DashboardChartsProps) {
  return (
    <>
      <ChartCard
        data={weeklyChartData}
        title={weeklyTitle}
        description={weeklyDescription}
        barFill="hsl(var(--primary))"
      />
      <ChartCard
        data={monthlyChartData}
        title={monthlyTitle}
        barFill="hsl(var(--chart-2))"
      />
      <ChartCard
        data={yearlyChartData}
        title={yearlyTitle}
        barFill="hsl(var(--chart-3))"
      />
    </>
  );
}
