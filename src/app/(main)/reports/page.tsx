'use client';
import { CardDescription } from "@/components/ui/card";
import { useLanguage } from '@/lib/hooks/use-language';

export default function ReportsPage() {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('reports_and_analytics')}</h1>
                <CardDescription>{t('generate_view_export_reports')}</CardDescription>
            </div>
            {/* El contenido de los filtros y la tabla de resultados se añadirá aquí */}
        </div>
    );
}
