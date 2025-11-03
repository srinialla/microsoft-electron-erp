import React, { useState, useEffect } from 'react';
import { FormDatePicker, DataGrid, LoadingSpinner } from '../../../shared/components';
import ReportsService from '../../reports/services/ReportsService';
import AccountingService from '../services/AccountingService';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';
import { Button } from '../../../renderer/components/ui/Button';

interface BalanceSheetData {
    account_type: string;
    account_name: string;
    account_code: string;
    balance: number;
}

export default function BalanceSheetPage() {
    const toasterId = useId('toaster');
    const { dispatchToast } = useToastController(toasterId);

    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState<Date | undefined>(new Date());
    const [balanceSheet, setBalanceSheet] = useState<{
        assets: BalanceSheetData[];
        liabilities: BalanceSheetData[];
        equity: BalanceSheetData[];
        totals: {
            total_assets: number;
            total_liabilities: number;
            total_equity: number;
        };
    } | null>(null);

    useEffect(() => {
        loadBalanceSheet();
    }, [asOfDate]);

    const loadBalanceSheet = async () => {
        try {
            setLoading(true);
            const trialBalance = await AccountingService.getTrialBalance(
                asOfDate?.toISOString().split('T')[0]
            );
            const accounts = await AccountingService.getAccounts();

            // Group accounts by type
            const assets: BalanceSheetData[] = [];
            const liabilities: BalanceSheetData[] = [];
            const equity: BalanceSheetData[] = [];

            trialBalance.forEach((tb) => {
                const account = accounts.find((a) => a.id === tb.account_id);
                if (!account) return;

                const accountType = account.account_type?.toLowerCase() || '';
                const balance =
                    accountType.includes('asset') || accountType === 'assets'
                        ? tb.debit - tb.credit
                        : tb.credit - tb.debit;

                const data: BalanceSheetData = {
                    account_type: account.account_type || '',
                    account_name: tb.account_name,
                    account_code: tb.account_code,
                    balance: Math.abs(balance),
                };

                if (accountType.includes('asset')) {
                    assets.push(data);
                } else if (accountType.includes('liability')) {
                    liabilities.push(data);
                } else if (accountType.includes('equity') || accountType.includes('capital')) {
                    equity.push(data);
                }
            });

            const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
            const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
            const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

            setBalanceSheet({
                assets,
                liabilities,
                equity,
                totals: {
                    total_assets: totalAssets,
                    total_liabilities: totalLiabilities,
                    total_equity: totalEquity,
                },
            });
        } catch (error) {
            dispatchToast(<div>Failed to load balance sheet: {(error as Error).message}</div>, {
                intent: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!balanceSheet) return;

        const rows: any[] = [
            ...balanceSheet.assets.map((a) => ({
                Type: 'Assets',
                'Account Code': a.account_code,
                'Account Name': a.account_name,
                Balance: a.balance,
            })),
            ...balanceSheet.liabilities.map((l) => ({
                Type: 'Liabilities',
                'Account Code': l.account_code,
                'Account Name': l.account_name,
                Balance: l.balance,
            })),
            ...balanceSheet.equity.map((e) => ({
                Type: 'Equity',
                'Account Code': e.account_code,
                'Account Name': e.account_name,
                Balance: e.balance,
            })),
            {
                Type: 'Total Assets',
                'Account Code': '',
                'Account Name': '',
                Balance: balanceSheet.totals.total_assets,
            },
            {
                Type: 'Total Liabilities',
                'Account Code': '',
                'Account Name': '',
                Balance: balanceSheet.totals.total_liabilities,
            },
            {
                Type: 'Total Equity',
                'Account Code': '',
                'Account Name': '',
                Balance: balanceSheet.totals.total_equity,
            },
        ];

        const headers = ['Type', 'Account Code', 'Account Name', 'Balance'];
        const csv = [
            headers.join(','),
            ...rows.map((row) =>
                headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance_sheet_${asOfDate?.toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        dispatchToast(<div>Balance sheet exported successfully</div>, { intent: 'success' });
    };

    const assetColumns = [
        { key: 'account_code', header: 'Account Code', sortable: true, width: '150px' },
        { key: 'account_name', header: 'Account Name', sortable: true },
        {
            key: 'balance',
            header: 'Balance',
            sortable: true,
            align: 'right' as const,
            render: (value: number) => formatCurrency(value),
        },
    ];

    if (loading) {
        return <LoadingSpinner variant="page" />;
    }

    return (
        <div style={{ padding: '24px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                }}
            >
                <h1>Balance Sheet</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <FormDatePicker
                        label="As of Date"
                        name="as_of_date"
                        value={asOfDate}
                        onChange={setAsOfDate}
                    />
                    <Button variant="outline" onClick={handleExport} icon={<ArrowDownload24Regular />}>
                        Export CSV
                    </Button>
                </div>
            </div>

            {balanceSheet && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Assets */}
                    <div>
                        <h2 style={{ marginTop: 0, color: '#107c10' }}>Assets</h2>
                        <DataGrid columns={assetColumns} data={balanceSheet.assets} />
                        <div
                            style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontWeight: 600,
                                textAlign: 'right',
                            }}
                        >
                            Total Assets: {formatCurrency(balanceSheet.totals.total_assets)}
                        </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div>
                        <h2 style={{ marginTop: 0, color: '#d13438' }}>Liabilities</h2>
                        <DataGrid columns={assetColumns} data={balanceSheet.liabilities} />
                        <div
                            style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontWeight: 600,
                                textAlign: 'right',
                            }}
                        >
                            Total Liabilities: {formatCurrency(balanceSheet.totals.total_liabilities)}
                        </div>

                        <h2 style={{ marginTop: '32px', color: '#0078d4' }}>Equity</h2>
                        <DataGrid columns={assetColumns} data={balanceSheet.equity} />
                        <div
                            style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontWeight: 600,
                                textAlign: 'right',
                            }}
                        >
                            Total Equity: {formatCurrency(balanceSheet.totals.total_equity)}
                        </div>
                    </div>
                </div>
            )}

            {balanceSheet && (
                <div
                    style={{
                        marginTop: '32px',
                        padding: '24px',
                        background: '#e8f4f8',
                        borderRadius: '8px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                        Total Assets = Total Liabilities + Equity
                    </div>
                    <div style={{ fontSize: '18px', color: '#616161' }}>
                        {formatCurrency(balanceSheet.totals.total_assets)} ={' '}
                        {formatCurrency(balanceSheet.totals.total_liabilities)} +{' '}
                        {formatCurrency(balanceSheet.totals.total_equity)}
                    </div>
                    <div
                        style={{
                            marginTop: '12px',
                            fontSize: '16px',
                            color:
                                Math.abs(
                                    balanceSheet.totals.total_assets -
                                        (balanceSheet.totals.total_liabilities +
                                            balanceSheet.totals.total_equity)
                                ) < 0.01
                                    ? '#107c10'
                                    : '#d13438',
                            fontWeight: 600,
                        }}
                    >
                        {Math.abs(
                            balanceSheet.totals.total_assets -
                                (balanceSheet.totals.total_liabilities + balanceSheet.totals.total_equity)
                        ) < 0.01
                            ? '✓ Balanced'
                            : '⚠ Not Balanced'}
                    </div>
                </div>
            )}
        </div>
    );
}
