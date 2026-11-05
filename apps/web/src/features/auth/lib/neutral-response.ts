import { performance } from 'node:perf_hooks';
import { setTimeout } from 'node:timers/promises';
export async function finishNeutralResponse(started: number) {
  await setTimeout(Math.max(0, 750 - (performance.now() - started)));
}
