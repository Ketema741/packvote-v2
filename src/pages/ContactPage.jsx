import React from 'react';
import { Container, Typography, Box, Paper, Link } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const ContactPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Contact Us
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 2,
            my: 4 
          }}>
            <EmailIcon sx={{ fontSize: 32, color: '#6366F1' }} />
            <Link 
              href="mailto:marina@gratitudedriven.com"
              variant="h5"
              underline="hover"
              sx={{ color: '#6366F1' }}
            >
              marina@gratitudedriven.com
            </Link>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mt: 4 }}>
            Have questions, suggestions, or just want to say hello? 
            We'd love to hear from you! Drop us an email and we'll get back to you as soon as possible.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default ContactPage; 