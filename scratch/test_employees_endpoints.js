const API_URL = "http://127.0.0.1:4000/api/v1";

async function runTests() {
  console.log("=== STARTING EMPLOYEE DIRECTORY API TESTS ===");

  // 1. Authenticate as HR Admin
  console.log("\n1. Authenticating as hr.admin@example.com...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hr.admin@example.com", password: "Skylinx@123" })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
  console.log("Authenticated successfully.");

  // 2. Fetch Employee List
  console.log("\n2. Fetching employee list...");
  const listRes = await fetch(`${API_URL}/employees`, { headers });
  if (!listRes.ok) throw new Error(`List failed: ${await listRes.text()}`);
  const listData = await listRes.json();
  console.log(`Success! Fetched ${listData.data.length} employees.`);

  // 3. Create a New Employee
  const employeeCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  const email = `test.employee.${employeeCode.toLowerCase()}@example.com`;
  console.log(`\n3. Creating new employee: Code=${employeeCode}, Email=${email}...`);
  const createRes = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      companyId: "company_skylinx",
      employeeCode,
      firstName: "Test",
      lastName: "Employee",
      email,
      phone: "9876543210",
      joiningDate: new Date().toISOString(),
    })
  });
  if (!createRes.ok) throw new Error(`Create failed: ${await createRes.text()}`);
  const createData = await createRes.json();
  const employeeId = createData.data.id;
  console.log(`Success! Created employee ID: ${employeeId}`);

  // 4. Retrieve Employee Details
  console.log(`\n4. Fetching employee details for ID=${employeeId}...`);
  const detailRes = await fetch(`${API_URL}/employees/${employeeId}`, { headers });
  if (!detailRes.ok) throw new Error(`Detail failed: ${await detailRes.text()}`);
  const detailData = await detailRes.json();
  console.log(`Success! Retrieved details. Phone is: ${detailData.data.phone}`);

  // 5. Update Employee Profile
  console.log(`\n5. Updating employee phone and gender...`);
  const updateRes = await fetch(`${API_URL}/employees/${employeeId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      phone: "1122334455",
      gender: "Male",
      dateOfBirth: new Date("1995-05-15").toISOString(),
    })
  });
  if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
  const updateData = await updateRes.json();
  console.log(`Success! Updated employee gender to: ${updateData.data.gender}`);

  // 6. Upload a Verification Document
  console.log(`\n6. Uploading verification document for employee...`);
  const docRes = await fetch(`${API_URL}/employees/${employeeId}/documents`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      documentType: "Passport",
      fileUrl: "https://secure-storage.local/docs/passport.pdf",
      expiresAt: new Date("2035-12-31").toISOString(),
    })
  });
  if (!docRes.ok) throw new Error(`Document upload failed: ${await docRes.text()}`);
  const docData = await docRes.json();
  const documentId = docData.data.id;
  console.log(`Success! Document uploaded with ID: ${documentId}, Status: ${docData.data.verificationStatus}`);

  // 7. Verify the Uploaded Document
  console.log(`\n7. Verifying the uploaded document...`);
  const verifyRes = await fetch(`${API_URL}/employees/${employeeId}/documents/${documentId}/verify`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ verifiedBy: "hr.admin@example.com" })
  });
  if (!verifyRes.ok) throw new Error(`Verification failed: ${await verifyRes.text()}`);
  const verifyData = await verifyRes.json();
  console.log(`Success! Document verification status: ${verifyData.data.verificationStatus}, VerifiedAt: ${verifyData.data.verifiedAt}`);

  console.log("\n=== ALL EMPLOYEE DIRECTORY API TESTS COMPLETED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("\nTEST FAILED:", err.message);
  process.exit(1);
});
