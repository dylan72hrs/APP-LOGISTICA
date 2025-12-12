'use client';
import { PlaceholderPage } from "@/components/placeholder-page";
import { useLanguage } from "@/lib/hooks/use-language";
import { Building } from "lucide-react";

export default function ProjectsPage() {
    const { t } = useLanguage();
    return (
        <PlaceholderPage 
            title={t('project_management')}
            description={t('manage_projects_associated_with_consumptions')}
            icon={Building}
        />
    )
}
