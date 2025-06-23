import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Link,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  FormControlLabel,
  Switch,
  InputAdornment,
  Slider,
  Stack
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  BarChart as BarChartIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const UrlShortener = () => {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [isPublic, setIsPublic] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentUrls, setRecentUrls] = useState([]);
  const [fetchingUrls, setFetchingUrls] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { isAuthenticated, getAuthHeader } = useAuth();

  // Load URLs from database on component mount
  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/urls', {
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch URLs');
      }

      const data = await response.json();
      setRecentUrls(data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError(error.message || 'An error occurred while fetching URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setShortUrl('');
    setCopied(false);

    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Simple URL validation
    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          originalUrl: url,
          customCode: customCode || undefined,
          expiryDays,
          isPublic
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create short URL');
      }

      setShortUrl(data.shortUrl);
      setSuccess(true);
      setUrl('');
      setCustomCode('');
    } catch (error) {
      console.error('Error creating short URL:', error);
      setError(error.message || 'An error occurred while creating the short URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    try {
      // Extract ID from shortUrl or use stored ID
      const urlParts = shortUrl.split('/');
      const shortCode = urlParts[urlParts.length - 1];
      
      const response = await fetch(`http://localhost:5000/api/urls/${shortCode}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete URL');
      }

      setShortUrl('');
      setSuccess(false);
      setError('');
    } catch (error) {
      console.error('Error deleting URL:', error);
      setError(error.message || 'An error occurred while deleting the URL');
    }
  };

  const fetchUrlStats = async (shortcode) => {
    try {
      const response = await fetch(`/api/shorturls/${shortcode}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch URL statistics');
      }
      
      alert(`URL: ${data.originalUrl}\nClicks: ${data.clicks}\nCreated: ${new Date(data.createdAt).toLocaleString()}\nExpires: ${new Date(data.expiryDate).toLocaleString()}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteClick = (url) => {
    setUrlToDelete(url);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!urlToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/shorturls/${urlToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete URL');
      }
      
      const data = await response.json();
      setDeleteMessage('URL deleted successfully');
      
      // Refresh the URL list
      fetchUrls();
      
      // Close dialog after a short delay
      setTimeout(() => {
        setDeleteDialogOpen(false);
        setDeleteMessage('');
        setUrlToDelete(null);
      }, 1500);
      
    } catch (err) {
      setDeleteMessage(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUrlToDelete(null);
    setDeleteMessage('');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            URL Shortener
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create short, easy-to-share links in seconds
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enter URL"
                variant="outlined"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custom Code (Optional)"
                variant="outlined"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="e.g., mylink"
                helperText="Leave blank for auto-generated code"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>
                Expiry Time: {expiryDays} days
              </Typography>
              <Slider
                value={expiryDays}
                onChange={(e, newValue) => setExpiryDays(newValue)}
                aria-labelledby="expiry-slider"
                valueLabelDisplay="auto"
                step={1}
                marks={[
                  { value: 1, label: '1d' },
                  { value: 30, label: '30d' },
                  { value: 90, label: '90d' },
                  { value: 365, label: '1y' }
                ]}
                min={1}
                max={365}
              />
            </Grid>

            {isAuthenticated && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Make URL public (visible to everyone)"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Shorten URL'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {success && shortUrl && (
          <Box sx={{ mt: 4 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              URL shortened successfully!
            </Alert>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'action.hover'
              }}
            >
              <Typography
                variant="body1"
                component="div"
                sx={{
                  fontWeight: 'medium',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {shortUrl}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                  <IconButton onClick={handleCopy} color={copied ? "success" : "primary"}>
                    {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  </IconButton>
                </Tooltip>
                {isAuthenticated && (
                  <Tooltip title="Delete URL">
                    <IconButton onClick={handleDelete} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Paper>
          </Box>
        )}

        {!isAuthenticated && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Sign in to save your shortened URLs and access more features!
            </Alert>
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Recent URLs:
          </Typography>
          
          {fetchingUrls ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : recentUrls.length > 0 ? (
            <List>
              {recentUrls.map((item, index) => {
                const shortcode = item.shortCode || item.shortUrl.split('/').pop();
                const isExpired = item.isExpired || new Date() > new Date(item.expiryDate);
                
                return (
                  <ListItem 
                    key={item.id || index}
                    secondaryAction={
                      <Box>
                        <Tooltip title="View Statistics">
                          <IconButton 
                            edge="end" 
                            onClick={() => fetchUrlStats(shortcode)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <BarChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete URL">
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDeleteClick(item)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    sx={{ py: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Link
                          href={item.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          color={isExpired ? "textSecondary" : "primary"}
                          underline="hover"
                          sx={{ wordBreak: 'break-all' }}
                        >
                          {item.shortUrl}
                        </Link>
                      }
                      secondary={item.originalUrl}
                      secondaryTypographyProps={{
                        noWrap: true,
                        style: { maxWidth: '100%' }
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Alert severity="info">
              No shortened URLs found. Create some shortened URLs to see them here.
            </Alert>
          )}
        </Box>
      </Paper>
      
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        message="Copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete URL
        </DialogTitle>
        <DialogContent>
          {deleteMessage ? (
            <Alert severity={deleteMessage.includes('Error') ? 'error' : 'success'}>
              {deleteMessage}
            </Alert>
          ) : (
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete this shortened URL?
              <br />
              <strong>{urlToDelete?.shortUrl}</strong>
              <br />
              This action cannot be undone.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          {!deleteMessage && (
            <>
              <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                color="error" 
                variant="contained"
                disabled={deleteLoading}
                startIcon={deleteLoading && <CircularProgress size={20} color="inherit" />}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UrlShortener; 