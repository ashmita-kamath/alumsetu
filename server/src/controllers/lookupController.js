import * as lookupService from "../services/lookupService.js";

export async function getInstitutions(req, res) {
  res.json(await lookupService.listInstitutions());
}

export async function getSkills(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  res.json(await lookupService.listSkills(search));
}
