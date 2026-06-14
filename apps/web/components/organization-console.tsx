"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../lib/client-api";
import { Card } from "./ui";
import { ChevronDown } from "lucide-react";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  managerId: string | null;
  managerName: string | null;
  department: string;
  designation: string;
  location: string;
  status: string;
  photoUrl: string | null;
}

interface DepartmentGroup {
  department: string;
  count: number;
  employees: Employee[];
}

interface ApiOrgChart {
  employees: Employee[];
  departmentTree: DepartmentGroup[];
}

export function OrganizationConsole() {
  const [activeTab, setActiveTab] = useState<"Employee Tree" | "Department Tree">("Employee Tree");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [isDeptCollapsed, setIsDeptCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch<ApiOrgChart>("/organization/chart")
      .then((res) => {
        if (res.data) {
          const list = res.data.employees || [];
          setEmployees(list);
          const depts = res.data.departmentTree || [];
          setDepartments(depts);
          if (depts.length > 0) {
            // Find a seeded department like Operations or HR if present, else first
            const defaultDept = depts.find(d => d.department.toLowerCase() === "hr" || d.department.toLowerCase().includes("operation")) || depts[0];
            setSelectedDepartment(defaultDept.department);
          }
        }
      })
      .catch((err) => console.warn("Failed to load organization chart", err))
      .finally(() => setLoaded(false));
  }, []);

  // Helper to resolve avatars dynamically
  function getAvatarUrl(name: string) {
    const n = name.toLowerCase();
    if (n.includes("aarav") || n.includes("mehta")) return "https://randomuser.me/api/portraits/men/32.jpg";
    if (n.includes("rohan") || n.includes("iyer")) return "https://randomuser.me/api/portraits/men/46.jpg";
    if (n.includes("kabir") || n.includes("sethi")) return "https://randomuser.me/api/portraits/men/60.jpg";
    if (n.includes("priya") || n.includes("nair")) return "https://randomuser.me/api/portraits/women/44.jpg";
    if (n.includes("sara") || n.includes("khan")) return "https://randomuser.me/api/portraits/women/12.jpg";
    
    // screenshot placeholders match
    if (n.includes("shareef")) return "https://randomuser.me/api/portraits/men/32.jpg";
    if (n.includes("aseem")) return "https://randomuser.me/api/portraits/men/46.jpg";
    if (n.includes("saranya")) return "https://randomuser.me/api/portraits/women/44.jpg";
    if (n.includes("gunade")) return "https://randomuser.me/api/portraits/men/60.jpg";

    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://randomuser.me/api/portraits/${hash % 2 === 0 ? "men" : "women"}/${hash % 100}.jpg`;
  }

  // Calculate report counts (direct and indirect) recursively
  function calculateReportees(employeeId: string): { direct: number; indirect: number } {
    const directReports = employees.filter((e) => e.managerId === employeeId);
    const directCount = directReports.length;
    let indirectCount = 0;
    for (const report of directReports) {
      const sub = calculateReportees(report.id);
      indirectCount += sub.direct + sub.indirect;
    }
    return { direct: directCount, indirect: indirectCount };
  }

  function handleToggleCollapse(id: string) {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleExportPDF() {
    window.print();
  }

  // Find leadership root nodes (employees whose managerId is null, or is not in the employees list)
  const employeeIds = new Set(employees.map((e) => e.id));
  const roots = employees.filter((e) => !e.managerId || !employeeIds.has(e.managerId));

  const activeDeptData = departments.find((d) => d.department === selectedDepartment);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-container, .print-container * {
            visibility: visible !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        .curved-line-left {
          position: absolute;
          top: 0;
          left: 50%;
          right: 0;
          height: 16px;
          border-top: 2px solid var(--border-strong);
          border-left: 2px solid var(--border-strong);
          border-top-left-radius: 12px;
        }

        .curved-line-right {
          position: absolute;
          top: 0;
          left: 0;
          right: 50%;
          height: 16px;
          border-top: 2px solid var(--border-strong);
          border-right: 2px solid var(--border-strong);
          border-top-right-radius: 12px;
        }

        .curved-line-middle {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 16px;
          border-top: 2px solid var(--border-strong);
        }

        .curved-line-middle-vertical {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 16px;
          background-color: var(--border-strong);
        }
      ` }} />

      {/* Tab bar */}
      <div className="flex border-b-2 border-[var(--color-brand-600)] w-full no-print tab-bar-container mb-6">
        <button
          onClick={() => setActiveTab("Employee Tree")}
          className={`px-6 py-3 font-bold text-sm transition-all focus:outline-none ${
            activeTab === "Employee Tree"
              ? "bg-[var(--color-brand-600)] text-white"
              : "bg-transparent text-text-primary hover:bg-sunken"
          }`}
        >
          Employee Tree
        </button>
        <button
          onClick={() => setActiveTab("Department Tree")}
          className={`px-6 py-3 font-bold text-sm transition-all focus:outline-none ${
            activeTab === "Department Tree"
              ? "bg-[var(--color-brand-600)] text-white"
              : "bg-transparent text-text-primary hover:bg-sunken"
          }`}
        >
          Department Tree
        </button>
      </div>

      {/* Employee Tree View */}
      {activeTab === "Employee Tree" && (
        <div className="print-container w-full flex flex-col items-center">
          <div className="w-full flex justify-start mb-6 no-print export-btn-container">
            <button
              onClick={handleExportPDF}
              className="px-6 py-2.5 font-bold text-xs bg-[var(--color-brand-600)] text-white rounded shadow-sm hover:bg-[var(--color-brand-600)] transition-all"
            >
              EXPORT TO PDF
            </button>
          </div>

          <div className="flex flex-col items-center w-full overflow-auto py-8">
            {roots.map((root) => (
              <EmployeeTreeNode
                key={root.id}
                employee={root}
                allEmployees={employees}
                collapsedNodes={collapsedNodes}
                onToggleCollapse={handleToggleCollapse}
                getAvatarUrl={getAvatarUrl}
                calculateReportees={calculateReportees}
              />
            ))}
          </div>
        </div>
      )}

      {/* Department Tree View */}
      {activeTab === "Department Tree" && (
        <div className="print-container w-full grid grid-cols-[220px_1fr] gap-6 items-start py-4">
          
          {/* Sidebar Left Column */}
          <div className="no-print flex flex-col relative">
            <button
              onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-[var(--color-brand-600)] text-white font-bold text-xs rounded-md shadow-sm transition-all hover:bg-[var(--color-brand-600)]"
            >
              <span>DEPARTMENTS</span>
              <ChevronDown className="h-4 w-4 shrink-0 ml-1" />
            </button>

            {isDeptDropdownOpen && (
              <div className="absolute top-full left-0 border border-line rounded-md bg-raised shadow-lg mt-1 overflow-y-auto max-h-[250px] w-full z-20">
                {departments.map((dept) => (
                  <button
                    key={dept.department}
                    onClick={() => {
                      setSelectedDepartment(dept.department);
                      setIsDeptDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold border-b last:border-0 border-line transition-all ${
                      selectedDepartment === dept.department
                        ? "bg-info-bg text-info-fg font-bold"
                        : "text-text-primary hover:bg-sunken"
                    }`}
                  >
                    {dept.department}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column Tree Panel */}
          <div className="flex flex-col items-center w-full min-h-[400px]">
            {!selectedDepartment ? (
              <div className="text-text-secondary text-sm mt-12">Select a department to view.</div>
            ) : activeDeptData ? (
              <div className="flex flex-col items-center w-full pt-4">
                {/* Department Node Card */}
                <div className="flex items-center gap-3 bg-info-bg border border-info-border rounded-lg p-3 px-5 shadow-sm min-w-[220px]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                    {selectedDepartment.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-primary">{selectedDepartment}</div>
                    <div className="text-xs font-semibold text-info-fg mt-0.5">{activeDeptData.employees.length} Employees</div>
                  </div>
                </div>

                {/* Orange collapse toggle badge */}
                <div className="w-0.5 h-6 bg-[var(--border-strong)] relative">
                  <button
                    onClick={() => setIsDeptCollapsed(!isDeptCollapsed)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm shadow-sm hover:bg-amber-600 transition-all focus:outline-none z-10"
                  >
                    {isDeptCollapsed ? "+" : "-"}
                  </button>
                </div>

                {/* Employees list row */}
                {!isDeptCollapsed && activeDeptData.employees.length > 0 && (
                  <div className="w-full flex flex-col items-center">
                    
                    {/* Branched connections */}
                    {activeDeptData.employees.length === 1 ? (
                      <div className="w-0.5 h-6 bg-[var(--border-strong)]" />
                    ) : (
                      <div className="relative w-full flex justify-center h-4">
                        <div className="absolute top-0 w-0.5 h-4 bg-[var(--border-strong)]"></div>
                      </div>
                    )}

                    {/* Children display */}
                    <div className="flex justify-center gap-0 w-full relative">
                      {activeDeptData.employees.map((emp, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === activeDeptData.employees.length - 1;
                        const isOnly = activeDeptData.employees.length === 1;

                        return (
                          <div key={emp.id} className="child-branch-wrapper px-4 pt-8 flex flex-col items-center">
                            {!isOnly && (
                              <>
                                {isFirst && <div className="curved-line-left" />}
                                {isLast && <div className="curved-line-right" />}
                                {!isFirst && !isLast && (
                                  <>
                                    <div className="curved-line-middle" />
                                    <div className="w-0.5 h-8 bg-[var(--border-strong)] absolute top-0 left-1/2 -translate-x-1/2" />
                                  </>
                                )}
                                {(isFirst || isLast) && (
                                  <div className="w-0.5 h-4 bg-[var(--border-strong)] absolute top-4 left-1/2 -translate-x-1/2" />
                                )}
                              </>
                            )}
                            {isOnly && (
                              <div className="w-0.5 h-4 bg-[var(--border-strong)] absolute top-0 left-1/2 -translate-x-1/2" />
                            )}
                            
                            {/* Employee Card */}
                            <div className="border border-line bg-raised rounded-lg p-4 pt-8 text-center shadow-sm relative min-w-[180px] max-w-[200px]">
                              <div className="w-12 h-12 rounded-full border-2 border-blue-400 overflow-hidden absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-brand-50)] flex items-center justify-center select-none">
                                <span className="text-sm font-bold text-info-fg">
                                  {emp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-info-fg truncate">{emp.designation}</div>
                              <div className="text-xs font-bold text-text-primary mt-1 truncate">{emp.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-text-secondary text-sm mt-12">No data found.</div>
            )}
          </div>

        </div>
      )}
    </>
  );
}

// Tree Node for Employee Tree View
interface NodeProps {
  employee: Employee;
  allEmployees: Employee[];
  collapsedNodes: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  getAvatarUrl: (name: string) => string;
  calculateReportees: (id: string) => { direct: number; indirect: number };
}

function EmployeeTreeNode({
  employee,
  allEmployees,
  collapsedNodes,
  onToggleCollapse,
  getAvatarUrl,
  calculateReportees,
}: NodeProps) {
  const isCollapsed = collapsedNodes[employee.id];
  const children = allEmployees.filter((e) => e.managerId === employee.id);
  const hasChildren = children.length > 0;
  const { direct, indirect } = calculateReportees(employee.id);

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="border border-blue-400 bg-raised rounded-lg p-4 pt-8 text-center shadow-sm relative min-w-[200px] max-w-[220px] z-10">
        <div className="w-12 h-12 rounded-full border-2 border-blue-400 overflow-hidden absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-brand-50)] flex items-center justify-center select-none">
          <span className="text-sm font-bold text-info-fg">
            {employee.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="text-xs font-bold text-text-primary uppercase truncate">{employee.name}</div>
        <div className="text-[10px] text-text-secondary mt-0.5 truncate">{employee.designation}</div>
        
        <div className="text-[10px] text-text-secondary text-left mt-3 border-t pt-2 space-y-0.5">
          <div>Direct Reportees: <span className="font-bold text-text-primary">{direct}</span></div>
          <div>Indirect Reportees: <span className="font-bold text-text-primary">{indirect}</span></div>
        </div>
      </div>

      {/* Recursive Children Connector */}
      {hasChildren && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line down to the toggle badge */}
          <div className="w-0.5 h-10 bg-[var(--border-strong)] relative flex justify-center">
            <button
              onClick={() => onToggleCollapse(employee.id)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-8 rounded border border-line bg-raised flex items-center justify-center text-[10px] font-bold text-text-secondary hover:bg-sunken shadow-sm z-10 font-mono transition-all focus:outline-none"
            >
              {isCollapsed ? `+ ${direct}` : `^ ${direct}`}
            </button>
          </div>

          {/* Children row */}
          {!isCollapsed && (
            <div className="w-full flex flex-col items-center">
              {children.length === 1 ? (
                <div className="w-0.5 h-6 bg-[var(--border-strong)]" />
              ) : (
                <div className="relative w-full flex justify-center h-4">
                  <div className="absolute top-0 w-0.5 h-4 bg-[var(--border-strong)]"></div>
                </div>
              )}

              <div className="flex justify-center gap-0 w-full relative">
                {children.map((child, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === children.length - 1;
                  const isOnly = children.length === 1;

                  return (
                    <div key={child.id} className="child-branch-wrapper px-4 pt-8 flex flex-col items-center">
                      {!isOnly && (
                        <>
                          {isFirst && <div className="curved-line-left" />}
                          {isLast && <div className="curved-line-right" />}
                          {!isFirst && !isLast && (
                            <>
                              <div className="curved-line-middle" />
                              <div className="w-0.5 h-8 bg-[var(--border-strong)] absolute top-0 left-1/2 -translate-x-1/2" />
                            </>
                          )}
                          {(isFirst || isLast) && (
                            <div className="w-0.5 h-4 bg-[var(--border-strong)] absolute top-4 left-1/2 -translate-x-1/2" />
                          )}
                        </>
                      )}
                      {isOnly && (
                        <div className="w-0.5 h-4 bg-[var(--border-strong)] absolute top-0 left-1/2 -translate-x-1/2" />
                      )}
                      
                      <EmployeeTreeNode
                        employee={child}
                        allEmployees={allEmployees}
                        collapsedNodes={collapsedNodes}
                        onToggleCollapse={onToggleCollapse}
                        getAvatarUrl={getAvatarUrl}
                        calculateReportees={calculateReportees}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

