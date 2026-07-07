const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/v1/projects/936bf526-260b-4aed-9171-75b5e3b0a3a8/workflow',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
