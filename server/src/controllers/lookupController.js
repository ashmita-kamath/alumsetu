import * as lookupService from "../services/lookupService.js";
import { AppError } from "../utils/AppError.js";
import { isUniqueViolation } from "../utils/dbErrors.js";

export async function getInstitutions(req, res) {
  res.json(await lookupService.listInstitutions());
}

export async function getSkills(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  res.json(await lookupService.listSkills(search));
}

// POST /api/institutions (admin only)
export async function addInstitution(req, res) {
  try {
    const institution = await lookupService.createInstitution(req.body);
    res.status(201).json({ institution });
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, "CONFLICT", "A college with this name already exists");
    throw err;
  }
}

// POST /api/skills (any logged-in user). Returns the existing skill if the name is taken.
export async function addSkill(req, res) {
  const { skill, created } = await lookupService.findOrCreateSkill(req.body.name);
  res.status(created ? 201 : 200).json({ skill });
}
