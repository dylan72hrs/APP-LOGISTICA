'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/hooks/use-language';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ValeConsumoData {
    id: string;
    date: Date;
    worker: { name: string; rut: string; position?: string; department?: string; } | null;
    project?: { name: string; id: string; } | null;
    requesterReference?: string;
    items: {
        code: string;
        description: string;
        size: string;
        consumeQuantity: number;
    }[];
    warehouse: string;
    deliveredBy: string;
}

interface ValeConsumoProps {
  data: ValeConsumoData;
}

function getVisibleVoucherNumber(id: string, date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const compactDate = `${year}${month}${day}`;
    const idSuffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'LOCAL';
    return `VE-${compactDate}-${idSuffix}`;
}

function safeValue(value: string | undefined | null) {
    return value?.trim() || 'N/A';
}

export const ValeConsumo = React.forwardRef<HTMLDivElement, ValeConsumoProps>(({ data }, ref) => {
    const { language } = useLanguage();
    const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');
    const visibleVoucherNumber = getVisibleVoucherNumber(data.id, data.date);
    const formattedDate = data.date.toLocaleDateString(language);
    const formattedTime = data.date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

    return (
        <div ref={ref} className="bg-white text-black p-8 print:p-0 print:shadow-none print:border-none font-sans" id="printable-content">
            <header className="flex justify-between items-start gap-6 border-b-2 border-black pb-4">
                <div className='flex items-center gap-4'>
                    {companyLogo && (
                        <Image
                            src={companyLogo.imageUrl}
                            alt={companyLogo.description}
                            width={72}
                            height={72}
                            data-ai-hint={companyLogo.imageHint}
                        />
                    )}
                    <div>
                        <p className="text-xl font-bold">MASTER DRILLING</p>
                        <p className="text-xs uppercase tracking-wide">Control de entrega EPP</p>
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold">Vale de Entrega de EPP</h1>
                    <p className="mt-1 font-mono text-sm">Nro. {visibleVoucherNumber}</p>
                    <p className="text-xs text-neutral-700">Registro local: {data.id}</p>
                </div>
            </header>

            <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <p><strong>Fecha:</strong> {formattedDate}</p>
                <p><strong>Hora:</strong> {formattedTime}</p>
                <p><strong>Bodega:</strong> {safeValue(data.warehouse)}</p>
                <p><strong>Responsable entrega:</strong> {safeValue(data.deliveredBy)}</p>
                <p><strong>Trabajador:</strong> {safeValue(data.worker?.name)}</p>
                <p><strong>Identificador:</strong> {safeValue(data.worker?.rut)}</p>
                <p><strong>Cargo:</strong> {safeValue(data.worker?.position)}</p>
                <p><strong>Departamento:</strong> {safeValue(data.worker?.department)}</p>
                {data.requesterReference ? (
                    <p className="col-span-2"><strong>Centro de costo / faena / area solicitante:</strong> {data.requesterReference}</p>
                ) : null}
                {data.project ? (
                    <p className="col-span-2"><strong>Referencia historica de proyecto:</strong> {data.project.name} ({data.project.id})</p>
                ) : null}
            </section>

            <section className="mt-6">
                <h2 className="mb-2 text-sm font-bold uppercase">EPP entregado</h2>
                <div className='border border-black'>
                    <Table>
                        <TableHeader>
                            <TableRow className='border-b border-black bg-neutral-200'>
                                <TableHead className="border-r border-black text-black font-bold">Codigo / SKU</TableHead>
                                <TableHead className="border-r border-black text-black font-bold">Producto</TableHead>
                                <TableHead className="border-r border-black text-black font-bold">Unidad / Talla</TableHead>
                                <TableHead className="text-right text-black font-bold">Cantidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map(item => (
                                <TableRow key={item.code} className='border-b border-black'>
                                    <TableCell className="border-r border-black">{safeValue(item.code)}</TableCell>
                                    <TableCell className="border-r border-black">{safeValue(item.description)}</TableCell>
                                    <TableCell className="border-r border-black">{safeValue(item.size)}</TableCell>
                                    <TableCell className="text-right font-medium">{item.consumeQuantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <section className="mt-6">
                <h2 className="mb-2 text-sm font-bold uppercase">Observaciones</h2>
                <div className="min-h-20 border border-black p-3 text-sm">
                    <p className="text-neutral-500">Sin observaciones registradas.</p>
                </div>
            </section>

            <footer className="mt-20 grid grid-cols-3 gap-8 text-center text-sm">
                <div>
                    <div className="border-t border-black pt-2">
                         <p className="font-semibold">Entrega bodega</p>
                         <p>{safeValue(data.deliveredBy)}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black pt-2">
                        <p className="font-semibold">Recibe trabajador</p>
                        <p>{safeValue(data.worker?.name)}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black pt-2">
                         <p className="font-semibold">Observaciones / conformidad</p>
                    </div>
                </div>
            </footer>

            <section className="mt-6 border border-black p-2 text-center text-[11px]">
                <p>El trabajador declara recibir los Elementos de Proteccion Personal indicados y se compromete a usarlos y mantenerlos en buen estado.</p>
            </section>
        </div>
    );
});
ValeConsumo.displayName = 'ValeConsumo';
