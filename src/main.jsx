import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unknown runtime error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  componentDidMount() {
    this.removeErrorListener = (event) => {
      const message = event?.error?.message || event?.message || "Unknown runtime error";
      this.setState({ hasError: true, message });
    };
    this.removeRejectionListener = (event) => {
      const message = event?.reason?.message || String(event?.reason || "Unhandled promise rejection");
      this.setState({ hasError: true, message });
    };

    window.addEventListener("error", this.removeErrorListener);
    window.addEventListener("unhandledrejection", this.removeRejectionListener);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.removeErrorListener);
    window.removeEventListener("unhandledrejection", this.removeRejectionListener);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: "2rem", fontFamily: "sans-serif" }}>
          Error: {this.state.message}
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
