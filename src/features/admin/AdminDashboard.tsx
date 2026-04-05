import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../components/ui/GlassCard';

interface MetricCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  change?: string;
}

interface Transaction {
  id: string;
  property: string;
  buyer: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
}

const monthlyData = [
  { month: 'Jan', value: 45 },
  { month: 'Fev', value: 62 },
  { month: 'Mar', value: 38 },
  { month: 'Abr', value: 75 },
  { month: 'Mai', value: 55 },
  { month: 'Jun', value: 88 },
  { month: 'Jul', value: 70 },
  { month: 'Ago', value: 92 },
  { month: 'Set', value: 65 },
  { month: 'Out', value: 78 },
  { month: 'Nov', value: 85 },
  { month: 'Dez', value: 95 },
];

const mockTransactions: Transaction[] = [
  { id: '1', property: 'Villa Costa do Sol', buyer: 'João M.', amount: '12.500.000 MZN', status: 'completed', date: '2024-01-15' },
  { id: '2', property: 'Apto Polana', buyer: 'Maria S.', amount: '8.200.000 MZN', status: 'pending', date: '2024-01-14' },
  { id: '3', property: 'Terreno Matola', buyer: 'Carlos D.', amount: '3.800.000 MZN', status: 'completed', date: '2024-01-13' },
  { id: '4', property: 'Casa Sommerschield', buyer: 'Ana P.', amount: '25.000.000 MZN', status: 'cancelled', date: '2024-01-12' },
  { id: '5', property: 'Apto Triunfo', buyer: 'Pedro L.', amount: '6.500.000 MZN', status: 'completed', date: '2024-01-11' },
];

export function AdminDashboard() {
  const { t } = useTranslation();

  const metrics: MetricCard[] = [
    { title: t('admin.totalSales'), value: '56.000.000', icon: 'trending-up', color: '#22C55E', change: '+12%' },
    { title: t('admin.newLeads'), value: '128', icon: 'people', color: '#3B82F6', change: '+8%' },
    { title: t('admin.occupancy'), value: '87%', icon: 'home', color: '#D4AF37', change: '+3%' },
    { title: t('admin.revenue'), value: '4.200.000', icon: 'cash', color: '#8B5CF6', change: '+15%' },
  ];

  const maxBarValue = Math.max(...monthlyData.map((d) => d.value));

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return '#22C55E';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {metrics.map((metric, i) => (
          <GlassCard key={i} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: `${metric.color}15` }]}>
              <Ionicons name={metric.icon} size={20} color={metric.color} />
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            {metric.change && (
              <Text style={[styles.metricChange, { color: metric.color }]}>{metric.change}</Text>
            )}
          </GlassCard>
        ))}
      </View>

      {/* Monthly Evolution Chart */}
      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('admin.monthlyEvolution')}</Text>
        <View style={styles.chart}>
          {monthlyData.map((d, i) => {
            const barHeight = (d.value / maxBarValue) * 120;
            return (
              <View key={i} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: d.value >= 80 ? '#D4AF37' : d.value >= 60 ? '#3B82F6' : '#94A3B8',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{d.month}</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      {/* Recent Transactions */}
      <GlassCard style={styles.transactionsCard}>
        <Text style={styles.transactionsTitle}>{t('admin.recentTransactions')}</Text>
        {mockTransactions.map((tx) => (
          <View key={tx.id} style={styles.transactionRow}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionProperty}>{tx.property}</Text>
              <Text style={styles.transactionBuyer}>{tx.buyer} · {tx.date}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>{tx.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(tx.status)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                  {t(`admin.status.${tx.status}`)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
    color: '#64748B',
  },
  metricChange: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_700Bold',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  chartTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingHorizontal: 4,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minWidth: 8,
  },
  barLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  transactionsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionProperty: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#0F172A',
  },
  transactionBuyer: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 12,
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
});
