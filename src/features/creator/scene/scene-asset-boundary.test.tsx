// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AssetBoundary } from "./scene-asset-boundary";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function FailedAsset({ message }: { readonly message: string }): never {
  throw new Error(message);
}

it.each(["Asset request failed: 404", "Invalid GLB data"])("isolates %s and keeps the fallback reactive", (message) => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  function Content({ selected }: { readonly selected: boolean }) {
    return <>
      <AssetBoundary fallback={<p>{selected ? "Selected error fallback" : "Error fallback"}</p>}>
        <FailedAsset message={message} />
      </AssetBoundary>
      <AssetBoundary fallback={<p>Unexpected fallback</p>}><p>Healthy asset</p></AssetBoundary>
    </>;
  }
  const { rerender } = render(<Content selected={false} />);
  expect(screen.getByText("Error fallback")).toBeTruthy();
  expect(screen.getByText("Healthy asset")).toBeTruthy();
  rerender(<Content selected />);
  expect(screen.getByText("Selected error fallback")).toBeTruthy();
  expect(screen.getByText("Healthy asset")).toBeTruthy();
  expect(screen.queryByText("Unexpected fallback")).toBeNull();
});
