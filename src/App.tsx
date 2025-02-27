import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Home from "./components/Home/Home";
import Count from "./components/Count/Count";
import Solve from "./components/Solve/Solve";

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
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/count" element={<Count />} />
          <Route path="/solve" element={<Solve />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
