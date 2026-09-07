import { computeSystemLayout } from '../lib/system-layout';
import type { SystemLayoutInput } from '../lib/system-graph';

self.onmessage = (event: MessageEvent<SystemLayoutInput>) => {
  try { self.postMessage({ positions: computeSystemLayout(event.data) }); }
  catch { self.postMessage({ error: 'La disposition du système n’a pas pu être calculée.' }); }
};
