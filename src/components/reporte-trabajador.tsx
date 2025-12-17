'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/hooks/use-language';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Worker, InventoryItem } from '@/lib/types';

interface ConsumedItem {
    date: Date;
    code: string;
    description: string;
    quantity: number;
}

export interface WorkerReportData {
    id: string;
    generationDate: Date;
    startDate: Date;
    endDate: Date;
    worker: Worker;
    items: ConsumedItem[];
    totalItemsConsumed: number;
}

interface ReporteTrabajadorProps {
  data: WorkerReportData;
}

export const ReporteTrabajador = React.forwardRef<HTMLDivElement, ReporteTrabajadorProps>(({ data }, ref) => {
    const { t, language } = useLanguage();
    const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');

    return (
        <div ref={ref} className="bg-white text-black p-8 print:shadow-none print:border-none print:p-0 font-sans" id="printable-content">
            <header className="flex justify-between items-start pb-4 border-b-2 border-black">
                <div className='flex items-center gap-4'>
                    {companyLogo && (
                        <Image
                            src={companyLogo.imageUrl}
                            alt={companyLogo.description}
                            width={100}
                            height={100}
                            data-ai-hint={companyLogo.imageHint}
                        />
                    )}
                </div>
                <div className="text-center">
                    <h1 className="text-xl font-bold">REGISTRO DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL</h1>
                    <p className='text-sm font-semibold'>EPP Tracker 3.0</p>
                </div>
                <div className='text-xs'>
                    <p><strong>ID Informe:</strong> {data.id}</p>
                    <p><strong>Fecha:</strong> {data.generationDate.toLocaleDateString(language)}</p>
                    <p><strong>Período:</strong> {data.startDate.toLocaleDateString(language)} - {data.endDate.toLocaleDateString(language)}</p>
                </div>
            </header>

            <section className="mt-6 p-2 border border-black rounded-md text-center bg-neutral-200">
                <p className="text-xs italic">De acuerdo con lo estipulado en la Ley 16.744, Art. 68 inciso tres "Las empresas deberán proporcionar a sus trabajadores, los equipos e implementos de protección necesarios, no pudiendo en caso alguno cobrarles su valor".</p>
            </section>
            
            <section className="mt-4 border border-black rounded-md">
                <Table className="text-sm">
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-bold bg-neutral-200 border-r border-black w-1/4">NOMBRE</TableCell>
                            <TableCell>{data.worker.name}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-bold bg-neutral-200 border-r border-black">CARGO</TableCell>
                            <TableCell>{data.worker.position}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-bold bg-neutral-200 border-r border-black">RUT</TableCell>
                            <TableCell>{data.worker.rut}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </section>

             <section className="mt-4 p-2 border border-black rounded-md text-center bg-neutral-200">
                <p className="text-xs italic">El trabajador se compromete a mantener los Elementos de Protección Personal (EPP) en buen estado, usarlos y declara haberlos recibido en forma gratuita.</p>
            </section>

            <section className="mt-6">
                <div className='border-black border'>
                    <Table>
                        <TableHeader>
                            <TableRow className='border-b border-black bg-neutral-200'>
                                <TableHead className="text-black font-bold border-r border-black">Fecha</TableHead>
                                <TableHead className="text-black font-bold border-r border-black">Código</TableHead>
                                <TableHead className="text-black font-bold border-r border-black">Descripción</TableHead>
                                <TableHead className="text-black font-bold text-right">Cantidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map((item, index) => (
                                <TableRow key={index} className='border-b border-black text-xs'>
                                    <TableCell className="border-r border-black">{item.date.toLocaleDateString(language)}</TableCell>
                                    <TableCell className="border-r border-black">{item.code}</TableCell>
                                    <TableCell className="border-r border-black">{item.description}</TableCell>
                                    <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>
            
            <section className="flex justify-end mt-4">
                <div className="text-right border-t-2 border-b-2 border-black py-1 px-4">
                    <p className="text-md font-bold">Total de Ítems Consumidos: {data.totalItemsConsumed}</p>
                </div>
            </section>

            <footer className="mt-32 grid grid-cols-2 gap-8 text-center">
                <div>
                    <div className="border-t border-black w-3/4 mx-auto pt-2">
                        <p className="font-bold">{data.worker.name}</p>
                        <p className="text-sm">{t('signature_worker')}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black w-3/4 mx-auto pt-2">
                         <p className="text-sm">{t('signature_supervisor')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
});
ReporteTrabajador.displayName = 'ReporteTrabajador';
