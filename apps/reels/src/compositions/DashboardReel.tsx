import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Outfit';
import { BrandBackdrop, COLORS, LyamoMark } from '../components/Brand';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
});

const FPS = 30;

/**
 * Timeline synced to out/sources/audio/dashboard-voiceover.mp3 (~35.7 s).
 * Whisper map (PL):
 *  0.0–9.9   intro (Lyamo / budżet / do wypłaty) → hook + early budget
 *  9.9–15.4  „średnio … dziennie / dni do wypłaty” → dashboard overview
 * 15.4–23.8  wykres kategorii / koszty stałe → analytics
 * 23.8–29.8  historia / paragony → transactions
 * 29.8–35.4  „Lyamo. Finanse pod kontrolą…” → end card (logo)
 * 35.4+      silence → logo + CTA still visible
 */
const HOOK_FRAMES = Math.round(3.5 * FPS);
const BUDGET_FRAMES = Math.round(12.0 * FPS); // through ~15.5 s
const CATEGORIES_FRAMES = Math.round(8.5 * FPS); // through ~24.0 s
const TRANSACTIONS_FRAMES = Math.round(5.8 * FPS); // through ~29.8 s
const END_FRAMES = Math.round(6.6 * FPS); // logo during closing VO + ~0.9 s silence
const DURATION = HOOK_FRAMES + BUDGET_FRAMES + CATEGORIES_FRAMES + TRANSACTIONS_FRAMES + END_FRAMES;

/** Pull narration earlier vs previous CapCut mux — VO with first number. */
const VO_START_FRAME = 0;

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

function CaptionBar({ children, delay = 8 }: { children: React.ReactNode; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captionIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 72,
        opacity: captionIn,
        transform: `translateY(${interpolate(captionIn, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          padding: '26px 36px',
          borderRadius: 26,
          background: 'rgba(8, 8, 12, 0.92)',
          border: '2px solid rgba(232, 168, 73, 0.4)',
          color: COLORS.text,
          fontSize: 48,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 14px rgba(0,0,0,0.6)',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}

type PhoneVideoProps = {
  src: string;
  startFrom?: number;
  caption: React.ReactNode;
};

/** Full phone view — no zoom/pan overlays that hide UI */
function PhoneVideoScene({ src, startFrom = 0, caption }: PhoneVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 95 } });
  const shellScale = interpolate(enter, [0, 1], [0.94, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <DriftBackdrop intensity={0.45} />
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
          transform: `scale(${shellScale})`,
          paddingBottom: 150,
        }}
      >
        <div
          style={{
            width: 780,
            height: 1360,
            borderRadius: 48,
            overflow: 'hidden',
            border: '3px solid rgba(232, 168, 73, 0.22)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(61, 214, 195, 0.08)',
            backgroundColor: '#0a0a10',
            position: 'relative',
          }}
        >
          <OffthreadVideo
            src={staticFile(src)}
            muted
            startFrom={startFrom}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        </div>
      </AbsoluteFill>
      <CaptionBar>{caption}</CaptionBar>
    </AbsoluteFill>
  );
}

function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numberSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const numberScale = interpolate(numberSpring, [0, 1], [0.82, 1]);
  const breathe = 1 + Math.sin(frame / 22) * 0.018;
  const driftY = Math.sin(frame / 40) * 6;
  const punchIn = spring({
    frame: frame - 26,
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
          style={{ opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) }}
        >
          <LyamoMark size={110} />
        </div>
        <div
          style={{
            opacity: numberSpring,
            transform: `translateY(${driftY}px) scale(${numberScale * breathe})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 118,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 1.02,
              background: `linear-gradient(135deg, ${COLORS.warm}, #f0c060 45%, ${COLORS.cool})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            45,86&nbsp;€
            <br />
            na dziś
          </div>
        </div>
        <div
          style={{
            opacity: punchIn,
            transform: `translateY(${interpolate(punchIn, [0, 1], [28, 0])}px)`,
            color: COLORS.text,
            fontSize: 52,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.25,
            maxWidth: 920,
            letterSpacing: '-0.02em',
          }}
        >
          Wiesz to z góry —
          <br />
          zanim wydasz.
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

function BudgetScene() {
  return (
    <PhoneVideoScene
      src="videos/dashboard-scroll-1.mov"
      startFrom={0}
      caption={<>Tyle średnio wydajesz każdego dnia</>}
    />
  );
}

function CategoriesScene() {
  return (
    <PhoneVideoScene
      src="videos/dashboard-scroll-2.mov"
      startFrom={Math.round(0.4 * FPS)}
      caption={
        <>
          Lyamo analizuje Twoje finanse —{' '}
          <span style={{ color: COLORS.warm }}>koszty stałe</span> i reszta
        </>
      }
    />
  );
}

function TransactionsScene() {
  return (
    <PhoneVideoScene
      src="videos/dashboard-scroll-3.mp4"
      startFrom={Math.round(0.4 * FPS)}
      caption={
        <>
          Paragon <span style={{ color: COLORS.cool }}>rozbity</span> na kategorie
        </>
      }
    />
  );
}

function EndCardScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const ctaIn = spring({
    frame: frame - 16,
    fps,
    config: { damping: 16, stiffness: 110 },
  });
  const breathe = 1 + Math.sin(frame / 28) * 0.012;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <DriftBackdrop intensity={0.85} />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 22,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px) scale(${breathe})`,
        }}
      >
        <LyamoMark size={148} />
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: COLORS.text,
            letterSpacing: '-0.04em',
          }}
        >
          Lyamo
        </div>
        <div
          style={{
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [16, 0])}px)`,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.text,
            textAlign: 'center',
            maxWidth: 960,
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
          }}
        >
          Finanse pod kontrolą.
        </div>
        <div
          style={{
            opacity: ctaIn,
            marginTop: 6,
            fontSize: 40,
            fontWeight: 500,
            color: COLORS.muted,
            textAlign: 'center',
            maxWidth: 940,
            lineHeight: 1.28,
          }}
        >
          Budżet, kategorie i historia — w jednym pulpicie.
        </div>
        <div
          style={{
            marginTop: 28,
            padding: '22px 48px',
            borderRadius: 18,
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.void,
            background: `linear-gradient(135deg, ${COLORS.warm} 0%, #f0c060 50%, ${COLORS.cool} 100%)`,
            opacity: ctaIn,
            transform: `scale(${interpolate(ctaIn, [0, 1], [0.94, 1])})`,
          }}
        >
          lyamo.eu
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const DashboardReel: React.FC = () => {
  const budgetFrom = HOOK_FRAMES;
  const categoriesFrom = budgetFrom + BUDGET_FRAMES;
  const transactionsFrom = categoriesFrom + CATEGORIES_FRAMES;
  const endFrom = transactionsFrom + TRANSACTIONS_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      <Sequence from={VO_START_FRAME} name="Voiceover">
        <Audio src={staticFile('audio/dashboard-voiceover.mp3')} />
      </Sequence>

      <Sequence from={0} durationInFrames={HOOK_FRAMES} name="Hook">
        <HookScene />
      </Sequence>
      <Sequence from={budgetFrom} durationInFrames={BUDGET_FRAMES} name="Budget">
        <BudgetScene />
      </Sequence>
      <Sequence from={categoriesFrom} durationInFrames={CATEGORIES_FRAMES} name="Categories">
        <CategoriesScene />
      </Sequence>
      <Sequence from={transactionsFrom} durationInFrames={TRANSACTIONS_FRAMES} name="Transactions">
        <TransactionsScene />
      </Sequence>
      <Sequence from={endFrom} durationInFrames={END_FRAMES} name="End">
        <EndCardScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const DASHBOARD_REEL_DURATION = DURATION;
export const DASHBOARD_REEL_FPS = FPS;
