"use client";

import React, { useEffect, useState, useRef, FormEvent } from "react";
import { 
  Heart, 
  MessageCircle, 
  Pin, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  X, 
  Send, 
  Megaphone, 
  Trophy, 
  Gift, 
  Sparkles, 
  Share2, 
  User,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "../lib/client-api";
import { getAccessToken } from "../lib/session";
import { requestDataRefresh, onDataRefresh } from "../lib/refresh-events";
import { Card, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";

interface ApiSocialLike {
  id: string;
  userId: string;
  user: {
    email: string;
    employee?: { firstName: string; lastName: string } | null;
  };
}

interface ApiSocialComment {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  user: {
    email: string;
    employee?: { firstName: string; lastName: string } | null;
  };
}

interface ApiSocialPost {
  id: string;
  type: string;
  title?: string | null;
  body: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  pinned: boolean;
  createdAt: string;
  author: {
    email: string;
    employee?: { firstName: string; lastName: string; department?: { name: string } } | null;
  };
  likes: ApiSocialLike[];
  comments: ApiSocialComment[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName?: string;
  birthdateVirtual?: string;
}

export function SkyNexusConsole() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Post Creator State
  const [postBody, setPostBody] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postType, setPostType] = useState<"ANNOUNCEMENT" | "POST" | "BIRTHDAY" | "RECOGNITION">("POST");
  const [isPinned, setIsPinned] = useState(false);
  const [mediaData, setMediaData] = useState<{ url: string; type: "IMAGE" | "VIDEO" } | null>(null);
  
  // App User State
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("You");

  // Interactive comments state
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Virtual birthday list
  const [birthdayStaff, setBirthdayStaff] = useState<Employee[]>([]);

  // Modal States for Header Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ANNOUNCEMENT" | "RECOGNITION" | "BIRTHDAY" | "POST">("ANNOUNCEMENT");
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");
  const [modalTargetEmpId, setModalTargetEmpId] = useState("");
  const [modalPinned, setModalPinned] = useState(false);
  const [modalMedia, setModalMedia] = useState<{ url: string; type: "IMAGE" | "VIDEO" } | null>(null);
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Decode JWT to find current user details
  useEffect(() => {
    try {
      const token = getAccessToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.sub || "");
        setCurrentUserEmail(payload.email || "");
        
        // Load employee list to resolve names
        apiFetch<any>("/reports/employees")
          .then((res) => {
            const rows = res.data?.rows || [];
            if (rows.length) {
              setEmployeesList(rows);
              const match = rows.find((emp: any) => emp.email === payload.email || emp.code === payload.sub);
              if (match) {
                setCurrentUserName(match.name);
              }
              
              // Seed virtual birthdays from actual employee roster
              const list: Employee[] = rows.map((emp: any, index: number) => {
                const days = ["Today", "Tomorrow", "In 3 Days", "June 12", "June 18", "June 25"];
                return {
                  id: emp.code,
                  firstName: emp.name.split(" ")[0],
                  lastName: emp.name.split(" ")[1] || "",
                  email: emp.email,
                  departmentName: emp.department,
                  birthdateVirtual: days[index % days.length]
                };
              });
              setBirthdayStaff(list.slice(0, 4));
            }
          })
          .catch(() => undefined);
      }
    } catch (e) {
      console.error("JWT decoding failed", e);
    }
  }, []);

  // Load Feed Data
  function loadFeed() {
    setLoading(true);
    apiFetch<ApiSocialPost[]>("/social/feed")
      .then((res) => {
        if (res.data) {
          setPosts(res.data);
        }
      })
      .catch((err) => {
        setError("Failed to fetch feed data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadFeed();
    return onDataRefresh("social", loadFeed);
  }, []);

  // Handle local file uploads (Base64)
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaData({
        url: reader.result as string,
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
      });
      setError("");
    };
    reader.readAsDataURL(file);
  }

  // Trigger publishing a post
  async function handlePublish(e: FormEvent) {
    e.preventDefault();
    if (!postBody.trim()) return;

    setMessage("");
    setError("");

    try {
      await apiFetch("/social/posts", {
        method: "POST",
        body: JSON.stringify({
          type: postType,
          title: postTitle || undefined,
          body: postBody,
          mediaUrl: mediaData?.url || undefined,
          mediaType: mediaData?.type || undefined,
          pinned: isPinned,
          authorUserId: currentUserId || undefined
        }),
      });

      setMessage("Post published successfully!");
      setPostBody("");
      setPostTitle("");
      setPostType("POST");
      setIsPinned(false);
      setMediaData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing post failed");
    }
  }

  // Liking/Unliking Post engagement
  async function handleToggleLike(postId: string, hasLiked: boolean) {
    try {
      if (hasLiked) {
        await apiFetch(`/social/posts/${postId}/like`, { method: "DELETE" });
      } else {
        await apiFetch(`/social/posts/${postId}/like`, { method: "POST" });
      }
      loadFeed();
    } catch (err) {
      console.error("Engagement toggle failed", err);
    }
  }

  // Comment submission
  async function handlePostComment(e: FormEvent, postId: string) {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      await apiFetch(`/social/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText })
      });

      setCommentInputs((curr) => ({ ...curr, [postId]: "" }));
      loadFeed();
    } catch (err) {
      setError("Failed to add comment.");
    }
  }

  // Action: Setup quick wish for birthday
  function triggerQuickWish(empName: string) {
    setPostType("BIRTHDAY");
    setPostTitle(`Birthday wishes to ${empName}! 🎉`);
    setPostBody(`Wishing you a fantastic birthday, ${empName}! Hope you have a wonderful year ahead filled with happiness and success! 🍰✨`);
    
    // Smooth scroll to top composer
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Modal controllers for header action buttons
  const openAnnouncementModal = () => {
    setModalType("ANNOUNCEMENT");
    setModalTitle("Company Announcement");
    setModalBody("");
    setModalPinned(true);
    setModalMedia(null);
    setModalTargetEmpId("");
    setIsModalOpen(true);
  };

  const openRecognizeModal = () => {
    setModalType("RECOGNITION");
    setModalTitle("Employee Recognition 🌟");
    setModalBody("");
    setModalPinned(false);
    setModalMedia(null);
    setModalTargetEmpId("");
    setIsModalOpen(true);
  };

  const openBirthdayModal = () => {
    setModalType("BIRTHDAY");
    setModalTitle("Happy Birthday! 🎉");
    setModalBody("");
    setModalPinned(false);
    setModalMedia(null);
    setModalTargetEmpId("");
    setIsModalOpen(true);
  };

  const handleModalEmpChange = (empId: string) => {
    setModalTargetEmpId(empId);
    const emp = employeesList.find(e => e.code === empId);
    if (!emp) return;

    if (modalType === "RECOGNITION") {
      setModalBody(`We would like to recognize ${emp.name} for outstanding contribution and dedication to the team! Thank you for your hard work! 🌟`);
    } else if (modalType === "BIRTHDAY") {
      setModalBody(`Happy Birthday, ${emp.name}! 🎂 Wishing you a wonderful day filled with celebration and a fantastic year ahead! 🎉✨`);
    }
  };

  function handleModalFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setModalMedia({
        url: reader.result as string,
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
      });
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleModalPublish(e: FormEvent) {
    e.preventDefault();
    if (!modalBody.trim()) return;

    setMessage("");
    setError("");

    try {
      await apiFetch("/social/posts", {
        method: "POST",
        body: JSON.stringify({
          type: modalType,
          title: modalTitle || undefined,
          body: modalBody,
          mediaUrl: modalMedia?.url || undefined,
          mediaType: modalMedia?.type || undefined,
          pinned: modalPinned,
          authorUserId: currentUserId || undefined
        }),
      });

      setMessage("Social post published successfully!");
      setIsModalOpen(false);
      loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing post failed");
    }
  }

  // Filter posts based on active category tab and search query
  const filteredPosts = posts.filter((post) => {
    // Tab filter
    let matchesTab = true;
    if (activeTab === "Feed") matchesTab = true;
    else if (activeTab === "Announcements") matchesTab = post.type === "ANNOUNCEMENT";
    else if (activeTab === "Birthdays") matchesTab = post.type === "BIRTHDAY";
    else if (activeTab === "Recognition") matchesTab = post.type === "RECOGNITION";

    // Text search filter
    const authorName = post.author?.employee 
      ? `${post.author.employee.firstName} ${post.author.employee.lastName}`
      : post.author?.email || "";
    
    const matchesSearch = !searchQuery || 
      post.body.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      authorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const pinnedAnnouncements = posts.filter(p => p.pinned);

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="SkyNexus"
        title="Internal Social Feed"
        summary="Share company announcements, employee posts, likes, comments, birthday wishes and recognition updates."
        tabs={["Feed", "Announcements", "Birthdays", "Recognition"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          { label: "Announcement", icon: Megaphone, onClick: openAnnouncementModal },
          { label: "Recognize", icon: Trophy, onClick: openRecognizeModal },
          { label: "Wish Birthday", icon: Gift, onClick: openBirthdayModal },
        ]}
        stats={[
          { label: "Audience", value: "All Available", note: "Employees" },
          { label: "Engagement", value: "Active", note: "Likes / Comments" },
          { label: "SkyNexus", value: "Online", note: "Social feed" },
        ]}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <ReferenceFlowStrip module="SkyNexus" />

      {/* Confirmation Toasts */}
      {(message || error) && (
        <div className="transition-all duration-300">
          {message && (
            <div className="rounded-xl bg-success-bg p-4 text-sm text-success-fg border border-success-border flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success-fg shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-danger-bg p-4 text-sm text-danger-fg border border-danger-border flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger-fg shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Grid Layout: Main Feed (Col 1) and Widgets (Col 2) */}
      <div className="grid grid-cols-[1fr_330px] gap-6 max-xl:grid-cols-1">
        
        {/* Left Column: Post Creator & Feed Posts */}
        <div className="grid gap-5">
          
          {/* Social Media Style Post Composer */}
          <Card>
            <form onSubmit={handlePublish} className="grid gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-sm font-bold text-brand uppercase border border-brand/20">
                  {currentUserName.slice(0,2)}
                </div>
                <div className="grid gap-2 flex-1">
                  <input
                    type="text"
                    placeholder="Provide a title (optional)..."
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full text-sm font-semibold outline-none border-b border-dashed border-[#e2e8f0] pb-1 text-text-primary placeholder:text-text-muted"
                  />
                  <textarea
                    rows={3}
                    placeholder="Share something with your team at PeopleOS..."
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    required
                    className="w-full text-sm outline-none resize-none text-text-primary placeholder:text-text-muted mt-1"
                  />
                </div>
              </div>



              <div className="flex flex-wrap items-center justify-between border-t border-[var(--surface-sunken)] pt-3 gap-3">
                <div className="flex items-center gap-3">

                  {/* Pin check box */}
                  <label className="flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-sunken transition select-none">
                    <input 
                      type="checkbox" 
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-[var(--border-strong)] text-brand focus:ring-brand h-3.5 w-3.5"
                    />
                    <Pin className="h-3.5 w-3.5 text-warning-fg" />
                    <span>Pin notice</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {/* Category select dropdown */}
                  <select
                    value={postType}
                    onChange={(e: any) => setPostType(e.target.value)}
                    className="rounded-lg border border-[var(--border-strong)] bg-raised px-2.5 py-1.5 text-xs font-semibold text-text-secondary outline-none transition focus:border-brand"
                  >
                    <option value="POST">General Post</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="RECOGNITION">Recognition</option>
                  </select>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark shadow-sm"
                  >
                    <Send className="h-3 w-3" />
                    Publish Feed
                  </button>
                </div>
              </div>
            </form>
          </Card>

          {/* Social Feed Posts List */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <div className="py-12 text-center text-text-muted font-semibold">
                  Compiling Skynexus database feed...
                </div>
              </Card>
            ) : !filteredPosts.length ? (
              <Card>
                <div className="py-12 text-center text-text-muted font-semibold">
                  No social posts in this category. Be the first to publish!
                </div>
              </Card>
            ) : (
              filteredPosts.map((post) => {
                const hasLiked = post.likes.some(like => like.userId === currentUserId);
                
                // Author representation
                const authorName = post.author?.employee 
                  ? `${post.author.employee.firstName} ${post.author.employee.lastName}`
                  : post.author?.email || "System User";
                const authorDept = post.author?.employee?.department?.name || "Corporate";

                return (
                  <article 
                    key={post.id} 
                    className={`rounded-xl border bg-raised p-5 shadow-sm transition hover:shadow-md ${
                      post.pinned ? "border-warning-border ring-1 ring-warning-border" : "border-[var(--border-subtle)]"
                    }`}
                  >
                    {/* Post Header details */}
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-3 mb-3">
                      <div className="flex gap-3 items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-xs font-bold text-text-secondary uppercase border">
                          {authorName.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary text-sm leading-none">{authorName}</h3>
                          <span className="text-[10px] text-text-muted">{authorDept} • {new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {post.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-fg bg-warning-bg border border-warning-border rounded-md px-1.5 py-0.5">
                            <Pin className="h-2.5 w-2.5" /> PINNED
                          </span>
                        )}
                        <StatusPill tone={
                          post.type === "ANNOUNCEMENT" ? "yellow" :
                          post.type === "RECOGNITION" ? "green" :
                          post.type === "BIRTHDAY" ? "green" : "yellow"
                        }>
                          {post.type}
                        </StatusPill>
                      </div>
                    </div>

                    {/* Post Title */}
                    {post.title && (
                      <h4 className="font-bold text-text-primary text-base mb-2 leading-tight">
                        {post.title}
                      </h4>
                    )}

                    {/* Post Message Body */}
                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                      {post.body}
                    </p>



                    {/* Engagement Actions footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-text-secondary text-xs">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleToggleLike(post.id, hasLiked)}
                          className={`flex items-center gap-1.5 font-bold transition hover:text-danger-fg ${
                            hasLiked ? "text-danger-fg" : ""
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${hasLiked ? "fill-rose-600" : ""}`} />
                          <span>{post.likes.length} Likes</span>
                        </button>

                        <button 
                          onClick={() => setExpandedComments(curr => ({ ...curr, [post.id]: !curr[post.id] }))}
                          className="flex items-center gap-1.5 font-semibold hover:text-text-primary transition"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments.length} Comments</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-text-muted">Company Access Only</span>
                    </div>

                    {/* Comments drawer */}
                    {expandedComments[post.id] && (
                      <div className="mt-4 border-t border-line pt-3">
                        {post.comments.length > 0 ? (
                          <div className="grid gap-2 mb-3">
                            {post.comments.map((c) => {
                              const cAuthor = c.user?.employee 
                                ? `${c.user.employee.firstName} ${c.user.employee.lastName}`
                                : c.user?.email || "Anonymous";
                              return (
                                <div key={c.id} className="rounded-lg bg-sunken p-2.5 text-xs text-text-secondary border border-line">
                                  <div className="flex justify-between font-semibold text-text-primary mb-1">
                                    <span>{cAuthor}</span>
                                    <span className="text-[9px] font-normal text-text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p>{c.body}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-text-muted mb-3 italic">No comments yet. Write one below!</p>
                        )}

                        <form onSubmit={(e) => handlePostComment(e, post.id)} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs(curr => ({ ...curr, [post.id]: e.target.value }))}
                            className="flex-1 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs outline-none focus:border-brand"
                          />
                          <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark">
                            Submit
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Widgets / Birthdays & Sticky Notices */}
        <div className="grid gap-5 content-start">
          
          {/* Upcoming Birthdays widget */}
          <Card>
            <div className="flex items-center gap-2 border-b pb-2 mb-3">
              <Gift className="h-5 w-5 text-pink-500" />
              <h3 className="font-bold text-text-primary text-sm">Upcoming Birthdays</h3>
            </div>
            
            <div className="grid gap-3.5">
              {birthdayStaff.length > 0 ? (
                birthdayStaff.map((staff) => (
                  <div key={staff.id} className="flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-text-primary">{staff.firstName} {staff.lastName}</div>
                      <div className="text-[10px] text-text-muted">{staff.departmentName || "Corporate"} • {staff.birthdateVirtual}</div>
                    </div>
                    
                    <button 
                      onClick={() => triggerQuickWish(`${staff.firstName} ${staff.lastName}`)}
                      className="rounded bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold px-2 py-1 text-[10px] transition"
                    >
                      Wish 🎉
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted italic">No birthdays scheduled.</p>
              )}
            </div>
          </Card>

          {/* Sticky Notice board */}
          <Card>
            <div className="flex items-center gap-2 border-b pb-2 mb-3">
              <Megaphone className="h-5 w-5 text-warning-fg" />
              <h3 className="font-bold text-text-primary text-sm">Pinned Company Updates</h3>
            </div>

            <div className="grid gap-3 text-xs">
              {pinnedAnnouncements.length > 0 ? (
                pinnedAnnouncements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="border-l-2 border-amber-400 pl-2 py-0.5">
                    <div className="font-semibold text-text-primary truncate">{ann.title || "Announcement"}</div>
                    <p className="text-[10px] text-text-secondary line-clamp-2 mt-0.5">{ann.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted italic">No pinned announcements.</p>
              )}
            </div>
          </Card>

          {/* Social Stats Board */}
          <Card>
            <div className="flex items-center gap-2 border-b pb-2 mb-3">
              <Sparkles className="h-5 w-5 text-brand" />
              <h3 className="font-bold text-text-primary text-sm">Nexus Analytics</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-sunken p-2.5 border">
                <span className="text-[10px] font-bold text-text-muted uppercase">Total Posts</span>
                <p className="text-lg font-bold text-text-primary mt-0.5">{posts.length}</p>
              </div>
              <div className="rounded-lg bg-sunken p-2.5 border">
                <span className="text-[10px] font-bold text-text-muted uppercase">Likes Given</span>
                <p className="text-lg font-bold text-text-primary mt-0.5">
                  {posts.reduce((sum, p) => sum + p.likes.length, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Action Post Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--text-primary)]/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-raised p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-secondary transition"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              {modalType === "ANNOUNCEMENT" && <Megaphone className="h-5 w-5 text-warning-fg" />}
              {modalType === "RECOGNITION" && <Trophy className="h-5 w-5 text-success-fg" />}
              {modalType === "BIRTHDAY" && <Gift className="h-5 w-5 text-pink-500" />}
              <span>
                {modalType === "ANNOUNCEMENT" && "Publish Announcement"}
                {modalType === "RECOGNITION" && "Recognize Employee"}
                {modalType === "BIRTHDAY" && "Send Birthday Wish"}
              </span>
            </h3>

            <form onSubmit={handleModalPublish} className="grid gap-4">
              {/* Target Employee Dropdown for Birthday or Recognition */}
              {(modalType === "RECOGNITION" || modalType === "BIRTHDAY") && (
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase">
                    Select Employee
                  </label>
                  <select
                    value={modalTargetEmpId}
                    onChange={(e) => handleModalEmpChange(e.target.value)}
                    required
                    className="min-h-10 rounded-lg border border-[var(--border-strong)] bg-raised px-3 text-sm outline-none focus:border-brand"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employeesList.map((emp) => (
                      <option key={emp.code} value={emp.code}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Post Title */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-text-secondary uppercase">
                  Post Title
                </label>
                <input
                  type="text"
                  placeholder="Enter a descriptive title..."
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="min-h-10 rounded-lg border border-[var(--border-strong)] px-3 text-sm outline-none focus:border-brand text-text-primary"
                />
              </div>

              {/* Message Body */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-text-secondary uppercase">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the post content here..."
                  value={modalBody}
                  onChange={(e) => setModalBody(e.target.value)}
                  required
                  className="rounded-lg border border-[var(--border-strong)] p-3 text-sm outline-none focus:border-brand text-text-primary resize-none"
                />
              </div>



              {/* Action row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-3">

                  <label className="flex items-center gap-1 cursor-pointer text-xs font-semibold text-text-secondary hover:text-brand select-none">
                    <input
                      type="checkbox"
                      checked={modalPinned}
                      onChange={(e) => setModalPinned(e.target.checked)}
                      className="rounded border-[var(--border-strong)] text-brand focus:ring-brand h-3.5 w-3.5"
                    />
                    <span>Pin notice</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-text-primary hover:bg-sunken transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                  >
                    Publish Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
