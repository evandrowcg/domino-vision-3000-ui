import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

const theme = createTheme({
  palette: {
    primary: {
      light: '#d1c4e9',
      main: '#7e57c2',
      dark: '#512da8',
    },
    background: {
      default: '#212121',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#000000',
    },
  },
});

test('renders with theme provider without crashing', () => {
  render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    </ThemeProvider>
  );
  expect(screen.getByText('Test content')).toBeInTheDocument();
});

test('theme has correct primary color', () => {
  expect(theme.palette.primary.main).toBe('#7e57c2');
});

test('theme has correct background color', () => {
  expect(theme.palette.background.default).toBe('#212121');
});
