import React from 'react';
import { Container, Typography, Box, Paper, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const DocsPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Documentation
          </Typography>

          {/* Getting Started */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#6366F1', mt: 4 }}>
              Getting Started
            </Typography>
            <Typography paragraph>
              Group Travel AI helps you and your friends decide on the perfect travel destination. 
              Here's how to get started in 4 simple steps:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="1. Create a Trip Link" 
                  secondary="Click 'Start a Trip' and share the generated link with your group"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><QuestionAnswerIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="2. Complete the Survey" 
                  secondary="Each group member fills out a quick questionnaire about their preferences"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TipsAndUpdatesIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="3. Review AI Recommendations" 
                  secondary="Our AI analyzes everyone's input and suggests 3 perfect destinations"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><HowToVoteIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="4. Vote and Decide" 
                  secondary="Group members vote on their favorite option"
                />
              </ListItem>
            </List>
          </Box>

          <Divider />

          {/* Survey Questions */}
          <Box sx={{ my: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#6366F1' }}>
              Survey Questions Explained
            </Typography>
            <Typography paragraph>
              Our questionnaire is designed to capture essential preferences while being quick to complete. 
              Key areas covered include:
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Budget Range" 
                  secondary="Your comfortable spending range for the entire trip"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Travel Dates" 
                  secondary="Preferred travel timeframe and duration"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Activity Preferences" 
                  secondary="Types of activities you enjoy (adventure, culture, relaxation, etc.)"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Must-Have Amenities" 
                  secondary="Essential features or facilities you need at the destination"
                />
              </ListItem>
            </List>
          </Box>

          <Divider />

          {/* Privacy & Security */}
          <Box sx={{ my: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#6366F1' }}>
              Privacy & Security
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Data Protection" 
                  secondary="We use industry-standard encryption to protect your personal information"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Group Privacy" 
                  secondary="Trip details are only visible to invited group members"
                />
              </ListItem>
            </List>
          </Box>

          <Divider />

          {/* Payment & Donations */}
          <Box sx={{ my: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#6366F1' }}>
              Payment & Donations
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><PaymentIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Free to Use" 
                  secondary="The basic service is completely free for all users"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TipsAndUpdatesIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Support Development" 
                  secondary="Donations help keep our AI service running and improving"
                />
              </ListItem>
            </List>
          </Box>

          <Divider />

          {/* Tips for Success */}
          <Box sx={{ my: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#6366F1' }}>
              Tips for Success
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><AccessTimeIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Set a Response Deadline" 
                  secondary="Give your group a specific timeframe to complete their surveys"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><QuestionAnswerIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Be Honest in Surveys" 
                  secondary="The more accurate your preferences, the better the AI recommendations"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><HowToVoteIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Vote Promptly" 
                  secondary="Complete the voting process quickly to maintain group momentum"
                />
              </ListItem>
            </List>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default DocsPage; 