import { useLive } from '../hooks';
import { Screen } from './PresenterPage';

/** Audience display. Drag this window to the projector and double-click to go full screen. */
export function OutputPage() {
  const [live] = useLive();
  return (
    <div className="output" onDoubleClick={() => document.documentElement.requestFullscreen?.()}>
      <Screen state={live} />
    </div>
  );
}
