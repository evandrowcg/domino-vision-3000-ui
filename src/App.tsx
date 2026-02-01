import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from "@mui/material";
import Home from "./components/Home/Home";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import SkipLink from "./components/SkipLink/SkipLink";

// Lazy load the heavy component that includes TensorFlow.js
const CountAndSolve = React.lazy(() => import("./components/CountAndSolve/CountAndSolve"));

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

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#212121",
    }}
  >
    <CircularProgress color="primary" />
  </Box>
);

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <SkipLink targetId="main-content" />
          <Box component="main" id="main-content" tabIndex={-1} sx={{ outline: 'none' }}>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/start" element={<CountAndSolve />} />
                {/* Catch-all route that redirects to "/" */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Box>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
