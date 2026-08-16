'use client';

import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';


import { Asset } from '../types';

interface AssetQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset | null;
    children?: React.ReactNode;
}

export const AssetQRModal: React.FC<AssetQRModalProps> = ({ isOpen, onClose, asset }: AssetQRModalProps) => {
    const componentRef = useRef<HTMLDivElement>(null);

    if (!asset) return null;

    const qrValue = JSON.stringify({
        id: asset.id,
        sn: asset.serialNumber,
        model: asset.model
    });

    const handlePrint = () => {
        if (!componentRef.current) return;

        const printContent = componentRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=600,height=600');

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Asset QR Code - ${asset.serialNumber}</title>
                        <style>
                            body {
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                            }
                            .qr-container {
                                text-align: center;
                                padding: 20px;
                                border: 2px solid #000;
                                border-radius: 8px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                            }
                            .serial {
                                font-size: 1.25rem;
                                font-weight: bold;
                                margin-top: 12px;
                                color: #000;
                            }
                            .model {
                                font-size: 0.875rem;
                                font-weight: 500;
                                color: #4b5563; /* Tailwind slate-600 */
                            }
                            img, svg {
                                max-width: 100%;
                                height: auto;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            ${printContent}
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();

            // Wait for SVG/images to render before printing
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Asset QR Code"
            size="sm"
        >
            <div className="flex flex-col items-center space-y-6 p-4">

                {/* Printable Area */}
                <div ref={componentRef} className="border-4 border-slate-900 p-4 rounded-lg bg-white w-64 h-auto text-center print:border-2 print:shadow-none print:m-0 print:w-full flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-2 w-full">
                        <div className="my-2 p-2 bg-white">
                            <QRCodeSVG
                                value={qrValue}
                                size={128}
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        <div className="text-sm font-mono font-bold mt-2 text-slate-900">{asset.serialNumber}</div>
                        <div className="text-xs text-slate-500 font-medium">{asset.model}</div>
                    </div>
                </div>

                <div className="text-sm text-slate-500 text-center max-w-xs">
                    Scan this code to quickly access asset details, history, and assignment status.
                </div>

                <div className="flex gap-3 w-full">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        leftIcon={<Printer className="h-4 w-4" />}
                        onClick={handlePrint}
                    >
                        Print QR
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
