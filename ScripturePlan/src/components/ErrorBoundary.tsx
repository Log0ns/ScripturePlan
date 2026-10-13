import React from 'react';

type Props = { onClose: () => void; children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900/95 px-6">
          <div className="text-red-400 text-sm font-medium">Something went wrong</div>
          <div className="text-slate-500 text-xs text-center">{this.state.error.message}</div>
          <button
            onClick={this.props.onClose}
            className="mt-2 px-4 py-2 rounded-xl text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
