'use client';
import { PlaceholderPage } from "@/components/placeholder-page";
import { useLanguage } from "@/lib/hooks/use-language";
import { BrainCircuit } from "lucide-react";

export default function RestockPage() {
    const { t } = useLanguage();
    return (
        <PlaceholderPage 
            title={t('ai_restock')}
            description={t('use_ai_for_restock_recommendations')}
            icon={BrainCircuit}
        />
    )
}
