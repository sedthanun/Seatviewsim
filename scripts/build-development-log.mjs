import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Documentation only: one Markdown source, an offline-readable HTML export, no app changes.
const sourceUrl = new URL("../docs/DEVELOPMENT-LOG.md", import.meta.url);
const outputUrl = new URL("../docs/DEVELOPMENT-LOG.html", import.meta.url);
const markdown = await readFile(sourceUrl, "utf8");
const metadataBlock = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
const metadata = Object.fromEntries((metadataBlock?.[1] ?? "").split(/\r?\n/).map(line => {
  const colon = line.indexOf(":");
  return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
}).filter(([key]) => key));
const lines = markdown.slice(metadataBlock?.[0].length ?? 0).split(/\r?\n/);
// Only section 00 defines milestones; history entries and acceptance lists do not count.
const progressSection = markdown.match(/^## 00 ·[^\r\n]*\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] ?? "";
const tasks = [...progressSection.matchAll(/^- \[([ xX])\] (.+)$/gm)].map(match => ({
  done: match[1].toLowerCase() === "x", title: match[2].trim(),
}));
if (!tasks.length) throw new Error("Section 00 must contain a progress checklist.");
const completed = tasks.filter(task => task.done).length;
const pending = tasks.filter(task => !task.done);
const percent = Math.round(completed / tasks.length * 100);
const summary = progressSection.match(/ความคืบหน้าตามรายการงาน: (\d+)% · เสร็จ (\d+) จาก (\d+) งานหลัก · เหลือ (\d+) งาน/);
if (!summary || summary.slice(1).map(Number).some((value, index) => value !== [percent, completed, tasks.length, pending.length][index])) {
  throw new Error(`Update the Markdown progress summary: ${percent}% / ${completed} of ${tasks.length}, ${pending.length} remaining.`);
}
const escape = text => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function inline(text) {
  // Only the documented inline subset is emitted; raw HTML is always escaped.
  const token = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let result = "", last = 0;
  for (const match of text.matchAll(token)) {
    result += escape(text.slice(last, match.index));
    if (match[1] != null) result += `<code>${escape(match[1])}</code>`;
    else if (match[2] != null) {
      const href = match[3];
      const allowed = !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) || /^https?:\/\//i.test(href);
      result += allowed ? `<a href="${escape(href)}">${escape(match[2])}</a>` : escape(match[2]);
    } else result += `<strong>${escape(match[4])}</strong>`;
    last = match.index + match[0].length;
  }
  return result + escape(text.slice(last));
}
const content = [], headings = [];
let sectionOpen = false;
const headingId = title => /^\d\d\s*·/.test(title) ? `section-${title.slice(0, 2)}` : `heading-${headings.length + 1}`;
const special = line => /^(#{1,3}\s|```|\| |\d+\.\s|[-*]\s)/.test(line);
for (let i = 0; i < lines.length;) {
  const line = lines[i];
  if (!line.trim()) { i++; continue; }
  if (line.startsWith("```")) {
    const language = line.slice(3).trim(), code = [];
    while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
    i++;
    content.push(`<div class="code-block"><div class="code-label">${escape(language || "text")}</div><pre><code>${escape(code.join("\n"))}</code></pre></div>`);
    continue;
  }
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length, title = heading[2];
    if (level === 1) content.push(`<h1>${inline(title)}</h1>`);
    else if (level === 2) {
      if (sectionOpen) content.push("</section>");
      const id = headingId(title);
      headings.push({id, title});
      content.push(`<section class="log-section" id="${id}"><h2>${inline(title)}</h2>`);
      sectionOpen = true;
    } else content.push(`<h3>${inline(title)}</h3>`);
    i++; continue;
  }
  if (line.startsWith("| ") && /^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i + 1] ?? "")) {
    const cells = row => row.trim().slice(1, -1).split("|").map(cell => cell.trim());
    const columns = cells(line);
    const rows = []; i += 2;
    while (i < lines.length && lines[i].startsWith("| ")) rows.push(cells(lines[i++]));
    content.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="ตาราง: ${escape(headings.at(-1)?.title ?? "ภาพรวม")}"><table><thead><tr>${columns.map(cell => `<th scope="col">${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
    continue;
  }
  if (/^(?:\d+\.|[-*])\s/.test(line)) {
    const ordered = /^\d+\./.test(line), items = [];
    const pattern = ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;
    while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].match(pattern)[1]);
    const tag = ordered ? "ol" : "ul";
    content.push(`<${tag}>${items.map(item => {
      const task = item.match(/^\[([ xX])\] (.+)$/);
      if (!task) return `<li>${inline(item)}</li>`;
      const done = task[1].toLowerCase() === "x";
      return `<li class="task-item"><span class="task-state${done ? " done" : ""}" role="img" aria-label="${done ? "เสร็จแล้ว" : "ยังไม่เสร็จ"}">${done ? "✓" : "○"}</span><span>${inline(task[2])}</span></li>`;
    }).join("")}</${tag}>`);
    continue;
  }
  const paragraph = [line]; i++;
  while (i < lines.length && lines[i].trim() && !special(lines[i])) paragraph.push(lines[i++]);
  content.push(`<p>${inline(paragraph.join(" "))}</p>`);
}
if (sectionOpen) content.push("</section>");
const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Development Log ของ IMAX Seat View Simulator: สถานะ Prototype, architecture, หลักฐาน, performance และแผน JSON ต่อสาขา / Preshow / Countdown">
  <meta name="document-version" content="${escape(metadata.document_version)}">
  <meta name="updated-at" content="${escape(metadata.updated_at)}">
  <meta name="color-scheme" content="dark light">
  <title>Development Log · IMAX Seat View Simulator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Prompt:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{font-family:'Prompt',Tahoma,Arial,sans-serif;color:#dbe7fa;background:#070e21;line-height:1.8;--font-small:'Google Sans',Tahoma,Arial,sans-serif;--muted:#9aafce;--line:#253550;--accent:#91bcff}
    *{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:radial-gradient(ellipse at 8% 0%,#173560 0,transparent 46%),radial-gradient(ellipse at 95% 4%,#25204d 0,transparent 35%),#070e21}
    a{color:var(--accent);text-underline-offset:4px}a:hover{color:white}button,a{touch-action:manipulation}a:focus-visible,button:focus-visible,.table-scroll:focus-visible{outline:2px solid #a8ceff;outline-offset:4px}
    .skip{position:absolute;top:-90px;left:20px;background:white;color:#10223f;padding:12px;z-index:20}.skip:focus{top:12px}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px 5vw;border-bottom:1px solid #ffffff13}.brand{font-weight:700;color:white;text-decoration:none;letter-spacing:.02em}.brand small{display:block;font-weight:400;font-size:12px;color:var(--muted)}
    .actions{display:flex;align-items:center;gap:10px}.action{font:inherit;line-height:1.4;font-size:13px;border:1px solid #3d567d;background:#182b4b;color:#e3eeff;border-radius:12px;padding:10px 16px;text-decoration:none;cursor:pointer}.action.primary{background:#95bfff;color:#102441;border-color:#95bfff;font-weight:700}
    .shell{display:grid;grid-template-columns:240px minmax(0,980px);gap:46px;max-width:1320px;margin:0 auto;padding:42px 30px 80px}
    aside{align-self:start;position:sticky;top:24px}.toc-heading{text-transform:uppercase;letter-spacing:.13em;color:#7f9ecb;font-size:11px;margin:6px 0 20px}.toc{display:flex;flex-direction:column;gap:4px}.toc a{font-size:13px;line-height:1.5;padding:8px 12px;color:#aabedb;text-decoration:none;border-left:2px solid #2b405f}.toc a:hover,.toc a:focus{background:#20345066;color:white;border-color:#8bb9ff}
    .aside-note{font-size:12px;border-top:1px solid var(--line);padding-top:20px;margin:24px 12px;color:var(--muted)}.aside-note strong{display:block;color:#b9d4ff;margin-bottom:5px}
    main{min-width:0}.hero{padding:30px 34px 24px;border:1px solid #52668a66;border-radius:24px;background:linear-gradient(125deg,#203d6399,#1b244599);margin-bottom:30px;box-shadow:0 20px 60px #00000026}.eyebrow{font-size:11px;letter-spacing:.16em;color:#aacdff;text-transform:uppercase;display:flex;gap:12px;align-items:center}.dot{width:7px;height:7px;background:#82dec5;border-radius:50%;box-shadow:0 0 15px #82dec588}
    .hero .hero-title{font-size:clamp(26px,3vw,39px);line-height:1.3;letter-spacing:-.025em;margin:16px 0 12px;color:#fff}.hero p{color:#b5c9e7;margin:0;font-size:15px;max-width:660px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px;border-top:1px solid #ffffff18;padding-top:20px}.stat strong{display:block;font-size:24px;line-height:1.3;color:#fff}.stat span{font-size:12px;color:#adc4e5}
    .progress-panel{margin-top:24px;padding-top:20px;border-top:1px solid #ffffff18}.progress-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px}.progress-heading h2{font-size:17px;margin:0}.progress-value{font-size:40px;font-weight:700;line-height:1.2;color:#a8efda}.progress-panel progress{display:block;width:100%;height:12px;margin:14px 0 12px;border:0;border-radius:999px;overflow:hidden;background:#0c1930;accent-color:#82dec5}.progress-panel progress::-webkit-progress-bar{background:#0c1930;border-radius:999px}.progress-panel progress::-webkit-progress-value{background:linear-gradient(90deg,#8bb9ff,#82dec5);border-radius:999px}.progress-panel progress::-moz-progress-bar{background:#82dec5;border-radius:999px}.hero .progress-note{font:13px/1.7 var(--font-small);margin-top:6px}.next-work{margin:20px 0 30px;padding:24px 28px;background:#111f36;border:1px solid #354d70;border-radius:20px}.next-work h2{font-size:20px;margin:0 0 12px}.next-work ul{margin:12px 0 18px}.next-work li{font-size:14px;overflow-wrap:anywhere}.task-item{display:flex;align-items:baseline;gap:10px;list-style:none}.task-state{flex:none;color:#aabedb}.task-state.done{color:#82dec5}
    article>h1{font-size:22px;line-height:1.5;margin:30px 0 14px;color:#edf4ff}article>p{font-size:15px}article>p:has(strong){border-left:3px solid #82b8ff;padding-left:18px}
    .log-section{scroll-margin-top:24px;padding:30px 0 28px;border-top:1px solid var(--line)}h2{font-size:23px;line-height:1.5;letter-spacing:-.015em;margin:0 0 20px;color:#f1f6ff}h3{color:#c6dcff;font-size:18px;margin:26px 0 12px;line-height:1.6}p{margin:12px 0 18px}li{margin:9px 0}ul,ol{padding-left:25px}strong{color:#edf4ff}
    code{font:12.5px/1.7 Consolas,'Courier New',monospace;background:#1e304d99;color:#d4e7ff;padding:2px 5px;border-radius:5px;overflow-wrap:anywhere}pre{margin:0;padding:19px 22px;overflow-x:auto;background:#091225;line-height:1.7}pre code{font-size:12.5px;background:none;padding:0;overflow-wrap:normal;border-radius:0}.code-block{margin:20px 0;border:1px solid #2b3e5b;border-radius:14px;overflow:hidden}.code-label{padding:7px 18px;background:#17243c;font:11px/1.7 Consolas,monospace;text-transform:uppercase;color:#90b7ed;letter-spacing:.08em}
    .table-scroll{overflow:auto;border:1px solid #293b56;border-radius:14px;margin:20px 0 25px;background:#101c3166}table{border-collapse:collapse;width:100%;font-size:13px;line-height:1.7;text-align:left}th{background:#1b2c48;color:#c8ddff;font-weight:600;white-space:nowrap}th,td{padding:13px 16px;border-bottom:1px solid #27364c;vertical-align:top}td:first-child{color:#d3e5ff}td{overflow-wrap:anywhere;min-width:110px}tr:last-child td{border-bottom:0}tbody tr:nth-child(even){background:#ffffff02}tbody tr:hover{background:#213c5c33}td code{font-size:12px}
    .footer{padding:24px 5vw;border-top:1px solid var(--line);font-size:12px;color:var(--muted);display:flex;justify-content:space-between;gap:20px}.footer a{white-space:nowrap}
    small,.action,.toc-heading,.toc a,.aside-note,.eyebrow,.stat span,table,.footer{font-family:var(--font-small)}
    @media(min-width:900px){article{font-size:15px}}@media(max-width:899px){.shell{grid-template-columns:1fr;gap:24px;padding:28px 22px 48px}aside{position:static}.toc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px}.aside-note{display:none}.toc-heading{margin:0 0 12px}.hero{padding:24px}.hero .hero-title{font-size:30px}.topbar{padding:18px 22px}}@media(max-width:520px){.topbar{align-items:flex-start;flex-direction:column;gap:14px}.actions{width:100%}.action{flex:1;text-align:center;font-size:12px;padding:10px 12px}.shell{padding:22px 16px 40px;gap:20px}.hero{padding:21px 19px;border-radius:18px}.hero .hero-title{font-size:27px}.hero p{font-size:13px}.stats{gap:10px}.stat strong{font-size:21px}.stat span{font-size:11px}.toc a{font-size:12px;padding:7px 9px}h2{font-size:20px}h3{font-size:17px}article{font-size:14px}article>h1{font-size:20px}th,td{padding:11px 13px}table{min-width:640px;font-size:12px}pre{padding:15px;font-size:12px}.footer{flex-direction:column;gap:6px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
    @media print{.next-work{background:white;border-color:#a5b3c6;padding:12px}.progress-value,.task-state,.task-state.done{color:#17253a}.progress-panel{border-color:#a5b3c6}}
    @media print{:root{color:#17253a;background:white}body{background:white;font-size:10pt}.topbar,aside,.actions,.skip,.stats{display:none}.shell{display:block;padding:0;max-width:none}.hero{background:none;border:0;box-shadow:none;padding:0;margin:0 0 20px}.hero .hero-title,h1,h2,h3,strong,td:first-child{color:#17253a!important}.hero p,p,.footer{color:#293b50}a{color:#154c8a}code,pre{background:#edf2f8;color:#17253a}.table-scroll{overflow:visible;border-color:#a5b3c6}table{font-size:9pt;min-width:0}th{background:#e4ebf3;color:#17253a}.log-section{padding:16px 0;border-color:#a5b3c6}tr,pre,h2,h3{break-inside:avoid}td,th{border-color:#b8c4d3;padding:7px}h2,h3{break-after:avoid}.footer{padding:10px 0;font-size:9pt}.code-label{background:#e4ebf3;color:#154c8a}.code-block{border-color:#a5b3c6}}
  </style>
</head>
<body>
  <a class="skip" href="#document">ข้ามไปเนื้อหา</a>
  <header class="topbar">
    <a class="brand" href="#document">IMAX Seat View Simulator<small>PROJECT KNOWLEDGE · ENGINEERING HANDOFF</small></a>
    <div class="actions"><a class="action primary" href="DEVELOPMENT-LOG.md" download>ดาวน์โหลด Markdown</a><button class="action" type="button" onclick="window.print()">พิมพ์ / บันทึก PDF</button></div>
  </header>
  <div class="shell">
    <aside aria-label="สารบัญ">
      <p class="toc-heading">Contents · ${headings.length} sections</p>
      <nav class="toc">${headings.map(h => `<a href="#${h.id}">${escape(h.title)}</a>`).join("\n")}</nav>
      <p class="aside-note"><strong>เอกสาร v${escape(metadata.document_version)} · ${escape(metadata.updated_at)}</strong>อ้างอิงโค้ดและการตัดสินใจล่าสุด<br>งาน JSON และวิดีโอใหม่ยังเป็นแผน</p>
    </aside>
    <main id="document">
      <div class="hero" aria-label="ภาพรวมเอกสาร">
        <div class="eyebrow"><span class="dot" aria-hidden="true"></span>Functional prototype · Documentation v${escape(metadata.document_version)}</div>
        <p class="hero-title">บันทึกงานวันนี้<br>พร้อมต่อยอดโรงถัดไป</p>
        <p>สถานะที่ตรวจได้ เหตุผลที่เลือก และแผนส่งต่อสำหรับคนกับ AI<br>หนึ่ง JSON ต่อสาขา · IMAX Preshow / IMAX Countdown</p>
        <div class="progress-panel">
          <div class="progress-heading"><h2 id="progress-label">ความคืบหน้าตามรายการงาน</h2><span class="progress-value">${percent}%</span></div>
          <progress value="${completed}" max="${tasks.length}" aria-labelledby="progress-label">${percent}%</progress>
          <p>เสร็จ ${completed} จาก ${tasks.length} งานหลัก · เหลือ ${pending.length} งาน</p>
          <p class="progress-note">นับงานที่เสร็จด้วยน้ำหนักเท่ากัน · ไม่ใช่เวลาทำงานหรือความแม่นยำของโรง · อัปเดต ${escape(metadata.updated_at)}</p>
        </div>
        <div class="stats"><div class="stat"><strong>11</strong><span>สาขาในทะเบียน</span></div><div class="stat"><strong>426</strong><span>รหัสที่นั่ง Prototype</span></div><div class="stat"><strong>2</strong><span>แผนหลักถัดไป</span></div></div>
      </div>
      <section class="next-work" aria-labelledby="next-work-title">
        <h2 id="next-work-title">${pending.length ? `งานที่ต้องทำต่อ · ${pending.length} งาน` : "ทำครบตามรายการงานแล้ว"}</h2>
        ${pending.length ? `<p><strong>ลำดับถัดไป:</strong> ${inline(pending[0].title)}</p><ul>${pending.map(task => `<li>${inline(task.title)}</li>`).join("")}</ul><a href="#section-11">ดู dependency และเกณฑ์ปิดงาน →</a>` : `<p>ตรวจขอบเขตและหลักฐานก่อนเพิ่มเป้าหมายใหม่</p>`}
      </section>
      <article aria-label="Development Log">${content.join("\n")}</article>
    </main>
  </div>
  <footer class="footer"><span>Generated from DEVELOPMENT-LOG.md · ${escape(metadata.updated_at)} · Roadmap ≠ implemented features</span><a href="#document">กลับไปด้านบน ↑</a></footer>
  <script type="application/json" id="ai-handoff-metadata">${JSON.stringify(metadata, null, 2).replace(/</g, "\\u003c")}</script>
</body>
</html>
`;
await writeFile(outputUrl, html, "utf8");
console.log(`Generated ${fileURLToPath(outputUrl)} (${headings.length} sections)`);

