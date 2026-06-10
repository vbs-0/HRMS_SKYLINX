const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const refRoot = path.join(projectRoot, '..', 'hrms-16.8.0');

// Paths
const prismaSchemaPath = path.join(projectRoot, 'packages', 'database', 'prisma', 'schema.prisma');
const refHrDoctypesDir = path.join(refRoot, 'hrms', 'hr', 'doctype');
const refPayrollDoctypesDir = path.join(refRoot, 'hrms', 'payroll', 'doctype');
const apiModulesDir = path.join(projectRoot, 'apps', 'api', 'src', 'modules');

// Helper to check if file/dir exists
function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

// 1. Parse Prisma Models
function parsePrismaModels(schemaPath) {
  if (!exists(schemaPath)) return [];
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /model\s+(\w+)\s*\{/g;
  const models = [];
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    models.push(match[1]);
  }
  return models;
}

// 2. Parse Reference DocTypes
function getRefDoctypes(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter(name => {
    return fs.statSync(path.join(dir, name)).isDirectory() && name !== '__pycache__';
  });
}

// 3. Scan for frappe.whitelist in reference codebase
function scanWhitelistedFunctions(dir) {
  const list = [];
  function walk(currentDir) {
    if (!exists(currentDir)) return;
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const p = path.join(currentDir, file);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '__pycache__' && file !== '.git') {
          walk(p);
        }
      } else if (file.endsWith('.py')) {
        const content = fs.readFileSync(p, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('@frappe.whitelist')) {
            // Find function def
            let fnName = 'unknown';
            let fnSignature = '';
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              if (lines[j].trim().startsWith('def ')) {
                const defMatch = lines[j].match(/def\s+([a-zA-Z0-9_]+)\((.*?)\):/);
                if (defMatch) {
                  fnName = defMatch[1];
                  fnSignature = defMatch[2];
                } else {
                  fnName = lines[j].trim();
                }
                break;
              }
            }
            list.push({
              file: path.relative(refRoot, p),
              line: i + 1,
              name: fnName,
              signature: fnSignature
            });
          }
        }
      }
    }
  }
  walk(dir);
  return list;
}

// 4. Scan NestJS Controllers (already scanned, but we can do a summary)
function getImplementedModules(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter(name => {
    return fs.statSync(path.join(dir, name)).isDirectory();
  });
}

// Map Doctype to Prisma Model Name (rough conversion like "leave_application" -> "LeaveRequest" or "LeaveApplication")
function findPrismaMatch(doctype, prismaModels) {
  const normDoctype = doctype.replace(/_/g, '').toLowerCase();
  
  // Custom manual mappings for known names
  const manualMap = {
    'leave_application': 'LeaveRequest',
    'leave_type': 'LeaveType',
    'leave_allocation': 'LeaveBalance', // leave balance in prisma represents allocation/balance
    'attendance': 'AttendanceLog',
    'shift_type': 'Shift',
    'expense_claim': 'Expense',
    'job_opening': 'JobPosting',
    'job_applicant': 'Candidate', // or JobApplication
    'job_offer': 'JobApplication', // or similar
    'employee_onboarding': 'Employee', // boarding activities are separate or not done
    'salary_structure': 'SalaryStructure',
    'salary_slip': 'Payslip',
    'payroll_entry': 'PayrollRun',
    'holiday_list': 'Holiday',
    'employee_insurance': 'EmployeeInsurance',
    'insurance_claim': 'InsuranceClaim',
    'insurance_dependent': 'InsuranceDependent',
    'ticket': 'Ticket',
    'ticket_comment': 'TicketComment',
    'social_post': 'SocialPost',
    'social_like': 'SocialLike',
    'social_comment': 'SocialComment',
    'reward_voucher': 'RewardVoucher',
    'reward_ledger': 'RewardLedger',
    'recognition_reward': 'RecognitionReward',
  };

  if (manualMap[doctype]) {
    return prismaModels.includes(manualMap[doctype]) ? manualMap[doctype] : null;
  }

  // Exact or camelCase matches
  const match = prismaModels.find(model => {
    const normModel = model.toLowerCase();
    return normModel === normDoctype || normModel + 's' === normDoctype || normModel === normDoctype + 's';
  });
  return match || null;
}

// Run Analysis
const prismaModels = parsePrismaModels(prismaSchemaPath);
const hrDoctypes = getRefDoctypes(refHrDoctypesDir);
const payrollDoctypes = getRefDoctypes(refPayrollDoctypesDir);
const whitelistedFns = scanWhitelistedFunctions(path.join(refRoot, 'hrms'));
const apiModules = getImplementedModules(apiModulesDir);

// Mapping Doctype statuses
const hrMapping = hrDoctypes.map(dt => {
  const modelMatch = findPrismaMatch(dt, prismaModels);
  return {
    doctype: dt,
    prismaModel: modelMatch,
    implemented: !!modelMatch
  };
});

const payrollMapping = payrollDoctypes.map(dt => {
  const modelMatch = findPrismaMatch(dt, prismaModels);
  return {
    doctype: dt,
    prismaModel: modelMatch,
    implemented: !!modelMatch
  };
});

const analysis = {
  summary: {
    totalPrismaModels: prismaModels.length,
    totalRefHrDoctypes: hrDoctypes.length,
    totalRefPayrollDoctypes: payrollDoctypes.length,
    totalWhitelistedApis: whitelistedFns.length,
    totalApiModules: apiModules.length
  },
  prismaModels,
  hrMapping,
  payrollMapping,
  missingHrDoctypes: hrMapping.filter(x => !x.implemented).map(x => x.doctype),
  implementedHrDoctypes: hrMapping.filter(x => x.implemented).map(x => ({ doctype: x.doctype, model: x.prismaModel })),
  missingPayrollDoctypes: payrollMapping.filter(x => !x.implemented).map(x => x.doctype),
  implementedPayrollDoctypes: payrollMapping.filter(x => x.implemented).map(x => ({ doctype: x.doctype, model: x.prismaModel })),
  whitelistedFns
};

fs.writeFileSync(path.join(__dirname, 'gap_analysis_details.json'), JSON.stringify(analysis, null, 2));
console.log('Gap Analysis completed. Saved to scratch/gap_analysis_details.json');
