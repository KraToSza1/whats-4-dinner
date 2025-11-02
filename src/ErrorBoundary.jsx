import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Log for debugging/telemetry
        console.error("[ErrorBoundary]", error, info);
        if (typeof this.props.onError === "function") {
            try { this.props.onError(error, info); } catch { /* no-op */ }
        }
    }

    componentDidUpdate(prevProps) {
        // Reset the boundary when resetKeys change (shallow compare)
        const { resetKeys } = this.props;
        if (Array.isArray(resetKeys) && Array.isArray(prevProps.resetKeys)) {
            const changed =
                resetKeys.length !== prevProps.resetKeys.length ||
                resetKeys.some((v, i) => v !== prevProps.resetKeys[i]);
            if (changed && this.state.hasError) {
                this.reset();
            }
        }
    }

    reset = () => {
        this.setState({ hasError: false, error: null, showDetails: false });
        if (typeof this.props.onRetry === "function") {
            try { this.props.onRetry(); } catch { /* no-op */ }
        }
    };

    toggleDetails = () =>
        this.setState((s) => ({ ...s, showDetails: !s.showDetails }));

    render() {
        if (this.state.hasError) {
            const msg = this.state.error?.message || "Unexpected error.";
            const stack =
                (this.state.error && (this.state.error.stack || String(this.state.error))) || "";

            return (
                <div
                    role="alert"
                    className="p-4 sm:p-6 m-3 rounded-xl border border-red-200 bg-red-50 text-red-900"
                >
                    <h2 className="text-lg font-bold mb-1">Something went wrong</h2>
                    <p className="text-sm opacity-90 mb-3">{msg}</p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={this.reset}
                            className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm"
                        >
                            Try again
                        </button>

                        <button
                            onClick={this.toggleDetails}
                            className="px-3 py-1.5 rounded-md border border-red-200 text-sm"
                            aria-expanded={this.state.showDetails}
                            aria-controls="err-details"
                        >
                            {this.state.showDetails ? "Hide details" : "Show details"}
                        </button>
                    </div>

                    {this.state.showDetails && (
                        <pre
                            id="err-details"
                            className="mt-3 max-h-64 overflow-auto text-xs bg-white/70 text-red-800 p-3 rounded border border-red-200"
                        >
              {stack}
            </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}