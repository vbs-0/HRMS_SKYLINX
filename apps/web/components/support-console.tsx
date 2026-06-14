"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../lib/client-api";
import {
  CircleHelp,
  PhoneCall,
  Mail,
  MessageCircle,
  Clock3,
  Headphones,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  AlertCircle,
  FileText,
  HelpCircle,
  Send,
  Building
} from "lucide-react";
import { Card, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";

interface Ticket {
  id: string; // Map to ticketNumber
  dbId?: string; // Real DB cuid
  title: string;
  queue: string;
  status: "Open" | "Assigned" | "In review" | "Resolved";
  priority: "Low" | "Medium" | "High";
  updated: string;
  description: string;
  timeline: { status: string; time: string; note: string }[];
  replies: { author: string; role: string; message: string; time: string }[];
}

const initialTickets: Ticket[] = [];

const faqs = [
  {
    id: "faq-1",
    category: "Account & Access",
    question: "How do I reset my login password?",
    answer: "You can reset your password by going to the Login page and clicking 'Forgot Password', or directly from your Profile Settings Security page. If your account is locked due to multiple incorrect attempts, contact Technical Support."
  },
  {
    id: "faq-2",
    category: "Payroll & Taxes",
    question: "What is the monthly payroll cycle cut-off date?",
    answer: "The monthly payroll cycle cut-off is the 25th of every month. Any attendance regularizations or leave requests submitted after this date will be processed in the next month's payroll cycle. Form 16 and TDS certificates are downloadable in the Compliance portal."
  },
  {
    id: "faq-3",
    category: "Leaves & Attendance",
    question: "How do I apply for maternity/paternity leave?",
    answer: "Maternity and paternity leaves can be requested under the Leave section. Please upload the necessary medical certificates or documents when submitting the request. Such leaves are routed to HR Operations for direct approval."
  },
  {
    id: "faq-4",
    category: "Leaves & Attendance",
    question: "Why is my biometric check-in not syncing in real-time?",
    answer: "Biometric sync runs automatically every 2 hours. If your attendance log is missing after 2 hours, please check if your device was online, raise a regularization request in the Attendance tab, or contact the Technical Support queue."
  },
  {
    id: "faq-5",
    category: "Payroll & Taxes",
    question: "How to update my bank details for salary export?",
    answer: "Navigate to Profile > Personal Details > Bank Information. Updates require HR approval and will be verified against a cancelled cheque upload. Changes made after the 20th will be active from the subsequent month."
  },
];

const queues = [
  {
    title: "HR Helpdesk",
    note: "Employee queries, profile support, policy guidance and escalation requests.",
    status: "Open",
    sla: "24h",
    icon: Headphones,
    agents: "3 Online",
    tone: "green" as const,
  },
  {
    title: "Payroll Support",
    note: "Payslip errors, salary structure, TDS deductions and bank export help.",
    status: "Priority",
    sla: "8h",
    icon: DollarSign,
    agents: "2 Online",
    tone: "yellow" as const,
  },
  {
    title: "Technical Support",
    note: "Login issues, role access, biometric sync, data import and integration support.",
    status: "Open",
    sla: "12h",
    icon: Wrench,
    agents: "1 Online",
    tone: "green" as const,
  },
  {
    title: "Implementation",
    note: "Module rollout, customized training sessions and admin configuration support.",
    status: "Planned",
    sla: "48h",
    icon: Layers,
    agents: "Scheduled",
    tone: "yellow" as const,
  },
];

export function SupportConsole() {
  const [activeTab, setActiveTab] = useState("Helpdesk");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [supportQueues, setSupportQueues] = useState(queues);

  // State for tickets list
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newQueue, setNewQueue] = useState("HR Helpdesk");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newDescription, setNewDescription] = useState("");

  // Email composer modal controls
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // FAQ Accordion state
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState("All");

  // Quick message reply state
  const [replyText, setReplyText] = useState("");

  // Toast / alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTickets = () => {
    apiFetch<any>("/tickets")
      .then((res) => {
        if (res.data) {
          const mapped: Ticket[] = res.data.map((t: any) => {
            return {
              id: t.ticketNumber,
              dbId: t.id,
              title: t.subject,
              queue: t.queue || "HR Helpdesk",
              status: t.status as any,
              priority: t.priority as any,
              updated: new Date(t.updatedAt || t.createdAt).toLocaleDateString(),
              description: t.description,
              timeline: [
                { status: "Ticket Created", time: new Date(t.createdAt).toLocaleDateString(), note: "Ticket raised from web console" }
              ],
              replies: (t.comments || []).map((c: any) => ({
                author: c.user?.employee ? `${c.user.employee.firstName} ${c.user.employee.lastName}` : c.user?.email || "User",
                role: c.user?.roles?.some((r: any) => r.role?.name === "SUPER_ADMIN") ? "Support Agent" : "Employee",
                message: c.comment,
                time: new Date(c.createdAt).toLocaleTimeString() + " " + new Date(c.createdAt).toLocaleDateString()
              }))
            };
          });
          setTickets(mapped);
        }
      })
      .catch((err) => console.warn("Error fetching tickets:", err));
  };

  useEffect(() => {
    fetchTickets();
    apiFetch<any>("/settings/rules")
      .then((res) => {
        if (res?.data?.support) {
          const supportRules = res.data.support;
          setSupportQueues(prev => prev.map(q => {
            if (q.title === "HR Helpdesk" && supportRules.slaMediumHours) {
              return { ...q, sla: `${supportRules.slaMediumHours}h` };
            }
            if (q.title === "Payroll Support" && supportRules.slaHighHours) {
              return { ...q, sla: `${supportRules.slaHighHours}h` };
            }
            if (q.title === "Technical Support" && supportRules.slaLowHours) {
              return { ...q, sla: `${supportRules.slaLowHours}h` };
            }
            return q;
          }));
        }
      })
      .catch((err) => console.warn("Error fetching settings rules:", err));
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    apiFetch<any>("/tickets", {
      method: "POST",
      body: JSON.stringify({
        subject: newTitle,
        description: newDescription,
        priority: newPriority,
        queue: newQueue
      })
    })
      .then((res) => {
        if (res.data) {
          const createdTicket = res.data;
          const tktId = createdTicket.ticketNumber;

          fetchTickets();

          triggerToast(`Ticket ${tktId} has been successfully raised and assigned.`);
          setActiveTab("Tickets");
          setExpandedTicketId(tktId);
        }
      })
      .catch((err) => {
        console.error("Error creating ticket:", err);
        triggerToast("Failed to create ticket. Please try again.");
      });

    // Reset Form
    setNewTitle("");
    setNewQueue("HR Helpdesk");
    setNewPriority("Medium");
    setNewDescription("");
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    apiFetch<any>("/tickets", {
      method: "POST",
      body: JSON.stringify({
        subject: emailSubject,
        description: emailBody,
        priority: "Medium",
        queue: "HR Helpdesk"
      })
    })
      .then((res) => {
        if (res.data) {
          const createdTicket = res.data;
          const tktId = createdTicket.ticketNumber;

          fetchTickets();

          triggerToast(`Email sent successfully! Ticket ${tktId} generated.`);
          setActiveTab("Tickets");
          setExpandedTicketId(tktId);
        }
      })
      .catch((err) => {
        console.error("Error sending email ticket:", err);
        triggerToast("Failed to send inquiry. Please try again.");
      });

    setEmailSubject("");
    setEmailBody("");
  };

  const handleAddReply = (ticketId: string) => {
    if (!replyText.trim()) return;

    const targetTicket = tickets.find(t => t.id === ticketId);
    if (!targetTicket || !targetTicket.dbId) return;

    apiFetch<any>(`/tickets/${targetTicket.dbId}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment: replyText })
    })
      .then((res) => {
        fetchTickets();
        setReplyText("");
        triggerToast("Reply posted successfully.");
      })
      .catch((err) => console.error("Error posting comment:", err));
  };


  // Filter lists based on tab + search + status
  const getFilteredTickets = () => {
    return tickets.filter(t => {
      // 1. Search Query filter
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.queue.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());

      // 2. Status dropdown mapping
      let matchesStatus = true;
      if (status === "Pending") {
        matchesStatus = t.status === "Assigned" || t.status === "In review" || t.status === "Open";
      } else if (status === "Approved") {
        // Map approved to Resolved
        matchesStatus = t.status === "Resolved";
      } else if (status === "Rejected") {
        matchesStatus = false; // No rejected status in tickets yet
      } else if (status === "Active") {
        matchesStatus = t.status !== "Resolved";
      }

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredQueues = () => {
    return supportQueues.filter(q =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.note.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getFilteredFAQs = () => {
    return faqs.filter(f => {
      const matchesCategory = selectedFaqCategory === "All" || f.category === selectedFaqCategory;
      const matchesSearch =
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const supportReport = [
    "Queue,Status,SLA",
    ...supportQueues.map(q => `${q.title},${q.status},${q.sla}`),
  ].join("%0A");

  // Status Colors for Ticket status badges
  const getStatusTone = (st: string) => {
    if (st === "Resolved") return "green";
    if (st === "In review") return "yellow";
    if (st === "Assigned") return "yellow";
    return "red";
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-[#e6f5ef] bg-[#e6f5ef] p-4 text-[#18865a] shadow-lg animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-[#18865a]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <ReferenceModuleHeader
        eyebrow="Support"
        title="Support Desk"
        summary="Employee and admin support for HRMS setup, payroll, attendance, integrations and daily operations."
        tabs={["Helpdesk", "Tickets", "Knowledge Base", "Contact"]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearch(""); // clear search on tab switch
        }}
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
        actions={[
          {
            label: "Raise Ticket",
            icon: CircleHelp,
            tone: "primary",
            onClick: () => setIsModalOpen(true),
          },
          { label: "Call", icon: PhoneCall, href: "tel:555-0199" },
          {
            label: "Email",
            icon: Mail,
            onClick: () => setIsEmailModalOpen(true),
          },
          { label: "Chat", icon: MessageCircle, href: "https://wa.me/91555-0199" },
        ]}
        stats={[
          { label: "Active Tickets", value: `${tickets.filter(t => t.status !== "Resolved").length}`, note: "Awaiting resolution" },
          { label: "Avg Resolution", value: "12 hours", note: "Across departments" },
          { label: "Support Agents", value: "6 Online", note: "Working hours active" },
        ]}
      />

      <ReferenceFlowStrip module="Support" />

      <section className="grid grid-cols-[1fr_340px] gap-5 max-xl:grid-cols-1">
        {/* Main Workspace Area */}
        <div className="grid gap-5">
          {/* 1. HELPDESK VIEW */}
          {activeTab === "Helpdesk" && (
            <Card className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce2eb] p-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#172033]">HR Support Departments</h2>
                  <p className="mt-1 text-sm text-muted">Direct queues routing payroll, attendance, onboarding and software operations.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white cursor-pointer hover:bg-brand-dark transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Support Request
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 max-sm:grid-cols-1">
                {getFilteredQueues().map((queue) => {
                  const QueueIcon = queue.icon;
                  return (
                    <div className="rounded-lg border border-[#dce2eb] bg-[#f8fafc] p-5 hover:border-brand hover:bg-white transition-all flex flex-col justify-between" key={queue.title}>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef5ff]">
                            <QueueIcon className="h-6 w-6 text-brand" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#8ca0bf] font-medium">{queue.agents}</span>
                            <StatusPill tone={queue.tone}>{queue.status}</StatusPill>
                          </div>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-[#172033]">{queue.title}</h3>
                        <p className="mt-2 text-sm text-muted leading-relaxed">{queue.note}</p>
                      </div>

                      <div className="mt-6 border-t border-[#eef2f7] pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#49637f]">
                          <Clock3 className="h-4 w-4 text-[#8ca0bf]" />
                          SLA Target: {queue.sla}
                        </div>
                        <button
                          onClick={() => {
                            setNewQueue(queue.title);
                            setIsModalOpen(true);
                          }}
                          className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                        >
                          Submit Ticket â†’
                        </button>
                      </div>
                    </div>
                  );
                })}
                {getFilteredQueues().length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted">
                    No departments match your search term.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 2. TICKETS VIEW */}
          {activeTab === "Tickets" && (
            <Card className="p-0">
              <div className="flex items-center justify-between border-b border-[#dce2eb] p-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#172033]">Your Support Tickets</h2>
                  <p className="text-sm text-muted">Track history and real-time correspondence of your raised helpdesk requests.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white cursor-pointer hover:bg-brand-dark transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Raise Ticket
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[100px_1fr_160px_100px_100px_40px] border-b border-[#dce2eb] px-5 py-3 text-xs font-bold uppercase text-muted max-md:hidden">
                <span>ID</span>
                <span>Ticket / Subject</span>
                <span>Department Queue</span>
                <span>Status</span>
                <span>Updated</span>
                <span></span>
              </div>

              {getFilteredTickets().map((tkt) => {
                const isExpanded = expandedTicketId === tkt.id;
                return (
                  <div key={tkt.id} className="border-b border-[#eef2f7] last:border-b-0">
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedTicketId(isExpanded ? null : tkt.id)}
                      className={`grid grid-cols-[100px_1fr_160px_100px_100px_40px] items-center gap-2 px-5 py-4 text-sm cursor-pointer hover:bg-[#f8fafc] transition-colors max-md:grid-cols-1 ${
                        isExpanded ? "bg-[#f8fafc]" : ""
                      }`}
                    >
                      <div className="font-bold text-[#8ca0bf]">{tkt.id}</div>
                      <div className="font-semibold text-[#172033] flex items-center gap-2">
                        {tkt.title}
                        {tkt.priority === "High" && (
                          <span className="rounded bg-[#fde8e6] px-1.5 py-0.5 text-[10px] font-bold text-[#ba3d37]">
                            High Priority
                          </span>
                        )}
                      </div>
                      <div className="text-muted flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-[#8ca0bf]" />
                        {tkt.queue}
                      </div>
                      <div>
                        <StatusPill tone={getStatusTone(tkt.status)}>{tkt.status}</StatusPill>
                      </div>
                      <div className="text-muted text-xs">{tkt.updated}</div>
                      <div className="text-right max-md:hidden">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted inline" /> : <ChevronDown className="h-4 w-4 text-muted inline" />}
                      </div>
                    </div>

                    {/* Expandable Details Pane */}
                    {isExpanded && (
                      <div className="bg-[#fcfdfe] border-t border-[#eef2f7] p-5 text-sm">
                        <div className="grid grid-cols-[1fr_260px] gap-6 max-lg:grid-cols-1">
                          {/* Description and Discussion */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1">Issue Description</h4>
                              <p className="text-[#34465f] bg-white p-3 rounded-lg border border-[#dce2eb] leading-relaxed">
                                {tkt.description}
                              </p>
                            </div>

                            {/* Discussion History */}
                            <div className="space-y-3 pt-2">
                              <h4 className="text-xs font-bold uppercase text-[#8ca0bf] tracking-wide">Correspondence Log</h4>
                              {tkt.replies.map((reply, i) => (
                                <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-[#eef2f7]">
                                  <div className="h-8 w-8 rounded-full bg-[#eef5ff] text-brand font-bold text-xs flex items-center justify-center flex-shrink-0">
                                    {reply.author.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-[#172033]">{reply.author} <span className="text-[10px] text-muted font-normal">({reply.role})</span></span>
                                      <span className="text-xs text-muted">{reply.time}</span>
                                    </div>
                                    <p className="text-muted leading-relaxed">{reply.message}</p>
                                  </div>
                                </div>
                              ))}
                              {tkt.replies.length === 0 && (
                                <p className="text-xs text-muted italic pl-1">No responses yet. Support agents will follow up shortly.</p>
                              )}
                            </div>

                            {/* Add reply form */}
                            {tkt.status !== "Resolved" && (
                              <div className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type a message or note..."
                                  className="flex-1 min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none focus:border-brand"
                                />
                                <button
                                  onClick={() => handleAddReply(tkt.id)}
                                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition-colors cursor-pointer"
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Timeline & Metadata Sidebar */}
                          <div className="rounded-lg border border-[#dce2eb] bg-[#f8fafc] p-4 h-fit">
                            <h4 className="text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-3">Ticket Timeline</h4>
                            <div className="relative border-l border-[#dce2eb] ml-2 pl-4 space-y-4">
                              {tkt.timeline.map((step, idx) => (
                                <div key={idx} className="relative">
                                  {/* timeline dot */}
                                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                                  <div className="text-xs font-bold text-[#172033]">{step.status}</div>
                                  <div className="text-[10px] text-muted">{step.time}</div>
                                  <p className="text-xs text-muted mt-0.5">{step.note}</p>
                                </div>
                              ))}
                            </div>

                            <div className="mt-5 pt-4 border-t border-[#dce2eb] space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-[#8ca0bf]">Priority:</span>
                                <span className="font-bold text-[#172033]">{tkt.priority}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#8ca0bf]">Last Update:</span>
                                <span className="font-bold text-[#172033]">{tkt.updated}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {getFilteredTickets().length === 0 && (
                <div className="text-center py-12 text-muted flex flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-[#8ca0bf] mb-2" />
                  <p className="font-semibold text-[#172033]">No tickets found</p>
                  <p className="text-xs mt-1">Try resetting the status filter or keyword search.</p>
                </div>
              )}
            </Card>
          )}

          {/* 3. KNOWLEDGE BASE VIEW */}
          {activeTab === "Knowledge Base" && (
            <div className="grid grid-cols-[180px_1fr] gap-4 max-md:grid-cols-1">
              {/* Category sidebar */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold uppercase text-[#8ca0bf] px-2 mb-1">Categories</div>
                {["All", "Account & Access", "Payroll & Taxes", "Leaves & Attendance"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedFaqCategory(cat);
                      setExpandedFaqId(null);
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                      selectedFaqCategory === cat
                        ? "bg-[#eef5ff] text-brand"
                        : "text-[#34465f] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* FAQs accordion */}
              <Card className="p-0">
                <div className="border-b border-[#dce2eb] p-5">
                  <h2 className="text-lg font-semibold text-[#172033]">Searchable FAQ Articles</h2>
                  <p className="text-sm text-muted">Self-help support tutorials detailing standard operations and configurations.</p>
                </div>

                <div className="p-5 space-y-3">
                  {getFilteredFAQs().map((faq) => {
                    const isFaqExpanded = expandedFaqId === faq.id;
                    return (
                      <div key={faq.id} className="rounded-lg border border-[#dce2eb] overflow-hidden bg-white">
                        <button
                          onClick={() => setExpandedFaqId(isFaqExpanded ? null : faq.id)}
                          className="w-full flex items-center justify-between text-left p-4 font-semibold text-[#172033] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="h-4.5 w-4.5 text-brand flex-shrink-0" />
                            {faq.question}
                          </span>
                          <span className="text-xs font-normal text-muted bg-[#f8fafc] px-2 py-0.5 rounded border border-[#eef2f7] mr-2 max-sm:hidden">
                            {faq.category}
                          </span>
                          {isFaqExpanded ? <ChevronUp className="h-4 w-4 text-muted flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />}
                        </button>
                        {isFaqExpanded && (
                          <div className="p-4 border-t border-[#eef2f7] bg-[#f8fafc] text-sm text-[#49637f] leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {getFilteredFAQs().length === 0 && (
                    <div className="text-center py-10 text-muted">
                      No FAQs found matching &quot;{search}&quot; or chosen category.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* 4. CONTACT VIEW */}
          {activeTab === "Contact" && (
            <Card className="p-0">
              <div className="border-b border-[#dce2eb] p-5">
                <h2 className="text-lg font-semibold text-[#172033]">Primary HR Contacts</h2>
                <p className="text-sm text-muted">Reach our support agents directly via phone, email or direct WhatsApp chat.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-5 max-md:grid-cols-1">
                <div className="rounded-lg border border-[#dce2eb] p-4 text-center bg-[#f8fafc]">
                  <PhoneCall className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-[#172033]">Hotline Support</h3>
                  <p className="text-xs text-muted mt-1">Direct query support line</p>
                  <a href="tel:555-0199" className="block mt-3 text-sm font-bold text-brand hover:underline">
                    555-0199
                  </a>
                </div>

                <div className="rounded-lg border border-[#dce2eb] p-4 text-center bg-[#f8fafc]">
                  <Mail className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-[#172033]">Email Desk</h3>
                  <p className="text-xs text-muted mt-1">Ticket submissions & reports</p>
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(true)}
                    className="block w-full mt-3 text-sm font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer text-center"
                  >
                    support@example.com
                  </button>
                </div>

                <div className="rounded-lg border border-[#dce2eb] p-4 text-center bg-[#f8fafc]">
                  <MessageCircle className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-[#172033]">WhatsApp Chat</h3>
                  <p className="text-xs text-muted mt-1">Quick messaging and status updates</p>
                  <a href="https://wa.me/91555-0199" target="_blank" rel="noreferrer" className="block mt-3 text-sm font-bold text-brand hover:underline">
                    +91 555-0199
                  </a>
                </div>
              </div>

              <div className="p-5 border-t border-[#eef2f7] space-y-4">
                <h3 className="font-semibold text-[#172033]">Support Operating Hours</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-[#49637f] max-sm:grid-cols-1">
                  <div className="bg-[#f8fafc] border border-[#eef2f7] p-3 rounded-lg">
                    <span className="font-bold text-[#172033] block">Monday - Friday</span>
                    9:00 AM - 6:00 PM (IST)
                  </div>
                  <div className="bg-[#f8fafc] border border-[#eef2f7] p-3 rounded-lg">
                    <span className="font-bold text-[#172033] block">Saturday</span>
                    9:00 AM - 1:00 PM (IST)
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <aside className="grid content-start gap-5">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef5ff] text-brand">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted">Primary Email</div>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="text-sm font-bold text-[#172033] hover:text-brand bg-transparent border-0 p-0 text-left font-sans cursor-pointer focus:outline-none"
                >
                  support@example.com
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef5ff] text-brand">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted">Query Phone</div>
                <a className="text-sm font-bold text-[#172033] hover:text-brand" href="tel:555-0199">
                  555-0199
                </a>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center gap-2 text-[#172033]">
                <CheckCircle2 className="h-4 w-4 text-[#15b881] flex-shrink-0" />
                Employee profile and HR queries
              </div>
              <div className="flex items-center gap-2 text-[#172033]">
                <CheckCircle2 className="h-4 w-4 text-[#15b881] flex-shrink-0" />
                Payroll, payslip and compliance support
              </div>
              <div className="flex items-center gap-2 text-[#172033]">
                <CheckCircle2 className="h-4 w-4 text-[#15b881] flex-shrink-0" />
                Access, role and module assistance
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[#172033]">Support Controls</h2>
            <div className="mt-4 grid gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition-colors cursor-pointer"
              >
                Raise New Ticket
              </button>
              <button
                onClick={() => {
                  setActiveTab("Contact");
                  setTimeout(() => {
                    const el = document.getElementById("support-sla");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#172033] hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                View SLA Policy
              </button>
              <a
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#172033] hover:bg-[#f8fafc] transition-colors"
                download="peopleos-support-report.csv"
                href={`data:text/csv;charset=utf-8,${supportReport}`}
              >
                Download Support Report
              </a>
            </div>
          </Card>

          <Card id="support-sla">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-brand flex-shrink-0" />
              <div>
                <h2 className="text-base font-semibold text-[#172033]">Secure Helpdesk</h2>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Payroll and document requests are routed through role-based access with audit trail visibility. HR Helpdesk replies within 24h, Payroll priority issues within 8h, and technical access issues within 12h.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </section>

      {/* RAISE TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-[#dce2eb] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#dce2eb] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#172033] flex items-center gap-2">
                <CircleHelp className="h-5 w-5 text-brand" />
                Raise New Support Ticket
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-[#f8fafc] hover:text-[#172033] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                  Ticket Subject / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payslip error for May 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                    Department Queue
                  </label>
                  <select
                    value={newQueue}
                    onChange={(e) => setNewQueue(e.target.value)}
                    className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none focus:border-brand"
                  >
                    <option value="HR Helpdesk">HR Helpdesk</option>
                    <option value="Payroll Support">Payroll Support</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Implementation">Implementation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "Low" | "Medium" | "High")}
                    className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none focus:border-brand"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about the issue to expedite resolution..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#dce2eb] bg-white p-3 text-sm text-[#172033] outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eef2f7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#172033] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition-colors cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL COMPOSER MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-[#dce2eb] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#dce2eb] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#172033] flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand" />
                Compose & Send Email to HR
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-[#f8fafc] hover:text-[#172033] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                  To
                </label>
                <input
                  type="text"
                  disabled
                  value="support@example.com"
                  className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-[#f8fafc] px-3 text-sm text-[#8ca0bf] outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#8ca0bf] tracking-wide mb-1.5">
                  Message Body
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write your query or request details here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-lg border border-[#dce2eb] bg-white p-3 text-sm text-[#172033] outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eef2f7]">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#172033] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition-colors cursor-pointer"
                >
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

