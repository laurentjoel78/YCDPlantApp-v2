import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  onPress: () => void;
};

export default function CommunityCard({ onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content style={styles.content}>
        <Icon name="forum" size={34} color={colors.primary} />
        <View style={styles.textArea}>
          <Text variant="titleMedium">Community Discussions</Text>
          <Text variant="bodySmall" style={{ marginTop: 4, color: colors.textSecondary }}>
            Join nearby farmers to ask questions and share advice.
          </Text>
        </View>
        <Button mode="contained" onPress={onPress} contentStyle={styles.buttonContent}>
          Open
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textArea: {
    flex: 1,
  },
  buttonContent: {
    paddingHorizontal: 12,
  },
});