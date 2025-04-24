import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="fixed" color="transparent" elevation={0} sx={{ bgcolor: 'white' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            color: '#6366F1', 
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          Group Travel AI
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Link href="/docs" color="inherit" underline="none">Docs</Link>
          <Link href="/donate" color="inherit" underline="none">Donate</Link>
          <Button 
            variant="contained" 
            onClick={() => navigate('/create-trip')}
            sx={{ 
              bgcolor: '#6366F1',
              '&:hover': { bgcolor: '#5558DD' }
            }}
          >
            Start a Trip
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 