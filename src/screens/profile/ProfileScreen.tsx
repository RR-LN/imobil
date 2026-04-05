import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import { isWeb, getContainerMaxWidth } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItem {
  icon: string;
  iconName?: string;
  title: string;
  subtitle?: string;
  route?: string;
  action?: () => void;
  danger?: boolean;
}

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { user, profile, isAuthenticated, signOut } = useAuthStore();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!profile?.full_name) return '?';
    const names = profile.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Terminar sessao',
      'Tens a certeza que queres terminar a sessao?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  // Menu items
  const menuItems: MenuItem[] = [
    {
      icon: '🏠',
      title: 'Meus Imoveis',
      subtitle: 'Gerir os teus imoveis publicados',
      route: 'MyProperties',
    },
    {
      icon: '⬆️',
      title: 'Fazer Upgrade',
      subtitle: 'Torna-te agente ou afiliado',
      route: 'Upgrade',
    },
    {
      icon: '💰',
      title: 'Afiliados',
      subtitle: 'Ganha comissões por indicações',
      route: 'Affiliate',
    },
    {
      icon: '🚪',
      title: 'Terminar Sessao',
      action: handleSignOut,
      danger: true,
    },
  ];

  // Handle menu item press
  const handleMenuPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigation.navigate(item.route as any);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        <View style={styles.notAuthContainer}>
          <Text style={styles.notAuthIcon}>👤</Text>
          <Text style={styles.notAuthTitle}>Inicia sessao</Text>
          <Text style={styles.notAuthText}>
            Entra na tua conta para aceder ao teu perfil e gerir os teus imoveis
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          { paddingBottom: insets.bottom + spacing['3xl'] },
          isWeb && styles.scrollContentWeb,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }, isWeb && styles.headerWeb]}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[colors.terra, colors.ochre]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </LinearGradient>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{profile?.full_name || 'Utilizador'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile?.role === 'affiliate' ? 'Afiliado' : profile?.is_seller ? 'Vendedor' : 'Utilizador'}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Imoveis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Visitas</Text>
          </View>
        </View>

        {/* MENU */}
        <View style={[styles.menuContainer, isWeb && styles.menuContainerWeb]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              {!item.danger && (
                <Text style={styles.menuArrow}>→</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* VERSION */}
        <Text style={styles.version}>Imobil v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  scrollView: {
    flex: 1,
  },

// HEADER
	header: {
		alignItems: 'center',
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.lg,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	headerTitle: {
		fontFamily: 'Georgia',
		fontSize: 28,
		fontWeight: '400' as const,
		color: colors.charcoal,
	},
	avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.white,
  },
  userName: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.lightMid,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  roleText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.white,
  },

  // STATS
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.charcoal,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  // MENU
  menuContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  // Removed - using MaterialIcons instead
  menuIcon: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '500',
    color: colors.charcoal,
  },
  menuTitleDanger: {
    color: '#DC3545',
  },
  menuSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 16,
    color: colors.lightMid,
  },

  // NOT AUTHENTICATED
  notAuthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  notAuthIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  notAuthTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  notAuthText: {
    fontSize: typography.sizes.md,
    color: colors.mid,
    textAlign: 'center',
    lineHeight: 22,
  },

  // VERSION
  version: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
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
  scrollContentWeb: {
    paddingHorizontal: spacing.lg,
  },
  menuContainerWeb: {
    paddingHorizontal: spacing.lg,
  },
});

export default ProfileScreen;
