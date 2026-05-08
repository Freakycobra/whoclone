import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderationAPI } from '../api/moderation';
import { colors } from '../theme/colors';

const REPORT_REASONS = [
  { id: 'nudity',       label: 'Nudity or sexual content',    emoji: '🔞' },
  { id: 'harassment',   label: 'Harassment or bullying',      emoji: '😤' },
  { id: 'hate_speech',  label: 'Hate speech or symbols',      emoji: '🚫' },
  { id: 'violence',     label: 'Violence or threats',         emoji: '⚠️' },
  { id: 'spam',         label: 'Spam or scam',                emoji: '🤖' },
  { id: 'underage',     label: 'Appears to be underage',      emoji: '👶' },
  { id: 'other',        label: 'Other',                       emoji: '📝' },
];

export default function ReportModal({
  visible,
  onClose,
  reporterId,
  reportedId,
  reportedName,
  sessionId,
}) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setLoading(true);
    try {
      await moderationAPI.report({
        reporterId,
        reportedId,
        reportedName,
        reason: selectedReason,
        sessionId,
        context: `Reported during video chat session`,
      });
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', 'Could not submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setSubmitted(false);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {submitted ? (
            // ── Success state ────────────────────────────────────────────
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Report Submitted</Text>
              <Text style={styles.successBody}>
                Thanks for keeping ConnectNow safe. Our team reviews all reports within 24 hours.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ── Report form ──────────────────────────────────────────────
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Report User</Text>
                {reportedName ? (
                  <Text style={styles.subtitle}>Reporting: {reportedName}</Text>
                ) : null}
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Why are you reporting this user?</Text>

              <View style={styles.reasonsList}>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonRow,
                      selectedReason === reason.id && styles.reasonRowActive,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                    <Text style={[
                      styles.reasonLabel,
                      selectedReason === reason.id && styles.reasonLabelActive,
                    ]}>
                      {reason.label}
                    </Text>
                    {selectedReason === reason.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selectedReason || loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={selectedReason ? ['#EF4444', '#DC2626'] : ['#333', '#333']}
                  style={[styles.submitBtn, !selectedReason && { opacity: 0.5 }]}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitText}>Submit Report</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#13131A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    position: 'absolute',
    bottom: -16,
    left: 0,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#aaa', fontSize: 14 },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    marginTop: 8,
  },
  reasonsList: { marginBottom: 20 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reasonRowActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  reasonEmoji: { fontSize: 18, marginRight: 12 },
  reasonLabel: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  reasonLabelActive: { color: '#fff', fontWeight: '600' },
  checkmark: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  submitBtn: {
    height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Success
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  successBody: {
    color: colors.textSecondary, fontSize: 14,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  doneBtn: {
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 26, paddingHorizontal: 48, paddingVertical: 14,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  doneBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
