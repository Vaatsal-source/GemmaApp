import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'neutral' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function CustomButton({
  title,
  onPress,
  variant = 'neutral',
  style,
  textStyle,
  disabled = false,
}: CustomButtonProps) {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getStyles = () => {
    let backgroundColor: string = themeColors.backgroundElement;
    let textColor: string = themeColors.text;
    let borderColor: string = 'transparent';
    let borderWidth: number = 0;

    if (disabled) {
      return {
        button: {
          backgroundColor: scheme === 'dark' ? '#1A1A1A' : '#E5E5E5',
          opacity: 0.5,
        },
        text: {
          color: scheme === 'dark' ? '#555555' : '#888888',
        },
      };
    }

    switch (variant) {
      case 'danger':
        backgroundColor = '#D32F2F'; // Bright Red
        textColor = '#FFFFFF';
        break;
      case 'warning':
        backgroundColor = '#F57C00'; // Dark Orange
        textColor = '#FFFFFF';
        break;
      case 'success':
        backgroundColor = '#388E3C'; // Dark Green
        textColor = '#FFFFFF';
        break;
      case 'info':
        backgroundColor = '#1976D2'; // Blue
        textColor = '#FFFFFF';
        break;
      case 'neutral':
        backgroundColor = themeColors.backgroundSelected;
        textColor = themeColors.text;
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderColor = themeColors.text;
        borderWidth = 2;
        textColor = themeColors.text;
        break;
    }

    return {
      button: {
        backgroundColor,
        borderColor,
        borderWidth,
      },
      text: {
        color: textColor,
      },
    };
  };

  const buttonStyles = getStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        buttonStyles.button,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={title}
    >
      <Text style={[styles.text, buttonStyles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52, // Easy to press in panic
    marginVertical: Spacing.one,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
