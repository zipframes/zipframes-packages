#!/usr/bin/env node
// Packages named in pending changesets, as opposed to the dependents
// Changesets bumps only because a dependency range went out of date.
//
// Snapshot publish uses this so a PR that changes one package does not
// publish every dependent under the same dist-tag.
//
//   node changeset-packages.mjs --list
//   node changeset-packages.mjs --summary
//   node changeset-packages.mjs --restore-others

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const CHANGESET_LINE = /^(?:"([^"]+)"|'([^']+)'|([^:\s]+))\s*:\s*(?:patch|minor|major)\s*$/;

export function packageNamesFromChangeset(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match) return [];

  const names = [];
  for (const line of match[1].split(/\r?\n/)) {
    const found = CHANGESET_LINE.exec(line.trim());
    if (!found) continue;
    names.push(found[1] ?? found[2] ?? found[3]);
  }
  return names;
}

export function collectPackageNames(changesetDir) {
  const names = new Set();
  if (!existsSync(changesetDir)) return names;

  for (const file of readdirSync(changesetDir)) {
    if (!file.endsWith(".md") || file === "README.md") continue;
    const markdown = readFileSync(join(changesetDir, file), "utf8");
    for (const name of packageNamesFromChangeset(markdown)) names.add(name);
  }
  return names;
}

export function packageDirsNotNamed(packagesDir, names) {
  const dirs = [];
  if (!existsSync(packagesDir)) return dirs;

  for (const dir of readdirSync(packagesDir)) {
    const manifestPath = join(packagesDir, dir, "package.json");
    if (!existsSync(manifestPath)) continue;
    const { name } = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!names.has(name)) dirs.push(dir);
  }
  return dirs;
}

function repoRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
}

function packageNamesFromFile(path) {
  const names = new Set();
  if (!existsSync(path)) return names;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const name = line.trim();
    if (name.length > 0) names.add(name);
  }
  return names;
}

function restoreOthers(root, namesFile) {
  const names = collectPackageNames(join(root, ".changeset"));
  if (names.size === 0 && namesFile !== undefined) {
    for (const name of packageNamesFromFile(namesFile)) names.add(name);
  }
  const dirs = packageDirsNotNamed(join(root, "packages"), names);
  const paths = [];
  for (const dir of dirs) {
    for (const file of ["package.json", "CHANGELOG.md"]) {
      const relative = join("packages", dir, file);
      if (existsSync(join(root, relative))) paths.push(relative);
    }
  }
  if (paths.length === 0) return;
  execFileSync("git", ["checkout", "--", ...paths], { cwd: root });
}

function summary(root) {
  const names = [...collectPackageNames(join(root, ".changeset"))].sort();
  const lines = names.map((name) => {
    const dir = name.replace("@zipframes/", "");
    const manifest = JSON.parse(readFileSync(join(root, "packages", dir, "package.json"), "utf8"));
    return `- \`${name}@${manifest.version}\``;
  });
  return lines.join("\n");
}

function main() {
  const root = repoRoot();
  const command = process.argv[2];
  if (command === "--list") {
    const names = [...collectPackageNames(join(root, ".changeset"))].sort();
    process.stdout.write(names.length === 0 ? "" : `${names.join("\n")}\n`);
    return;
  }
  if (command === "--summary") {
    const text = summary(root);
    process.stdout.write(text.length === 0 ? "" : `${text}\n`);
    return;
  }
  if (command === "--restore-others") {
    const namesFileArg = process.argv.indexOf("--from-file");
    const namesFile =
      namesFileArg !== -1 && process.argv[namesFileArg + 1] !== undefined
        ? process.argv[namesFileArg + 1]
        : undefined;
    restoreOthers(root, namesFile);
    return;
  }
  throw new Error(
    "usage: changeset-packages.mjs --list | --summary | --restore-others [--from-file <path>]",
  );
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main();
