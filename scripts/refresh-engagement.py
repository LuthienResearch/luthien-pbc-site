#!/usr/bin/env python3
"""Fetch real engagement data from GitHub, HN, and Reddit APIs.

Run periodically to keep quote card numbers accurate.
Outputs a JS object that can be pasted into problem-widget.html and index.html.

Usage:
    uv run python scripts/refresh-engagement.py
"""

import json
import re
import ssl
import sys
import time
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

GITHUB_ISSUES = [
    10077, 7074, 1290, 22557, 10628, 27430, 19106, 11913,
    3109, 7232, 15711, 25305, 18883, 26533, 10577, 8154, 9115,
]

HN_ITEMS = [44908733, 44908875, 46648851, 46526088]

REDDIT_URLS = {
    "https://www.reddit.com/r/dotnet/comments/1qd11od/dotnetslopwatch_a_net_tool_that_detects_llm/": "dotnetslopwatch",
}


def fetch_json(url, headers=None):
    hdrs = {"User-Agent": "Luthien-engagement-refresh/1.0"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, headers=hdrs)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return json.loads(resp.read())


def fetch_github():
    results = {}
    for issue_num in GITHUB_ISSUES:
        url = f"https://api.github.com/repos/anthropics/claude-code/issues/{issue_num}"
        try:
            data = fetch_json(url, {"Accept": "application/vnd.github.v3+json"})
            results[f"https://github.com/anthropics/claude-code/issues/{issue_num}"] = {
                "ghComments": data.get("comments", 0),
            }
            print(f"  GitHub #{issue_num}: {data.get('comments', 0)} comments", file=sys.stderr)
            time.sleep(0.5)
        except Exception as e:
            print(f"  GitHub #{issue_num}: FAILED - {e}", file=sys.stderr)
    return results


def find_parent_story(item_id):
    """Walk up from a comment to find the parent story."""
    current = item_id
    for _ in range(10):
        data = fetch_json(f"https://hacker-news.firebaseio.com/v0/item/{current}.json")
        if data.get("type") == "story":
            return data
        parent = data.get("parent")
        if not parent:
            return data
        current = parent
        time.sleep(0.3)
    return None


def fetch_hn():
    results = {}
    for item_id in HN_ITEMS:
        try:
            data = fetch_json(f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json")
            if data.get("type") == "comment":
                story = find_parent_story(item_id)
                if story:
                    results[f"https://news.ycombinator.com/item?id={item_id}"] = {
                        "hnPoints": story.get("score", 0),
                        "hnComments": story.get("descendants", 0),
                        "hnBy": story.get("by", ""),
                    }
                    print(f"  HN {item_id} (comment -> story {story.get('id')}): {story.get('score', 0)} pts", file=sys.stderr)
            else:
                results[f"https://news.ycombinator.com/item?id={item_id}"] = {
                    "hnPoints": data.get("score", 0),
                    "hnComments": data.get("descendants", 0),
                    "hnBy": data.get("by", ""),
                }
                print(f"  HN {item_id}: {data.get('score', 0)} points", file=sys.stderr)
            time.sleep(0.5)
        except Exception as e:
            print(f"  HN {item_id}: FAILED - {e}", file=sys.stderr)
    return results


def fetch_reddit():
    results = {}
    for url, key in REDDIT_URLS.items():
        try:
            data = fetch_json(url + ".json", {"User-Agent": "Luthien-research-bot/1.0"})
            post = data[0]["data"]["children"][0]["data"]
            results[url] = {
                "redditVotes": post.get("score", 0),
                "redditComments": post.get("num_comments", 0),
            }
            print(f"  Reddit {key}: {post.get('score', 0)} upvotes, {post.get('num_comments', 0)} comments", file=sys.stderr)
        except Exception as e:
            print(f"  Reddit {key}: FAILED - {e}", file=sys.stderr)
    return results


def main():
    print("Fetching engagement data...", file=sys.stderr)

    all_data = {}
    print("\nGitHub:", file=sys.stderr)
    all_data.update(fetch_github())
    print("\nHacker News:", file=sys.stderr)
    all_data.update(fetch_hn())
    print("\nReddit:", file=sys.stderr)
    all_data.update(fetch_reddit())

    # Output as JS object for embedding
    print("\n// Paste this into problem-widget.html and index.html")
    print("var realEngagement = " + json.dumps(all_data, indent=2) + ";")


if __name__ == "__main__":
    main()
