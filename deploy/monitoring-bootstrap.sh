#!/usr/bin/env bash
# One-time monitoring bootstrap for the KJIT Classroom instance.
#
# Run from a CloudShell session signed in as the account root (root is needed:
# the day-to-day admin user is denied IAM writes):
#
#   curl -fsSL https://raw.githubusercontent.com/Jeffin03/kjit-classroom/master/deploy/monitoring-bootstrap.sh \
#     | ALERT_EMAIL=you@example.com bash
#
# What it creates (all inside the AWS free tier at this scale):
#   * CloudWatchAgentServerPolicy on the instance role, so the agent can publish
#     memory / disk / swap metrics
#   * SNS topic + email subscription
#   * four alarms: CPU, memory, disk, EC2 status check
#   * one CloudWatch dashboard
#   * one monthly budget with 50% / 80% / forecast alerts
#
# It does not install the CloudWatch agent — that is done over SSH afterwards.
# Safe to re-run: every step is create-or-update.

set -uo pipefail

REGION="${AWS_REGION:-ap-south-1}"
ACCOUNT_ID="${ACCOUNT_ID:-290719180191}"
INSTANCE_ID="${INSTANCE_ID:-i-04fdf15567813a6a0}"
ROLE="${ROLE:-kjit-classroom-ec2}"
TOPIC="${TOPIC:-kjit-classroom-alerts}"
DASHBOARD="${DASHBOARD:-KJIT-Classroom}"
BUDGET="${BUDGET:-kjit-classroom-monthly}"
BUDGET_LIMIT="${BUDGET_LIMIT:-30}"
ALERT_EMAIL="${ALERT_EMAIL:?set ALERT_EMAIL, e.g. ALERT_EMAIL=you@example.com}"

export AWS_PAGER="" AWS_REGION="$REGION"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

say() { printf '\n== %s ==\n' "$*"; }

say "identity"
IDENTITY=$(aws sts get-caller-identity --query Arn --output text)
echo "$IDENTITY"
case "$IDENTITY" in
  *":root"|*":user/"*admin*) ;;
  *) echo "WARNING: this identity may lack IAM/billing permissions; continue at your own risk" ;;
esac

# --- 1. Let the instance publish custom metrics ------------------------------
say "CloudWatch agent permissions"
aws iam attach-role-policy --role-name "$ROLE" \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
echo "attached CloudWatchAgentServerPolicy to $ROLE"

# --- 2. SNS topic + email subscription --------------------------------------
say "SNS topic"
TOPIC_ARN=$(aws sns create-topic --name "$TOPIC" --query TopicArn --output text)
echo "$TOPIC_ARN"

if aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" \
     --query "Subscriptions[?Endpoint=='$ALERT_EMAIL'].SubscriptionArn" --output text \
     | grep -q .; then
  echo "subscription for $ALERT_EMAIL already exists"
else
  aws sns subscribe --topic-arn "$TOPIC_ARN" \
    --protocol email --notification-endpoint "$ALERT_EMAIL" \
    --query SubscriptionArn --output text
  echo "confirmation email sent to $ALERT_EMAIL — click the link in it"
fi

cat > "$TMP/topic-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAccountOwner",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::${ACCOUNT_ID}:root" },
      "Action": ["SNS:Publish", "SNS:GetTopicAttributes", "SNS:SetTopicAttributes",
                 "SNS:Subscribe", "SNS:ListSubscriptionsByTopic"],
      "Resource": "${TOPIC_ARN}"
    },
    {
      "Sid": "AllowCloudWatchAlarms",
      "Effect": "Allow",
      "Principal": { "Service": "cloudwatch.amazonaws.com" },
      "Action": "SNS:Publish",
      "Resource": "${TOPIC_ARN}"
    },
    {
      "Sid": "AllowBudgets",
      "Effect": "Allow",
      "Principal": { "Service": "budgets.amazonaws.com" },
      "Action": "SNS:Publish",
      "Resource": "${TOPIC_ARN}"
    }
  ]
}
JSON
aws sns set-topic-attributes --topic-arn "$TOPIC_ARN" \
  --attribute-name Policy --attribute-value "file://$TMP/topic-policy.json"
echo "topic policy set (CloudWatch + Budgets may publish)"

# --- 3. Alarms ---------------------------------------------------------------
say "alarms"

alarm() { # name description namespace metric json-dimensions operator threshold
  local name="$1" desc="$2" ns="$3" metric="$4" dims="$5" op="$6" threshold="$7"
  aws cloudwatch put-metric-alarm \
    --alarm-name "$name" --alarm-description "$desc" \
    --namespace "$ns" --metric-name "$metric" --dimensions "$dims" \
    --statistic Average --period 300 --evaluation-periods 2 \
    --threshold "$threshold" --comparison-operator "$op" \
    --treat-missing-data notBreaching \
    --alarm-actions "$TOPIC_ARN" --ok-actions "$TOPIC_ARN" >/dev/null
  echo "  $name"
}

# Dimensions are passed as JSON: the CLI shorthand cannot express two keys
# (Name=InstanceId,Name=path) in one --dimensions argument, and the value must be
# a *list* of {Name,Value} objects, not a map.
DIM_INSTANCE="[{\"Name\":\"InstanceId\",\"Value\":\"$INSTANCE_ID\"}]"
DIM_DISK="[{\"Name\":\"InstanceId\",\"Value\":\"$INSTANCE_ID\"},{\"Name\":\"path\",\"Value\":\"/\"}]"

alarm "kjit-classroom-cpu-high" "CPU above 80% for 10 minutes" \
  AWS/EC2 CPUUtilization "$DIM_INSTANCE" \
  GreaterThanThreshold 80

alarm "kjit-classroom-memory-high" "Memory above 85% for 10 minutes" \
  CWAgent mem_used_percent "$DIM_INSTANCE" \
  GreaterThanThreshold 85

alarm "kjit-classroom-disk-high" "Root filesystem above 85% for 10 minutes" \
  CWAgent disk_used_percent "$DIM_DISK" \
  GreaterThanThreshold 85

# Status checks are a 1/0 signal; 1 minute granularity for two periods.
aws cloudwatch put-metric-alarm \
  --alarm-name kjit-classroom-status-check \
  --alarm-description "EC2 status check failed for 2 minutes" \
  --namespace AWS/EC2 --metric-name StatusCheckFailed \
  --dimensions "$DIM_INSTANCE" \
  --statistic Maximum --period 60 --evaluation-periods 2 \
  --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$TOPIC_ARN" --ok-actions "$TOPIC_ARN" >/dev/null
echo "  kjit-classroom-status-check"

# --- 4. Dashboard ------------------------------------------------------------
say "dashboard"
cat > "$TMP/dashboard.json" <<JSON
{
  "widgets": [
    {
      "type": "metric", "x": 0, "y": 0, "width": 12, "height": 6,
      "properties": {
        "title": "CPU / memory / disk (%)",
        "region": "${REGION}",
        "view": "timeSeries", "stacked": false, "period": 300,
        "metrics": [
          ["AWS/EC2", "CPUUtilization", "InstanceId", "${INSTANCE_ID}"],
          ["CWAgent", "mem_used_percent", "InstanceId", "${INSTANCE_ID}"],
          ["CWAgent", "disk_used_percent", "InstanceId", "${INSTANCE_ID}", "path", "/"],
          ["CWAgent", "swap_used_percent", "InstanceId", "${INSTANCE_ID}"]
        ],
        "yAxis": { "left": { "min": 0, "max": 100 } }
      }
    },
    {
      "type": "metric", "x": 12, "y": 0, "width": 12, "height": 6,
      "properties": {
        "title": "Network + status checks",
        "region": "${REGION}",
        "view": "timeSeries", "stacked": false, "period": 300,
        "metrics": [
          ["AWS/EC2", "NetworkIn", "InstanceId", "${INSTANCE_ID}"],
          ["AWS/EC2", "NetworkOut", "InstanceId", "${INSTANCE_ID}"],
          ["AWS/EC2", "StatusCheckFailed", "InstanceId", "${INSTANCE_ID}"]
        ]
      }
    },
    {
      "type": "metric", "x": 0, "y": 6, "width": 12, "height": 6,
      "properties": {
        "title": "DynamoDB throttles / errors",
        "region": "${REGION}",
        "view": "timeSeries", "stacked": false, "period": 300,
        "metrics": [
          ["AWS/DynamoDB", "ThrottledRequests", "TableName", "kjit-classroom"],
          ["AWS/DynamoDB", "UserErrors", "TableName", "kjit-classroom"]
        ]
      }
    },
    {
      "type": "metric", "x": 12, "y": 6, "width": 12, "height": 6,
      "properties": {
        "title": "EC2 status checks (detail)",
        "region": "${REGION}",
        "view": "timeSeries", "stacked": false, "period": 300,
        "metrics": [
          ["AWS/EC2", "StatusCheckFailed_Instance", "InstanceId", "${INSTANCE_ID}"],
          ["AWS/EC2", "StatusCheckFailed_System", "InstanceId", "${INSTANCE_ID}"]
        ]
      }
    }
  ]
}
JSON
aws cloudwatch put-dashboard --dashboard-name "$DASHBOARD" \
  --dashboard-body "file://$TMP/dashboard.json" >/dev/null
echo "  $DASHBOARD"

# --- 5. Budget ---------------------------------------------------------------
say "budget (\$$BUDGET_LIMIT/month)"
cat > "$TMP/budget.json" <<JSON
{
  "BudgetName": "${BUDGET}",
  "BudgetLimit": { "Amount": "${BUDGET_LIMIT}", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
JSON
cat > "$TMP/notifications.json" <<JSON
[
  { "Notification": { "NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN",
                      "Threshold": 50, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [ { "SubscriptionType": "SNS", "Address": "${TOPIC_ARN}" } ] },
  { "Notification": { "NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN",
                      "Threshold": 80, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [ { "SubscriptionType": "SNS", "Address": "${TOPIC_ARN}" } ] },
  { "Notification": { "NotificationType": "FORECASTED", "ComparisonOperator": "GREATER_THAN",
                      "Threshold": 100, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [ { "SubscriptionType": "SNS", "Address": "${TOPIC_ARN}" } ] }
]
JSON
if aws budgets describe-budget --account-id "$ACCOUNT_ID" --budget-name "$BUDGET" >/dev/null 2>&1; then
  aws budgets update-budget --account-id "$ACCOUNT_ID" --new-budget "file://$TMP/budget.json"
  # Replace notifications wholesale (create-budget is the only API that sets them).
  aws budgets create-budget --account-id "$ACCOUNT_ID" \
    --budget "file://$TMP/budget.json" \
    --notifications-with-subscribers "file://$TMP/notifications.json" >/dev/null 2>&1 || true
  echo "  updated $BUDGET"
else
  aws budgets create-budget --account-id "$ACCOUNT_ID" \
    --budget "file://$TMP/budget.json" \
    --notifications-with-subscribers "file://$TMP/notifications.json" >/dev/null
  echo "  created $BUDGET"
fi

# --- 6. Cost snapshot --------------------------------------------------------
say "cost snapshot (month to date)"
START=$(date -u +%Y-%m-01)
END=$(date -u -d '+1 day' +%Y-%m-%d)
# Grouping by RECORD_TYPE separates gross usage from the credit line items;
# the ungrouped total nets to ~0 while credits are covering everything.
if OUT=$(aws ce get-cost-and-usage --time-period "Start=$START,End=$END" \
      --granularity MONTHLY --metrics UnblendedCost \
      --group-by Type=DIMENSION,Key=RECORD_TYPE \
      --query 'ResultsByTime[0].Groups[].[Keys[0],Metrics.UnblendedCost.Amount]' \
      --output text 2>/dev/null); then
  echo "$OUT" | while read -r kind amount; do
    [ -n "${amount:-}" ] || continue
    case "$kind" in
      Usage)  printf '  gross usage   $%.2f\n' "$(echo "$amount" | tr -d '-')" ;;
      Credit) printf '  credits used  $%.2f\n' "$(echo "$amount" | tr -d '-')" ;;
      Tax)    printf '  tax           $%.2f\n' "$amount" ;;
      *)      printf '  %-13s $%.2f\n' "$kind" "$amount" ;;
    esac
  done
else
  echo "  Cost Explorer returned an error (it may still be activating)."
fi
echo "  Remaining credit balance has no API — see Billing -> Credits."

say "done"
cat <<EOF
Topic:      $TOPIC_ARN
Dashboard:  https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${DASHBOARD}
Alarms:     https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#alarmsV2:
Budget:     https://console.aws.amazon.com/billing/home#/budgets

Next:
  1. Click the confirmation link AWS emailed to ${ALERT_EMAIL}.
  2. The CloudWatch agent still has to be installed on the instance.
EOF
