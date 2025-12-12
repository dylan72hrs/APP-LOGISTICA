'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/hooks/use-language';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';

interface ValeConsumoData {
    id: string;
    date: Date;
    worker: { name: string; rut: string; } | null;
    project: { name: string; id: string; } | null;
    items: {
        code: string;
        description: string;
        size: string;
        consumeQuantity: number;
        cost: number;
    }[];
    totalCost: number;
    warehouse: string;
    deliveredBy: string;
}

interface ValeConsumoProps {
  data: ValeConsumoData;
}

export const ValeConsumo = React.forwardRef<HTMLDivElement, ValeConsumoProps>(({ data }, ref) => {
    const { t, language } = useLanguage();
    const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');

    return (
        <div ref={ref} className="bg-white text-black p-8 print:shadow-none print:border-none">
            <header className="flex justify-between items-center pb-4 border-b border-black">
                <div className='flex items-center gap-4'>
                {companyLogo && (
                    <Image
                        src={companyLogo.imageUrl}
                        alt={companyLogo.description}
                        width={80}
                        height={80}
                        data-ai-hint={companyLogo.imageHint}
                    />
                )}
                 <div>
                    <h1 className="text-2xl font-bold">MASTER DRILLING</h1>
                    <p className="text-sm">EPP Tracker 3.0</p>
                 </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold">{t('consumption_voucher')}</h2>
                    <p className="text-right font-mono">{data.id}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                    <p><strong>{t('date')}:</strong> {data.date.toLocaleDateString(language)}</p>
                    <p><strong>{t('warehouse')}:</strong> {data.warehouse}</p>
                </div>
                <div>
                    <p><strong>{t('worker')}:</strong> {data.worker?.name}</p>
                    <p><strong>{t('rut')}:</strong> {data.worker?.rut}</p>
                    <p><strong>{t('project')}:</strong> {data.project?.name} ({data.project?.id})</p>
                </div>
            </section>

            <section className="mt-6">
                <div className='border-black border'>
                    <Table>
                        <TableHeader>
                            <TableRow className='border-b border-black'>
                                <TableHead className="text-black border-r border-black">{t('code')}</TableHead>
                                <TableHead className="text-black border-r border-black">{t('description')}</TableHead>
                                <TableHead className="text-black text-right border-r border-black">{t('quantity')}</TableHead>
                                <TableHead className="text-black text-right border-r border-black">{t('unit_cost')}</TableHead>
                                <TableHead className="text-black text-right">{t('total')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map(item => (
                                <TableRow key={item.code} className='border-b border-black'>
                                    <TableCell className="border-r border-black">{item.code}</TableCell>
                                    <TableCell className="border-r border-black">{item.description}</TableCell>
                                    <TableCell className="text-right border-r border-black">{item.consumeQuantity}</TableCell>
                                    <TableCell className="text-right border-r border-black">${item.cost.toLocaleString(language)}</TableCell>
                                    <TableCell className="text-right">${(item.cost * item.consumeQuantity).toLocaleString(language)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>
            
            <section className="flex justify-end mt-4">
                <div className="text-right">
                    <p className="text-lg font-bold">{t('total_cost')}: ${data.totalCost.toLocaleString(language)}</p>
                </div>
            </section>

            <footer className="mt-24 grid grid-cols-3 gap-8 text-center">
                <div>
                    <div className="border-t border-black w-full mx-auto pt-2">
                        <p>{t('signature_worker')}</p>
                        <p className='font-bold'>{data.worker?.name}</p>
                    </div>
                </div>
                 <div>
                    <div className="border-t border-black w-full mx-auto pt-2">
                         <p>{t('signature_delivered_by')}</p>
                         <p className='font-bold'>{data.deliveredBy}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black w-full mx-auto pt-2">
                         <p>{t('signature_supervisor')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
});
ValeConsumo.displayName = 'ValeConsumo';

export function ValeConsumoPreview({ data }: ValeConsumoProps) {
    const { t } = useLanguage();
    
    return (
        <div>
            <div className="flex justify-end mb-4 print:hidden">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2" />
                    {t('print')}
                </Button>
            </div>
             <div id="printable-content-wrapper" className="border rounded-lg overflow-hidden print:border-none print:rounded-none" >
                <ValeConsumo data={data} />
             </div>
        </div>
    );
}
