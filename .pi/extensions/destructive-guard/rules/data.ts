// Data and infrastructure destruction: containers, databases, clusters,
// cloud resources. All ask — the agent cannot tell a scratch database from
// production, and none of it comes back.

import type { Rule } from "../types";
import { needsVerb, OB, re, RUNNERS, SEG, verb } from "./_shared";

const SQL_DESTROY =
  "\\b(?:DROP\\s+(?:DATABASE|SCHEMA|TABLE|INDEX|USER|ROLE|COLLECTION)|TRUNCATE(?:\\s+TABLE)?|DELETE\\s+FROM\\s+\\w+\\s*(?:;|$|\\)))";

export const DATA_RULES: Rule[] = [
  // --- Containers ---
  {
    id: "docker-prune",
    family: "data",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:docker|podman|nerdctl)")}${SEG}\\b(?:system\\s+prune|volume\\s+(?:prune|rm)|image\\s+prune${SEG}${OB}-[a-zA-Z]*a|rmi\\b${SEG}${OB}-[a-zA-Z]*f|container\\s+prune|builder\\s+prune${SEG}${OB}-[a-zA-Z]*a|network\\s+prune)\\b` +
        `|${verb("(?:docker|podman)")}${SEG}\\brm\\b${SEG}${OB}-[a-zA-Z]*[fv]` +
        `|${verb("(?:docker-compose|docker)")}${SEG}\\b(?:compose\\s+)?down\\b${SEG}(?:${OB}-v\\b|--volumes\\b|--rmi\\b))`,
    ),
    title: "docker prune / volume rm / down -v",
    why: "volumes hold databases and state that no image rebuild brings back; prune -a removes every image not in use.",
    fix: "Name the container or volume you mean; approve only if the data in it is disposable.",
    refine: needsVerb(/^(?:docker|podman|nerdctl|docker-compose)$/),
  },
  // --- Databases ---
  {
    id: "database-destroy",
    family: "data",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:psql|mysql|mariadb|sqlite3?|clickhouse-client|cockroach|duckdb|sqlcmd)")}${SEG}${SQL_DESTROY}` +
        `|${verb("(?:dropdb|mysqladmin)")}${SEG}\\b(?:drop\\b|\\w+)` +
        `|${verb("redis-cli")}${SEG}\\b(?:FLUSHALL|FLUSHDB)\\b` +
        `|${verb("(?:mongo|mongosh)")}${SEG}\\b(?:dropDatabase|drop)\\(` +
        `|${verb("(?:prisma|drizzle-kit|sequelize|typeorm|alembic|rails|php artisan|npx prisma)")}${SEG}\\b(?:migrate\\s+reset|db\\s+(?:drop|reset|push${SEG}--force-reset)|schema:drop|downgrade\\s+base|migrate:fresh|db:drop)\\b` +
        `|${SQL_DESTROY}${SEG}(?:<<|\\|\\s*(?:psql|mysql|sqlite3)))`,
    ),
    title: "DROP / TRUNCATE / FLUSHALL / migrate reset",
    why: "a dropped database, table, or key space is gone; the agent cannot tell a scratch instance from the one that matters.",
    fix: "Take a dump first (pg_dump, mysqldump, redis SAVE); approve only if the data is disposable.",
  },
  // --- Clusters ---
  {
    id: "kubernetes-delete",
    family: "cloud",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:kubectl|oc|k)")}${SEG}\\b(?:delete|drain|cordon|taint)\\b|${verb("helm")}${SEG}\\b(?:uninstall|delete|rollback)\\b` +
        `|${verb("(?:kind|minikube|k3d)")}${SEG}\\b(?:delete|destroy)\\b)`,
    ),
    title: "kubectl delete / helm uninstall / node drain",
    why: "a deleted namespace, deployment, or PVC takes its workloads and data with it, cluster-wide.",
    fix: "Dry-run first (kubectl delete --dry-run=client); approve only for a cluster you own.",
    refine: needsVerb(/^(?:kubectl|oc|k|helm|kind|minikube|k3d)$/),
  },
  // --- Infrastructure as code ---
  {
    id: "iac-destroy",
    family: "cloud",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:terraform|tofu|terragrunt)")}${SEG}\\b(?:destroy|apply${SEG}(?:-auto-approve|--auto-approve)|state\\s+(?:rm|mv|push)|force-unlock|taint|import)\\b` +
        `|${verb("pulumi")}${SEG}\\b(?:destroy|up${SEG}(?:--yes|-y\\b)|stack\\s+rm|state\\s+delete)` +
        `|${verb("cdk")}${SEG}\\b(?:destroy|deploy${SEG}--require-approval\\s+never)\\b` +
        `|${verb("(?:ansible|ansible-playbook)")}${SEG}\\b(?:state=absent|--tags\\s+\\S*(?:destroy|remove|purge))` +
        `|${verb("(?:vagrant|multipass|lima|limactl)")}${SEG}\\b(?:destroy|delete)\\b)`,
    ),
    title: "terraform destroy / apply -auto-approve / state rm",
    why: "infrastructure changes reach real cloud resources; destroy removes them and -auto-approve skips the only review step.",
    fix: "Run plan first and read it; approve only for the environment the user named.",
    refine: needsVerb(
      new RegExp(
        `^(?:terraform|tofu|terragrunt|pulumi|cdk|ansible|ansible-playbook|vagrant|multipass|lima|limactl|${RUNNERS})$`,
      ),
    ),
  },
  // --- Cloud CLIs ---
  {
    id: "cloud-delete",
    family: "cloud",
    tier: "ask",
    pattern: re(
      `(?:${verb("aws")}${SEG}\\b(?:s3\\s+(?:rb|rm\\b${SEG}--recursive)|s3api\\s+delete-(?:bucket|object)s?|ec2\\s+terminate-instances|rds\\s+delete-db-(?:instance|cluster)` +
        "|cloudformation\\s+delete-stack|dynamodb\\s+delete-table|lambda\\s+delete-function|iam\\s+delete-|eks\\s+delete-|ecr\\s+(?:batch-)?delete-|kms\\s+schedule-key-deletion|route53\\s+delete-|ecs\\s+delete-|elasticache\\s+delete-)" +
        `|${verb("gcloud")}${SEG}\\b(?:delete|destroy)\\b|${verb("gsutil")}${SEG}\\b(?:rm\\b${SEG}${OB}-[a-zA-Z]*r|rb)\\b` +
        `|${verb("az")}${SEG}\\b(?:delete|purge)\\b|${verb("(?:doctl|linode-cli|hcloud|flyctl|fly)")}${SEG}\\b(?:delete|destroy|rm)\\b` +
        `|${verb("(?:vercel|netlify|heroku|railway)")}${SEG}\\b(?:remove|rm|destroy|delete|apps:destroy)\\b` +
        `|${verb("(?:gh)")}${SEG}\\brepo\\s+delete\\b|${verb("(?:supabase|neonctl|planetscale|pscale)")}${SEG}\\b(?:delete|reset|db\\s+reset|branch\\s+delete)\\b)`,
    ),
    title: "deleting a cloud resource",
    why: "buckets, instances, databases, stacks, and repos on a provider are shared state; deletion is billed, logged, and final.",
    fix: "Approve only for a resource the user named and confirmed disposable.",
    refine: needsVerb(
      new RegExp(
        `^(?:aws|gcloud|gsutil|az|doctl|linode-cli|hcloud|flyctl|fly|vercel|netlify|heroku|railway|gh|supabase|neonctl|planetscale|pscale|${RUNNERS})$`,
      ),
    ),
  },
];
