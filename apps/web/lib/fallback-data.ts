export const fallbackEmployees = [
  { id: "EMP-1001", name: "Aarav Mehta", role: "HR Manager", department: "People", location: "Mumbai", status: "Active" },
  { id: "EMP-1002", name: "Priya Nair", role: "Payroll Specialist", department: "Finance", location: "Bengaluru", status: "Active" },
  { id: "EMP-1003", name: "Kabir Sethi", role: "Frontend Engineer", department: "Engineering", location: "Delhi", status: "Active" },
  { id: "EMP-1004", name: "Sara Khan", role: "Sales Executive", department: "Sales", location: "Hyderabad", status: "Active" },
];

export const fallbackAttendance = [
  { employee: "Aarav Mehta", date: "2026-05-25", checkIn: "09:25", checkOut: "18:35", status: "Present" },
  { employee: "Priya Nair", date: "2026-05-25", checkIn: "09:48", checkOut: "18:05", status: "Late" },
  { employee: "Kabir Sethi", date: "2026-05-25", checkIn: "09:06", checkOut: "18:31", status: "Present" },
  { employee: "Sara Khan", date: "2026-05-25", checkIn: "-", checkOut: "-", status: "Absent" },
];

export const fallbackLeaves = [
  { employee: "Kabir Sethi", type: "Casual Leave", dates: "2026-05-28 to 2026-05-29", days: 2, status: "Pending" },
  { employee: "Priya Nair", type: "Sick Leave", dates: "2026-05-20", days: 1, status: "Approved" },
];

export const fallbackPayroll = [
  { employee: "Aarav Mehta", month: "May 2026", gross: "\u20B9120,833", deductions: "\u20B916,800", net: "\u20B9104,033", status: "Draft" },
  { employee: "Priya Nair", month: "May 2026", gross: "\u20B981,667", deductions: "\u20B99,200", net: "\u20B972,467", status: "Draft" },
];

export const fallbackDocuments = [
  { id: "doc_aadhaar_1001", employeeId: "emp_1001", employee: "Aarav Mehta", type: "Aadhaar", expires: "-", status: "Verified", fileUrl: "https://storage.example.com/documents/aadhaar-1001.pdf" },
  { id: "doc_pan_1002", employeeId: "emp_1002", employee: "Priya Nair", type: "PAN", expires: "-", status: "Pending", fileUrl: "https://storage.example.com/documents/pan-1002.pdf" },
  { id: "doc_degree_1003", employeeId: "emp_1003", employee: "Kabir Sethi", type: "Education Certificate", expires: "-", status: "Pending", fileUrl: "https://storage.example.com/documents/degree-1003.pdf" },
];

export const fallbackExpenses = [
  { id: "exp_travel_1004", employee: "Sara Khan", category: "Travel", amount: "\u20B91,850", claimDate: "2026-05-24", status: "PENDING", receiptUrl: "https://storage.example.com/expenses/emp_1004/travel-may.pdf" },
  { id: "exp_food_1003", employee: "Kabir Sethi", category: "Meals", amount: "\u20B9620", claimDate: "2026-05-22", status: "HOLD", receiptUrl: "https://storage.example.com/expenses/emp_1003/meals-may.pdf" },
  { id: "exp_client_1002", employee: "Priya Nair", category: "Client Visit", amount: "\u20B93,400", claimDate: "2026-05-19", status: "APPROVED", receiptUrl: "https://storage.example.com/expenses/emp_1002/client-visit.pdf" },
];

export const fallbackHolidays = [
  { id: "holiday_republic_2026", name: "Republic Day", date: "2026-01-26", type: "MANDATORY", location: "All Locations", status: "ACTIVE" },
  { id: "holiday_holi_2026", name: "Holi", date: "2026-03-04", type: "REGIONAL", location: "Delhi", status: "ACTIVE" },
  { id: "holiday_independence_2026", name: "Independence Day", date: "2026-08-15", type: "MANDATORY", location: "All Locations", status: "ACTIVE" },
  { id: "holiday_diwali_2026", name: "Diwali", date: "2026-11-08", type: "OPTIONAL", location: "All Locations", status: "ACTIVE" },
];

export const fallbackOrgEmployees = [
  { id: "emp_1001", employeeCode: "EMP-1001", name: "Aarav Mehta", managerId: null, managerName: null, department: "People", designation: "HR Manager", location: "Mumbai", status: "ACTIVE", reports: 2 },
  { id: "emp_1002", employeeCode: "EMP-1002", name: "Priya Nair", managerId: "emp_1001", managerName: "Aarav Mehta", department: "Finance", designation: "Payroll Specialist", location: "Bengaluru", status: "ACTIVE", reports: 0 },
  { id: "emp_1005", employeeCode: "EMP-1005", name: "Rohan Iyer", managerId: "emp_1001", managerName: "Aarav Mehta", department: "Operations", designation: "Operations Lead", location: "Pune", status: "ACTIVE", reports: 2 },
  { id: "emp_1003", employeeCode: "EMP-1003", name: "Kabir Sethi", managerId: "emp_1005", managerName: "Rohan Iyer", department: "Engineering", designation: "Frontend Engineer", location: "Delhi", status: "ACTIVE", reports: 0 },
  { id: "emp_1004", employeeCode: "EMP-1004", name: "Sara Khan", managerId: "emp_1005", managerName: "Rohan Iyer", department: "Sales", designation: "Sales Executive", location: "Hyderabad", status: "ACTIVE", reports: 0 },
];

export const fallbackDepartments = [
  { department: "Engineering", count: 1 },
  { department: "Finance", count: 1 },
  { department: "Operations", count: 1 },
  { department: "People", count: 1 },
  { department: "Sales", count: 1 },
];

export const fallbackInsurancePolicies = [
  { id: "ins_1002", employeeId: "emp_1002", employee: "Priya Nair", provider: "Company Group Health", policyNumber: "SGH-2026-1002", policyType: "Group Mediclaim", coverage: "\u20B95,00,000", premium: "\u20B918,500", validTill: "2027-03-31", status: "ACTIVE", dependents: 1 },
  { id: "ins_1003", employeeId: "emp_1003", employee: "Kabir Sethi", provider: "Company Group Health", policyNumber: "SGH-2026-1003", policyType: "Group Mediclaim", coverage: "\u20B95,00,000", premium: "\u20B918,500", validTill: "2027-03-31", status: "ACTIVE", dependents: 0 },
];

export const fallbackInsuranceClaims = [
  { id: "claim_1002_001", employee: "Priya Nair", provider: "Company Group Health", claimNumber: "CLM-2026-001", claimType: "Hospitalization", amount: "\u20B942,000", claimDate: "2026-05-20", status: "PENDING", documentUrl: "https://storage.example.com/insurance/emp_1002/claim-001.pdf" },
  { id: "claim_1003_001", employee: "Kabir Sethi", provider: "Company Group Health", claimNumber: "CLM-2026-002", claimType: "OPD", amount: "\u20B94,500", claimDate: "2026-05-18", status: "APPROVED", documentUrl: "https://storage.example.com/insurance/emp_1003/claim-002.pdf" },
];

export const fallbackCardEmployees = [
  {
    id: "emp_1001",
    employeeCode: "EMP-1001",
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    phone: "+91 98765 41000",
    department: "People",
    designation: "HR Manager",
    location: "Mumbai",
    joiningDate: "2023-01-16",
  },
  {
    id: "emp_1003",
    employeeCode: "EMP-1003",
    name: "Kabir Sethi",
    email: "kabir.sethi@example.com",
    phone: "+91 98765 41000",
    department: "Engineering",
    designation: "Frontend Engineer",
    location: "Delhi",
    joiningDate: "2023-01-16",
  },
];

export const fallbackNotifications = [
  { id: "notif_payroll", recipient: "Aarav Mehta", channel: "EMAIL", title: "May payroll verification closes today", body: "Please review pending payroll items before locking the run.", status: "PENDING", createdAt: "2026-05-25", sentAt: "-" },
  { id: "notif_attendance", recipient: "Aarav Mehta", channel: "WHATSAPP", title: "Attendance reminder", body: "Four employees have not completed check-out for today.", status: "PENDING", createdAt: "2026-05-25", sentAt: "-" },
  { id: "notif_leave", recipient: "Aarav Mehta", channel: "IN_APP", title: "Leave approval pending", body: "Kabir Sethi has a casual leave request awaiting HR action.", status: "SENT", createdAt: "2026-05-25", sentAt: "2026-05-25" },
];

export const fallbackSocialPosts = [
  {
    id: "social_announcement",
    author: "Aarav Mehta",
    type: "ANNOUNCEMENT",
    title: "May payroll review window",
    body: "Payroll verification for May is open. Managers should close attendance corrections before payroll lock.",
    pinned: true,
    createdAt: "2026-05-25",
    likes: 0,
    comments: ["Please coordinate any pending regularization by end of day."],
  },
  {
    id: "social_recognition",
    author: "Aarav Mehta",
    type: "RECOGNITION",
    title: "Employee recognition",
    body: "Congratulations to Sara Khan for closing the Hyderabad client onboarding ahead of schedule.",
    pinned: false,
    createdAt: "2026-05-25",
    likes: 1,
    comments: [],
  },
];

export const fallbackRewards = {
  totalPoints: 300,
  vouchers: [
    { id: "voucher_coffee", code: "SKY-COFFEE-500", title: "Cafe Voucher", provider: "Company Benefits", value: "\u20B9500", pointsCost: 250, status: "ACTIVE" },
  ],
  benefits: [
    { id: "benefit_health", title: "Health Checkup", provider: "Company Wellness", category: "Wellness", description: "Annual preventive health checkup for employees.", pointsCost: 1200, status: "ACTIVE" },
  ],
  recognitions: [
    { id: "recognition_sara", employee: "Sara Khan", title: "Client onboarding excellence", message: "Great ownership on the Hyderabad client onboarding.", points: 300, createdAt: "2026-05-25" },
  ],
  ledger: [
    { id: "ledger_sara", employee: "Sara Khan", points: 300, reason: "Client onboarding excellence", source: "RECOGNITION", createdAt: "2026-05-25" },
  ],
};

export const fallbackCompanySettings = {
  name: "PeopleOS",
  legalName: "Your Company Private Limited",
  logoUrl: "/company-logo.png",
  address: "Mumbai, Maharashtra",
  taxId: "GSTIN-PENDING",
  workWeek: "Monday to Saturday",
  timezone: "Asia/Kolkata",
};

export const fallbackModuleSettings = [
  "employees",
  "documents",
  "cards",
  "attendance",
  "leave",
  "holidays",
  "organization",
  "payroll",
  "expenses",
  "insurance",
  "assets",
  "performance",
  "approvals",
  "compliance",
  "analytics",
  "saas",
  "notifications",
  "social",
  "rewards",
  "reports",
  "security",
].map((module) => ({ module, enabled: true }));

export const fallbackAuditLogs = [
  { id: "audit_seed", module: "seed", action: "create", entityType: "database", entityId: "company_default", actor: "System", createdAt: "2026-05-25" },
  { id: "audit_payroll", module: "payroll", action: "run.calculate", entityType: "payroll_run", entityId: "payroll_may", actor: "Aarav Mehta", createdAt: "2026-05-25" },
  { id: "audit_documents", module: "employees", action: "documents.verify", entityType: "employee_document", entityId: "doc_pan", actor: "Aarav Mehta", createdAt: "2026-05-25" },
];

export const fallbackAnalytics = {
  metrics: {
    headcount: 5,
    attendanceRate: 75,
    leaveApprovalRate: 0,
    monthlyPayroll: 120833,
    payrollNet: 104033,
    pendingExpenses: 1,
    openJobs: 1,
    candidates: 1,
    annualCtc: 4930000,
  },
  insights: [
    { title: "Workforce Strength", value: "5 active", note: "5 departments covered", status: "STABLE" },
    { title: "Attendance Health", value: "75%", note: "4 attendance logs analysed", status: "REVIEW" },
    { title: "Payroll Load", value: "\u20B9120,833", note: "1 payslip in current sample", status: "TRACKING" },
    { title: "Hiring Pipeline", value: "1 candidates", note: "1 open jobs", status: "ACTIVE" },
  ],
  departmentBreakdown: [
    { department: "People", count: 1 },
    { department: "Finance", count: 1 },
    { department: "Engineering", count: 1 },
    { department: "Sales", count: 1 },
    { department: "Operations", count: 1 },
  ],
  locationBreakdown: [
    { location: "Mumbai", count: 1 },
    { location: "Bengaluru", count: 1 },
    { location: "Delhi", count: 1 },
    { location: "Hyderabad", count: 1 },
    { location: "Pune", count: 1 },
  ],
  trend: [
    { label: "Headcount", value: 5 },
    { label: "Attendance", value: 75 },
    { label: "Leave", value: 0 },
    { label: "Hiring", value: 1 },
    { label: "Expenses", value: 1 },
  ],
  risks: [
    { name: "Pending Expenses", count: 1, status: "REVIEW" },
    { name: "Leave Approval", count: 1, status: "REVIEW" },
    { name: "Open Hiring", count: 1, status: "ACTIVE" },
  ],
};

export const fallbackSaas = {
  tenants: 1,
  activeTenants: 1,
  activePlan: "Standard",
  employeeLimit: 25,
  activeEmployees: 5,
  usagePercent: 20,
  enabledModules: 18,
  monthlyPrice: 1749,
  plans: [
    {
      name: "Basic",
      employees: 5,
      monthlyPrice: 0,
      additionalEmployeePrice: 0,
      modules: 8,
      status: "AVAILABLE",
      accessLevel: "Free Forever",
      features: ["No hidden charges", "No credit card required", "Employee directory", "Documents", "Web attendance", "Leave basics", "Holiday calendar", "Email support"],
    },
    {
      name: "Standard",
      employees: 25,
      monthlyPrice: 1749,
      additionalEmployeePrice: 70,
      modules: 18,
      status: "ACTIVE",
      accessLevel: "Professional HR access",
      features: ["Everything in Basic", "Payroll", "Expenses", "Insurance", "ID & visiting cards", "Organization chart", "Notifications", "Phone support"],
    },
    {
      name: "Pro",
      employees: 25,
      monthlyPrice: 3750,
      additionalEmployeePrice: 150,
      modules: 30,
      status: "AVAILABLE",
      accessLevel: "Enterprise access",
      features: ["Everything in Standard", "Rewards", "Analytics", "Compliance", "Security", "SaaS controls"],
    },
  ],
  planMatrix: [
    { section: "HR Management", feature: "Announcements", basic: "Included", standard: "Included", pro: "Included" },
    { section: "HR Management", feature: "Reminders and alerts", basic: "Included", standard: "Included", pro: "Included" },
    { section: "HR Management", feature: "Automated birthday and anniversary messages", basic: "Included", standard: "Included", pro: "Included" },
    { section: "HR Management", feature: "Employee database and KYC upload", basic: "Included", standard: "Included", pro: "Included" },
    { section: "HR Management", feature: "Login using OTP", basic: "Included", standard: "Included", pro: "Included" },
    { section: "HR Management", feature: "Data storage", basic: "250 MB", standard: "Unlimited", pro: "Unlimited" },
    { section: "HR Management", feature: "Verification dashboard", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Leave & Attendance", feature: "Web clock for attendance", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Leave & Attendance", feature: "Customizable leave rules", basic: "1 rule", standard: "Unlimited", pro: "Unlimited" },
    { section: "Leave & Attendance", feature: "Customizable attendance rules", basic: "1 rule", standard: "Unlimited", pro: "Unlimited" },
    { section: "Leave & Attendance", feature: "Attendance penalty rules", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Leave & Attendance", feature: "Selfie / GPS attendance", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Leave & Attendance", feature: "Attendance IP restriction", basic: "Not included", standard: "Add-on \u20B910/user/month", pro: "Included" },
    { section: "Leave & Attendance", feature: "Geo-fencing", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
    { section: "Payroll", feature: "Customized salary structure", basic: "1 structure", standard: "Unlimited", pro: "Unlimited" },
    { section: "Payroll", feature: "Audit logs", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Salary payout through bank export", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Bank transfers through NEFT", basic: "Included", standard: "Unlimited", pro: "Unlimited" },
    { section: "Payroll", feature: "PF, ESI, PT and TDS statutory calculation", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "PF, ESI challan generation", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Form 16 and 12BB", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Income tax projections for employees", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Income tax computation", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
    { section: "Payroll", feature: "Overtime calculation", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Daily / weekly wages with OT", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Payslips bulk download", basic: "Not included", standard: "Add-on \u20B910/user/month", pro: "Included" },
    { section: "Payroll", feature: "Mid month variable payout", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Payroll", feature: "Exit management", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
    { section: "Expense Management", feature: "Expense payout", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Expense Management", feature: "Expense approval workflow", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
    { section: "Additional Features", feature: "ESS portal", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Letter generation", basic: "Not included", standard: "Add-on \u20B930/user/month", pro: "Included" },
    { section: "Additional Features", feature: "Asset management", basic: "Not included", standard: "Add-on \u20B910/user/month", pro: "Included" },
    { section: "Additional Features", feature: "Company Prime benefits", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Analytics and reports", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Employee social network", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Automated ID / visiting card", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Multicity calendar", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Realtime biometric integration", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Additional Features", feature: "Annual maintenance charges", basic: "Not included", standard: "\u20B95,000", pro: "\u20B95,000" },
    { section: "Implementation & Support", feature: "Setup support", basic: "2 hours", standard: "Included", pro: "Included" },
    { section: "Implementation & Support", feature: "Live webinar", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Implementation & Support", feature: "Support via email", basic: "Included", standard: "Included", pro: "Included" },
    { section: "Implementation & Support", feature: "Support via chat and phone", basic: "Not included", standard: "Included", pro: "Included" },
    { section: "Implementation & Support", feature: "Training for employees", basic: "Not included", standard: "Not included", pro: "Included" },
  ],
  planAddOns: [
    { feature: "Multicompany support", basic: "Not included", standard: "\u20B920/user/month", pro: "\u20B920/user/month" },
    { feature: "Live tracking for Android", basic: "Not included", standard: "\u20B950/user/month", pro: "\u20B950/user/month" },
    { feature: "Rewards and recognition", basic: "Not included", standard: "\u20B930/user/month", pro: "Included" },
    { feature: "Roster / rotational shift", basic: "Not included", standard: "\u20B930/user/month", pro: "Included" },
    { feature: "Performance management", basic: "Not included", standard: "\u20B940/user/month", pro: "Included" },
    { feature: "Advanced attendance system", basic: "Not included", standard: "\u20B950/user/month", pro: "Included" },
    { feature: "Device attendance connector", basic: "Not included", standard: "\u20B950/user/month", pro: "Included" },
    { feature: "Custom branding", basic: "Not included", standard: "Included", pro: "Included" },
    { feature: "Timesheet", basic: "Not included", standard: "Coming soon", pro: "Coming soon" },
    { feature: "Background verification", basic: "Not included", standard: "Coming soon", pro: "Coming soon" },
  ],
  billingSummary: {
    plan: "Standard",
    duration: "1 Year",
    employees: 25,
    basePlan: 1749,
    additionalEmployeePrice: 0,
    addOnMonthlyPrice: 0,
    itemTotal: 20988,
    discountPrice: 20988,
    gst: 3777.84,
    grandTotal: 24765.84,
  },
  companies: [
    { id: "company_default", name: "PeopleOS", legalName: "Your Company Private Limited", status: "ACTIVE", timezone: "Asia/Kolkata", createdAt: "2026-05-25T00:00:00.000Z" },
  ],
  entitlements: [
    { id: "ent_employees", module: "employees", enabled: true },
    { id: "ent_payroll", module: "payroll", enabled: true },
    { id: "ent_attendance", module: "attendance", enabled: true },
  ],
  billingEvents: [],
};

export const fallbackIntegrations = {
  connected: 2,
  configured: 5,
  total: 7,
  integrations: [
    { key: "email", name: "Email Alerts", status: "CONFIGURED", provider: "SMTP pending", records: 1 },
    { key: "whatsapp", name: "WhatsApp Alerts", status: "CONFIGURED", provider: "WhatsApp API pending", records: 1 },
    { key: "push", name: "Push Notifications", status: "CONFIGURED", provider: "Notification channel", records: 0 },
    { key: "biometric", name: "Biometric Attendance", status: "CONFIGURED", provider: "Device bridge ready", records: 0 },
    { key: "geo", name: "Geo Attendance", status: "CONNECTED", provider: "Browser location", records: 1 },
    { key: "s3", name: "AWS S3 Storage", status: "PENDING", provider: "Bucket pending", records: 0 },
    { key: "bank", name: "Bank Export", status: "CONFIGURED", provider: "Payroll bank file export", records: 0 },
  ],
  logs: [],
};

export const fallbackApprovals = {
  total: 5,
  pending: 4,
  approved: 1,
  rejected: 0,
  modules: [
    { module: "leave", count: 1 },
    { module: "attendance", count: 0 },
    { module: "expenses", count: 1 },
    { module: "insurance", count: 1 },
    { module: "payroll", count: 1 },
  ],
  items: [
    { id: "leave_1003", type: "Leave", module: "leave", requester: "Kabir Sethi", title: "Casual Leave", amount: 2, status: "PENDING", createdAt: "2026-05-25T00:00:00.000Z" },
    { id: "exp_travel_1004", type: "Expense", module: "expenses", requester: "Sara Khan", title: "Travel", amount: 1850, status: "PENDING", createdAt: "2026-05-24T00:00:00.000Z" },
    { id: "claim_1002_001", type: "Insurance", module: "insurance", requester: "Priya Nair", title: "Hospitalization", amount: 42000, status: "PENDING", createdAt: "2026-05-20T00:00:00.000Z" },
  ],
};



export const fallbackAssets = {
  total: 8,
  assigned: 8,
  available: 2,
  returned: 0,
  handoverPending: 5,
  categories: [
    { type: "Laptop", count: 5 },
    { type: "ID Card", count: 3 },
    { type: "Phone", count: 0 },
    { type: "Accessories", count: 2 },
  ],
  rows: [
    { id: "asset_laptop_emp_1001", assetTag: "SKY-LAP-001", type: "Laptop", item: "HP EliteBook", assignedTo: "Aarav Mehta", employeeStatus: "ACTIVE", department: "People", status: "ASSIGNED", condition: "GOOD" },
    { id: "asset_id_emp_1001", assetTag: "SKY-ID-EMP-1001", type: "ID Card", item: "Employee ID Card", assignedTo: "Aarav Mehta", employeeStatus: "ACTIVE", department: "People", status: "ASSIGNED", condition: "GOOD" },
  ],
  logs: [],
};

export const fallbackPerformance = {
  employees: 5,
  averageScore: 82,
  reviewReady: 4,
  recognitions: 1,
  cycles: 0,
  categories: [
    { name: "Goals", completed: 11, total: 17 },
    { name: "Attendance", completed: 4, total: 5 },
    { name: "Recognition", completed: 1, total: 5 },
    { name: "Review Ready", completed: 4, total: 5 },
  ],
  rows: [
    { employeeId: "emp_1001", employee: "Aarav Mehta", department: "People", designation: "HR Manager", goals: 4, completedGoals: 3, attendanceScore: 100, recognitionPoints: 0, performanceScore: 91, rating: "EXCELLENT" },
    { employeeId: "emp_1002", employee: "Priya Nair", department: "Finance", designation: "Payroll Specialist", goals: 3, completedGoals: 2, attendanceScore: 100, recognitionPoints: 0, performanceScore: 84, rating: "GOOD" },
    { employeeId: "emp_1004", employee: "Sara Khan", department: "Sales", designation: "Sales Executive", goals: 3, completedGoals: 2, attendanceScore: 55, recognitionPoints: 300, performanceScore: 76, rating: "GOOD" },
  ],
  logs: [],
};

export const fallbackReportCards = [
  { key: "employees", title: "Employee Reports", total: 5, note: "Department, designation, location" },
  { key: "attendance", title: "Attendance Reports", total: 4, note: "Daily logs and status" },
  { key: "leave", title: "Leave Reports", total: 1, note: "Requests and balances" },
  { key: "payroll", title: "Payroll Reports", total: 1, note: "Payslips, gross, net" },
  { key: "expenses", title: "Expense Reports", total: 1, note: "Claims and reimbursements" },
  { key: "compliance", title: "Compliance Reports", total: 4, note: "PF, ESI, PT, TDS" },
];

export const fallbackCompliance = {
  activeEmployees: 5,
  configuredEmployees: 2,
  payrollRuns: 1,
  totals: {
    pf: 21600,
    esi: 2450,
    professionalTax: 400,
    tds: 18500,
  },
  checks: [
    { name: "PF", status: "READY", amount: 21600 },
    { name: "ESI", status: "READY", amount: 2450 },
    { name: "Professional Tax", status: "READY", amount: 400 },
    { name: "TDS", status: "READY", amount: 18500 },
    { name: "Form 16", status: "READY", amount: 18500 },
  ],
  rows: [
    { employeeId: "emp_1001", employee: "Aarav Mehta", department: "People", annualCtc: 1450000, pf: 10800, esi: 0, professionalTax: 200, tds: 12000, form16Status: "READY", effectiveFrom: "2026-04-01" },
    { employeeId: "emp_1002", employee: "Priya Nair", department: "Finance", annualCtc: 980000, pf: 10800, esi: 2450, professionalTax: 200, tds: 6500, form16Status: "READY", effectiveFrom: "2026-04-01" },
  ],
};

export const fallbackAtsJobs = [
  { id: "job_backend", title: "Backend Engineer", openings: 2, status: "OPEN", candidates: 1, stage: "INTERVIEW" },
  { id: "job_hr", title: "HR Executive", openings: 1, status: "OPEN", candidates: 0, stage: "SCREENING" },
  { id: "job_accountant", title: "Accountant", openings: 1, status: "OPEN", candidates: 0, stage: "OFFER" },
];

export const fallbackAtsCandidates = [
  { id: "cand_neha", fullName: "Neha Sharma", email: "neha.sharma@example.com", phone: "+91 98888 12000", source: "LinkedIn", currentStage: "INTERVIEW", jobTitle: "Backend Engineer", applicationId: "app_neha_backend", interviews: 1 },
];

