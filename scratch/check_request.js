import http from 'http';

http.get('http://localhost:5173/assets/images/backgrounds/bg_main.webp', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    if (body.length < 500) {
      body += chunk;
    }
  });
  
  res.on('end', () => {
    console.log('\nFirst 200 chars of body:');
    console.log(body.substring(0, 200));
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
