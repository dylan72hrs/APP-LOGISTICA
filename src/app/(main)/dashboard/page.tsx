'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Boxes, Truck, AlertCircle, Users } from "lucide-react";
import { mockConsumptionRecords, mockInventory, mockWorkers } from "@/lib/data";

const totalItems = mockInventory.reduce((acc, item) => acc + item.quantity, 0);
const lowStockItems = mockInventory.filter(item => item.quantity < 20).length;
const totalConsumptions = mockConsumptionRecords.length;

const consumptionByDay = mockConsumptionRecords.reduce((acc, record) => {
    const day = record.date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
    acc[capitalizedDay] = (acc[capitalizedDay] || 0) + record.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc;
}, {} as Record<string, number>);


const chartData = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => ({
    name: day,
    total: consumptionByDay[day] || 0
}));


export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Items en Inventario</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalItems.toLocaleString('es-ES')}</div>
                        <p className="text-xs text-muted-foreground">Unidades totales en stock</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consumos (Últimos 7 días)</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalConsumptions.toLocaleString('es-ES')}</div>
                        <p className="text-xs text-muted-foreground">Registros de consumo</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockItems}</div>
                        <p className="text-xs text-muted-foreground">Items con menos de 20 unidades</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trabajadores Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockWorkers.length}</div>
                        <p className="text-xs text-muted-foreground">Total de trabajadores registrados</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Resumen de Consumos Semanales</CardTitle>
                        <CardDescription>Cantidad de items consumidos por día.</CardDescription>
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
