#!/usr/bin/env bash
# Thin redirect — always runs the canonical installer from luthien-proxy.
# This lets us offer `curl -fsSL https://luthien.cc/install.sh | bash`
# while keeping the real script in the luthien-proxy repo.
set -euo pipefail
exec bash <(curl -fsSL https://raw.githubusercontent.com/LuthienResearch/luthien-proxy/main/scripts/install.sh)
