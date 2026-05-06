import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export default function UnderAgeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={styles.icon}>🔞</Text>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.body}>
          ConnectNow is only available to users who are{' '}
          <Text style={styles.highlight}>18 years or older.</Text>
        </Text>
        <Text style={styles.sub}>
          Based on the date of birth you entered, you do not meet the minimum age requirement.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.replace('Splash')}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36,
  },
  icon: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
  body: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 12 },
  highlight: { color: '#FF4C4C', fontWeight: '700' },
  sub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 40 },
  backBtn: {
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 28, paddingHorizontal: 40, paddingVertical: 14,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
