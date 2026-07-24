#!/bin/zsh
cd "$(dirname "$0")"
lsof -ti tcp:4321 | xargs kill 2>/dev/null
echo "planet based ✺ http://localhost:4321"
python3 -m http.server 4321
