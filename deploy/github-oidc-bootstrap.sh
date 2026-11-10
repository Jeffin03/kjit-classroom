#!/usr/bin/env bash
#
# One-shot IAM bootstrap for the GitHub Actions release pipeline.
#
# Run this in AWS CloudShell (or any principal with IAM write access) once.
# It is idempotent: re-running updates the trust policy and inline permissions.
#
#   bash deploy/github-oidc-bootstrap.sh
#
# Creates:
#   - the GitHub OIDC identity provider (token.actions.githubusercontent.com)
#   - role kjit-classroom-github-deploy, assumable only by this repo's
#     master branch, v* tags, and the `production` environment
#   - inline policy: ECR push/pull + ssm:SendCommand to the instance
set -euo pipefail

ACCOUNT_ID="${ACCOUNT_ID:-290719180191}"
REPO="Jeffin03/kjit-classroom"
# New GitHub repos issue *immutable* OIDC subjects that embed the numeric owner
# and repo IDs: repo:<owner>@<owner-id>/<repo>@<repo-id>. The legacy
# "repo:<owner>/<repo>" form no longer appears in tokens for these repos.
# Inspect with: gh api repos/<owner>/<repo>/actions/oidc/customization/sub
REPO_SUBJECT="repo:Jeffin03@114830279/kjit-classroom@1356951073"
ROLE="kjit-classroom-github-deploy"
REGION="${AWS_REGION:-ap-south-1}"
INSTANCE_ID="${INSTANCE_ID:-i-04fdf15567813a6a0}"
ECR_REPO="kjit-classroom"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "== identity =="
aws sts get-caller-identity --query 'Arn' --output text

cat > "$TMP/trust.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:${REPO}:ref:refs/heads/master",
            "repo:${REPO}:ref:refs/tags/v*",
            "repo:${REPO}:environment:Production",
            "repo:${REPO}:environment:production",
            "${REPO_SUBJECT}:ref:refs/heads/master",
            "${REPO_SUBJECT}:ref:refs/tags/v*",
            "${REPO_SUBJECT}:environment:Production",
            "${REPO_SUBJECT}:environment:production"
          ]
        }
      }
    }
  ]
}
JSON

cat > "$TMP/permissions.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrAuth",
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Sid": "EcrPushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
        "ecr:DescribeImages"
      ],
      "Resource": "arn:aws:ecr:${REGION}:${ACCOUNT_ID}:repository/${ECR_REPO}"
    },
    {
      "Sid": "RunCommand",
      "Effect": "Allow",
      "Action": ["ssm:SendCommand"],
      "Resource": [
        "arn:aws:ec2:${REGION}:${ACCOUNT_ID}:instance/${INSTANCE_ID}",
        "arn:aws:ssm:${REGION}::document/AWS-RunShellScript"
      ]
    },
    {
      "Sid": "ReadCommandOutput",
      "Effect": "Allow",
      "Action": ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"],
      "Resource": "*"
    }
  ]
}
JSON

echo "== OIDC provider =="
if OUT=$(aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 2>&1); then
  echo "created"
elif grep -q "EntityAlreadyExists" <<<"$OUT"; then
  echo "already exists"
else
  echo "$OUT"
fi

echo "== role $ROLE =="
if ERR=$(aws iam create-role \
  --role-name "$ROLE" \
  --description "GitHub Actions: build/push image and deploy via SSM" \
  --assume-role-policy-document "file://$TMP/trust.json" 2>&1); then
  echo "created"
else
  if grep -q "EntityAlreadyExists" <<<"$ERR"; then
    echo "already exists, updating trust policy"
  else
    echo "$ERR"
  fi
  aws iam update-assume-role-policy \
    --role-name "$ROLE" \
    --policy-document "file://$TMP/trust.json"
  echo "trust policy updated"
fi

echo "== inline permissions =="
aws iam put-role-policy \
  --role-name "$ROLE" \
  --policy-name kjit-classroom-github-deploy \
  --policy-document "file://$TMP/permissions.json"

echo "== done =="
aws iam get-role --role-name "$ROLE" --query 'Role.Arn' --output text
