import { Component } from "react";
import type { ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0F172A", color: "#fff", fontFamily: "system-ui" }}>
          <div style={{ maxWidth: 640, width: "100%", background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#94a3b8", marginBottom: 16, fontSize: 14 }}>
              The app failed to render. The error below is the real cause:
            </p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#0b1020", padding: 16, borderRadius: 12, fontSize: 12, color: "#fca5a5", overflowX: "auto" }}>
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); location.reload(); }}
              style={{ marginTop: 16, background: "#14B8A6", color: "#06251f", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
