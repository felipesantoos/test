import axios from 'axios';

// Helper function to create Redmine API request with Basic Auth
export const createRedmineRequest = (authToken, redmineUrl, endpoint, params = {}, method = 'get', data = null, headers = {}) => {
  const url = `${redmineUrl}/` + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
  
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Basic ${authToken}`,
      'X-Requested-With': 'XMLHttpRequest',
      ...headers
    },
    params,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    responseType: headers.responseType || 'json',
    withCredentials: true // Enable sending cookies
  };

  // For file uploads, send raw data
  if (data instanceof Buffer) {
    config.data = data;
  } 
  // For regular requests, send JSON data
  else if (data && (method === 'post' || method === 'put' || method === 'patch')) {
    config.data = data;
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  }

  // Special handling for binary downloads
  if (headers.responseType === 'arraybuffer') {
    config.responseEncoding = 'binary';
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
