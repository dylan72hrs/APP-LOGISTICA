'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/hooks/use-language';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Worker } from '@/lib/types';

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
    const generationTime = data.generationDate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

    return (
        <div ref={ref} className="bg-white text-black p-8 print:p-0 print:shadow-none print:border-none font-sans flex flex-col min-h-[90vh]" id="printable-content">
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
                    <p className="text-xs font-bold uppercase tracking-wide">Ficha imprimible de consumo de EPP</p>
                    <h1 className="text-xl font-bold">REGISTRO DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL</h1>
                    <p className='text-sm font-semibold'>EPP Tracker 3.0</p>
                </div>
                <div className='text-xs'>
                    <p><strong>ID Informe:</strong> {data.id}</p>
                    <p><strong>Fecha:</strong> {data.generationDate.toLocaleDateString(language)}</p>
                    <p><strong>Hora:</strong> {generationTime}</p>
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
                        <TableRow>
                            <TableCell className="font-bold bg-neutral-200 border-r border-black">SECCION</TableCell>
                            <TableCell>{data.worker.department}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </section>

             <section className="mt-4 p-2 border border-black rounded-md text-center bg-neutral-200">
                <p className="text-xs italic">El trabajador se compromete a mantener los Elementos de Protección Personal (EPP) en buen estado, usarlos y declara haberlos recibido en forma gratuita.</p>
            </section>

            <section className="mt-6 flex-grow">
                <div className='border-black border'>
                    <Table>
                        <TableHeader>
                            <TableRow className='border-b border-black bg-neutral-200'>
                                <TableHead className="text-black font-bold border-r border-black">Fecha</TableHead>
                                <TableHead className="text-black font-bold border-r border-black">Código</TableHead>
                                <TableHead className="text-black font-bold border-r border-black">Descripción</TableHead>
                                <TableHead className="text-black font-bold border-r border-black text-right">Cantidad</TableHead>
                                <TableHead className="text-black font-bold text-center">Recibido</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map((item, index) => (
                                <TableRow key={index} className='border-b border-black text-xs'>
                                    <TableCell className="border-r border-black">{item.date.toLocaleDateString(language)}</TableCell>
                                    <TableCell className="border-r border-black">{item.code}</TableCell>
                                    <TableCell className="border-r border-black">{item.description}</TableCell>
                                    <TableCell className="border-r border-black text-right font-medium">{item.quantity}</TableCell>
                                    <TableCell className="text-center border-l border-black"></TableCell>
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

            <section className="mt-6">
                <h2 className="mb-2 text-sm font-bold uppercase">Observaciones</h2>
                <div className="min-h-16 border border-black p-3 text-sm">
                    <p className="text-neutral-500">Sin observaciones registradas.</p>
                </div>
            </section>

            <footer className="mt-20 grid grid-cols-3 gap-8 text-center text-sm">
                <div>
                    <div className="border-t border-black pt-2">
                        <p className="font-semibold">Entrega bodega</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black pt-2">
                        <p className="font-semibold">Recibe trabajador</p>
                        <p>{data.worker.name}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black pt-2">
                        <p className="font-semibold">Observaciones / conformidad</p>
                    </div>
                </div>
            </footer>
        </div>
    );
});
ReporteTrabajador.displayName = 'ReporteTrabajador';
