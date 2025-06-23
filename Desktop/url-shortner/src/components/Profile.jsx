import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';

const Profile = () => {
  const { currentUser, logout, getAuthHeader } = useAuth();
  const [userUrls, setUserUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserUrls = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/urls/user/urls', {
          headers: {
            ...getAuthHeader()
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user URLs');
        }

        const data = await response.json();
        setUserUrls(data);
      } catch (error) {
        console.error('Error fetching user URLs:', error);
        setError(error.message || 'Failed to fetch user URLs');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserUrls();
    } else {
      setLoading(false);
    }
  }, [currentUser, getAuthHeader]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="info">
          Please log in to view your profile.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ 
            backgroundColor: 'primary.main', 
            borderRadius: '50%', 
            p: 1,
            mr: 2
          }}>
            <PersonIcon sx={{ color: 'white', fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4">{currentUser.username}</Typography>
            <Typography variant="body1" color="text.secondary">{currentUser.email}</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <LinkIcon sx={{ mr: 1 }} />
          Your Shortened URLs
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {userUrls.length === 0 ? (
          <Alert severity="info">
            You haven't created any shortened URLs yet.
          </Alert>
        ) : (
          <List>
            {userUrls.map((url) => (
              <Paper key={url._id} sx={{ mb: 2, p: 2 }}>
                <ListItem disablePadding>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mr: 1 }}>
                          {url.shortUrl}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={url.isPublic ? "Public" : "Private"} 
                          color={url.isPublic ? "success" : "default"}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Original: {url.originalUrl}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Clicks: {url.clicks}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Expires: {new Date(url.expiryDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
          >
            Create New URL
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 