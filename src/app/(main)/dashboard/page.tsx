'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Boxes, Truck, AlertCircle, Users, CalendarDays, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/hooks/use-language";
import { useState, useMemo } from "react";
import { useWarehouse } from "@/lib/hooks/use-warehouse";
import { useData } from "@/lib/hooks/use-data";
import { useAuth } from "@/lib/hooks/use-auth";
import { isThisMonth, isThisYear, isWithinInterval, subDays, getWeekOfMonth, getMonth } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { selectedWarehouseId, availableWarehouses } = useWarehouse();
    const { inventory, consumptionRecords, workers } = useData();

    const [isLowStockDialogOpen, setIsLowStockDialogOpen] = useState(false);


    const filteredInventory = useMemo(() => {
        if (selectedWarehouseId === 'all') {
            if (user?.role === 'reports') {
                const countryWarehouseIds = availableWarehouses.map(w => w.id);
                return inventory.filter(item => countryWarehouseIds.includes(item.warehouseId));
            }
            return inventory;
        }
        return inventory.filter(item => item.warehouseId === selectedWarehouseId);
    }, [selectedWarehouseId, inventory, user, availableWarehouses]);

    const filteredConsumptions = useMemo(() => {
        if (selectedWarehouseId === 'all') {
             if (user?.role === 'reports') {
                const countryWarehouseIds = availableWarehouses.map(w => w.id);
                return consumptionRecords.filter(record => countryWarehouseIds.includes(record.warehouseId));
            }
            return consumptionRecords;
        }
        return consumptionRecords.filter(record => record.warehouseId === selectedWarehouseId);
    }, [selectedWarehouseId, consumptionRecords, user, availableWarehouses]);

    const totalItems = filteredInventory.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockItems = useMemo(() => filteredInventory.filter(item => item.quantity < 20), [filteredInventory]);

    const now = new Date();
    const last7DaysInterval = { start: subDays(now, 7), end: now };

    const weeklyConsumedItems = filteredConsumptions
        .filter(r => isWithinInterval(r.date, last7DaysInterval))
        .reduce((sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
        
    const consumptionByDay = useMemo(() => {
        const acc: Record<string, number> = {};
        const weeklyConsumptions = filteredConsumptions.filter(r => isWithinInterval(r.date, last7DaysInterval));
        
        for (const record of weeklyConsumptions) {
            const day = record.date.toLocaleDateString(language, { weekday: 'short' }).replace('.', '');
            const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
            acc[capitalizedDay] = (acc[capitalizedDay] || 0) + record.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        return acc;
    }, [language, filteredConsumptions, last7DaysInterval]);


    const weeklyChartData = useMemo(() => {
        const dayNames = {
            'es': ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'fr': ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        };
        const currentDayNames = dayNames[language as keyof typeof dayNames] || dayNames['en'];
        return currentDayNames.map(day => ({
            name: day,
            total: consumptionByDay[day] || 0
        }));
    }, [consumptionByDay, language]);

     const consumptionByWeekOfMonth = useMemo(() => {
        const acc: Record<string, number> = {};
        const monthlyConsumptions = filteredConsumptions.filter(r => isThisMonth(r.date));
        
        for (const record of monthlyConsumptions) {
            const weekOfMonth = getWeekOfMonth(record.date, { weekStartsOn: 1 });
            const weekKey = `${t('week')} ${weekOfMonth}`;
            acc[weekKey] = (acc[weekKey] || 0) + record.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        return acc;
    }, [filteredConsumptions, t]);

    const monthlyChartData = useMemo(() => {
        const weeks = [1, 2, 3, 4, 5];
        return weeks.map(week => {
            const weekKey = `${t('week')} ${week}`;
            return {
                name: weekKey,
                total: consumptionByWeekOfMonth[weekKey] || 0,
            }
        });
    }, [consumptionByWeekOfMonth, t]);

    const consumptionByMonthOfYear = useMemo(() => {
        const acc: Record<string, number> = {};
        const yearlyConsumptions = filteredConsumptions.filter(r => isThisYear(r.date));
        
        for (const record of yearlyConsumptions) {
            const month = record.date.toLocaleDateString(language, { month: 'short' }).replace('.', '');
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
            acc[capitalizedMonth] = (acc[capitalizedMonth] || 0) + record.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        return acc;
    }, [language, filteredConsumptions]);

    const yearlyChartData = useMemo(() => {
        const monthNames = {
            'es': ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            'fr': ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
        };
        const currentMonthNames = monthNames[language as keyof typeof monthNames] || monthNames['en'];
        return currentMonthNames.map(month => ({
            name: month,
            total: consumptionByMonthOfYear[month] || 0
        }));
    }, [consumptionByMonthOfYear, language]);


    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('items_in_inventory')}</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalItems.toLocaleString(language)}</div>
                        <p className="text-xs text-muted-foreground">{t('total_units_in_stock')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('consumptions_last_7_days')}</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{weeklyConsumedItems.toLocaleString(language)}</div>
                        <p className="text-xs text-muted-foreground">{t('items_consumed')}</p>
                    </CardContent>
                </Card>
                <Dialog open={isLowStockDialogOpen} onOpenChange={setIsLowStockDialogOpen}>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:bg-muted/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('stock_alerts')}</CardTitle>
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{lowStockItems.length}</div>
                                <p className="text-xs text-muted-foreground">{t('items_less_than_20_units')}</p>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{t('stock_alerts')}</DialogTitle>
                            <CardDescription>{t('items_less_than_20_units')}</CardDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('code')}</TableHead>
                                        <TableHead>{t('description')}</TableHead>
                                        <TableHead>{t('warehouse')}</TableHead>
                                        <TableHead className="text-right">{t('quantity')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStockItems.map(item => (
                                        <TableRow key={`${item.id}-${item.warehouseId}`}>
                                            <TableCell className="font-medium">{item.code}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>
                                                {availableWarehouses.find(w => w.id === item.warehouseId)?.name || item.warehouseId}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="destructive">{item.quantity}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 md:col-span-2 lg:col-span-7">
                    <CardHeader>
                        <CardTitle>{t('weekly_consumption_summary')}</CardTitle>
                        <CardDescription>{t('quantity_of_items_consumed_per_day_last_7_days')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--background))'}}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 md:col-span-2 lg:col-span-7">
                    <CardHeader>
                        <CardTitle>{t('consumptions_this_month')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--background))'}}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                 <Card className="col-span-1 md:col-span-2 lg:col-span-7">
                    <CardHeader>
                        <CardTitle>{t('consumptions_this_year')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={yearlyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--background))'}}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

}
