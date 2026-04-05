import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, textStyles, shadows } from '../constants/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { backgroundColor: colors.forest, iconName: '✓' };
    case 'error':
      return { backgroundColor: '#A32D2D', iconName: '✕' };
    case 'warning':
      return { backgroundColor: colors.ochre, iconName: '⚠' };
    case 'info':
    default:
      return { backgroundColor: colors.charcoal, iconName: 'ℹ' };
  }
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [opacity] = useState(new Animated.Value(0));

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      setToast({ id: Date.now().toString(), message, type, duration });

      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        setTimeout(() => {
          hideToastInternal();
        }, duration);
      }
    },
    [opacity]
  );

  const hideToastInternal = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [opacity]);

  const hideToast = useCallback(() => {
    hideToastInternal();
  }, [hideToastInternal]);

  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning, showInfo, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { opacity, backgroundColor: getToastStyles(toast.type).backgroundColor },
          ]}
        >
          <TouchableOpacity
            style={styles.content}
            onPress={hideToast}
            activeOpacity={0.8}
          >
            <Text style={styles.icon}>{getToastStyles(toast.type).iconName}</Text>
            <Text style={styles.message}>{toast.message}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  icon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  message: {
    ...textStyles.body,
    color: colors.white,
    flex: 1,
  },
});

export default ToastProvider;
