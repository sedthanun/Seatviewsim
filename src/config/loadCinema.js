import { buildCinemaRuntime } from "./buildCinemaRuntime";
import { validateCinema } from "./validateCinema";
import { cinemaRegistry } from "../data/cinemaRegistry";
import { branches } from "../data/branches";

export class CinemaLoadError extends Error {
  constructor(kind, message, details = {}) {
    super(message);
    this.name = "CinemaLoadError";
    this.kind = kind;
    Object.assign(this, details);
  }
}

export async function loadCinema(branchId, { importer, registry = cinemaRegistry } = {}) {
  const metadata = branches.find(branch => branch.id === branchId);
  if (!metadata) throw new CinemaLoadError("not-found", `Cinema branch not found: ${branchId}`);
  if (metadata.status !== "available") throw new CinemaLoadError("unavailable", `Cinema branch is not available: ${branchId}`);
  if (!registry[branchId] && !importer) throw new CinemaLoadError("unavailable", `Cinema data is not registered: ${branchId}`);
  let module;
  try { module = await (importer ?? registry[branchId])(); }
  catch (cause) { throw new CinemaLoadError("load", `Unable to load cinema data: ${branchId}`, { cause }); }
  const cinema = module.default ?? module;
  const validation = validateCinema(cinema, { expectedBranchId: branchId });
  if (!validation.valid) throw new CinemaLoadError("invalid", `Cinema data is invalid: ${branchId}`, { validation });
  if (!validation.canSimulate || cinema.status !== "available" || !["reviewed", "prototype"].includes(cinema.auditorium.referenceStatus))
    throw new CinemaLoadError("unavailable", `Cinema data is not ready: ${branchId}`, { validation });
  return buildCinemaRuntime(cinema);
}
