/**
 * ProPresenter AI Studio - Live Coding Canvas Engine
 * Evaluates live Canvas 2D render loops in real-time.
 */

export class LiveCoderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.animId = null;
    this.startTime = Date.now();
    this.renderFn = null;
    this.error = null;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  compileCode(codeString) {
    try {
      // Evaluate user code in a function body returning renderBackground
      const fn = new Function(`${codeString}; return typeof renderBackground === "function" ? renderBackground : null;`)();
      if (fn) {
        this.renderFn = fn;
        this.error = null;
        return { success: true };
      } else {
        this.error = "No se encontró la función 'renderBackground(ctx, width, height, time)'";
        return { success: false, error: this.error };
      }
    } catch (err) {
      this.error = err.message;
      return { success: false, error: err.message };
    }
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const loop = () => {
      if (this.canvas && this.ctx) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = Date.now() - this.startTime;

        if (this.renderFn && !this.error) {
          try {
            this.ctx.save();
            this.renderFn(this.ctx, width, height, time);
            this.ctx.restore();
          } catch (err) {
            this.error = "Error de ejecución: " + err.message;
          }
        } else {
          // Default fallback dark background
          this.ctx.fillStyle = '#0a0c10';
          this.ctx.fillRect(0, 0, width, height);
        }
      }
      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
