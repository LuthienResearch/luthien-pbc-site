(() => {
  "use strict";

  const status = document.getElementById("status");
  const joinLink = document.getElementById("join-link");
  const updatedAtElement = document.getElementById("updated-at");
  const showEmailButton = document.getElementById("show-email");
  const emailLink = document.getElementById("email-link");

  showEmailButton.addEventListener("click", () => {
    const emailCodes = [115, 99, 111, 116, 116, 119, 111, 102, 102, 111, 114, 100, 51, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];
    const email = String.fromCharCode(...emailCodes);

    emailLink.href = `mailto:${email}?subject=Seattle%20AI%20Safety%20Slack%20invitation`;
    emailLink.textContent = ` ${email}`;
    emailLink.hidden = false;
    showEmailButton.hidden = true;
  });

  function showFailure(message) {
    status.textContent = message;
    status.hidden = false;
    joinLink.hidden = true;
  }

  fetch("invite.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Invite configuration returned ${response.status}`);
      }
      return response.json();
    })
    .then((invite) => {
      const expiresAt = Date.parse(invite.expiresAt);
      const updatedAt = Date.parse(`${invite.updatedAt}T00:00:00Z`);
      const isSlackInvite = typeof invite.url === "string"
        && invite.url.startsWith("https://join.slack.com/t/seattleaisafety/shared_invite/");

      if (!isSlackInvite || !Number.isFinite(expiresAt) || !Number.isFinite(updatedAt)) {
        throw new Error("Invite configuration is invalid");
      }

      if (expiresAt <= Date.now()) {
        showFailure("Invitation expired.");
        return;
      }

      joinLink.href = invite.url;
      joinLink.hidden = false;
      updatedAtElement.textContent = new Date(updatedAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
        year: "numeric"
      });
    })
    .catch(() => {
      showFailure("Invitation unavailable.");
    });
})();
