import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useAuthStore } from "../../store/authStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/ProfileStack";
import { GlassCard } from "../../components/ui/GlassCard";

const MENU_ITEMS = [
  { id: "favorites", icon: "heart", label: "Favoritos" },
  { id: "appointments", icon: "calendar", label: "Visitas Agendadas" },
  { id: "messages", icon: "chatbubbles", label: "Mensagens" },
  { id: "saved", icon: "bookmark", label: "Pesquisas Guardadas" },
  { id: "history", icon: "time", label: "Historico" },
  { id: "settings", icon: "settings", label: "Definicoes" },
];

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuthStore();
  const { favorites, collections } = useFavoritesStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  
  const handleMenuPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'appointments') {
      navigation.navigate('MyAppointments');
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const getBadgeCount = (id: string) => {
    if (id === "favorites") return favorites.length;
    return 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#2D3A2D" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)}>
          <GlassCard style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {profile?.full_name?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile?.full_name || "Utilizador"}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {profile?.role === "agent" ? "Agente" : profile?.role === "seller" ? "Vendedor" : "Membro"}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Object.keys(collections).length}</Text>
            <Text style={styles.statLabel}>Colecoes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Visitas</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={22} color="#5A6B5A" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {getBadgeCount(item.id) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{getBadgeCount(item.id)}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#8B988B" />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#B85C5C" />
            <Text style={styles.logoutText}>Terminar Sessao</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.version}>Kugava v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5F3",
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D3A2D",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    marginHorizontal: 20,
    alignItems: "center",
    padding: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: "#5A6B5A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3A2D",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#8B988B",
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: "rgba(90, 107, 90, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A6B5A",
    textTransform: "uppercase",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E8E4E0",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3A2D",
  },
  statLabel: {
    fontSize: 12,
    color: "#8B988B",
    marginTop: 4,
  },
  menu: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE5",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F7F5F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#2D3A2D",
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "#5A6B5A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B85C5C",
    marginLeft: 8,
  },
  version: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 12,
    color: "#8B988B",
  },
});