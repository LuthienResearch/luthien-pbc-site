// Login form HTML. Same visual language as the dashboard. Form fields use
// proper autocomplete attributes so password managers can save and refill.
export function loginHtml(error: boolean = false): string {
  const banner = error
    ? '<div class="err">Invalid username or password.</div>'
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>luthien.cc tracker · sign in</title>
<style>
  :root {
    color-scheme: light dark;
    --fg: #1a1a1a;
    --bg: #fafaf7;
    --muted: #6b6b6b;
    --border: #d8d6cf;
    --accent: #2a5d8f;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --fg: #e8e6e0;
      --bg: #1a1a1a;
      --muted: #8a8a8a;
      --border: #333;
      --accent: #6ea8d8;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: var(--fg);
    background: var(--bg);
    display: grid;
    place-items: center;
  }
  form {
    width: 320px;
    padding: 28px 32px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
  }
  h1 { font-size: 16px; font-weight: 600; margin: 0 0 20px; letter-spacing: -0.01em; }
  label { display: block; font-size: 12px; color: var(--muted); margin: 0 0 4px; }
  input {
    width: 100%;
    font: inherit;
    padding: 8px 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--fg);
    border-radius: 4px;
    margin-bottom: 14px;
  }
  input:focus { outline: 2px solid var(--accent); outline-offset: -1px; border-color: transparent; }
  button {
    width: 100%;
    font: inherit;
    padding: 9px 10px;
    border: 0;
    background: var(--accent);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  button:hover { filter: brightness(1.1); }
  .err {
    color: #c4534b;
    font-size: 13px;
    padding: 8px 10px;
    border: 1px solid #c4534b;
    border-radius: 4px;
    margin-bottom: 14px;
  }
  .meta { color: var(--muted); font-size: 12px; margin-top: 14px; text-align: center; }
</style>
</head>
<body>
<form method="POST" action="/_t/login" autocomplete="on">
  <h1>luthien.cc tracker</h1>
  ${banner}
  <label for="username">Username</label>
  <input id="username" name="username" type="text" autocomplete="username" autofocus required>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Sign in</button>
  <div class="meta">Sessions last 30 days.</div>
</form>
</body>
</html>
`;
}
