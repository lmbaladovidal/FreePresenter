/**
 * ProPresenter AI Studio - Stage Display & Timer Manager
 */

import { store } from './state.js';

export class StageManager {
  constructor() {
    this.timerInterval = null;
  }

  startTimer(durationSeconds) {
    store.state.timerValue = durationSeconds;
    store.state.timerRunning = true;
    store.notify();

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (store.state.timerValue > 0 && store.state.timerRunning) {
        store.state.timerValue--;
        store.notify();
      } else if (store.state.timerValue <= 0) {
        this.stopTimer();
      }
    }, 1000);
  }

  pauseTimer() {
    store.state.timerRunning = false;
    store.notify();
  }

  resumeTimer() {
    store.state.timerRunning = true;
    store.notify();
  }

  stopTimer() {
    store.state.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    store.notify();
  }

  setStageMessage(msg) {
    store.state.stageMessage = msg;
    store.notify();
  }

  clearStageMessage() {
    store.state.stageMessage = "";
    store.notify();
  }

  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const stageManager = new StageManager();
