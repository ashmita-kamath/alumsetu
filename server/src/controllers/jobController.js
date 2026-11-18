import * as jobService from "../services/jobService.js";

export async function listJobs(req, res) {
  res.json(await jobService.listJobs(req.query));
}

export async function getJob(req, res) {
  res.json(await jobService.getJob(req.params.id, req.user));
}

export async function createJob(req, res) {
  res.status(201).json({ job: await jobService.createJob(req.user, req.body) });
}

export async function deleteJob(req, res) {
  await jobService.deleteJob(req.user, req.params.id);
  res.status(204).end();
}

export async function apply(req, res) {
  res.status(201).json({ application: await jobService.apply(req.user, req.params.id, req.body) });
}

export async function listApplicationsForJob(req, res) {
  res.json(await jobService.listApplicationsForJob(req.user, req.params.id));
}

export async function myApplications(req, res) {
  res.json(await jobService.myApplications(req.user));
}

export async function updateApplicationStatus(req, res) {
  res.json({ application: await jobService.updateApplicationStatus(req.user, req.params.id, req.body.status) });
}
