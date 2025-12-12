'use client';
import { PlaceholderPage } from "@/components/placeholder-page";
import { useLanguage } from "@/lib/hooks/use-language";
import { FileText } from "lucide-react";

export default function ReportsPage() {
    const { t } = useLanguage();
    return (
        <PlaceholderPage 
            title={t('reports_and_analytics')}
            description={t('generate_view_export_reports')}
            icon={FileText}
        />
    )
}
