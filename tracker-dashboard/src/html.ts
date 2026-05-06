// Single-file HTML dashboard. Embedded as a string literal so the worker has
// no static-asset dependencies. Vanilla JS, no build step.
export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>luthien.cc tracker</title>
<style>
  :root {
    color-scheme: light dark;
    --fg: #1a1a1a;
    --bg: #fafaf7;
    --muted: #6b6b6b;
    --border: #d8d6cf;
    --accent: #2a5d8f;
    --row-hover: #f0eee8;
    --code-bg: #efece4;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --fg: #e8e6e0;
      --bg: #1a1a1a;
      --muted: #8a8a8a;
      --border: #333;
      --accent: #6ea8d8;
      --row-hover: #252525;
      --code-bg: #2a2a2a;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: var(--fg);
    background: var(--bg);
    padding: 32px 40px;
    max-width: 1200px;
    margin: 0 auto;
  }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
  .meta { color: var(--muted); font-size: 13px; }
  .controls { margin: 16px 0 24px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  label { color: var(--muted); font-size: 13px; }
  select, input, button {
    font: inherit;
    padding: 6px 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--fg);
    border-radius: 4px;
  }
  button { cursor: pointer; }
  button:hover { background: var(--row-hover); }
  button.logout { font-size: 12px; padding: 3px 8px; background: transparent; color: var(--muted); }
  button.logout:hover { color: var(--fg); background: var(--row-hover); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
  th {
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    cursor: pointer;
    user-select: none;
  }
  th[data-sort]:hover { color: var(--fg); }
  tr.summary-row { cursor: pointer; }
  tr.summary-row:hover { background: var(--row-hover); }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.ref { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13px; }
  .countries { color: var(--muted); font-size: 12px; }
  .empty { color: var(--muted); padding: 40px 0; text-align: center; }
  .drill {
    background: var(--code-bg);
    margin: 0;
    padding: 12px 16px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre;
    overflow-x: auto;
    border-bottom: 1px solid var(--border);
  }
  .err { color: #c4534b; padding: 12px; border: 1px solid #c4534b; border-radius: 4px; margin: 12px 0; }
  .loading { color: var(--muted); padding: 12px 0; }
  .small { font-size: 12px; color: var(--muted); }
  code { background: var(--code-bg); padding: 1px 5px; border-radius: 3px; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>luthien.cc tracker</h1>
  <div>
    <span class="meta">Share <code>?ref=&lt;token&gt;</code> on tracked URLs to log a hit.</span>
    <form method="POST" action="/_t/logout" style="display:inline; margin-left: 12px;">
      <button type="submit" class="logout">Sign out</button>
    </form>
  </div>
</header>

<div class="controls">
  <label>Window:
    <select id="days">
      <option value="1">1 day</option>
      <option value="7">7 days</option>
      <option value="30" selected>30 days</option>
      <option value="90">90 days</option>
      <option value="365">1 year</option>
    </select>
  </label>
  <button id="refresh">Refresh</button>
  <span id="status" class="small"></span>
</div>

<div id="content">
  <div class="loading">Loading…</div>
</div>

<script>
(() => {
  const $ = (sel) => document.querySelector(sel);
  const content = $("#content");
  const status = $("#status");
  let summary = [];
  let sortKey = "hits";
  let sortDir = -1;

  function fmtTs(s) {
    if (!s) return "";
    return s.replace("T", " ").replace(/\\.\\d+Z?$/, "").replace(" 00:00:00", "");
  }

  function setStatus(msg) {
    status.textContent = msg;
  }

  async function loadSummary() {
    const days = $("#days").value;
    setStatus("loading…");
    content.innerHTML = '<div class="loading">Loading…</div>';
    try {
      const res = await fetch("/_t/api/hits?days=" + days, { credentials: "same-origin" });
      if (!res.ok) {
        content.innerHTML = '<div class="err">API error: ' + res.status + ' ' + (await res.text()) + '</div>';
        setStatus("");
        return;
      }
      const json = await res.json();
      summary = json.data || [];
      setStatus(summary.length + " refs · " + (json.rows || 0) + " rows · " + new Date().toLocaleTimeString());
      renderSummary();
    } catch (err) {
      content.innerHTML = '<div class="err">' + err + '</div>';
      setStatus("");
    }
  }

  function renderSummary() {
    if (!summary.length) {
      content.innerHTML = '<div class="empty">No hits in this window. Share a link with <code>?ref=&lt;token&gt;</code> to populate.</div>';
      return;
    }
    const rows = [...summary].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });

    const arrow = (k) => k === sortKey ? (sortDir === 1 ? " ↑" : " ↓") : "";
    let html = '<table><thead><tr>' +
      '<th data-sort="ref">ref' + arrow("ref") + '</th>' +
      '<th data-sort="hits" class="num">hits' + arrow("hits") + '</th>' +
      '<th data-sort="first_seen">first seen' + arrow("first_seen") + '</th>' +
      '<th data-sort="last_seen">last seen' + arrow("last_seen") + '</th>' +
      '<th data-sort="country_count" class="num">countries' + arrow("country_count") + '</th>' +
      '<th data-sort="path_count" class="num">paths' + arrow("path_count") + '</th>' +
      '</tr></thead><tbody>';
    for (const r of rows) {
      const refSafe = r.ref.replace(/[<>&]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[c]));
      html += '<tr class="summary-row" data-ref="' + refSafe + '">' +
        '<td class="ref">' + refSafe + '</td>' +
        '<td class="num">' + r.hits + '</td>' +
        '<td>' + fmtTs(r.first_seen) + '</td>' +
        '<td>' + fmtTs(r.last_seen) + '</td>' +
        '<td class="num">' + (r.country_count || 0) + '</td>' +
        '<td class="num">' + (r.path_count || 0) + '</td>' +
        '</tr>';
    }
    html += '</tbody></table>';
    content.innerHTML = html;

    content.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const k = th.dataset.sort;
        if (k === sortKey) sortDir = -sortDir;
        else { sortKey = k; sortDir = (k === "hits" ? -1 : 1); }
        renderSummary();
      });
    });
    content.querySelectorAll("tr.summary-row").forEach(tr => {
      tr.addEventListener("click", () => toggleDrill(tr));
    });
  }

  async function toggleDrill(tr) {
    const next = tr.nextElementSibling;
    if (next && next.classList.contains("drill-row")) {
      next.remove();
      return;
    }
    const ref = tr.dataset.ref;
    const days = $("#days").value;
    const drill = document.createElement("tr");
    drill.classList.add("drill-row");
    drill.innerHTML = '<td colspan="6"><div class="drill">loading hits for ' + ref + '…</div></td>';
    tr.after(drill);
    try {
      const res = await fetch("/_t/api/hits?days=" + days + "&ref=" + encodeURIComponent(ref), { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) {
        drill.querySelector(".drill").textContent = "error: " + (json.error || res.status);
        return;
      }
      const hits = json.data || [];
      if (!hits.length) {
        drill.querySelector(".drill").textContent = "no individual hits captured (sample window expired)";
        return;
      }
      const lines = hits.map(h => {
        const ua = (h.ua || "").slice(0, 80);
        const country = h.country || "?";
        const path = h.path || "?";
        return fmtTs(h.hit_time) + "  " + country.padEnd(3) + "  " + path.padEnd(12) + "  " + ua;
      });
      drill.querySelector(".drill").textContent = lines.join("\\n");
    } catch (err) {
      drill.querySelector(".drill").textContent = "error: " + err;
    }
  }

  $("#days").addEventListener("change", loadSummary);
  $("#refresh").addEventListener("click", loadSummary);
  loadSummary();
})();
</script>
</body>
</html>
`;
