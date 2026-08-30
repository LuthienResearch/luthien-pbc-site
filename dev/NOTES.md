# Notes

- Slack documents a 30-day maximum for workspace invite links and exposes no supported method for creating a new general workspace invite link.
- The current invite expires at `2026-09-28T23:14:56Z`, verified from Slack's public invite-page metadata.
- Keep `site/slack/invite.json` as the single source of truth for the current invite. The page must fail to the contact email if the config is missing or expired.
- Keep the page visible instead of redirecting automatically. Visitors choose when to follow the current invite.
- Reveal Scott's contact email only after a click, assembling it at runtime so the complete address does not appear in the page source. This reduces basic source scraping but cannot stop every sophisticated bot.
- A scheduled GitHub Action should verify the deployed page and live Slack metadata every six hours, then alert Scott seven days before expiry. Do not store a Slack user token in GitHub or call undocumented private Slack methods.
