import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Home from "./components/Home/Home";
import CountAndSolve from "./components/CountAndSolve/CountAndSolve";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

const theme = createTheme({
  palette: {
    primary: {
      light: "#d1c4e9",
      main: "#7e57c2",
      dark: "#512da8",
    },
    background: {
      default: "#212121",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#000000",
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/start" element={<CountAndSolve />} />
            {/* Catch-all route that redirects to "/" */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
