import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';
import { getCategoryStats, getTotalPhotoCount, getQuestionCount } from '../../../services/QuestionService';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StatsModal({ visible, onClose }: StatsModalProps) {
  const stats = getCategoryStats();
  const totalQuestions = getQuestionCount();
  const totalPhotos = getTotalPhotoCount();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Library Stats</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>{totalQuestions}</Text>
              <Text style={styles.summaryLabel}>questions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>{totalPhotos}</Text>
              <Text style={styles.summaryLabel}>photos</Text>
            </View>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {stats.map((cat) => (
              <View key={cat.id} style={styles.row}>
                <View style={[styles.colorBar, { backgroundColor: cat.color }]} />
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.count}>{cat.questionCount}q</Text>
                <Text style={styles.count}>{cat.photoCount}p</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  list: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  colorBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  count: {
    ...typography.small,
    color: colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  closeText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
});
