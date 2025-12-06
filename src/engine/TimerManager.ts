import { TimerHandle } from '../types/gameEngine';

export class TimerManager {
  private rafIds = new Set<TimerHandle>();

  add(cb: FrameRequestCallback): TimerHandle {
    const id = requestAnimationFrame(cb);
    this.rafIds.add(id);
    return id;
  }

  remove(id: TimerHandle) {
    if (this.rafIds.has(id)) {
      cancelAnimationFrame(id);
      this.rafIds.delete(id);
    }
  }

  clearAll() {
    this.rafIds.forEach((id) => cancelAnimationFrame(id));
    this.rafIds.clear();
  }
}
