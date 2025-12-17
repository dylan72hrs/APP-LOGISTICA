'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Boxes, Truck, AlertCircle, Users, CalendarDays, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/hooks/use-language";
import { useMemo } from "react";
import { useWarehouse } from "@/lib/hooks/use-warehouse";
import { useData } from "@/lib/hooks/use-data";
import { useAuth } from "@/lib/hooks/use-auth";
import { isThisMonth, isThisYear, isWithinInterval, subDays } from "date-fns";

export default function DashboardPage() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { selectedWarehouseId, availableWarehouses } = useWarehouse();
    const { inventory, consumptionRecords, workers } = useData();


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
    const lowStockItems = filteredInventory.filter(item => item.quantity < 20).length;
    
    const now = new Date();
    const last7DaysInterval = { start: subDays(now, 7), end: now };

    const weeklyConsumedItems = filteredConsumptions
        .filter(r => isWithinInterval(r.date, last7DaysInterval))
        .reduce((sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);

    const monthlyConsumedItems = filteredConsumptions
        .filter(r => isThisMonth(r.date))
        .reduce((sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
        
    const yearlyConsumedItems = filteredConsumptions
        .filter(r => isThisYear(r.date))
        .reduce((sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);


    const totalActiveWorkers = useMemo(() => {
        const consumedWorkerIds = new Set(filteredConsumptions.map(c => c.workerId));
        return workers.filter(w => consumedWorkerIds.has(w.id)).length;
    }, [workers, filteredConsumptions]);


    const consumptionByDay = useMemo(() => {
        const acc: Record<string, number> = {};
        const weeklyConsumptions = filteredConsumptions.filter(r => isWithinInterval(r.date, last7DaysInterval));
        
        for (const record of weeklyConsumptions) {
            const day = record.date.toLocaleDateString(language, { weekday: 'short' }).replace('.', '');
            const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
            acc[capitalizedDay] = (acc[capitalizedDay] || 0) + record.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        return acc;
    }, [language, filteredConsumptions]);


    const chartData = useMemo(() => {
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


    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card className="col-span-1 lg:col-span-1 xl:col-span-2">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('consumptions_this_month')}</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{monthlyConsumedItems.toLocaleString(language)}</div>
                        <p className="text-xs text-muted-foreground">{t('items_consumed')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('consumptions_this_year')}</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{yearlyConsumedItems.toLocaleString(language)}</div>
                        <p className="text-xs text-muted-foreground">{t('items_consumed')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stock_alerts')}</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockItems}</div>
                        <p className="text-xs text-muted-foreground">{t('items_less_than_20_units')}</p>
                    </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-full">
                    <CardHeader>
                        <CardTitle>{t('weekly_consumption_summary')}</CardTitle>
                        <CardDescription>{t('quantity_of_items_consumed_per_day_last_7_days')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
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
        </div>
    );
}
