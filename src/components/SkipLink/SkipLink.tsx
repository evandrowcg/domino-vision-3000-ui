import React from 'react';
import { Box, Link } from '@mui/material';

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children = 'Skip to main content' }) => {
  return (
    <Box
      component={Link}
      href={`#${targetId}`}
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        padding: '1rem',
        backgroundColor: 'primary.main',
        color: 'white',
        textDecoration: 'none',
        '&:focus': {
          left: '50%',
          transform: 'translateX(-50%)',
          top: '0',
        },
      }}
    >
      {children}
    </Box>
  );
};

export default SkipLink;
