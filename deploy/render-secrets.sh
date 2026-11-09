#!/usr/bin/env bash
# Render secrets.env from SSM Parameter Store.
#
# Parameters are stored under SSM_PREFIX (default /kjit-classroom/prod) with
# the env var name as the last path segment, e.g.:
#   /kjit-classroom/prod/AUTH_SECRET
#   /kjit-classroom/prod/GITHUB_APP_PRIVATE_KEY
#
# The GitHub App PEM is stored on ONE line with literal \n escapes; the app
# converts them back to newlines in backend/github/client.ts.
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
PREFIX="${SSM_PREFIX:-/kjit-classroom/prod}"
OUT="${1:-secrets.env}"

command -v aws >/dev/null || { echo "aws CLI not found" >&2; exit 1; }
command -v jq  >/dev/null || { echo "jq not found (apt install jq)" >&2; exit 1; }

aws ssm get-parameters-by-path \
  --region "$REGION" \
  --path "$PREFIX" \
  --recursive \
  --with-decryption \
  --query 'Parameters[].{Name:Name,Value:Value}' \
  --output json \
| jq -r '.[] | "\(.Name | split("/") | last)=\(.Value)"' \
> "$OUT"

chmod 600 "$OUT"
echo "wrote $OUT ($(wc -l < "$OUT") variables)"
