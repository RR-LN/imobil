import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useBookings, useBookingActions } from '../../hooks/useBookings';
import { colors, spacing, borderRadius, textStyles, shadows } from '../../constants/theme';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Booking } from '../../services/supabase';
import { isWeb, getContainerMaxWidth } from '../../utils/responsive';

type BookingWithRelations = Booking & {
  property: { id: string; title: string; location: string; images: string[] } | null;
  buyer: { id: string; full_name: string; avatar_url: string | null; phone: string | null } | null;
  agent: { id: string; full_name: string; avatar_url: string | null; phone: string | null } | null;
};

const STATUS_CONFIG: Record<Booking['status'], { label: string; color: string; iconName: string }> = {
  pending: { label: 'Pendente', color: colors.warning, iconName: 'schedule' },
  confirmed: { label: 'Confirmado', color: colors.success, iconName: 'check-circle' },
  cancelled: { label: 'Cancelado', color: colors.error, iconName: 'cancel' },
  completed: { label: 'Concluído', color: colors.info, iconName: 'done' },
};

export const AppointmentsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const bookingsQuery = useBookings(
    profile?.id,
    profile?.is_seller ? 'agent' : 'buyer'
  );
  const { data: bookings, isLoading, error, refetch } = bookingsQuery;
  const { updateStatus } = useBookingActions();

  const now = new Date();
  const typedBookings = bookings as BookingWithRelations[] | undefined;
  const upcomingBookings = typedBookings?.filter(
    (b) => new Date(b.scheduled_at) > now && b.status !== 'cancelled'
  ) || [];
  const pastBookings = typedBookings?.filter(
    (b) => new Date(b.scheduled_at) <= now || b.status === 'cancelled'
  ) || [];

  const handleCancelBooking = async (booking: BookingWithRelations) => {
    Alert.alert(
      'Cancelar Agendamento',
      `Tem a certeza que quer cancelar a visita a "${booking.property?.title || 'imóvel'}"?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatus.mutateAsync({
                bookingId: booking.id,
                status: 'cancelled',
              });
              refetch();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar o agendamento');
            }
          },
        },
      ]
    );
  };

  const handleConfirmBooking = async (booking: BookingWithRelations) => {
    Alert.alert(
      'Confirmar Agendamento',
      `Confirmar a visita a "${booking.property?.title || 'imóvel'}"?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Confirmar',
          onPress: async () => {
            try {
              await updateStatus.mutateAsync({
                bookingId: booking.id,
                status: 'confirmed',
              });
              refetch();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível confirmar o agendamento');
            }
          },
        },
      ]
    );
  };

  const handleContactAgent = (booking: Booking) => {
    // TODO: Navegar para chat com o agente
    Alert.alert('Info', 'Contato com agente será implementado em breve');
  };

  const renderBookingCard = ({ item }: { item: BookingWithRelations }) => {
    const status = STATUS_CONFIG[item.status];
    const date = new Date(item.scheduled_at);
    const property = item.property;
    const agent = item.agent;
    const buyer = item.buyer;

    return (
      <View style={styles.card}>
        {/* Header com status */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.iconName} {status.label}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {format(date, "EEEE, dd 'de' MMMM", { locale: pt })}
          </Text>
          <Text style={styles.timeText}>
            {format(date, 'HH:mm')}h
          </Text>
        </View>

        {/* Propriedade */}
        <View style={styles.propertySection}>
          {property?.images?.[0] ? (
            <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
          ) : (
            <View style={[styles.propertyImage, styles.propertyImagePlaceholder]}>
              <Ionicons name="home-outline" size={24} color={colors.lightMid} />
            </View>
          )}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {property?.title || 'Imóvel removido ou indisponível'}
            </Text>
            <Text style={styles.propertyLocation} numberOfLines={1}>
              📍 {property?.location || 'Localização não disponível'}
            </Text>
            {item.notes && (
              <Text style={styles.notesText} numberOfLines={2}>
                📝 {item.notes}
              </Text>
            )}
          </View>
        </View>

        {/* Agente */}
        {agent && (
          <View style={styles.agentSection}>
            <View style={styles.agentInfo}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentAvatarText}>
                  {agent.full_name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.agentName}>{agent.full_name || 'Agente'}</Text>
                <Text style={styles.agentRole}>Agente Imobiliário</Text>
                {agent.phone && (
                  <Text style={styles.agentPhone}>📞 {agent.phone}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Ações */}
        <View style={styles.actions}>
          {/* Agent actions: confirm pending, cancel/contact confirmed */}
          {profile?.is_seller && (
            <>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => handleConfirmBooking(item)}
                  activeOpacity={0.8}
                  testID="confirm-booking-button"
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                  <Text style={[styles.actionButtonText, { color: colors.white }]}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              )}
              {item.status === 'confirmed' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelBooking(item)}
                  activeOpacity={0.8}
                  testID="cancel-booking-button"
                >
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* User actions: cancel (pending/confirmed), contact */}
          {!profile?.is_seller && item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.contactButton]}
              onPress={() => handleContactAgent(item)}
              activeOpacity={0.8}
              testID="contact-agent-button"
            >
              <Ionicons name="chatbubble" size={18} color={colors.white} />
              <Text style={[styles.actionButtonText, { color: colors.white }]}>
                Contactar
              </Text>
            </TouchableOpacity>
          )}

          {/* Common: cancel for both if booking is confirmed/pending */}
          {(!profile?.is_seller || profile?.is_seller) &&
           (item.status === 'pending' || item.status === 'confirmed') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(item)}
              activeOpacity={0.8}
              testID="cancel-booking-button"
            >
              <Ionicons name="close-circle" size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = ({ type }: { type: 'upcoming' | 'past' }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === 'upcoming' ? 'calendar-outline' : 'checkmark-done-outline'}
        size={64}
        color={colors.lightMid}
      />
      <Text style={styles.emptyTitle}>
        {type === 'upcoming' ? 'Nenhum agendamento futuro' : 'Nenhum agendamento anterior'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'upcoming'
          ? 'Quando visitar um imóvel, seu agendamento aparecerá aqui'
          : 'Seus agendamentos concluídos ou cancelados aparecerão aqui'}
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="log-in-outline" size={64} color={colors.lightMid} />
          <Text style={styles.emptyTitle}>Precisa autenticar-se</Text>
          <Text style={styles.emptyText}>
            Faça login para ver seus agendamentos
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>Erro ao carregar agendamentos</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const tabs = [
    { key: 'upcoming' as const, label: 'Próximos', count: upcomingBookings.length },
    { key: 'past' as const, label: 'Anteriores', count: pastBookings.length },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }, isWeb && styles.containerWeb]}>
      {/* Header */}
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <Text style={styles.headerTitle}>Meus Agendamentos</Text>
        <Text style={styles.headerSubtitle}>
          {isAuthenticated ? `Olá, ${profile?.full_name?.split(' ')[0] || ''}` : ''}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, isWeb && styles.tabsContainerWeb]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive, isWeb && styles.tabWeb]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive, isWeb && styles.tabLabelWeb]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, isWeb && styles.tabBadgeWeb]}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.terra} />
          <Text style={styles.loadingText}>A carregar agendamentos...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'upcoming' ? upcomingBookings : pastBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            isWeb && styles.listContentWeb,
            (activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.terra}
              colors={[colors.terra]}
            />
          }
          ListEmptyComponent={<EmptyState type={activeTab} />}
          testID="bookings-list"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.warmWhite,
  },
  headerTitle: {
    ...textStyles.heading,
    fontSize: 28,
    color: colors.dark,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: colors.mid,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.terra,
  },
  tabLabel: {
    ...textStyles.body,
    color: colors.mid,
    fontSize: 15,
  },
  tabLabelActive: {
    color: colors.terra,
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: '30%',
    backgroundColor: colors.terra,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    ...textStyles.body,
    color: colors.dark,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  timeText: {
    ...textStyles.body,
    color: colors.terra,
    fontWeight: '600',
  },
  propertySection: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  propertyImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  propertyImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  propertyLocation: {
    ...textStyles.caption,
    color: colors.mid,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...textStyles.caption,
    color: colors.mid,
    fontStyle: 'italic',
  },
  agentSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.terra,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  agentAvatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  agentName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.dark,
  },
  agentRole: {
    ...textStyles.caption,
    color: colors.mid,
  },
  agentPhone: {
    ...textStyles.caption,
    color: colors.primary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.error + '15',
  },
  contactButton: {
    backgroundColor: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.success || '#10b981',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.mid,
  },
  emptyTitle: {
    ...textStyles.heading,
    fontSize: 18,
    color: colors.dark,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.mid,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },

  // WEB RESPONSIVE STYLES
  containerWeb: {
    maxWidth: getContainerMaxWidth(),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  headerWeb: {
    paddingHorizontal: spacing.lg,
  },
  tabsContainerWeb: {
    paddingHorizontal: spacing.lg,
  },
  tabWeb: {
    minWidth: 100,
  },
  tabLabelWeb: {
    fontSize: 14,
  },
  tabBadgeWeb: {
    right: 20,
  },
  listContentWeb: {
    paddingHorizontal: spacing.lg,
  },
});

export default AppointmentsScreen;
