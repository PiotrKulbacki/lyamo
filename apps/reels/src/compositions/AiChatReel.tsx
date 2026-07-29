import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Outfit';
import { BrandBackdrop, COLORS } from '../components/Brand';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
});

const FPS = 30;

/** Original AiChatReel timeline (matches archived ai-chat-reel.mp4) */
const NUMBER_HOOK_FRAMES = Math.round(3.4 * FPS);
const TV_HOOK_FRAMES = Math.round(4.6 * FPS);
const CHAT_FRAMES = Math.round(6.6 * FPS);
const RESULT_FRAMES = Math.round(4.5 * FPS);
const END_FRAMES = Math.round(4.0 * FPS);
const DURATION = NUMBER_HOOK_FRAMES + TV_HOOK_FRAMES + CHAT_FRAMES + RESULT_FRAMES + END_FRAMES;

const TV_FROM = NUMBER_HOOK_FRAMES;
const CHAT_FROM = TV_FROM + TV_HOOK_FRAMES;
const RESULT_FROM = CHAT_FROM + CHAT_FRAMES;
const END_FROM = RESULT_FROM + RESULT_FRAMES;

function DriftBackdrop({ intensity = 1 }: { intensity?: number }) {
  const frame = useCurrentFrame();
  const x = Math.sin(frame / 48) * 18 * intensity;
  const y = Math.cos(frame / 56) * 14 * intensity;
  const scale = 1 + Math.sin(frame / 70) * 0.025 * intensity;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <BrandBackdrop />
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          backgroundImage: [
            'radial-gradient(ellipse 55% 40% at 30% 35%, rgba(232, 168, 73, 0.14), transparent 70%)',
            'radial-gradient(ellipse 50% 45% at 72% 55%, rgba(61, 214, 195, 0.12), transparent 70%)',
          ].join(', '),
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
}

/** Replaces opening number card — only amount changed to 23,50 */
function HookNumberScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const numberScale = interpolate(numberSpring, [0, 1], [0.82, 1]);
  const numberOpacity = interpolate(numberSpring, [0, 1], [0, 1]);
  const breathe = 1 + Math.sin(frame / 22) * 0.018;
  const driftY = Math.sin(frame / 40) * 6;

  const punchIn = spring({
    frame: frame - 28,
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <DriftBackdrop />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 56,
          gap: 28,
        }}
      >
        <div
          style={{
            opacity: numberOpacity,
            transform: `translateY(${driftY}px) scale(${numberScale * breathe})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 128,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 1.02,
              background: `linear-gradient(135deg, ${COLORS.warm}, #f0c060 45%, ${COLORS.cool})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            23,50&nbsp;€
            <br />
            dziennie
          </div>
        </div>

        <div
          style={{
            opacity: punchIn,
            transform: `translateY(${interpolate(punchIn, [0, 1], [28, 0])}px)`,
            color: COLORS.text,
            fontSize: 56,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.25,
            maxWidth: 920,
            letterSpacing: '-0.02em',
          }}
        >
          To dlatego nie możesz
          <br />
          odłożyć pieniędzy.
        </div>

        <div
          style={{
            marginTop: 8,
            height: 4,
            width: interpolate(frame, [36, 70], [0, 220], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.warm}, ${COLORS.cool})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Result beat — remaining daily after TV purchase */
function ResultScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const breathe = 1 + Math.sin(frame / 24) * 0.015;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <DriftBackdrop intensity={0.8} />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 64,
          gap: 20,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.92, 1]) * breathe})`,
        }}
      >
        <div
          style={{
            color: COLORS.muted,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Po zakupie TV
        </div>
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, ${COLORS.warm}, #f0c060 45%, ${COLORS.cool})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          12,53&nbsp;€
          <br />
          na dzień
        </div>
        <div
          style={{
            marginTop: 16,
            color: COLORS.text,
            fontSize: 44,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: 920,
            lineHeight: 1.3,
            opacity: 0.95,
          }}
        >
          sprawdź to zanim kupisz
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function BaseVideoSegment({
  startFrom,
  style,
}: {
  startFrom: number;
  style?: React.CSSProperties;
}) {
  return (
    <AbsoluteFill style={style}>
      <OffthreadVideo
        src={staticFile('videos/ai-chat-reel-base.mp4')}
        muted
        startFrom={startFrom}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
}

/**
 * AiChat reel: hook 23,50 €, result 12,53 €.
 * Middle + end segments reuse the archived MP4.
 */
export const AiChatReel: React.FC = () => {
  const middleFrom = TV_FROM;
  const middleDuration = TV_HOOK_FRAMES + CHAT_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      <Sequence from={0} durationInFrames={NUMBER_HOOK_FRAMES} name="HookNumber">
        <HookNumberScene />
      </Sequence>

      <Sequence from={middleFrom} durationInFrames={middleDuration} name="TvAndChat">
        <BaseVideoSegment startFrom={middleFrom} />
      </Sequence>

      <Sequence from={RESULT_FROM} durationInFrames={RESULT_FRAMES} name="Result">
        <ResultScene />
      </Sequence>

      <Sequence from={END_FROM} durationInFrames={END_FRAMES} name="End">
        <BaseVideoSegment startFrom={END_FROM} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const AI_CHAT_REEL_DURATION = DURATION;
export const AI_CHAT_REEL_FPS = FPS;
