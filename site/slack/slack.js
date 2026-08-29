(() => {
  "use strict";

  const status = document.getElementById("status");
  const joinLink = document.getElementById("join-link");

  function showFailure(message) {
    status.textContent = message;
    status.classList.add("error");
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
      const isSlackInvite = typeof invite.url === "string"
        && invite.url.startsWith("https://join.slack.com/t/seattleaisafety/shared_invite/");

      if (!isSlackInvite || !Number.isFinite(expiresAt)) {
        throw new Error("Invite configuration is invalid");
      }

      if (expiresAt <= Date.now()) {
        showFailure("The Slack invitation needs to be refreshed.");
        return;
      }

      joinLink.href = invite.url;
      joinLink.hidden = false;
      status.textContent = "Opening Slack.";

      window.setTimeout(() => {
        window.location.replace(invite.url);
      }, 700);
    })
    .catch(() => {
      showFailure("The Slack invitation could not be loaded.");
    });
})();
