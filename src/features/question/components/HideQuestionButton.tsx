import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing } from '../../../core/constants/spacing';

interface HideQuestionButtonProps {
  onHide: () => void;
}

export function HideQuestionButton({ onHide }: HideQuestionButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)} style={styles.button}>
        <Text style={styles.text}>Hide</Text>
      </TouchableOpacity>

      <ConfirmationModal
        visible={showModal}
        title="Hide Question?"
        message="This question will be removed from the question library and won't appear in future tests. You can restore all hidden questions from the home screen."
        confirmText="Hide"
        cancelText="Keep"
        onConfirm={() => {
          setShowModal(false);
          onHide();
        }}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
