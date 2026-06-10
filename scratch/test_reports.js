const http = require("http");

const API_BASE = "http://localhost:4000/api/v1";

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log("=== STARTING REPORTS ENDPOINTS TEST ===");

  const authRes = await request(`${API_BASE}/auth/login`, {
    method: "POST",
    body: {
      email: "hr.admin@skylinx.local",
      password: "Skylinx@123",
    },
  });
  const token = authRes.data.accessToken;

  const keys = ["employees", "attendance", "leave", "payroll", "expenses", "compliance"];

  console.log("\n--- PASS 1: Default Tenant (null) ---");
  for (const key of keys) {
    try {
      const res = await request(`${API_BASE}/reports/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`${key} - Success! Rows: ${res.data.rows?.length || 0}`);
    } catch (err) {
      console.error(`${key} - FAILED:`, err.message);
    }
  }

  console.log("\n--- PASS 2: Explicit Tenant ('company_skylinx') ---");
  for (const key of keys) {
    try {
      const res = await request(`${API_BASE}/reports/${key}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-tenant-id": "company_skylinx"
        }
      });
      console.log(`${key} - Success! Rows: ${res.data.rows?.length || 0}`);
    } catch (err) {
      console.error(`${key} - FAILED:`, err.message);
    }
  }
}

run().catch(console.error);
