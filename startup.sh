#!/bin/sh
# Restart contract: probe preview, start npm run dev only if down.
set -e
if curl -sf -o /dev/null http://127.0.0.1:8080/; then
  exit 0
fi
cd /workspace
npm run dev >/tmp/canquant-dev.log 2>&1 &
# wait briefly for bind
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf -o /dev/null http://127.0.0.1:8080/; then
    exit 0
  fi
  sleep 1
done
exit 0
