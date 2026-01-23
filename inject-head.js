import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const FAVICONS = `
<link rel="icon" href="/assets/img/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/img/favicon/favicon-16x16.png">
<link rel="apple-touch-icon" href="/assets/img/favicon/apple-touch-icon.png">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon/favicon.svg">
`.trim();

function scan(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (["assets", "content", "admin", ".git", "node_modules"].includes(item.name)) continue;
      scan(full);
    }

    if (item.isFile() && item.name.endsWith(".html")) {
      let html = fs.readFileSync(full, "utf8");

      if (html.includes("favicon.ico")) return;

      if (html.includes("</head>")) {
        html = html.replace("</head>", `  ${FAVICONS}\n</head>`);
        fs.writeFileSync(full, html, "utf8");
        console.log("✔ Injected favicons:", full);
      }
    }
  }
}

scan(ROOT);
