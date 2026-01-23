import fs from "fs";
import path from "path";

const SITE = "https://kamogartistry.com";
const ROOT = process.cwd();

const EXCLUDE_DIRS = new Set(["admin", "assets", "content", "payments", ".git", "node_modules"]);
const EXCLUDE_FILES = new Set(["404.html"]); // don't index 404

function isHtml(file) {
  return file.endsWith(".html");
}

function walk(dir, urls = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(full, urls);
      continue;
    }

    if (!entry.isFile() || !isHtml(entry.name)) continue;
    if (EXCLUDE_FILES.has(entry.name)) continue;

    // Only include pages that are meant to be public.
    // We INCLUDE /portfolio/*.html and root *.html
    if (rel.startsWith("portfolio/") || !rel.includes("/")) {
      const loc = rel === "index.html" ? `${SITE}/` : `${SITE}/${rel}`;
      urls.push(loc);
    }
  }
  return urls;
}

const urls = walk(ROOT, []).sort((a, b) => a.localeCompare(b));

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log(`✔ sitemap.xml generated with ${urls.length} URLs`);
