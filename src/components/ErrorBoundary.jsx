import React from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[DiceClash ErrorBoundary caught an unhandled error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="glass-panel-gamer max-w-lg w-full p-8 rounded-3xl border-2 border-crimson/60 shadow-[0_0_50px_rgba(225,29,72,0.3)] text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-crimson/20 border border-crimson/50 text-crimson-light flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              <ShieldAlert className="w-8 h-8 text-crimson-light" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading text-2xl font-black text-white uppercase tracking-wider">
                Arena Display Interrupted
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                An unexpected display issue occurred while loading this Arena match. Your funds and on-chain status are completely safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3.5 rounded-xl bg-arena-surface border border-arena-border text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                <span className="text-gray-500 font-bold block mb-1">Details:</span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="crimson-gradient-btn flex-1 py-3.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:scale-[1.01] transition-transform"
              >
                <Home className="w-4 h-4" />
                <span>Return to Arena Lobby</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-gray-300 bg-arena-surface hover:bg-arena-hover border border-arena-border flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
