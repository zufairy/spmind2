/**
 * RAF Pool for managing requestAnimationFrame calls
 */
export class RafPool {
  private ids = new Set<number>();

  /**
   * Add a new RAF callback
   */
  add(cb: FrameRequestCallback): number {
    const id = requestAnimationFrame(cb);
    this.ids.add(id);
    return id;
  }

  /**
   * Clear all RAF callbacks
   */
  clear(): void {
    this.ids.forEach(cancelAnimationFrame);
    this.ids.clear();
  }

  /**
   * Get number of active callbacks
   */
  size(): number {
    return this.ids.size;
  }
}