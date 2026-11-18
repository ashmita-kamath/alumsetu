import * as forumService from "../services/forumService.js";

export async function listPosts(req, res) {
  res.json(await forumService.listPosts(req.user, req.query));
}

export async function getPost(req, res) {
  res.json(await forumService.getPost(req.params.id, req.user));
}

export async function createPost(req, res) {
  res.status(201).json({ post: await forumService.createPost(req.user, req.body) });
}

export async function updatePost(req, res) {
  res.json({ post: await forumService.updatePost(req.user, req.params.id, req.body) });
}

export async function deletePost(req, res) {
  await forumService.deletePost(req.user, req.params.id);
  res.status(204).end();
}

export async function addComment(req, res) {
  res.status(201).json({ comment: await forumService.addComment(req.user, req.params.id, req.body) });
}

export async function deleteComment(req, res) {
  await forumService.deleteComment(req.user, req.params.id);
  res.status(204).end();
}
