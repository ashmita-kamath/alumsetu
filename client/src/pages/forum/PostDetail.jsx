import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import api from "../../services/api";
import { Alert, Button, Card, PageLoader, Textarea } from "../../components/ui";
import ReportModal from "../../components/forum/ReportModal";
import { categoryLabel, timeAgo } from "../../components/forum/forumUtils";

/**
 * One forum post with its comments → GET /posts/:id → { post, comments }.
 *
 * – Anyone logged in can comment (POST /posts/:id/comments).
 * – The author or an admin can delete a post or comment.
 * – Anyone except the author can report a post or comment.
 *
 * The Delete button is only shown to the author/admin, but the
 * backend also checks ownership, so hiding it is not the protection.
 */
export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, setData } = useApi(`/posts/${id}`);

  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [posting, setPosting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reportTarget, setReportTarget] = useState(null);

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert>{error.status === 404 ? "This post does not exist or was removed." : error.message}</Alert>
        <Link to="/forum" className="mt-4 inline-block text-sm font-semibold text-orange-dark hover:underline">
          ← Back to forum
        </Link>
      </div>
    );
  }

  const { post, comments } = data;
  const canDelete = (authorId) => user.id === authorId || user.role === "admin";

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    setCommentError("");
    try {
      const { comment: created } = await api.post(`/posts/${post.id}/comments`, { body: comment.trim() });
      // Show the new comment straight away. If the API leaves out the
      // author, fill it in from the logged-in user.
      const withAuthor = { author: { id: user.id, full_name: user.full_name, role: user.role }, ...created };
      setData({ ...data, comments: [...comments, withAuthor] });
      setComment("");
    } catch (err) {
      setCommentError(err.message); // e.g. 422 CONTENT_BLOCKED
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      navigate("/forum", { replace: true });
    } catch (err) {
      setActionError(err.message);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setData({ ...data, comments: comments.filter((c) => c.id !== commentId) });
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/forum" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to forum
      </Link>

      <Alert className="mt-4">{actionError}</Alert>

      {/* The post */}
      <Card className="mt-4">
        <span className="rounded-full bg-orange/15 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
          {categoryLabel(post.category)}
        </span>
        <h1 className="mt-3 text-2xl font-bold">{post.title}</h1>
        <Byline author={post.author} createdAt={post.created_at} />
        <p className="mt-4 whitespace-pre-line text-navy/90">{post.body}</p>

        <ItemActions
          canDelete={canDelete(post.author?.id)}
          canReport={user.id !== post.author?.id}
          onDelete={deletePost}
          onReport={() => setReportTarget({ post_id: post.id })}
        />
      </Card>

      {/* Comments */}
      <section className="mt-8" aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="text-lg font-bold">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>

        <ul className="mt-4 flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-gray-100 bg-card p-4">
              <Byline author={c.author} createdAt={c.created_at} />
              <p className="mt-2 whitespace-pre-line text-sm text-navy/90">{c.body}</p>
              <ItemActions
                canDelete={canDelete(c.author?.id)}
                canReport={user.id !== c.author?.id}
                onDelete={() => deleteComment(c.id)}
                onReport={() => setReportTarget({ comment_id: c.id })}
              />
            </li>
          ))}
        </ul>

        <form onSubmit={addComment} className="mt-6 flex flex-col gap-3">
          <Alert>{commentError}</Alert>
          <Textarea
            id="new-comment"
            label="Add a comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" disabled={posting || !comment.trim()} className="self-end">
            {posting ? "Posting…" : "Post comment"}
          </Button>
        </form>
      </section>

      <ReportModal target={reportTarget} open={Boolean(reportTarget)} onClose={() => setReportTarget(null)} />
    </div>
  );
}

function Byline({ author, createdAt }) {
  return (
    <p className="mt-1 text-xs">
      <span className="font-semibold text-navy">{author?.full_name}</span>
      {author?.role === "alumni" && " · Alumni"}
      {author?.role === "admin" && " · Admin"} · {timeAgo(createdAt)}
    </p>
  );
}

function ItemActions({ canDelete, canReport, onDelete, onReport }) {
  if (!canDelete && !canReport) return null;
  return (
    <div className="mt-3 flex gap-4 text-xs font-semibold">
      {canReport && (
        <button type="button" onClick={onReport} className="text-body hover:text-orange-dark hover:underline">
          Report
        </button>
      )}
      {canDelete && (
        <button type="button" onClick={onDelete} className="text-red-700 hover:underline">
          Delete
        </button>
      )}
    </div>
  );
}
