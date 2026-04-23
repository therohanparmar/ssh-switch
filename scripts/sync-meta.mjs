import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
};

const readText = (filePath) => fs.readFileSync(filePath, "utf8");
const writeText = (filePath, value) => fs.writeFileSync(filePath, value);

const metaPath = path.join(repoRoot, "app.meta.json");
if (!fs.existsSync(metaPath)) {
  console.error("Missing app.meta.json at repo root.");
  process.exit(1);
}

const meta = readJson(metaPath);
if (!meta?.title || !meta?.version || !meta?.author?.name) {
  console.error("app.meta.json must include: title, version, author.name");
  process.exit(1);
}

// package.json: only version is synced.
{
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = readJson(pkgPath);
  pkg.version = meta.version;
  writeJson(pkgPath, pkg);
}

// src-tauri/tauri.conf.json: productName, version, first window title are synced.
{
  const tauriConfPath = path.join(repoRoot, "src-tauri", "tauri.conf.json");
  const conf = readJson(tauriConfPath);
  conf.productName = meta.title;
  conf.version = meta.version;
  if (meta.mainBinaryName && typeof meta.mainBinaryName === "string") {
    conf.mainBinaryName = meta.mainBinaryName;
  }
  if (conf?.app?.windows?.[0]) {
    conf.app.windows[0].title = meta.title;
  }
  writeJson(tauriConfPath, conf);
}

// src-tauri/Cargo.toml: [package] version and authors are synced (minimal text replacement).
{
  const cargoPath = path.join(repoRoot, "src-tauri", "Cargo.toml");
  let cargo = readText(cargoPath);

  cargo = cargo.replace(
    /^version\s*=\s*".*"$/m,
    `version = "${meta.version}"`
  );

  const authorsLine = `authors = ["${meta.author.name.replace(/"/g, '\\"')}"]`;
  if (/^authors\s*=\s*\[.*\]$/m.test(cargo)) {
    cargo = cargo.replace(/^authors\s*=\s*\[.*\]$/m, authorsLine);
  } else {
    cargo = cargo.replace(/^\[package\]\s*$/m, `[package]\n${authorsLine}`);
  }

  writeText(cargoPath, cargo);
}

console.log(`Synced metadata: ${meta.title} v${meta.version}`);
