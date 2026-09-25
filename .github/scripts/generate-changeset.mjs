#!/usr/bin/env node
// Generates a changeset from the commits found in a git range, as a fallback
// for whoever doesn't write one by hand.
//
// A manual changeset (added with `pnpm changeset`) always wins: the caller
// should skip invoking this script when one already exists for the range in
// question. See docs/versionamento.md.
//
// By default (pull-request snapshots) only feat and fix commits count. A
// chore, refactor or test commit never drags a package into that release.
// Pass --any-package-change on main: every commit that touches a package
// still gets a changeset, and the bump is at least a patch. feat, fix and
// breaking markers keep their usual severity, and they win when higher.
//
// Each package's bump comes only from the commits that touch it. A package
// touched by both a feat and a fix in the same range gets the more
// significant of the two, not the more significant across the whole range.
//
// The "chore: version packages" commit is ignored even with
// --any-package-change. That commit is the Version Packages PR landing, and
// treating it as a new change would open another version PR forever.
//
// Usage:
//   node generate-changeset.mjs --from <ref> --to <ref> [--any-package-change] [--out-dir <dir>] [--filename <name>]
//
// Writes <out-dir>/<filename> (default: auto-<short sha>.md) when the range
// warrants a release, and reports the outcome on $GITHUB_OUTPUT as `created`
// (true|false) and, when true, `path`.

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SEVERITY = { patch: 0, minor: 1, major: 2 };
const CONVENTIONAL_COMMIT = /^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/;
const BREAKING_FOOTER = /BREAKING CHANGE:/;
const VERSION_PACKAGES_COMMIT = /^chore(?:\([^)]*\))?!?: version packages(?:\s|$)/;

function parseArgs(argv) {
  const args = { outDir: ".changeset", anyPackageChange: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--from") args.from = argv[++i];
    else if (argv[i] === "--to") args.to = argv[++i];
    else if (argv[i] === "--out-dir") args.outDir = argv[++i];
    else if (argv[i] === "--filename") args.filename = argv[++i];
    else if (argv[i] === "--any-package-change") args.anyPackageChange = true;
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!args.from || !args.to) {
    throw new Error(
      "usage: generate-changeset.mjs --from <ref> --to <ref> [--any-package-change] [--out-dir <dir>] [--filename <name>]",
    );
  }
  return args;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

/** One entry per commit in (from, to], oldest first, with the packages it touches. */
function commitsInRange(from, to) {
  const shas = git(["log", "--format=%H", "--reverse", `${from}..${to}`])
    .trim()
    .split("\n")
    .filter(Boolean);

  return shas.map((sha) => {
    const raw = git(["show", "-s", "--format=%s%x00%b", sha]);
    const [subject, body = ""] = raw.split("\x00");

    const files = git(["diff-tree", "--no-commit-id", "--name-only", "-r", sha])
      .trim()
      .split("\n")
      .filter(Boolean);
    const packageDirs = new Set(
      files
        .map((file) => /^packages\/([^/]+)\//.exec(file)?.[1])
        .filter((dir) => dir !== undefined),
    );

    return { sha, subject: subject.trim(), body, packageDirs };
  });
}

/**
 * null when the commit should not release.
 * With anyPackageChange, a commit that touches a package is at least a patch.
 */
function bumpFor(commit, anyPackageChange) {
  if (VERSION_PACKAGES_COMMIT.test(commit.subject)) return null;

  const match = CONVENTIONAL_COMMIT.exec(commit.subject);
  if (match) {
    const [, type, , breaking] = match;
    const isBreaking = Boolean(breaking) || BREAKING_FOOTER.test(commit.body);
    if (isBreaking) return "major";
    if (type === "feat") return "minor";
    if (type === "fix") return "patch";
  }

  if (anyPackageChange && commit.packageDirs.size > 0) return "patch";
  return null;
}

function packageNameFromDir(dir) {
  const manifestPath = join("packages", dir, "package.json");
  if (!existsSync(manifestPath)) return null;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return manifest.name ?? null;
}

function setOutput(name, value) {
  const target = process.env.GITHUB_OUTPUT;
  if (target) appendFileSync(target, `${name}=${value}\n`);
}

function main() {
  const { from, to, outDir, filename, anyPackageChange } = parseArgs(process.argv.slice(2));
  const commits = commitsInRange(from, to);

  // package name -> { bump, subjects: Set<string> }
  const perPackage = new Map();

  for (const commit of commits) {
    const bump = bumpFor(commit, anyPackageChange);
    if (bump === null || commit.packageDirs.size === 0) continue;

    for (const dir of commit.packageDirs) {
      const name = packageNameFromDir(dir);
      if (!name) continue;

      const entry = perPackage.get(name);
      if (!entry) {
        perPackage.set(name, { bump, subjects: new Set([commit.subject]) });
      } else {
        entry.subjects.add(commit.subject);
        if (SEVERITY[bump] > SEVERITY[entry.bump]) entry.bump = bump;
      }
    }
  }

  if (perPackage.size === 0) {
    console.log(
      anyPackageChange
        ? "No releasable package change in this range. Nothing to do."
        : "No feat or fix commit touching a package in this range. Nothing to do.",
    );
    setOutput("created", "false");
    return;
  }

  const frontmatter = [...perPackage.entries()]
    .map(([name, { bump }]) => `"${name}": ${bump}`)
    .join("\n");

  const allSubjects = new Set();
  for (const { subjects } of perPackage.values()) {
    for (const subject of subjects) allSubjects.add(subject);
  }
  const summary = [...allSubjects].map((subject) => `- ${subject}`).join("\n");

  const content = `---\n${frontmatter}\n---\n\n${summary}\n`;
  const path = join(outDir, filename ?? `auto-${to.slice(0, 7)}.md`);
  writeFileSync(path, content);

  console.log(`Wrote ${path}:\n\n${content}`);
  setOutput("created", "true");
  setOutput("path", path);
}

main();
