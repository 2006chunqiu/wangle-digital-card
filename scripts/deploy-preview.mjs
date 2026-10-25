import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const archivePath = path.join(projectRoot, "release", "wangle-digital-card.zip");
const recordDir = path.join(projectRoot, ".deploy");
const recordPath = path.join(recordDir, "brewpage.json");

function randomNamespace() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return "wangle-card-" + suffix;
}

async function readExistingRecord() {
  if (process.env.BREWPAGE_FRESH === "1") return null;
  try {
    const record = JSON.parse(await readFile(recordPath, "utf8"));
    if (record.ownerToken && record.ownerLink && record.namespace) return record;
  } catch {
    /* no previous deployment */
  }
  return null;
}

async function upload(endpoint, archive, token) {
  const form = new FormData();
  form.append("archive", new Blob([archive], { type: "application/zip" }), "wangle-digital-card.zip");

  const headers = {
    "User-Agent": "wangle-digital-card/1.0"
  };
  if (token) headers["X-Owner-Token"] = token;

  const response = await fetch(endpoint, {
    method: token ? "PUT" : "POST",
    headers,
    body: form
  });

  const body = await response.text();
  let data;

  try {
    data = JSON.parse(body);
  } catch {
    data = { raw: body };
  }

  return { response, data };
}

async function main() {
  const archive = await readFile(archivePath);
  const existing = await readExistingRecord();
  let result;

  if (existing) {
    console.log("Updating existing preview (stable URL)...");
    result = await upload(new URL(existing.ownerLink), archive, existing.ownerToken);
  } else {
    const endpoint = new URL("https://brewpage.app/api/sites");
    endpoint.searchParams.set("ns", process.env.BREWPAGE_NS || randomNamespace());
    endpoint.searchParams.set("ttl", process.env.BREWPAGE_TTL || "30");
    console.log("Uploading " + (archive.length / 1024).toFixed(1) + " KB to BrewPage...");
    result = await upload(endpoint, archive, null);
  }

  // Expired or unavailable previews can be replaced with a fresh one.
  if (existing && (result.response.status === 404 || result.response.status === 410)) {
    console.log("Previous preview expired; creating a new one...");
    const endpoint = new URL("https://brewpage.app/api/sites");
    endpoint.searchParams.set("ns", randomNamespace());
    endpoint.searchParams.set("ttl", process.env.BREWPAGE_TTL || "30");
    result = await upload(endpoint, archive, null);
  }

  if (!result.response.ok) {
    console.error("Deploy failed (" + result.response.status + ")");
    console.error(JSON.stringify(result.data, null, 2));
    process.exitCode = 1;
    return;
  }

  const data = result.data;
  const id = data.id || (existing && existing.ownerLink ? existing.ownerLink.split("/").pop() : null);
  const namespace = data.namespace || (existing && existing.namespace) || null;
  const record = {
    provider: "BrewPage",
    deployedAt: new Date().toISOString(),
    expiresAt: data.expiresAt || (existing && existing.expiresAt) || null,
    namespace,
    id,
    link: data.link || (existing && existing.link) || null,
    ownerLink: data.ownerLink || (existing && existing.ownerLink) || null,
    ownerToken: existing ? existing.ownerToken : data.ownerToken || null,
    sizeBytes: data.sizeBytes || (existing && existing.sizeBytes) || null,
    notices: data.notices || []
  };

  await mkdir(recordDir, { recursive: true });
  await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n");

  console.log("");
  console.log("Public preview: " + record.link);
  console.log("Expires      : " + (record.expiresAt || "unknown"));
  console.log("Record       : .deploy/brewpage.json");
  console.log("Owner token saved locally; do not commit it.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
