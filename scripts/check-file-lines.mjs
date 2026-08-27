import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_LINES = 500;
const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const SOURCE_ROOTS = ["src", "scripts"];
const SOURCE_FILES = [
  "instrumentation-client.ts",
  "instrumentation.ts",
  "middleware.ts",
  "proxy.ts",
];
const EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const IGNORED_SEGMENTS = new Set([
  ".next",
  "__mocks__",
  "__tests__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "public",
  "reports",
  "test",
  "tests",
]);
const TEST_FILE_PATTERN = /\.(?:spec|test)\.[cm]?[jt]sx?$/;
const ROOT_CONFIG_PATTERN = /(?:^|\.)config\.[cm]?[jt]s$/;

function comparePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function shouldIgnore(relativePath) {
  const segments = relativePath.split("/");

  return (
    segments.some((segment) => IGNORED_SEGMENTS.has(segment)) ||
    TEST_FILE_PATTERN.test(relativePath)
  );
}

function collectFiles(entryPath, files) {
  if (!existsSync(entryPath)) {
    return;
  }

  const entries = readdirSync(entryPath, { withFileTypes: true }).sort((a, b) =>
    comparePaths(a.name, b.name),
  );

  for (const entry of entries) {
    const absolutePath = path.join(entryPath, entry.name);
    const relativePath = toPosixPath(path.relative(PROJECT_ROOT, absolutePath));

    if (shouldIgnore(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      collectFiles(absolutePath, files);
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.add(relativePath);
    }
  }
}

function collectFile(relativePath, files) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);

  if (
    existsSync(absolutePath) &&
    EXTENSIONS.has(path.extname(relativePath)) &&
    !shouldIgnore(relativePath)
  ) {
    files.add(toPosixPath(relativePath));
  }
}

function countPhysicalLines(relativePath) {
  const contents = readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");

  if (contents.length === 0) {
    return 0;
  }

  const lineBreaks = contents.match(/\r\n|\r|\n/g)?.length ?? 0;
  const endsWithLineBreak = /(?:\r\n|\r|\n)$/.test(contents);

  return lineBreaks + (endsWithLineBreak ? 0 : 1);
}

const files = new Set();

for (const sourceRoot of SOURCE_ROOTS) {
  collectFiles(path.join(PROJECT_ROOT, sourceRoot), files);
}

for (const sourceFile of SOURCE_FILES) {
  collectFile(sourceFile, files);
}

for (const entry of readdirSync(PROJECT_ROOT, { withFileTypes: true })) {
  if (entry.isFile() && ROOT_CONFIG_PATTERN.test(entry.name)) {
    collectFile(entry.name, files);
  }
}

const checkedFiles = [...files].sort(comparePaths);
const violations = checkedFiles
  .map((file) => ({ file, lines: countPhysicalLines(file) }))
  .filter(({ lines }) => lines > MAX_LINES)
  .sort((a, b) => b.lines - a.lines || comparePaths(a.file, b.file));

if (violations.length > 0) {
  console.error(`File line-count guard failed (maximum: ${MAX_LINES} lines):`);

  for (const { file, lines } of violations) {
    console.error(`- ${file}: ${lines} lines (${lines - MAX_LINES} over limit)`);
  }

  process.exit(1);
}

console.log(
  `File line-count guard passed: ${checkedFiles.length} files checked, maximum ${MAX_LINES} lines.`,
);
