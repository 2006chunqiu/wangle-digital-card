import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const tokenRecordPath = path.join(projectRoot, ".deploy", "github-token.json");
const owner = "2006chunqiu";
const repo = "wangle-digital-card";
const apiBase = "https://api.github.com";
const excludedDirectories = new Set([
  ".git",
  ".deploy",
  "node_modules",
  "dist",
  "release",
  "qa",
  ".cache",
  ".pnpm-home",
  ".pnpm-store",
  ".appdata",
  ".config",
  ".netlify",
  ".netlify-tools"
]);
const excludedFiles = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

const record = JSON.parse(await readFile(tokenRecordPath, "utf8"));
const token = record.access_token;
if (!token) throw new Error("GitHub token missing");

const headers = {
  Authorization: "Bearer " + token,
  Accept: "application/vnd.github+json",
  "User-Agent": "wangle-digital-card-deploy",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json"
};

async function api(method, endpoint, body) {
  const response = await fetch(apiBase + endpoint, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const error = new Error(`${method} ${endpoint} -> ${response.status}: ${text.slice(0, 700)}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function walk(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    if (entry.isFile() && excludedFiles.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute, base)));
    } else if (entry.isFile()) {
      const info = await stat(absolute);
      files.push({
        absolute,
        relative: path.relative(base, absolute).split(path.sep).join("/"),
        size: info.size
      });
    }
  }

  return files.sort((a, b) => a.relative.localeCompare(b.relative));
}

async function waitForRun(commitSha) {
  const started = Date.now();
  let dispatched = false;

  while (Date.now() - started < 6 * 60 * 1000) {
    const runs = await api("GET", `/repos/${owner}/${repo}/actions/runs?per_page=20`);
    const candidates = runs.workflow_runs.filter(
      (run) => run.head_branch === "main" && (run.head_sha === commitSha || !dispatched)
    );
    const completed = candidates.find(
      (run) => run.status === "completed" && run.conclusion === "success"
    );

    if (completed) {
      return completed;
    }

    const failed = candidates.find(
      (run) => run.status === "completed" && run.conclusion && run.conclusion !== "success"
    );

    if (failed) {
      return failed;
    }

    if (!dispatched) {
      const anyRun = candidates.some((run) => run.status !== "completed");
      if (!anyRun) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const refreshed = await api("GET", `/repos/${owner}/${repo}/actions/runs?per_page=20`);
        const hasPushRun = refreshed.workflow_runs.some(
          (run) => run.head_sha === commitSha && run.event === "push"
        );
        if (!hasPushRun) {
          await api("POST", `/repos/${owner}/${repo}/actions/workflows/deploy-pages.yml/dispatches`, {
            ref: "main"
          });
          console.log("Workflow dispatch requested.");
        }
        dispatched = true;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Timed out waiting for the Pages workflow");
}

async function waitForPages(url) {
  const started = Date.now();
  while (Date.now() - started < 5 * 60 * 1000) {
    try {
      const response = await fetch(`${url}?v=${Date.now()}`, {
        headers: { "User-Agent": "wangle-digital-card-verifier" },
        cache: "no-store"
      });
      const text = await response.text();
      if (response.ok && text.includes("王乐") && text.includes("武汉理工大学")) {
        return true;
      }
      console.log(`Pages check: HTTP ${response.status}`);
    } catch (error) {
      console.log("Pages check pending: " + error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return false;
}

async function main() {
  const user = await api("GET", "/user");
  console.log("Authenticated as:", user.login);

  let repoInfo;
  try {
    repoInfo = await api("GET", `/repos/${owner}/${repo}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    repoInfo = await api("POST", "/user/repos", {
      name: repo,
      description: "王乐 · 数字经济数字名片（静态站点）",
      private: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      auto_init: false
    });
    console.log("Repository created:", repoInfo.full_name);
  }

  // Pages is enabled before the workflow commit so the first push can deploy.
  try {
    const pages = await api("GET", `/repos/${owner}/${repo}/pages`);
    console.log("Pages already enabled:", pages.html_url || "");
  } catch (error) {
    if (error.status === 404) {
      const pages = await api("POST", `/repos/${owner}/${repo}/pages`, { build_type: "workflow" });
      console.log("Pages enabled:", pages.html_url || "");
    } else {
      throw error;
    }
  }

  // Initialize main so the repository has a valid base commit.
  let baseCommit;
  let baseTree;
  try {
    const ref = await api("GET", `/repos/${owner}/${repo}/git/ref/heads/main`);
    baseCommit = await api("GET", `/repos/${owner}/${repo}/git/commits/${ref.object.sha}`);
    baseTree = baseCommit.tree.sha;
  } catch (error) {
    if (error.status !== 404 && error.status !== 409) throw error;
    const readme = "# 王乐 · 数字经济数字名片\n\n正在部署静态站点。\n";
    const initialized = await api("PUT", `/repos/${owner}/${repo}/contents/README.md`, {
      message: "chore: initialize repository",
      content: Buffer.from(readme, "utf8").toString("base64"),
      branch: "main"
    });
    const ref = await api("GET", `/repos/${owner}/${repo}/git/ref/heads/main`);
    baseCommit = await api("GET", `/repos/${owner}/${repo}/git/commits/${ref.object.sha}`);
    baseTree = baseCommit.tree.sha;
    console.log("Repository initialized:", initialized.commit.sha.slice(0, 7));
  }

  const files = await walk(projectRoot);
  const treeEntries = [];
  console.log(`Uploading ${files.length} source files...`);

  for (const file of files) {
    if (file.relative === "README.md" && file.size === 0) continue;
    const content = await readFile(file.absolute);
    const blob = await api("POST", `/repos/${owner}/${repo}/git/blobs`, {
      content: content.toString("base64"),
      encoding: "base64"
    });
    treeEntries.push({
      path: file.relative,
      mode: "100644",
      type: "blob",
      sha: blob.sha
    });
  }

  const tree = await api("POST", `/repos/${owner}/${repo}/git/trees`, {
    base_tree: baseTree,
    tree: treeEntries
  });

  const commit = await api("POST", `/repos/${owner}/${repo}/git/commits`, {
    message: "feat: 王乐个人数字名片",
    tree: tree.sha,
    parents: [baseCommit.sha]
  });

  await api("PATCH", `/repos/${owner}/${repo}/git/refs/heads/main`, {
    sha: commit.sha,
    force: false
  });
  console.log("Pushed source commit:", commit.sha.slice(0, 7));

  const run = await waitForRun(commit.sha);
  console.log("Workflow run:", run.status, run.conclusion || "", run.html_url || "");
  if (run.conclusion !== "success") {
    throw new Error("GitHub Actions deployment failed: " + (run.html_url || "unknown run"));
  }

  const pagesUrl = `https://${owner}.github.io/${repo}/`;
  const live = await waitForPages(pagesUrl);
  const result = {
    owner,
    repo,
    repoUrl: `https://github.com/${owner}/${repo}`,
    pagesUrl,
    commit: commit.sha,
    workflowRun: run.html_url || null,
    verified: live,
    deployedAt: new Date().toISOString()
  };

  await mkdir(path.join(projectRoot, ".deploy"), { recursive: true });
  await writeFile(path.join(projectRoot, ".deploy", "github-repo.json"), JSON.stringify(result, null, 2) + "\n");

  console.log("");
  console.log("GitHub repository:", result.repoUrl);
  console.log("Public site    :", result.pagesUrl);
  console.log("Verified       :", live ? "yes" : "not yet (Pages may still be building)");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
