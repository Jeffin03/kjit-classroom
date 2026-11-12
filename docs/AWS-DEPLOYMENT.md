# Deploying KJIT Classroom to AWS (single instance, `ap-south-1`)

This is the production deployment we settled on: the Next.js app runs as a
Docker container on one EC2 instance, Caddy terminates TLS, and DynamoDB stores
the data. No ALB, no NAT gateway, no Route 53, no custom domain yet.

Estimated cost: **~₹1,800–1,900 / month (~$21)** — see [Cost](#cost).

---

## 1. How it works

```
                 <elastic-ip>.sslip.io  (public DNS, free, no setup)
                              │
                    ┌─────────▼──────────┐
                    │  EC2 t4g.small     │  ap-south-1
                    │  Ubuntu 24.04 ARM  │
                    │                    │
                    │  ┌──────────────┐  │
              :443  │  │    Caddy     │  │  Let's Encrypt TLS (auto)
              :80   │  │  reverse     │  │
                    │  │  proxy       │  │
                    │  └──────┬───────┘  │
                    │         │ :3000    │
                    │  ┌──────▼───────┐  │
                    │  │  Next.js     │  │  node server.js (standalone)
                    │  │  container   │  │
                    │  └──────┬───────┘  │
                    └─────────┼──────────┘
                              │ IAM instance role (no static keys)
                ┌─────────────┼──────────────┐
                ▼             ▼              ▼
           DynamoDB      SSM Parameter   CloudWatch
        (single table)    Store (secrets)   logs
```

**What happens on a request**

1. Browser hits `https://<elastic-ip>.sslip.io`.
2. `sslip.io` resolves the embedded IP — no DNS record to manage.
3. Caddy presents its Let's Encrypt certificate and proxies to `app:3000`.
4. Next.js reads the session cookie (`proxy.ts` for gated routes), then the
   route handler calls `authorize()` → `resolveAccess()`.
5. `resolveAccess()` pulls a fresh store snapshot from DynamoDB
   (`ensureFresh()`), then resolves the role from GitHub org/team membership
   plus roster/teacher records.
6. Reads are served from the in-memory store; mutations mark entities dirty and
   flush to DynamoDB after the response (`after()`).
7. Secrets arrive as environment variables from `secrets.env`, generated from
   SSM at deploy time. AWS credentials come from the instance role.

**Why no ALB / NAT / Route 53**

- The instance's Elastic IP is the single entry point; Caddy handles TLS.
- The instance lives in a public subnet with a public IP, so outbound calls to
  `api.github.com` need no NAT gateway.
- `sslip.io` replaces DNS. When you go official, buy a ~$10/yr domain and point
  an A record at the Elastic IP — still no Route 53.

---

## 2. Prerequisites

- AWS CLI v2 configured with an admin-ish profile (`aws sts get-caller-identity`).
- Docker with `buildx` locally (for the arm64 image).
- An SSH key pair for EC2.
- Your GitHub App is already created (you have `AUTH_GITHUB_ID`,
  `AUTH_GITHUB_SECRET`, and the `GITHUB_APP_*` values).

Set these shell variables for the commands below:

```bash
export AWS_REGION=ap-south-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

---

## 3. Create the DynamoDB table

```bash
aws dynamodb create-table \
  --table-name kjit-classroom \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION"

# Point-in-time recovery (cheap at this size, worth having).
aws dynamodb update-continuous-backups \
  --table-name kjit-classroom \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region "$AWS_REGION"
```

> On-demand is effectively free at your volume and avoids throttling. If you
> want to stay strictly inside the always-free tier, use provisioned 25/25
> instead (`--provisioned-throughput ReadCapacityUnits=25,WriteCapacityUnits=25`).

---

## 4. Create the IAM role and instance profile

Save this as `instance-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:*:table/kjit-classroom"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:ap-south-1:*:parameter/kjit-classroom/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

Save this as `ec2-trust.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create them:

```bash
aws iam create-policy \
  --policy-name kjit-classroom-instance \
  --policy-document file://instance-policy.json

aws iam create-role \
  --role-name kjit-classroom-ec2 \
  --assume-role-policy-document file://ec2-trust.json

aws iam attach-role-policy \
  --role-name kjit-classroom-ec2 \
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/kjit-classroom-instance"

aws iam create-instance-profile --instance-profile-name kjit-classroom-ec2
aws iam add-role-to-instance-profile \
  --instance-profile-name kjit-classroom-ec2 \
  --role-name kjit-classroom-ec2

# Push rights, used when the host builds and pushes images itself. Pull rights
# are already covered by the inline policy above.
aws iam attach-role-policy \
  --role-name kjit-classroom-ec2 \
  --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
```

---

## 5. Create the ECR repository and push the image

```bash
aws ecr create-repository \
  --repository-name kjit-classroom \
  --region "$AWS_REGION"

# Keep the 10 most recent images; expire untagged build attestations.
aws ecr put-lifecycle-policy \
  --repository-name kjit-classroom \
  --region "$AWS_REGION" \
  --lifecycle-policy-text file://deploy/ecr-lifecycle.json

aws ecr put-image-scanning-configuration \
  --repository-name kjit-classroom \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true
```

Build and push **on the instance** (arm64 native — no buildx/QEMU needed). This
is the fallback path: production images are normally built and pushed by
`.github/workflows/release.yml` (see [section 11](#11-continuous-deployment-github-actions)).
The instance role carries `AmazonEC2ContainerRegistryPowerUser` so an on-box
build can still push:

```bash
cd /opt/kjit-classroom/src
REG="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SHA=$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d-%H%M)

docker compose -f deploy/docker-compose.yml build app
docker tag kjit-classroom:local "$REG/kjit-classroom:latest"
docker tag kjit-classroom:local "$REG/kjit-classroom:$SHA"
docker push "$REG/kjit-classroom:latest"
docker push "$REG/kjit-classroom:$SHA"
```

> The instance is arm64 (`t4g`), so the image must be `linux/arm64`. Building on
> the instance avoids emulation entirely. If you build elsewhere, use
> `docker buildx build --platform linux/arm64 --push`; on x86 hosts that runs
> under QEMU and is noticeably slower.
>
> `npm ci --ignore-scripts` in the Dockerfile is deliberate: `phantomjs-prebuilt`
> (a docs-only dev dependency) has no arm64 binary and its install hook fails.

---

## 6. Launch the EC2 instance

Find the current Ubuntu 24.04 arm64 AMI:

```bash
AMI_ID=$(aws ssm get-parameter \
  --name /aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id \
  --region "$AWS_REGION" --query Parameter.Value --output text)
```

Create a security group (SSH only from your IP):

```bash
SG_ID=$(aws ec2 create-security-group \
  --group-name kjit-classroom \
  --description "KJIT Classroom app" \
  --region "$AWS_REGION" \
  --query GroupId --output text)

MY_IP=$(curl -s https://checkip.amazonaws.com)

aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 22 --cidr "${MY_IP}/32" --region "$AWS_REGION"
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$AWS_REGION"
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$AWS_REGION"
```

Launch:

```bash
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t4g.small \
  --key-name <YOUR_KEY_PAIR> \
  --security-group-ids "$SG_ID" \
  --iam-instance-profile Name=kjit-classroom-ec2 \
  --user-data file://deploy/cloud-init.yaml \
  --region "$AWS_REGION" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kjit-classroom}]' \
  --query 'Instances[0].InstanceId' --output text)
```

Allocate and attach a stable Elastic IP:

```bash
ALLOC=$(aws ec2 allocate-address --domain vpc --region "$AWS_REGION" \
  --query AllocationId --output text)
aws ec2 associate-address --instance-id "$INSTANCE_ID" \
  --allocation-id "$ALLOC" --region "$AWS_REGION"

EIP=$(aws ec2 describe-addresses --allocation-ids "$ALLOC" \
  --region "$AWS_REGION" --query 'Addresses[0].PublicIp' --output text)
echo "Elastic IP: $EIP"
```

Your hostname is the IP with dots replaced by dashes, plus `.sslip.io`:

```bash
APP_HOST=$(echo "$EIP" | tr '.' '-').sslip.io
echo "APP_HOST=$APP_HOST"     # e.g. 13-234-56-78.sslip.io
```

---

## 7. Store secrets in SSM

```bash
P=/kjit-classroom/prod

put() {  # put NAME VALUE [type]
  aws ssm put-parameter --region "$AWS_REGION" \
    --name "$P/$1" --value "$2" --type "${3:-SecureString}" --overwrite >/dev/null
}

put AUTH_SECRET "$(openssl rand -base64 48)"
put AUTH_GITHUB_ID '<github app client id>'
put AUTH_GITHUB_SECRET '<github app client secret>'
put AUTH_URL 'https://<APP_HOST>' String       # exact origin, no trailing slash
put AUTH_TRUST_HOST 'true' String
put GITHUB_ORG '<org login>'
put GITHUB_FACULTY_TEAM '<faculty team slug>' String   # optional
put GITHUB_APP_ID '<app id>'
put GITHUB_APP_INSTALLATION_ID '<installation id>'
put DYNAMODB_TABLE 'kjit-classroom' String
put AWS_REGION "$AWS_REGION" String
put AWS_INSTANCE_ROLE 'true' String
put SEED_DUMMY_DATA 'false' String
```

`AWS_INSTANCE_ROLE=true` tells the app to take DynamoDB credentials from the
instance profile instead of static keys, so no `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` parameters are stored.

The GitHub App private key must be **one line with literal `\n`**. From the
`.pem` file on your machine:

```bash
awk 'NF {sub(/\r/,""); printf "%s\\n",$0}' github-app.pem > github-app.oneline
put GITHUB_APP_PRIVATE_KEY "file://github-app.oneline"
rm github-app.oneline
```

> The app calls `.replace(/\\n/g, "\n")` on `GITHUB_APP_PRIVATE_KEY`, so the
> single-line form is correct. Do **not** set `GITHUB_APP_PRIVATE_KEY_PATH` on
> the server — the file will not exist in the container.
>
> If you prefer a PAT over the GitHub App credentials, store
> `GITHUB_ORG_TOKEN` instead of the `GITHUB_APP_*` trio.

---

## 8. Configure GitHub

In the GitHub App settings:

- **Callback URL**: `https://<APP_HOST>/api/auth/callback/github`
- **Homepage URL**: `https://<APP_HOST>`

`AUTH_URL` must be exactly `https://<APP_HOST>` (no trailing slash). This is
what makes Auth.js issue secure cookies and build correct callback URLs.

---

## 9. Deploy on the host

```bash
ssh ubuntu@<EIP>
```

(Reconnect if `docker` says permission denied — the instance profile add of the
`docker` group needs a fresh login.)

Put the deployment config on the instance. The box is **not a git checkout** —
`/opt/kjit-classroom/src` is a plain copy (no `.git`), and only `deploy/`
matters at runtime: the application code arrives inside the container image.
Copy the deploy directory from your machine:

```bash
mkdir -p /opt/kjit-classroom/src
rsync -av --delete \
  --exclude '.env' --exclude 'secrets.env' \
  deploy/ ubuntu@<EIP>:/opt/kjit-classroom/src/deploy/
```

`.env` and `secrets.env` are created on the host in the next step and must never
be overwritten from your machine. If you prefer a full checkout (handy for
on-box builds), clone once and remember that the pipeline still only updates the
image and `deploy/.env` — a stale checkout is normal and harmless.

Configure and start:

```bash
cd /opt/kjit-classroom/src/deploy

cp env.example .env
# edit .env:
#   APP_HOST=<APP_HOST>
#   ACME_EMAIL=<your email>
#   APP_IMAGE=<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/kjit-classroom:latest
nano .env

bash render-secrets.sh secrets.env
docker compose pull app
docker compose up -d --no-build
```

Watch it come up:

```bash
docker compose logs -f app caddy
```

Caddy requests the Let's Encrypt certificate on first request. Verify:

```bash
curl -sS "https://<APP_HOST>/api/health" | jq
# expect { "ok": true, "checks": [ ... ] }
```

Then open `https://<APP_HOST>` and sign in with GitHub.

---

## 10. Day-to-day operations

**Logs**

```bash
cd /opt/kjit-classroom/src/deploy
docker compose logs -f app
docker compose logs -f caddy
```

**Build and push a new image** (fallback only — CI normally builds; the box has
2 GB RAM and swapping during a build is slow):

```bash
cd /opt/kjit-classroom/src
REG="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SHA=$(date +%Y%m%d-%H%M)

docker compose -f deploy/docker-compose.yml build app
docker tag kjit-classroom:local "$REG/kjit-classroom:latest"
docker tag kjit-classroom:local "$REG/kjit-classroom:$SHA"
docker push "$REG/kjit-classroom:latest"
docker push "$REG/kjit-classroom:$SHA"
```

**Deploy a new version**

```bash
cd /opt/kjit-classroom/src/deploy
docker compose pull app
docker compose up -d --no-build app
```

The host pulls from ECR through the ECR credential helper, so pulls keep working
across reboots without a manual login (the helper mints credentials from the
instance role):

```bash
sudo apt-get install -y amazon-ecr-credential-helper
cat > ~/.docker/config.json <<'JSON'
{
  "credHelpers": {
    "<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com": "ecr-login"
  }
}
JSON
```

The SSM agent runs deploys as **root**, so the helper must be configured for
root too, otherwise `docker compose pull` fails with
`no basic auth credentials`:

```bash
sudo mkdir -p /root/.docker
sudo tee /root/.docker/config.json >/dev/null <<'JSON'
{
  "credHelpers": {
    "<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com": "ecr-login"
  }
}
JSON
```

> Scoping the helper to the ECR host keeps Docker Hub pulls anonymous; setting a
> global `credsStore` would make the helper answer for every registry.

**Change deploy config (compose file, Caddyfile, extra files)**

The release pipeline only rewrites `APP_IMAGE` in `deploy/.env` and restarts the
`app` service. It does **not** sync anything else, so changes under `deploy/`
have to be copied by hand:

```bash
rsync -av --exclude '.env' --exclude 'secrets.env' \
  deploy/ ubuntu@<EIP>:/opt/kjit-classroom/src/deploy/

ssh ubuntu@<EIP> 'cd /opt/kjit-classroom/src/deploy && \
  docker compose up -d && docker compose restart caddy'
```

`docker compose up -d` recreates containers whose config changed (an image-only
change is a no-op); `caddy` needs an explicit restart to re-read a mounted
`Caddyfile`.

**Restart**

```bash
docker compose restart app
```

**Backups**

- DynamoDB PITR is enabled (restore to any point in the last 35 days).
- EBS snapshots are optional — the instance holds no durable data (all state is
  in DynamoDB), so a snapshot is only useful for a faster rebuild.
- Keep the repo + SSM parameters as the source of truth.

**OS updates**

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot   # Docker restarts the containers automatically
```

---

## 11. Continuous deployment (GitHub Actions)

The pipeline assumes a short-lived AWS role via GitHub's OIDC provider — there
are no AWS keys in GitHub. Bootstrap the two IAM resources once, from a
principal with IAM write access (CloudShell is easiest):

```bash
bash deploy/github-oidc-bootstrap.sh
```

That creates the OIDC provider, the `kjit-classroom-github-deploy` role, and an
inline policy limited to ECR push/pull plus `ssm:SendCommand` on this instance.
The role is assumable only by this repo's `master` branch, `v*` tags, and the
`Production` environment.

> Repos created after July 2025 issue **immutable** OIDC subjects that embed the
> numeric owner/repo IDs:
> `repo:<owner>@<owner-id>/<repo>@<repo-id>:ref:refs/heads/master`.
> The classic `repo:<owner>/<repo>:...` form never matches for these repos, and
> the failure surfaces as the unhelpful
> `Not authorized to perform sts:AssumeRoleWithWebIdentity`.
> Check the prefix with
> `gh api repos/<owner>/<repo>/actions/oidc/customization/sub`.

Then `.github/workflows/release.yml` does:

| Trigger | Result |
| --- | --- |
| PR | `ci.yml`: typecheck, lint, tests, build. No AWS access. |
| push to `master` | Builds `linux/arm64` on `ubuntu-24.04-arm` and pushes `:sha-<7>`. No deploy. |
| tag `v*` | Builds and pushes `:vX.Y.Z` and `:latest`, then deploys over SSM and verifies `/api/health`. |
| manual dispatch | Re-deploys an existing tag (rollback). |

Cut a release:

```bash
git tag v0.2.0
git push origin v0.2.0
```

Roll back to a previous image without rebuilding:

```bash
gh workflow run release.yml -f tag=v0.1.0
```

The deploy step rewrites `APP_IMAGE` in `deploy/.env` to the exact tag (not
`:latest`), so the host is pinned to a known artifact and a later restart cannot
silently pick up something newer. That is the **only** host-side change: the
pipeline never copies code or config to the box — see
[Change deploy config](#change-deploy-config-compose-file-caddyfile-extra-files).

**Deploy approval gate:** create the `Production` environment with required
reviewers and the deploy job waits for approval. Without reviewers it runs
immediately:

```bash
gh api --method PUT repos/Jeffin03/kjit-classroom/environments/Production \
  -f 'reviewers[][type]=User' -F 'reviewers[][id]=<your-github-user-id>'
```

The instance needs `AmazonSSMManagedInstanceCore` for RunCommand (already
attached). No SSH key or inbound port is used by the pipeline.

---

## 12. Monitoring and cost

Everything here is inside the AWS free tier at this scale (10 custom metrics,
10 alarms, 3 dashboards, 1,000 SNS emails, 2 budgets).

**Bootstrap (once, from root CloudShell)** — idempotent, re-run it any time:

```bash
curl -fsSL https://raw.githubusercontent.com/Jeffin03/kjit-classroom/master/deploy/monitoring-bootstrap.sh \
  | ALERT_EMAIL=25mcab24@kristujayanti.com bash
```

It grants the instance role `CloudWatchAgentServerPolicy`, creates the
`kjit-classroom-alerts` topic + email subscription, four alarms, the
`KJIT-Classroom` dashboard, and the `kjit-classroom-monthly` budget. Alerts
only arrive after the recipient clicks the SNS confirmation email.

It has to run as root: the instance role may publish metrics and edit
dashboards, but `cloudwatch:PutMetricAlarm` and all billing APIs are reserved
for the account root / admins.

**The agent** (`deploy/cloudwatch-agent.json`) publishes `mem_used_percent`,
`disk_used_percent` for `/`, and `swap_used_percent` into the `CWAgent`
namespace, tagged with `InstanceId`. Installing or changing it is a manual host
step (the pipeline only ships images):

```bash
scp -i ~/.ssh/kjit-classroom.pem deploy/cloudwatch-agent.json ubuntu@<EIP>:/tmp/
ssh ubuntu@<EIP> 'sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c file:/tmp/cloudwatch-agent.json'
```

On a fresh instance the agent itself has to be installed first:

```bash
curl -fsSL -o /tmp/cwagent.deb \
  https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/arm64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E /tmp/cwagent.deb
```

> Alarm dimensions are passed as JSON in the bootstrap script. The AWS CLI's
> `Name=k,Value=v` shorthand cannot express two keys (`InstanceId` + `path`) and
> fails with `ParamValidation: Second instance of key "Name"`.

**Alarms** (5-minute periods, two consecutive breaches, notify on ALARM and OK):
CPU > 80%, memory > 85%, root disk > 85%, and `StatusCheckFailed` for 2 minutes.

**Cost and credits.** The budget alerts at 50% and 80% of $30 actual spend, plus
a 100% forecast alert. Month-to-date figures from the script group by
`RECORD_TYPE`, because with credits applied the ungrouped total nets to ~$0 —
`Usage` is gross spend and `Credit` is how much credit has been consumed. The
**remaining** credit balance is not exposed by any API; only the Billing console
→ *Credits* page shows it.

Permissions note: the instance role may publish and describe alarms, but the
AWS-managed `CloudWatchReadOnlyAccess` policy does **not** grant
`ListMetrics` / `GetMetricStatistics` / `GetMetricData`, so the box cannot read
metric values. Check the console dashboard or add an explicit policy if that is
needed.

---

## 13. Troubleshooting

| Symptom | Check |
| --- | --- |
| `502` from Caddy | `docker compose logs app`; hit `/api/health`; the container may be unhealthy |
| `ssh: connect ... timed out` | The port-22 rule is pinned to your public IP; update it to `$(curl -fsS https://checkip.amazonaws.com)/32` |
| `Could not assume role with OIDC` | Trust policy must accept the repo's immutable subject (`repo:owner@id/repo@id:...`); re-run `deploy/github-oidc-bootstrap.sh` |
| `no basic auth credentials` on pull | The user running `docker compose` lacks the ECR helper — SSM deploys run as `root`, so `/root/.docker/config.json` must exist |
| Deploy says success but old version serves | `grep '^APP_IMAGE=' deploy/.env` on the host; if it is stale, the SSM step failed before the `sed` |
| `dash: Syntax error` in an SSM deploy | RunCommand uses `dash`; avoid `set -o pipefail` and bash-only syntax |
| Certificate not issued | `dig +short <APP_HOST>` returns the EIP; ports 80/443 open; `docker compose logs caddy` |
| Login loops / callback error | `AUTH_URL` and the GitHub callback must both be `https://<APP_HOST>` |
| `/api/health` says `AWS credentials` missing | Instance profile attached? `AWS_INSTANCE_ROLE=true` in secrets? |
| `DynamoDB` access denied | Role policy ARN/region; table must be in `ap-south-1` |
| Container unhealthy at boot | Missing env: `docker compose exec app env`, then `curl localhost:3000/api/health` |
| Build OOM on the host | Build/push from your machine or CI instead (step 5) |

---

## Cost

Approximate `ap-south-1` list prices:

| Line | Monthly |
| --- | --- |
| EC2 `t4g.small` | ~$14 |
| EBS `gp3` 20 GB | ~$1.80 |
| Elastic IP | ~$3.65 |
| DynamoDB (on-demand, this volume) | ~$0 |
| SSM Parameter Store | $0 |
| CloudWatch (logs; metrics/alarms are free tier) | ~$1.20 |
| Data transfer | ~$1 |
| **Total** | **≈ $21/month** |

`t4g.micro` brings it to ~$15/month; Lightsail 2 GB is a flat $12.

---

## 14. When you outgrow this

- **Custom domain**: buy ~$10/yr at Cloudflare/Namecheap, add an A record to
  the Elastic IP, then update `APP_HOST`, `AUTH_URL`, and the GitHub callback.
  Caddy reissues the certificate automatically. Route 53 is still unnecessary.
- **High availability**: the same image, DynamoDB table, and SSM parameters
  move to ECS Fargate + ALB. The app's persistence layer already supports
  multiple instances (`ensureFresh` / `mutated`), so no code change is required.
