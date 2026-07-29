import React from 'react';
import { Composition } from 'remotion';
import { AiChatReel, AI_CHAT_REEL_DURATION, AI_CHAT_REEL_FPS } from './compositions/AiChatReel';
import {
  DashboardReel,
  DASHBOARD_REEL_DURATION,
  DASHBOARD_REEL_FPS,
} from './compositions/DashboardReel';

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
    </>
  );
};
