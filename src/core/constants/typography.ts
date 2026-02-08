import { TextStyle } from 'react-native';

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  } as TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  } as TextStyle,
  h3: {
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  small: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,
} as const;
