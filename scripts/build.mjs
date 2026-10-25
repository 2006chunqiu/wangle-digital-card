import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const srcDir = path.join(projectRoot, "src");
const distDir = path.join(projectRoot, "dist");
const releaseDir = path.join(projectRoot, "release");
const zipPath = path.join(releaseDir, "wangle-digital-card.zip");

async function walk(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute, base)));
    } else if (entry.isFile()) {
      files.push({
        absolute,
        relative: path.relative(base, absolute).split(path.sep).join("/")
      });
    }
  }

  return files;
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function buildZip(files, date) {
  const { dosTime, dosDate } = dosDateTime(date);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.relative, "utf8");
    const data = file.data;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

async function main() {
  const pkg = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    await cp(path.join(srcDir, entry.name), path.join(distDir, entry.name), { recursive: true });
  }

  const files = (await walk(distDir)).sort((a, b) => a.relative.localeCompare(b.relative));
  let totalBytes = 0;
  const manifest = [];

  for (const file of files) {
    const info = await stat(file.absolute);
    totalBytes += info.size;
    manifest.push({ path: file.relative, bytes: info.size });
  }

  const buildInfo = {
    name: pkg.name,
    version: pkg.version,
    generatedAt: new Date().toISOString(),
    fileCount: manifest.length,
    totalBytes,
    files: manifest
  };

  await writeFile(path.join(distDir, "deploy-info.json"), JSON.stringify(buildInfo, null, 2) + "\n");

  const zipEntries = [];
  for (const file of await walk(distDir)) {
    zipEntries.push({ relative: file.relative, data: await readFile(file.absolute) });
  }

  await mkdir(releaseDir, { recursive: true });
  await writeFile(zipPath, buildZip(zipEntries, new Date()));

  const zipStat = await stat(zipPath);
  console.log("");
  console.log("  Digital card build complete");
  console.log("  ----------------------------");
  console.log("  Output : dist/");
  console.log("  Files  : " + manifest.length);
  console.log("  Size   : " + (totalBytes / 1024).toFixed(1) + " KB");
  console.log("  Archive: " + path.relative(projectRoot, zipPath) + " (" + (zipStat.size / 1024).toFixed(1) + " KB)");
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
