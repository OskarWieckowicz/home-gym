import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/** jsdom lacks native modal behavior. Focus trapping/inertness are verified in a browser. */
export function mockNativeDialog() {
  const prototype = HTMLDialogElement.prototype;
  const originalShow = Object.getOwnPropertyDescriptor(prototype, "showModal");
  const originalClose = Object.getOwnPropertyDescriptor(prototype, "close");
  beforeEach(() => {
    Object.defineProperty(prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    }) });
    Object.defineProperty(prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.open = false;
      // Native close events are queued, including during Strict Mode effect replay.
      queueMicrotask(() => this.dispatchEvent(new Event("close")));
    }) });
  });
  afterEach(() => {
    cleanup();
    if (originalShow) Object.defineProperty(prototype, "showModal", originalShow);
    else Reflect.deleteProperty(prototype, "showModal");
    if (originalClose) Object.defineProperty(prototype, "close", originalClose);
    else Reflect.deleteProperty(prototype, "close");
  });
}
