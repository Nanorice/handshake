import React, { useState } from 'react';
import { Container, Button, TextField, Typography, Paper, Box, Alert } from '@mui/material';
import { testApiEndpoint } from '../utils/testApi';

const ApiTester = () => {
  const [endpointInput, setEndpointInput] = useState('/matches');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const result = await testApiEndpoint(endpointInput);
      setTestResult(result);
      console.log('API test result:', result);
    } catch (error) {
      console.error('Error testing API:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          API Endpoint Tester
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField 
            fullWidth
            label="API Endpoint" 
            value={endpointInput}
            onChange={(e) => setEndpointInput(e.target.value)}
            placeholder="e.g., /matches, /api/matches"
            helperText="Enter endpoint path to test"
            sx={{ mb: 2 }}
          />
          
          <Button 
            variant="contained" 
            onClick={handleTest}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Endpoint'}
          </Button>
        </Box>
        
        {testResult && (
          <Box sx={{ mt: 3 }}>
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {testResult.success ? 'Endpoint is reachable!' : 'Endpoint test failed'}
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Test Results:
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ApiTester; 