#!/usr/bin/env node
/**
 * Crée labels, milestones, issues (et en option le GitHub Project) à partir de backlog/issues.json.
 *
 * Prérequis : GitHub CLI connecté (`gh auth login`), et pour --project : `gh auth refresh -s project`.
 *
 * Usage :
 *   node scripts/create-github-backlog.mjs --dry-run          # affiche ce qui serait créé
 *   node scripts/create-github-backlog.mjs                    # dépôt courant
 *   node scripts/create-github-backlog.mjs --repo owner/nom --project
 *
 * Relançable sans doublon : labels mis à jour, milestones et issues existants ignorés (par titre).
 * Les responsables viennent du champ `owners` de chaque issue, traduit en identifiants GitHub par
 * backlog/team.json (prénom → identifiant, vide = non assigné).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const withProject = args.includes("--project");
const repoArg = args.includes("--repo") ? args[args.indexOf("--repo") + 1] : undefined;

const backlog = JSON.parse(readFileSync(join(root, "backlog/issues.json"), "utf8"));
const team = JSON.parse(readFileSync(join(root, "backlog/team.json"), "utf8"));

function gh(ghArgs, { json = false } = {}) {
  if (dryRun) return json ? [] : "";
  const out = execFileSync("gh", ghArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return json ? JSON.parse(out || "[]") : out.trim();
}

const log = (msg) => console.info(dryRun ? `[simulation] ${msg}` : msg);

const repo =
  repoArg ??
  (dryRun
    ? "OWNER/lislestart"
    : gh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]));
const owner = repo.split("/")[0];
log(`Dépôt : ${repo}`);

// 1. Labels
for (const label of backlog.labels) {
  gh([
    "label",
    "create",
    label.name,
    "--repo",
    repo,
    "--color",
    label.color,
    "--description",
    label.description,
    "--force",
  ]);
}
log(`${backlog.labels.length} labels créés ou mis à jour`);

// 2. Milestones
const existingMilestones = new Set(
  gh(["api", `repos/${repo}/milestones?state=all&per_page=100`], { json: true }).map(
    (m) => m.title,
  ),
);
for (const m of backlog.milestones) {
  if (existingMilestones.has(m.title)) continue;
  gh([
    "api",
    "-X",
    "POST",
    `repos/${repo}/milestones`,
    "-f",
    `title=${m.title}`,
    "-f",
    `due_on=${m.due}T23:59:59Z`,
    "-f",
    `description=${m.description}`,
  ]);
  log(`Milestone : ${m.title}`);
}

// 3. Issues
const existingIssues = new Set(
  gh(["issue", "list", "--repo", repo, "--state", "all", "--limit", "1000", "--json", "title"], {
    json: true,
  }).map((i) => i.title),
);
const poleNames = {
  backend: "Backend",
  web: "Front web",
  mobile: "Mobile",
  transverse: "Transverse (CI/CD, infra, sécurité)",
};
const created = [];

for (const issue of backlog.issues) {
  if (existingIssues.has(issue.title)) continue;
  const labels = [`type:${issue.type}`, `area:${issue.area}`, `pole:${issue.pole}`];
  if (issue.priority) labels.push("priority:haute");
  if (issue.goodFirst) labels.push("good first issue");
  if (issue.bonus) labels.push("bonus");

  const milestone = issue.sprint === null ? null : backlog.milestones[issue.sprint];
  const body = [
    "## Critères d'acceptation",
    "",
    ...issue.criteria.map((c) => `- [ ] ${c}`),
    "",
    "---",
    `Pôle : ${poleNames[issue.pole]}${milestone ? ` · ${milestone.title}` : " · Bonus"}`,
  ].join("\n");

  const createArgs = [
    "issue",
    "create",
    "--repo",
    repo,
    "--title",
    issue.title,
    "--body",
    body,
    "--label",
    labels.join(","),
  ];
  if (milestone) createArgs.push("--milestone", milestone.title);
  const assignees = (issue.owners ?? []).map((o) => team[o]).filter(Boolean);
  if (assignees.length > 0) createArgs.push("--assignee", assignees.join(","));

  const url = gh(createArgs);
  created.push(url);
  log(`Issue : ${issue.title}`);
}
log(`${created.length} issues créées (${backlog.issues.length - created.length} déjà présentes)`);

// 4. GitHub Project (optionnel)
if (withProject) {
  const project = dryRun
    ? { number: 0 }
    : JSON.parse(
        gh(["project", "create", "--owner", owner, "--title", "LisLeStart", "--format", "json"]),
      );
  gh(["project", "link", String(project.number), "--owner", owner, "--repo", repo]);
  for (const url of created)
    gh(["project", "item-add", String(project.number), "--owner", owner, "--url", url]);
  log(`Project « LisLeStart » créé (n°${project.number}) et ${created.length} issues ajoutées`);
  log("À faire dans l'interface : vues Tableau (par Statut) et Roadmap (par Milestone).");
}
