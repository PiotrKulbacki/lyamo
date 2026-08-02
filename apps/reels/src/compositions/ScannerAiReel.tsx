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
import { BrandBackdrop, COLORS, LyamoMark } from '../components/Brand';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
});

const FPS = 30;

/**
 * Source: out/sources/videos/scanner-ai-h264.mp4 (~42.7 s, from scanner-ai.mp4).
 *
 * Reel timeline (≈33.6 s) — VO to record as scanner-ai-voiceover.pl.mp3:
 *  0.0–2.8   hook graphic
 *  2.8–8.8   analiza (source 0–6 @1x)
 *  8.8–14.8  podsumowanie pól (source 6–12 @1x) + lekki zoom na Kwota/Opis
 * 14.8–22.8  pozycje (source 12–28 @2x)
 * 22.8–28.8  podsumowanie kategorii (source 28–34 @1x) + silny zoom
 * 28.8–31.8  zapis / sukces (source 34–40 @2x)
 * 31.8–33.6  end card
 */
const HOOK_FRAMES = Math.round(2.8 * FPS);
const ANALYZE_FRAMES = Math.round(6.0 * FPS);
const HEADER_FRAMES = Math.round(6.0 * FPS);
const ITEMS_FRAMES = Math.round(8.0 * FPS);
const SUMMARY_FRAMES = Math.round(6.0 * FPS);
const SAVE_FRAMES = Math.round(3.0 * FPS);
const END_FRAMES = Math.round(1.8 * FPS);

const DURATION =
  HOOK_FRAMES +
  ANALYZE_FRAMES +
  HEADER_FRAMES +
  ITEMS_FRAMES +
  SUMMARY_FRAMES +
  SAVE_FRAMES +
  END_FRAMES;

const VIDEO_SRC = 'videos/scanner-ai-h264.mp4';

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

function CaptionBar({ children, delay = 6 }: { children: React.ReactNode; delay?: number }) {
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
          fontSize: 46,
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

type ZoomPhoneProps = {
  startFrom: number;
  playbackRate?: number;
  caption: React.ReactNode;
  /** 1 = no zoom; higher = closer. Applied with spring + optional hold. */
  zoomTo?: number;
  /** Vertical pan of video content (px). Negative = look lower on phone UI. */
  panY?: number;
  zoomDelayFrames?: number;
};

function ZoomPhoneScene({
  startFrom,
  playbackRate = 1,
  caption,
  zoomTo = 1,
  panY = 0,
  zoomDelayFrames = 12,
}: ZoomPhoneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 95 } });
  const shellScale = interpolate(enter, [0, 1], [0.94, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const zoomSpring = spring({
    frame: frame - zoomDelayFrames,
    fps,
    config: { damping: 18, stiffness: 70 },
  });
  const zoom = interpolate(zoomSpring, [0, 1], [1, zoomTo]);
  const y = interpolate(zoomSpring, [0, 1], [0, panY]);

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
            src={staticFile(VIDEO_SRC)}
            muted
            startFrom={startFrom}
            playbackRate={playbackRate}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              transform: `scale(${zoom}) translateY(${y}px)`,
              transformOrigin: zoomTo > 1.4 ? 'center 58%' : 'center 35%',
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
  const punch = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const sub = spring({
    frame: frame - 18,
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
          gap: 24,
        }}
      >
        <div
          style={{ opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' }) }}
        >
          <LyamoMark size={100} />
        </div>
        <div
          style={{
            opacity: punch,
            transform: `scale(${interpolate(punch, [0, 1], [0.86, 1])})`,
            fontSize: 72,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            maxWidth: 940,
            background: `linear-gradient(135deg, ${COLORS.warm}, #f0c060 45%, ${COLORS.cool})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Paragon?
          <br />
          Zrób zdjęcie.
        </div>
        <div
          style={{
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [20, 0])}px)`,
            color: COLORS.text,
            fontSize: 44,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: 880,
            lineHeight: 1.25,
          }}
        >
          AI odczyta kwotę, sklep i pozycje.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function EndCardScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const ctaIn = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <DriftBackdrop intensity={0.85} />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
        }}
      >
        <LyamoMark size={132} />
        <div
          style={{
            fontSize: 108,
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
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.text,
            textAlign: 'center',
            maxWidth: 960,
            lineHeight: 1.22,
          }}
        >
          Skanuj paragony z AI.
        </div>
        <div
          style={{
            marginTop: 20,
            padding: '20px 44px',
            borderRadius: 18,
            fontSize: 38,
            fontWeight: 700,
            color: COLORS.void,
            background: `linear-gradient(135deg, ${COLORS.warm} 0%, #f0c060 50%, ${COLORS.cool} 100%)`,
            opacity: ctaIn,
          }}
        >
          lyamo.eu
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const ScannerAiReel: React.FC = () => {
  const analyzeFrom = HOOK_FRAMES;
  const headerFrom = analyzeFrom + ANALYZE_FRAMES;
  const itemsFrom = headerFrom + HEADER_FRAMES;
  const summaryFrom = itemsFrom + ITEMS_FRAMES;
  const saveFrom = summaryFrom + SUMMARY_FRAMES;
  const endFrom = saveFrom + SAVE_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      <Sequence from={0} durationInFrames={HOOK_FRAMES} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={analyzeFrom} durationInFrames={ANALYZE_FRAMES} name="Analyze">
        <ZoomPhoneScene
          startFrom={0}
          caption={
            <>
              AI <span style={{ color: COLORS.cool }}>analizuje</span> paragon…
            </>
          }
        />
      </Sequence>

      <Sequence from={headerFrom} durationInFrames={HEADER_FRAMES} name="Header">
        <ZoomPhoneScene
          startFrom={Math.round(6 * FPS)}
          zoomTo={1.28}
          panY={-40}
          zoomDelayFrames={18}
          caption={
            <>
              <span style={{ color: COLORS.warm }}>36,52&nbsp;€</span> · Lidl · gotowe
            </>
          }
        />
      </Sequence>

      <Sequence from={itemsFrom} durationInFrames={ITEMS_FRAMES} name="Items">
        <ZoomPhoneScene
          startFrom={Math.round(12 * FPS)}
          playbackRate={2}
          caption={
            <>
              Pozycje z kategoriami — <span style={{ color: COLORS.cool }}>spożywcze</span> i chemia
            </>
          }
        />
      </Sequence>

      <Sequence from={summaryFrom} durationInFrames={SUMMARY_FRAMES} name="SummaryZoom">
        <ZoomPhoneScene
          startFrom={Math.round(30 * FPS)}
          zoomTo={1.62}
          panY={-210}
          zoomDelayFrames={6}
          caption={
            <>
              Suma <span style={{ color: COLORS.cool }}>zgadza się</span> z paragonem
            </>
          }
        />
      </Sequence>

      <Sequence from={saveFrom} durationInFrames={SAVE_FRAMES} name="Save">
        <ZoomPhoneScene
          startFrom={Math.round(34 * FPS)}
          playbackRate={2}
          caption={<>Zapis jednym tapnięciem</>}
        />
      </Sequence>

      <Sequence from={endFrom} durationInFrames={END_FRAMES} name="End">
        <EndCardScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const SCANNER_AI_REEL_DURATION = DURATION;
export const SCANNER_AI_REEL_FPS = FPS;
