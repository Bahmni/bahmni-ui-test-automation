#!/usr/bin/env bash
set -euo pipefail

# Upload allure-results/ to an allure-docker-service instance.
#
# Required env:
#   ALLURE_SERVER_URL       e.g. http://localhost:5050  or  http://<aws-host>:5050
#
# Optional env:
#   ALLURE_PROJECT_ID       target project on the server (default: "default")
#   ALLURE_RESULTS_DIR      results directory to upload (default: "reports/allure-results")
#   ALLURE_SERVER_USER      basic-auth user (only if SECURITY_ENABLED=1 on server)
#   ALLURE_SERVER_PASS      basic-auth pass
#   ALLURE_DASHBOARD_URL    UI URL used only in the success message

RESULTS_DIR="${ALLURE_RESULTS_DIR:-reports/allure-results}"
PROJECT_ID="${ALLURE_PROJECT_ID:-default}"

if [ -z "${ALLURE_SERVER_URL:-}" ]; then
  echo "ALLURE_SERVER_URL is not set — skipping Allure upload."
  exit 0
fi

if [ ! -d "$RESULTS_DIR" ] || [ -z "$(ls -A "$RESULTS_DIR" 2>/dev/null || true)" ]; then
  echo "No results found in '$RESULTS_DIR' — skipping upload."
  exit 0
fi

AUTH_ARGS=()
if [ -n "${ALLURE_SERVER_USER:-}" ] && [ -n "${ALLURE_SERVER_PASS:-}" ]; then
  AUTH_ARGS=(-u "$ALLURE_SERVER_USER:$ALLURE_SERVER_PASS")
fi

# Ensure the target project exists (idempotent; ignore "already exists" errors).
curl -sS -o /dev/null -w '' \
  "${AUTH_ARGS[@]}" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d "{\"id\": \"${PROJECT_ID}\"}" \
  "${ALLURE_SERVER_URL%/}/allure-docker-service/projects" || true

FILE_ARGS=()
COUNT=0
while IFS= read -r -d '' f; do
  FILE_ARGS+=(-F "files[]=@${f}")
  COUNT=$((COUNT + 1))
done < <(find "$RESULTS_DIR" -maxdepth 1 -type f -print0)

if [ "$COUNT" -eq 0 ]; then
  echo "No files matched in '$RESULTS_DIR' — skipping upload."
  exit 0
fi

echo "Uploading $COUNT result files to $ALLURE_SERVER_URL (project: $PROJECT_ID)..."

curl -sS --fail-with-body \
  "${AUTH_ARGS[@]}" \
  -X POST \
  "${FILE_ARGS[@]}" \
  "${ALLURE_SERVER_URL%/}/allure-docker-service/send-results?project_id=${PROJECT_ID}"

echo
echo "Generating report for project '$PROJECT_ID'..."

# allure-docker-service only auto-generates reports for the "default" project.
# For any custom project_id, we must trigger generation explicitly.
curl -sS --fail-with-body -o /dev/null \
  "${AUTH_ARGS[@]}" \
  -X GET \
  "${ALLURE_SERVER_URL%/}/allure-docker-service/generate-report?project_id=${PROJECT_ID}"

echo "Report generated."
echo "Dashboard: ${ALLURE_DASHBOARD_URL:-<set ALLURE_DASHBOARD_URL to print here>}"
echo "Project: ${PROJECT_ID}"
