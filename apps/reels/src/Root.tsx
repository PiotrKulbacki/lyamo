import React from 'react';
import { Composition } from 'remotion';
import { AiChatReel, AI_CHAT_REEL_DURATION, AI_CHAT_REEL_FPS } from './compositions/AiChatReel';
import {
  DashboardReel,
  DASHBOARD_REEL_DURATION,
  DASHBOARD_REEL_FPS,
} from './compositions/DashboardReel';
import {
  DashboardEnReel,
  DASHBOARD_EN_REEL_DURATION,
  DASHBOARD_EN_REEL_FPS,
} from './compositions/DashboardEnReel';
import {
  ScannerAiReel,
  SCANNER_AI_REEL_DURATION,
  SCANNER_AI_REEL_FPS,
} from './compositions/ScannerAiReel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AiChatReel"
        component={AiChatReel}
        durationInFrames={AI_CHAT_REEL_DURATION}
        fps={AI_CHAT_REEL_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="DashboardReel"
        component={DashboardReel}
        durationInFrames={DASHBOARD_REEL_DURATION}
        fps={DASHBOARD_REEL_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="DashboardEnReel"
        component={DashboardEnReel}
        durationInFrames={DASHBOARD_EN_REEL_DURATION}
        fps={DASHBOARD_EN_REEL_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScannerAiReel"
        component={ScannerAiReel}
        durationInFrames={SCANNER_AI_REEL_DURATION}
        fps={SCANNER_AI_REEL_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
