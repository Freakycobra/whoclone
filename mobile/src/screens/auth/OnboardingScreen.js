import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '⚡',
    title: 'Meet Someone\nRight Now',
    subtitle: 'One tap. Instant video match with a real person anywhere in the world.',
    gradient: ['#7C3AED', '#9D5CF6'],
  },
  {
    id: '2',
    emoji: '🎁',
    title: 'Send Gifts,\nEarn Diamonds',
    subtitle: 'Send virtual gifts to people you like. Hosts earn real money.',
    gradient: ['#EC4899', '#F97316'],
  },
  {
    id: '3',
    emoji: '🌍',
    title: 'Go Live &\nBuild Your Audience',
    subtitle: 'Start your own live stream. Get followers, receive gifts, go viral.',
    gradient: ['#3B82F6', '#06B6D4'],
  },
  {
    id: '4',
    emoji: '👑',
    title: 'VIP = Better\nMatches',
    subtitle: 'Filter by gender and country. Zero ads. 3x faster matching.',
    gradient: ['#F59E0B', '#EF4444'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('PhoneAuth');
    }
  };

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={[...item.gradient, 'transparent']}
        style={styles.slideGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <View style={styles.slideContent}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('PhoneAuth')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  slideGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    opacity: 0.15,
  },
  slideContent: {
    alignItems: 'center',
    marginTop: -80,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#7C3AED',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaButton: {
    width: width - 48,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
});
