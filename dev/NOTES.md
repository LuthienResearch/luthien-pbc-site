# Notes

- Slack documents a 30-day maximum for workspace invite links and exposes no supported method for creating a new general workspace invite link.
- The current invite expires at `2026-09-28T23:14:56Z`, verified from Slack's public invite-page metadata.
- Keep `site/slack/invite.json` as the single source of truth for the current invite. The page must fail to the contact email if the config is missing or expired.
- A scheduled GitHub Action should verify the live Slack metadata and alert before expiry. Do not store a Slack user token in GitHub or call undocumented private Slack methods.
