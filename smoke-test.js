const http = require('http');

async function doRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("Logging in...");
  const loginRes = await doRequest('/api/v1/auth/login', 'POST', { email: 'admin@example.com', password: 'password123' });
  if (!loginRes.body.data || !loginRes.body.data.accessToken) {
    console.error("Login failed", loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.data.accessToken;

  console.log("\n--- 7a. GET /api/v1/payroll/templates ---");
  const templatesRes = await doRequest('/api/v1/payroll/templates', 'GET', null, token);
  console.log(JSON.stringify(templatesRes.body, null, 2));

  const standardTemplate = templatesRes.body.data.find(t => t.name.includes("Standard"));
  if (!standardTemplate) {
    console.error("Standard template not found");
    return;
  }

  console.log(`\n--- 7b. POST /api/v1/payroll/templates/${standardTemplate.id}/assign (Valid Employee) ---`);
  const assignRes1 = await doRequest(`/api/v1/payroll/templates/${standardTemplate.id}/assign`, 'POST', {
    employeeIds: ["emp_1002"],
    effectiveDate: "2026-06-15"
  }, token);
  console.log(JSON.stringify(assignRes1.body, null, 2));

  console.log(`\n--- 7d. POST /api/v1/payroll/templates/${standardTemplate.id}/assign (Invalid Employee) ---`);
  const assignRes2 = await doRequest(`/api/v1/payroll/templates/${standardTemplate.id}/assign`, 'POST', {
    employeeIds: ["emp_fake"],
    effectiveDate: "2026-06-15"
  }, token);
  console.log(JSON.stringify(assignRes2.body, null, 2));
}

run().catch(console.error);
