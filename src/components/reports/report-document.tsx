"use client";

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fontes se necessário (opcional para o básico)
// Font.register({ ... });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#10b981',
        paddingBottom: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#09090b',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 10,
        color: '#71717a',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    period: {
        fontSize: 12,
        color: '#10b981',
        textAlign: 'right',
        fontWeight: 'bold',
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30,
    },
    summaryCard: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    summaryLabel: {
        fontSize: 9,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    table: {
        width: 'auto',
        marginBottom: 30,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 8,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#64748b',
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
    },
    tableCell: {
        fontSize: 10,
        color: '#334155',
    },
    colDate: { width: '15%' },
    colDesc: { width: '45%' },
    colCat: { width: '20%' },
    colVal: { width: '20%', textAlign: 'right' },

    amountPositive: { color: '#059669' },
    amountNegative: { color: '#dc2626' },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#94a3b8',
    }
});

interface ReportProps {
    data: {
        userName: string;
        period: string;
        summary: {
            income: number;
            expense: number;
            balance: number;
        };
        transactions: any[];
        goals: any[];
    };
}

export const ReportDocument = ({ data }: ReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>MyFinancial</Text>
                    <Text style={styles.subtitle}>Relatório de Gestão Financeira</Text>
                </View>
                <View>
                    <Text style={styles.period}>{data.period}</Text>
                    <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                        Emitido para {data.userName}
                    </Text>
                </View>
            </View>

            {/* Resumo */}
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: '#10b981' }]}>
                    <Text style={styles.summaryLabel}>Receitas</Text>
                    <Text style={[styles.summaryValue, { color: '#059669' }]}>
                        {data.summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                </View>
                <View style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: '#ef4444' }]}>
                    <Text style={styles.summaryLabel}>Despesas</Text>
                    <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                        {data.summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                </View>
                <View style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: '#6366f1' }]}>
                    <Text style={styles.summaryLabel}>Resultado</Text>
                    <Text style={styles.summaryValue}>
                        {data.summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                </View>
            </View>

            {/* Transações */}
            <Text style={styles.sectionTitle}>Transações do Período</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.colDate}><Text style={styles.tableCellHeader}>Data</Text></View>
                    <View style={styles.colDesc}><Text style={styles.tableCellHeader}>Descrição</Text></View>
                    <View style={styles.colCat}><Text style={styles.tableCellHeader}>Categoria</Text></View>
                    <View style={styles.colVal}><Text style={styles.tableCellHeader}>Valor</Text></View>
                </View>

                {data.transactions.map((t, i) => (
                    <View key={i} style={styles.tableRow}>
                        <View style={styles.colDate}>
                            <Text style={styles.tableCell}>{new Date(t.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <View style={styles.colDesc}>
                            <Text style={styles.tableCell}>{t.description}</Text>
                        </View>
                        <View style={styles.colCat}>
                            <Text style={styles.tableCell}>{t.category?.name || 'Geral'}</Text>
                        </View>
                        <View style={styles.colVal}>
                            <Text style={[styles.tableCell, t.type === 'EXPENSE' ? styles.amountNegative : styles.amountPositive]}>
                                {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Metas se houver */}
            {data.goals.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Status das Metas</Text>
                    <View style={{ gap: 10 }}>
                        {data.goals.map((goal, i) => (
                            <View key={i} style={{ padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{goal.name}</Text>
                                    <Text style={{ fontSize: 10 }}>
                                        {Math.min(100, Math.floor((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100))}%
                                    </Text>
                                </View>
                                <View style={{ height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 }}>
                                    <View style={{
                                        height: 4,
                                        backgroundColor: goal.color || '#10b981',
                                        borderRadius: 2,
                                        width: `${Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)}%`
                                    }} />
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}

            <View style={styles.footer}>
                <Text>MyFinancial - Gestão Inteligente</Text>
                <Text>Gerado em {new Date().toLocaleString('pt-BR')}</Text>
                <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
            </View>
        </Page>
    </Document>
);
