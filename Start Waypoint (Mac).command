#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1 || ! node -e "process.exit(+process.versions.node.split('.')[0] < 22 ? 1 : 0)"; then
  echo "Waypoint needs Node.js version 22 or newer."
  echo "Opening the download page now. Install the LTS version, then double-click this file again."
  open https://nodejs.org
  read -r -p "Press Enter to close."
  exit 1
fi

fail() { echo; echo "Something went wrong. Take a screenshot of this window and send it to Claude."; read -r -p "Press Enter to close."; exit 1; }

if [ ! -d node_modules ]; then
  echo "Setting up Waypoint for the first time. This takes a minute or two..."
  npm install || fail
fi

echo "Building Waypoint..."
npm run build || fail

echo
echo "Waypoint is starting. Your browser will open in a few seconds."
echo "KEEP THIS WINDOW OPEN while you use Waypoint. Close it to stop Waypoint."
echo
(sleep 5; open http://localhost:4300) &
npm start
