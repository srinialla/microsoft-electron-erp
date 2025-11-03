import React from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import { useToastController, useId } from '@fluentui/react-components';
import { DocumentPdf24Regular } from '@fluentui/react-icons';

export default function PDFExportPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const handleExportPDF = async (reportType: string) => {
    try {
      // In production, would generate actual PDF using a library like jsPDF or pdfkit
      dispatchToast(<div>PDF export functionality would be implemented here</div>, {
        intent: 'info',
      });
    } catch (error) {
      dispatchToast(<div>Failed to export PDF: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const exportOptions = [
    { id: 'sales-summary', label: 'Sales Summary PDF' },
    { id: 'income-statement', label: 'Income Statement PDF' },
    { id: 'balance-sheet', label: 'Balance Sheet PDF' },
    { id: 'trial-balance', label: 'Trial Balance PDF' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Export Reports to PDF</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {exportOptions.map((option) => (
          <div
            key={option.id}
            style={{
              padding: '20px',
              border: '1px solid #e1e1e1',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ margin: 0 }}>{option.label}</h3>
            <Button
              variant="primary"
              icon={<DocumentPdf24Regular />}
              onClick={() => handleExportPDF(option.id)}
            >
              Export PDF
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
