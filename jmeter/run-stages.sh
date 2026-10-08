#!/usr/bin/env bash
# Runs the JMeter plan at five sizes (x1, x10, x100, x1000, x10000),
# one after the other, then prints a summary table.
#
#   ./jmeter/run-stages.sh
#
# Each stage is that many "teacher sessions" (one full pass through the
# plan: 10 requests). At most MAX_THREADS users run at the same time, and
# bigger stages loop more times. Settings can be changed like this:
#   STAGES="1 10 100" MAX_THREADS=50 PORT=3000 ./jmeter/run-stages.sh
set -euo pipefail
cd "$(dirname "$0")"

HOST="${HOST:-localhost}"
PORT="${PORT:-3200}"
STAGES="${STAGES:-1 10 100 1000 10000}"
MAX_THREADS="${MAX_THREADS:-200}"
JMETER="${JMETER:-jmeter}"

command -v "$JMETER" >/dev/null || { echo "JMeter not found. Install it, or set JMETER=/path/to/bin/jmeter"; exit 1; }
curl -fsS "http://$HOST:$PORT/health" >/dev/null || { echo "Nothing healthy at http://$HOST:$PORT/health. Start the app first (jmeter/start-load-server.sh)."; exit 1; }

mkdir -p results
for N in $STAGES; do
  THREADS=$(( N < MAX_THREADS ? N : MAX_THREADS ))
  LOOPS=$(( (N + THREADS - 1) / THREADS ))
  RAMP=$(( THREADS / 10 ))
  [ "$RAMP" -lt 1 ] && RAMP=1
  [ "$RAMP" -gt 30 ] && RAMP=30

  echo "=== Stage x$N: $THREADS users x $LOOPS loops, ramp-up ${RAMP}s ==="
  # JMeter refuses to overwrite old results, so clear this stage's first.
  rm -rf "results/x$N-report" "results/x$N.jtl"
  "$JMETER" -n -t phoneme-builder.jmx \
    -Jhost="$HOST" -Jport="$PORT" -Jthreads="$THREADS" -Jloops="$LOOPS" -Jramp="$RAMP" \
    -l "results/x$N.jtl" -e -o "results/x$N-report"
done

node summarise.mjs results
