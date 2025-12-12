'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/hooks/use-language";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">{description}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                <Icon className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('page_in_construction')}</p>
                <p className="mt-2 text-sm text-muted-foreground/80">{t('functionality_coming_soon')}</p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
