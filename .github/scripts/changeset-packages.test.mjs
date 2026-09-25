import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  collectPackageNames,
  packageDirsNotNamed,
  packageNamesFromChangeset,
} from "./changeset-packages.mjs";

test("reads quoted and unquoted package names from a changeset", () => {
  const markdown = `---
"@zipframes/core": minor
'@zipframes/schemas': patch
@zipframes/logger: major
---

- feat(core): add something
`;

  assert.deepEqual(packageNamesFromChangeset(markdown), [
    "@zipframes/core",
    "@zipframes/schemas",
    "@zipframes/logger",
  ]);
});

test("ignores a changeset without frontmatter", () => {
  assert.deepEqual(packageNamesFromChangeset("no frontmatter\n"), []);
});

test("collects names from every changeset except the README", () => {
  const dir = mkdtempSync(join(tmpdir(), "changesets-"));
  writeFileSync(join(dir, "README.md"), '---\n"@zipframes/core": major\n---\n');
  writeFileSync(join(dir, "auto-pr-35.md"), '---\n"@zipframes/core": minor\n---\n\n- feat\n');
  writeFileSync(join(dir, "notes.txt"), '---\n"@zipframes/logger": patch\n---\n');

  assert.deepEqual([...collectPackageNames(dir)], ["@zipframes/core"]);
});

test("keeps only packages the changeset does not name", () => {
  const root = mkdtempSync(join(tmpdir(), "packages-"));
  const packagesDir = join(root, "packages");
  for (const [dir, name] of [
    ["core", "@zipframes/core"],
    ["authenticator", "@zipframes/authenticator"],
    ["logger", "@zipframes/logger"],
  ]) {
    mkdirSync(join(packagesDir, dir), { recursive: true });
    writeFileSync(join(packagesDir, dir, "package.json"), JSON.stringify({ name }));
  }

  assert.deepEqual(packageDirsNotNamed(packagesDir, new Set(["@zipframes/core"])).sort(), [
    "authenticator",
    "logger",
  ]);
});
