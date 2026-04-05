import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../constants/theme';

export const SearchScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🔍 SearchScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...textStyles.heading,
    color: colors.mid,
  },
});

export default SearchScreen;
