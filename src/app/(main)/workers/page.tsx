'use client';
import { PlaceholderPage } from "@/components/placeholder-page";
import { useLanguage } from "@/lib/hooks/use-language";
import { HardHat } from "lucide-react";

export default function WorkersPage() {
    const { t } = useLanguage();
    return (
        <PlaceholderPage 
            title={t('worker_management')}
            description={t('manage_worker_information')}
            icon={HardHat}
        />
    )
}
