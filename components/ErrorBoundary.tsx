import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Send to error tracking service (e.g., Sentry)
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>
            
            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6 text-left">
                <p className="text-red-400 text-xs font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-zinc-500 text-xs mt-2 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                <Home size={18} />
                Startseite
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#00FF00] hover:bg-[#00FF00]/80 text-black font-bold rounded-xl transition-colors"
              >
                <RefreshCw size={18} />
                Neu laden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
