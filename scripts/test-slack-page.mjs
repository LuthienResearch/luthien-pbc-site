import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const pageScript = fs.readFileSync(path.join(repositoryRoot, "site/slack/slack.js"), "utf8");
const pageHtml = fs.readFileSync(path.join(repositoryRoot, "site/slack/index.html"), "utf8");
const currentInvite = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "site/slack/invite.json"), "utf8"));

async function runScenario({ invite, fetchError = null }) {
  const elements = {
    status: {
      classList: { add(className) { this.value = className; }, value: "" },
      textContent: "Loading the current invitation."
    },
    "join-link": {
      hidden: true,
      href: "#"
    },
    "show-email": {
      addEventListener(eventName, callback) {
        this[eventName] = callback;
      },
      hidden: false
    },
    "email-link": {
      hidden: true,
      href: "",
      textContent: ""
    }
  };

  const context = {
    Date,
    Error,
    Number,
    document: {
      getElementById(id) {
        return elements[id];
      }
    },
    fetch() {
      if (fetchError) {
        return Promise.reject(fetchError);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(invite),
        status: 200
      });
    }
  };

  vm.runInNewContext(pageScript, context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { elements };
}

const active = await runScenario({ invite: currentInvite });
assert.equal(active.elements["join-link"].hidden, false);
assert.equal(active.elements["join-link"].href, currentInvite.url);
assert.equal(active.elements.status.textContent, "The current invitation is ready.");

active.elements["show-email"].click();
assert.equal(active.elements["show-email"].hidden, true);
assert.equal(active.elements["email-link"].hidden, false);
assert.equal(active.elements["email-link"].textContent, "scottwofford3@gmail.com");
assert.equal(
  active.elements["email-link"].href,
  "mailto:scottwofford3@gmail.com?subject=Seattle%20AI%20Safety%20Slack%20invitation"
);

const expired = await runScenario({
  invite: {
    ...currentInvite,
    expiresAt: "2020-01-01T00:00:00Z"
  }
});
assert.equal(expired.elements["join-link"].hidden, true);
assert.equal(expired.elements.status.textContent, "The Slack invitation needs to be refreshed.");

const unavailable = await runScenario({
  invite: currentInvite,
  fetchError: new Error("network unavailable")
});
assert.equal(unavailable.elements["join-link"].hidden, true);
assert.equal(unavailable.elements.status.textContent, "The Slack invitation could not be loaded.");

assert.equal(pageHtml.includes("scottwofford3@gmail.com"), false);
assert.equal(pageScript.includes("scottwofford3@gmail.com"), false);

console.log("Slack page interaction, email-obfuscation, and failure-path tests passed");
