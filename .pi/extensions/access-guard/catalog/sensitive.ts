// The sensitive-files catalog: which files an agent may never read, write, edit,
// list, search, or reference from a shell command. Ported from the Claude Code
// `sensitive-files` hook's D2 table and extended where common practice had moved
// on (each addition is marked `+`). Data only; ../match compiles it.
//
// Two matcher kinds — see ./types.ts. Basenames catch a secret wherever it sits;
// fragments catch a credential store by its well-known home. The `env` category's
// guidance is computed at denial time from the template that exists on disk.

import type { SensitiveCategory } from "./types";

/**
 * The only escape hatch, and it exempts BASENAME rules only. A template name
 * still denies when it sits inside a cataloged directory (`~/.aws/.env.example`)
 * or when its real path is a live secret (a template-named symlink to a real
 * `.env`). No env-var bypass and no project allowlist file exist by design.
 */
export const TEMPLATE_ALLOWLIST: readonly string[] = [
  ".env.example",
  ".env.sample",
  ".env.template",
  ".env.dist",
  "example.env",
  "sample.env",
  "template.env",
];

export const SENSITIVE_CATALOG: readonly SensitiveCategory[] = [
  {
    id: "env",
    label: "Environment files",
    guidance: "", // computed: names the template that exists, else "ask the user"
    basenames: [".env", ".env.*", "*.env", ".envrc", ".flaskenv"],
    fragments: [],
  },
  {
    id: "ssh",
    label: "SSH & auth keys",
    guidance:
      "SSH/auth key: never read key material; ask the user to run the command that needs it.",
    basenames: [
      "id_rsa*",
      "id_dsa*",
      "id_ecdsa*",
      "id_ed25519*",
      "*.ppk",
      "ssh_host_*_key", // + host private keys under /etc/ssh
    ],
    fragments: ["/.ssh/"],
  },
  {
    id: "certs",
    label: "Certificates & private keys",
    guidance:
      "Certificate/private key: ask the user for the value or to run the tool that consumes it.",
    basenames: [
      "*.pem",
      "*.key",
      "*.p12",
      "*.pfx",
      "*.pkcs12", // + long-form PKCS#12
      "*.p8", // + Apple APNs / App Store Connect auth keys
      "*.jks",
      "*.keystore",
      "*.asc",
      "*.gpg",
      "*.pgp",
      "*.ovpn", // + OpenVPN profiles embed keys
    ],
    fragments: [
      "/.gnupg/",
      "/letsencrypt/live/",
      "/.config/sops/age/", // + sops age private keys
    ],
  },
  {
    id: "cloud",
    label: "Cloud provider credentials",
    guidance: "Cloud credential: use the provider CLI/SDK via the user; never read the raw file.",
    basenames: [
      "service-account*.json",
      "serviceaccount*.json",
      "serviceAccountKey.json",
      "client_secret*.json", // + Google OAuth client secrets
      "credentials.json", // + Google API / generic credential dumps
      "kubeconfig*", // + kubeconfigs outside ~/.kube
      ".boto", // + legacy GCS/AWS
      ".s3cfg", // + s3cmd
      ".dockercfg", // + legacy Docker
    ],
    fragments: [
      "/.aws/",
      "/.azure/",
      "/.config/gcloud/",
      "/.kube/",
      "/.docker/config.json",
      "/.config/containers/auth.json", // + podman / skopeo
      "/.oci/",
      "/.aliyun/",
      "/.config/doctl/",
      "/.fly/",
      "/.config/hcloud/", // + Hetzner
      "/.wrangler/config/", // + Cloudflare
      "/.mc/config.json", // + MinIO client
    ],
  },
  {
    id: "pkg",
    label: "Package-manager credentials",
    guidance: "Package-manager credential: ask the user to run the authenticated command.",
    basenames: [".npmrc", ".yarnrc", ".yarnrc.yml", ".pypirc", ".netrc", "_netrc"],
    fragments: [
      "/.gem/credentials",
      "/.cargo/credentials",
      "/.cargo/credentials.toml", // + current cargo name; the bare fragment misses it
      "/.m2/settings.xml",
      "/.gradle/gradle.properties",
      "/.composer/auth.json",
      "/.bundle/config",
      "/.config/pip/pip.conf",
      "/.nuget/nuget.config",
    ],
  },
  {
    id: "vcs",
    label: "VCS & tool credentials",
    guidance: "VCS/tool credential: ask the user to run the authenticated command.",
    basenames: [".git-credentials"],
    fragments: [
      "/.config/gh/hosts.yml",
      "/.config/glab-cli/",
      "/.config/hub", // + hub's OAuth token
      "/.svn/auth/",
    ],
  },
  {
    id: "cicd",
    label: "CI/CD & IaC secrets",
    guidance: "CI/CD or IaC secret: ask the user for the value; never read the secret/state file.",
    basenames: [
      ".vault-token",
      ".terraformrc",
      "terraform.rc",
      "*.tfstate",
      "*.tfstate.*",
      "*.tfvars",
      "*.tfvars.json",
      ".secrets",
      ".vault_pass*",
    ],
    fragments: [
      "/.circleci/cli.yml",
      "/.terraform.d/credentials.tfrc.json", // + Terraform Cloud token
      "/.pulumi/credentials.json", // + Pulumi
    ],
  },
  {
    id: "framework",
    label: "Framework & app secrets",
    guidance:
      "Framework/app secret: ask the user for the specific value; never read the secret file.",
    basenames: [
      "master.key",
      "credentials.yml.enc",
      "secrets.yml",
      "secrets.yaml",
      "secrets.json",
      "secrets.toml",
      "local_settings.py",
      ".htpasswd", // + Apache/nginx password file
      "wp-config.php", // + WordPress DB credentials
      "sftp-config.json", // + editor deploy configs carry passwords
      ".ftpconfig",
    ],
    fragments: [],
  },
  {
    id: "database",
    label: "Database credentials & data",
    guidance:
      "Database credential/data file: ask the user for connection details; never read the file.",
    basenames: [".pgpass", ".my.cnf", ".mylogin.cnf", "*.sqlite", "*.sqlite3", "*.db"],
    fragments: [],
  },
  {
    id: "history",
    label: "Shell & REPL history",
    guidance:
      "Shell/REPL history may hold secrets: ask the user for the specific command or value.",
    basenames: [
      ".bash_history",
      ".zsh_history",
      ".sh_history",
      "fish_history", // + fish
      ".psql_history",
      ".mysql_history",
      ".rediscli_history",
      ".sqlite_history",
      ".node_repl_history",
      ".python_history",
      ".irb_history", // + ruby
    ],
    fragments: [],
  },
  {
    id: "browser",
    label: "Browser & OS credential stores",
    guidance: "Browser/OS credential store: never read it; ask the user for the specific value.",
    basenames: [
      "logins.json",
      "key3.db",
      "key4.db",
      "*.kdb", // + KeePass 1.x
      "*.kdbx",
      "*.keychain",
      "*.keychain-db",
    ],
    fragments: [
      "/login data",
      "/cookies",
      "/etc/shadow",
      "/etc/gshadow",
      "/.local/share/keyrings/", // + GNOME keyring
      "/.password-store/", // + pass
      "/.config/op/", // + 1Password CLI
      "/.config/Bitwarden CLI/", // + Bitwarden CLI
    ],
  },
  {
    id: "kerberos",
    label: "Kerberos",
    guidance: "Kerberos credential: never read it; ask the user to run the authenticated command.",
    basenames: ["*.keytab", "krb5cc*"],
    fragments: [],
  },
  {
    id: "wallet",
    label: "Crypto wallets",
    guidance: "Crypto wallet: never read wallet material; ask the user.",
    basenames: ["wallet.dat", "*.wallet", "UTC--*"],
    fragments: [
      "/.ethereum/keystore/", // + geth keystore dir
      "/.config/solana/", // + solana-keygen default
    ],
  },
  {
    id: "ai",
    label: "AI-tool auth",
    guidance: "AI-tool auth file: never read it; ask the user for what you need.",
    basenames: [".claude.json"],
    fragments: [
      "/.claude/.credentials.json",
      "/.codex/auth.json",
      "/.pi/agent/auth.json", // + Pi's own API keys and OAuth tokens
      "/.gemini/oauth_creds.json", // + Gemini CLI
    ],
  },
];
