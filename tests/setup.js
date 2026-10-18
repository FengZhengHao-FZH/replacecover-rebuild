import { vi } from 'vitest';

// jsdom has neither of these, and both are load-bearing in the reconstruction:
// IntersectionObserver gates lazy grid mounting (B24), matchMedia is unused by our
// code but pulled in by html2canvas.
class Observer {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
  }

  observe(target) {
    this.targets.push(target);
  }

  unobserve(target) {
    this.targets = this.targets.filter((item) => item !== target);
  }

  disconnect() {
    this.targets = [];
  }

  // Test hook: flush every observed element as intersecting.
  triggerAll() {
    this.callback(this.targets.map((target) => ({ target, isIntersecting: true })), this);
  }
}

globalThis.IntersectionObserver = Observer;
globalThis.__intersectionObservers = [];

const realObserver = Observer;
globalThis.IntersectionObserver = class extends realObserver {
  constructor(callback) {
    super(callback);
    globalThis.__intersectionObservers.push(this);
  }
};

// Test hook: reveal every lazy cell mounted so far.
globalThis.__revealAllLazyCells = () => {
  for (const observer of globalThis.__intersectionObservers) observer.triggerAll();
};

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
