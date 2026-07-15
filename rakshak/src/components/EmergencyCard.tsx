import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface EmergencyCardProps {
  order: number;
  action: string;
  why: string;
  isFirst?: boolean;
}

export default function EmergencyCard({ order, action, why, isFirst = false }: EmergencyCardProps) {
  const [expanded, setExpanded] = useState(isFirst);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.backgroundElement },
      isFirst && styles.firstCard
    ]}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={[
          styles.badge, 
          { backgroundColor: isFirst ? '#D32F2F' : colors.backgroundSelected }
        ]}>
          <Text style={[
            styles.badgeText, 
            { color: isFirst ? '#FFFFFF' : colors.text }
          ]}>
            {order}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.actionText, 
            { color: colors.text },
            isFirst && styles.firstActionText
          ]}>
            {action}
          </Text>
          <Text style={[styles.tapHint, { color: colors.textSecondary }]}>
            {expanded ? '▼ Hide explanation' : '▶ Tap to see WHY'}
          </Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.backgroundSelected }]}>
          <Text style={[styles.whyTitle, { color: colors.text }]}>Why this matters:</Text>
          <Text style={[styles.whyText, { color: colors.textSecondary }]}>{why}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginVertical: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
    alignSelf: 'stretch',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  firstCard: {
    borderWidth: 2,
    borderColor: '#D32F2F', // Highlight the immediate priority action
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    gap: Spacing.half,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  firstActionText: {
    fontSize: 17,
  },
  tapHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  body: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    gap: Spacing.one,
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  whyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
