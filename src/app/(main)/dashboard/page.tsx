'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Boxes, Truck, AlertCircle, Users } from "lucide-react";
import { useLanguage } from "@/lib/hooks/use-language";
import { useMemo } from "react";
import { useWarehouse } from "@/lib/hooks/use-warehouse";
import { useData } from "@/lib/hooks/use-data";

export default function DashboardPage() {
    const { t, language } = useLanguage();
    const { selectedWarehouseId } = useWarehouse();
    const { inventory, consumptionRecords, workers } = useData();


    const filteredInventory = useMemo(() => {
        if (!selectedWarehouseId || selectedWarehouseId === 'all') return inventory;
        return inventory.filter(item => item.warehouseId === selectedWarehouseId);
    }, [selectedWarehouseId, inventory]);

    const filteredConsumptions = useMemo(() => {
        if (!selectedWarehouseId || selectedWarehouseId === 'all') return consumptionRecords;
        return consumptionRecords.filter(record => record.warehouseId === selectedWarehouseId);
    }, [selectedWarehouseId, consumptionRecords]);

    const totalItems = filteredInventory.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockItems = filteredInventory.filter(item => item.quantity < 20).length;
    const totalConsumptions = filteredConsumptions.length;

    const consumptionByDay = useMemo(() => {
        const acc: Record<string, number> = {};
        for (const record of filteredConsumptions) {
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        <div className="text-2xl font-bold">+{totalConsumptions.toLocaleString(language)}</div>
                        <p className="text-xs text-muted-foreground">{t('consumption_records')}</p>
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('active_workers')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workers.length}</div>
                        <p className="text-xs text-muted-foreground">{t('total_registered_workers')}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>{t('weekly_consumption_summary')}</CardTitle>
                        <CardDescription>{t('quantity_of_items_consumed_per_day')}</CardDescription>
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

    