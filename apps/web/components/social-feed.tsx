"use client";

import { Heart, MessageCircle, Pin } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackSocialPosts } from "../lib/fallback-data";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { StatusPill } from "./ui";

type SocialPost = (typeof fallbackSocialPosts)[number];

interface ApiSocialPost {
  id: string;
  type: string;
  title?: string | null;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: {
    email: string;
    employee?: { firstName: string; lastName: string } | null;
  };
  likes: unknown[];
  comments: Array<{ body: string }>;
}

export function SocialFeed() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiSocialPost[]>("/social/feed")
      .then((body) => {
        if (!body.data) return;
        setPosts(
          body.data.map((post) => ({
            id: post.id,
            author: post.author.employee ? `${post.author.employee.firstName} ${post.author.employee.lastName}` : post.author.email,
            type: post.type,
            title: post.title || "",
            body: post.body,
            pinned: post.pinned,
            createdAt: post.createdAt.slice(0, 10),
            likes: post.likes.length,
            comments: post.comments.map((comment) => comment.body),
          })),
        );
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
    return onDataRefresh("social", load);
  }, []);

  async function like(id: string) {
    await apiFetch(`/social/posts/${id}/like`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setMessage("Post liked.");
    requestDataRefresh("social");
  }

  async function comment(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    const body = String(form.get("body"));
    if (!body.trim()) return;

    await apiFetch(`/social/posts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    currentForm.reset();
    setMessage("Comment added.");
    requestDataRefresh("social");
  }

  return (
    <div className="grid gap-4">
      {message ? <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)]">{message}</div> : null}
      {posts.map((post) => (
        <article className="rounded-lg border border-[var(--border-default)] bg-raised p-5 shadow-sm" key={post.id}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{post.title || post.type}</h2>
                {post.pinned ? <Pin className="h-4 w-4 text-brand" /> : null}
              </div>
              <div className="mt-1 text-xs text-muted">{post.author} - {post.createdAt}</div>
            </div>
            <StatusPill tone={post.type === "ANNOUNCEMENT" ? "yellow" : "green"}>{post.type}</StatusPill>
          </div>
          <p className="text-sm leading-6">{post.body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-raised px-3 text-sm font-semibold" onClick={() => like(post.id)}>
              <Heart className="h-4 w-4" /> {post.likes}
            </button>
            <div className="flex min-h-9 items-center gap-2 rounded-lg bg-[var(--surface-canvas)] px-3 text-sm">
              <MessageCircle className="h-4 w-4" /> {post.comments.length}
            </div>
          </div>
          {post.comments.length ? (
            <div className="mt-4 grid gap-2">
              {post.comments.map((item, index) => (
                <div className="rounded-lg bg-[var(--surface-canvas)] p-3 text-sm" key={`${post.id}-${index}`}>{item}</div>
              ))}
            </div>
          ) : null}
          <form className="mt-4 grid grid-cols-[1fr_auto] gap-2 max-md:grid-cols-1" onSubmit={(event) => comment(event, post.id)}>
            <input className="min-h-10 rounded-lg border border-[var(--border-default)] px-3 text-sm text-ink" name="body" placeholder="Write a comment" />
            <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Comment</button>
          </form>
        </article>
      ))}
    </div>
  );
}
