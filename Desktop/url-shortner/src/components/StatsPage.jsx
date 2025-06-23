import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

const StatsPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const { isAuthenticated, getAuthHeader } = useAuth();

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
      setUrls(data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError(error.message || 'An error occurred while fetching URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (url) => {
    setUrlToDelete(url);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!urlToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`http://localhost:5000/api/urls/${urlToDelete._id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete URL');
      }

      setUrls(urls.filter(url => url._id !== urlToDelete._id));
      setDeleteDialogOpen(false);
      setUrlToDelete(null);
    } catch (error) {
      console.error('Error deleting URL:', error);
      setError(error.message || 'An error occurred while deleting URL');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopy = (id, shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredUrls = tabValue === 0 
    ? urls 
    : tabValue === 1 
      ? urls.filter(url => url.user && isAuthenticated) 
      : urls.filter(url => url.isPublic);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <LinkIcon sx={{ mr: 1 }} />
          URL Statistics
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {urls.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No URLs found. Create some shortened URLs to see statistics here.
          </Alert>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="url filter tabs">
                <Tab label="All URLs" />
                {isAuthenticated && <Tab label="My URLs" />}
                <Tab label="Public URLs" />
              </Tabs>
            </Box>

            {filteredUrls.length === 0 ? (
              <Alert severity="info">
                No URLs found in this category.
              </Alert>
            ) : (
              filteredUrls.map((url) => (
                <Accordion key={url._id} sx={{ mb: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`panel-${url._id}-content`}
                    id={`panel-${url._id}-header`}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 'medium', mr: 1 }}>
                          {url.shortCode}
                        </Typography>
                        <Chip 
                          size="small" 
                          icon={url.isPublic ? <PublicIcon /> : <LockIcon />}
                          label={url.isPublic ? "Public" : "Private"} 
                          color={url.isPublic ? "success" : "default"}
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Clicks: {url.clicks}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Original URL:
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                            {url.originalUrl}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title={copied === url._id ? "Copied!" : "Copy short URL"}>
                            <IconButton 
                              onClick={() => handleCopy(url._id, url.shortUrl)}
                              color={copied === url._id ? "success" : "primary"}
                            >
                              {copied === url._id ? <CheckCircleIcon /> : <ContentCopyIcon />}
                            </IconButton>
                          </Tooltip>
                          {(isAuthenticated && (!url.user || url.user === (url.user && url.user._id))) && (
                            <Tooltip title="Delete URL">
                              <IconButton 
                                onClick={() => handleDeleteClick(url)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" gutterBottom>
                        Click Statistics
                      </Typography>

                      {url.clickData && url.clickData.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Time</TableCell>
                                <TableCell>Referrer</TableCell>
                                <TableCell>Location</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {url.clickData.map((click, index) => (
                                <TableRow key={index}>
                                  <TableCell>{new Date(click.timestamp).toLocaleString()}</TableCell>
                                  <TableCell>{click.referrer || 'Direct'}</TableCell>
                                  <TableCell>{click.location || 'Unknown'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No clicks recorded yet.
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Created: {new Date(url.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expires: {new Date(url.expiryDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete URL?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this shortened URL? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
            startIcon={deleteLoading && <CircularProgress size={20} />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StatsPage; 