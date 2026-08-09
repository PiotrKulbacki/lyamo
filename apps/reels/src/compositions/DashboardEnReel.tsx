import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { COLORS } from '../components/Brand';

const FPS = 30;

/** EN VO: out/sources/audio/en/dashboard-voiceover.mp3 */
const VO_SECONDS = 36.8065;
/** Source video natural length (Dashboard-EN.mp4 / h264) */
const VIDEO_SECONDS = 39.291678;
/** Short hold after last VO line (matches PL end-card silence) */
const TAIL_SECONDS = 0.9;

const DURATION_SECONDS = VO_SECONDS + TAIL_SECONDS;
const DURATION = Math.round(DURATION_SECONDS * FPS);

/**
 * Slightly speed up the EN base video so the full cut lands with the VO
 * (video is ~2.5 s longer than narration).
 */
const PLAYBACK_RATE = VIDEO_SECONDS / DURATION_SECONDS;

export const DashboardEnReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      <Sequence from={0} name="Voiceover">
        <Audio src={staticFile('audio/en/dashboard-voiceover.mp3')} />
      </Sequence>

      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile('videos/Dashboard-EN-h264.mp4')}
          muted
          playbackRate={PLAYBACK_RATE}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DASHBOARD_EN_REEL_DURATION = DURATION;
export const DASHBOARD_EN_REEL_FPS = FPS;
