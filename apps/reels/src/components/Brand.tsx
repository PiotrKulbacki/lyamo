import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const COLORS = {
  void: '#08080c',
  text: '#e8e8ed',
  muted: '#8888a0',
  warm: '#e8a849',
  cool: '#3dd6c3',
} as const;

export function LyamoMark({ size = 72 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="lyamo-warm"
          x1="10"
          y1="40"
          x2="54"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f0c060" />
          <stop offset="1" stopColor="#e8a849" />
        </linearGradient>
        <linearGradient
          id="lyamo-cool"
          x1="16"
          y1="6"
          x2="36"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5eeadb" />
          <stop offset="1" stopColor="#3dd6c3" />
        </linearGradient>
      </defs>
      <rect x="12" y="6" width="18" height="52" rx="9" fill="url(#lyamo-warm)" opacity="0.92" />
      <rect x="12" y="40" width="40" height="18" rx="9" fill="url(#lyamo-cool)" opacity="0.78" />
    </svg>
  );
}

export function BrandBackdrop() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.void,
        backgroundImage: [
          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(232, 168, 73, 0.16), transparent)',
          'radial-gradient(ellipse 60% 40% at 90% 10%, rgba(61, 214, 195, 0.12), transparent)',
          'radial-gradient(ellipse 50% 30% at 50% 100%, rgba(255, 107, 74, 0.06), transparent)',
        ].join(', '),
      }}
    />
  );
}

type AnimatedTextProps = {
  children: React.ReactNode;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  style?: React.CSSProperties;
};

export function AnimatedText({
  children,
  delay = 0,
  fontSize = 64,
  color = COLORS.text,
  fontWeight = 700,
  style,
}: AnimatedTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [36, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        color,
        fontSize,
        fontWeight,
        lineHeight: 1.15,
        letterSpacing: '-0.03em',
        textAlign: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PhoneFrame({
  children,
  scale = 1,
  style,
}: {
  children: React.ReactNode;
  scale?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: 780,
        height: 1560,
        borderRadius: 56,
        border: '3px solid rgba(232, 168, 73, 0.22)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(61, 214, 195, 0.08)',
        overflow: 'hidden',
        backgroundColor: '#0a0a10',
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export { COLORS };
