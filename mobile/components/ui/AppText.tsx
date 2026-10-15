import type { TextProps } from 'react-native';
import { Text } from 'react-native';

import { cn } from '@/utils/cn';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'headline'
  | 'body'
  | 'subheadline'
  | 'caption'
  | 'label'
  | 'footnote'
  | 'mono';

// Refined, compact iOS typography scale
const variants: Record<TextVariant, string> = {
  // iOS Large Title (compact)
  display: 'text-[24px] font-bold tracking-[-0.4px] leading-[30px] text-white',
  // iOS Title 1
  title: 'text-[20px] font-bold tracking-[-0.3px] leading-[26px] text-white',
  // iOS Title 2 / Heading
  heading: 'text-[17px] font-semibold tracking-[-0.2px] leading-[22px] text-white',
  // iOS Headline
  headline: 'text-[15px] font-semibold tracking-[-0.2px] leading-[20px] text-white',
  // iOS Body
  body: 'text-[14px] font-normal leading-[20px] text-white/90',
  // iOS Subheadline
  subheadline: 'text-[13px] font-normal leading-[18px] text-white/70',
  // iOS Caption
  caption: 'text-[12px] font-normal leading-[16px] text-[rgba(235,235,245,0.60)]',
  // iOS Footnote
  footnote: 'text-[11px] font-normal leading-[15px] text-[rgba(235,235,245,0.60)]',
  // iOS Label / Section Header
  label: 'text-[10px] font-semibold uppercase tracking-[0.5px] text-[rgba(235,235,245,0.45)]',
  // Monospace (Code / Terminal)
  mono: 'font-mono text-[12px] leading-[17px] text-white/90',
};

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
}

export function AppText({
  variant,
  className,
  maxFontSizeMultiplier = 1.25,
  ...props
}: AppTextProps) {
  const hasCustomSize =
    className &&
    /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|\[\d+px\])\b/.test(className);

  let variantClass = '';
  if (variant) {
    variantClass = variants[variant];
    if (hasCustomSize) {
      variantClass = variantClass
        .replace(/\btext-\[\d+px\]\b/g, '')
        .replace(/\bleading-\[\d+px\]\b/g, '')
        .trim();
    }
  } else if (!hasCustomSize) {
    variantClass = variants.body;
  } else {
    variantClass = 'text-white/90';
  }

  return (
    <Text
      className={cn(variantClass, className)}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    />
  );
}
