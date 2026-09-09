// Play/pause/step/scrub/speed state machine over a drunkenBishop() steps[]
// trace. Never re-derives algorithm state itself — it only walks an index
// into the precomputed trace (see algorithm/drunkenBishop.js's foldSteps),
// so "scrub to step 47" always matches what a live run would show at that
// point, and the animation can never drift from the "instant result" view.

export class StepController {
  /**
   * @param {Array} steps - from drunkenBishop().steps
   * @param {(cursor: number, playing: boolean) => void} onChange - called whenever cursor or playing state changes
   */
  constructor(steps, onChange) {
    this.steps = steps;
    this.onChange = onChange;
    this.cursor = 0;
    this.playing = false;
    this.speed = 8; // steps per second
    this._timer = null;
  }

  _notify() {
    this.onChange(this.cursor, this.playing);
  }

  _clearTimer() {
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  play() {
    if (this.cursor >= this.steps.length) this.cursor = 0;
    this.playing = true;
    this._clearTimer();
    this._timer = setInterval(() => {
      this.stepForward();
      if (this.cursor >= this.steps.length) this.pause();
    }, 1000 / this.speed);
    this._notify();
  }

  pause() {
    this.playing = false;
    this._clearTimer();
    this._notify();
  }

  stepForward() {
    this.cursor = Math.min(this.cursor + 1, this.steps.length);
    this._notify();
  }

  stepBack() {
    this.cursor = Math.max(this.cursor - 1, 0);
    this._notify();
  }

  scrubTo(n) {
    this.cursor = Math.max(0, Math.min(n, this.steps.length));
    this._notify();
  }

  reset() {
    this.pause();
    this.cursor = 0;
    this._notify();
  }

  setSpeed(n) {
    this.speed = Math.max(1, n);
    if (this.playing) {
      // restart interval at new speed
      this.play();
    }
  }

  destroy() {
    this._clearTimer();
  }
}
