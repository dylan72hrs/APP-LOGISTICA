'use client';
import { PlaceholderPage } from "@/components/placeholder-page";
import { useLanguage } from "@/lib/hooks/use-language";
import { Truck } from "lucide-react";

export default function ConsumptionsPage() {
    const { t } = useLanguage();
    return (
        <PlaceholderPage 
            title={t('consumption_record')}
            description={t('record_epp_delivery')}
            icon={Truck}
        />
    )
}
