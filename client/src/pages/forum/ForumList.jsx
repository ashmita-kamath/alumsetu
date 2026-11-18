import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { toQuery } from "../../services/api";
import { Alert, EmptyState, Input, PageLoader, Pagination } from "../../components/ui";
import { CATEGORIES, categoryLabel, timeAgo } from "../../components/forum/forumUtils";

/**
 * Forum home → GET /posts?category=&search=&page=
 *
 * Like the alumni directory, the category, search and page live in
 * the URL so Back, refresh and shared links keep them.
 */
const PAGE_SIZE = 15;

export default function ForumList() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const page = Number(params.get("page")) || 1;

  const [searchText, setSearchText] = useState(search);

  const { data, loading, error } = useApi(`/posts${toQuery({ category, search, page, limit: PAGE_SIZE })}`);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  // Wait until the user stops typing before searching
  useEffect(() => {
    if (searchText.trim() === search) return;
    const timer = setTimeout(() => setParam("search", searchText.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const tabs = [{ value: "", label: "All" }, ...CATEGORIES];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Forum</h1>
          <p className="mt-1 text-sm">Ask questions and share advice with students and alumni.</p>
        </div>
        <Link
          to="/forum/new"
          className="inline-flex items-center rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-navy hover:bg-orange/90"
        >
          + New post
        </Link>
      </div>

      <Input
        id="forum-search"
        type="search"
        label="Search posts"
        placeholder="Search by title or text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="mt-6"
      />

      <div className="-mx-4 mt-4 overflow-x-auto px-4" role="tablist" aria-label="Category">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={category === t.value}
              onClick={() => setParam("category", t.value)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                category === t.value ? "bg-navy text-white" : "bg-white text-navy hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="No posts yet"
            message={search || category ? "Try another category or search." : "Be the first to start a discussion."}
          />
        ) : data ? (
          <>
            <ul className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}>
              {data.items.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/forum/${post.id}`}
                    className="block rounded-xl border border-gray-100 bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/50"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-orange/15 px-2.5 py-0.5 font-semibold text-orange-dark">
                        {categoryLabel(post.category)}
                      </span>
                      <span>
                        {post.author?.full_name}
                        {post.author?.role === "alumni" && " · Alumni"} · {timeAgo(post.created_at)}
                      </span>
                    </div>
                    <h2 className="mt-2 text-lg font-bold">{post.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm">{post.body}</p>
                    <p className="mt-2 text-xs font-semibold text-navy">
                      {post.comment_count} {Number(post.comment_count) === 1 ? "comment" : "comments"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(p) => {
                setParam("page", String(p));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
