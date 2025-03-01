import axios from 'axios';

// Helper function to create Redmine API request with Basic Auth
export const createRedmineRequest = (authToken, redmineUrl, endpoint, params = {}, method = 'get', data = null) => {
  const url = `${redmineUrl}/` + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
  
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json'
    },
    params
  };

  if (data && (method === 'post' || method === 'put')) {
    config.data = data;
  }

  return axios(config);
};

// Helper function to create Redmine API request with API Key
export const createRedmineApiKeyRequest = (apiKey, redmineUrl, endpoint, params = {}, method = 'get', data = null) => {
  const url = `${redmineUrl}/` + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
  
  const config = {
    method,
    url,
    headers: {
      'X-Redmine-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    params
  };

  if (data && (method === 'post' || method === 'put')) {
    config.data = data;
  }

  return axios(config);
};