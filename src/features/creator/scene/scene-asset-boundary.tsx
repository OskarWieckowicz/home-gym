import { Component, type ErrorInfo, type ReactNode } from "react";

type AssetBoundaryProps = { readonly fallback: ReactNode; readonly children: ReactNode };
type AssetBoundaryState = { readonly failed: boolean };

export class AssetBoundary extends Component<AssetBoundaryProps, AssetBoundaryState> {
  state: AssetBoundaryState = { failed: false };
  static getDerivedStateFromError(): AssetBoundaryState { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.warn("3D asset failed; using catalog solid.", error, info.componentStack); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
