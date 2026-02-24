import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'overline' | 'button' | 'buttonSmall';

interface TextProps extends RNTextProps {
  variant?: Variant;
  muted?: boolean;
}

const variantClasses: Record<Variant, string> = {
  h1: 'text-[28px] leading-[34px] font-bold tracking-tight',
  h2: 'text-[22px] leading-[28px] font-bold',
  h3: 'text-lg leading-6 font-semibold',
  body: 'text-base leading-6',
  bodySmall: 'text-sm leading-5',
  caption: 'text-xs leading-4',
  overline: 'text-[11px] leading-4 font-semibold tracking-wide uppercase',
  button: 'text-base leading-6 font-semibold',
  buttonSmall: 'text-sm leading-5 font-semibold',
};

export function Text({ variant = 'body', muted, className = '', ...props }: TextProps) {
  const base = variantClasses[variant];
  const color = muted ? 'text-gray-500' : 'text-gray-900';
  return <RNText className={`${base} ${color} ${className}`} {...props} />;
}
