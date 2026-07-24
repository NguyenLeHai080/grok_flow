# CI/CD and Deployment

## Parallel pipeline architecture

Every pull request to `dev`, `staging`, or `prod` starts five independent workflows at the same time. Each workflow can be inspected and rerun without restarting unrelated checks.

| Workflow | Required check | Additional parallel checks |
| --- | --- | --- |
| `governance.yml` | `Commit policy` | Pull request size |
| `backend.yml` | `Backend tests` | Python 3.12/3.13 matrix, migrations, compile check |
| `frontend.yml` | `Frontend quality` | Dependency audit, build artifact |
| `infrastructure.yml` | `Compose validation` | Backend/frontend/Grok2API Docker build matrix |
| `security.yml` | `Secret scan` | Trivy filesystem scan, Python dependency audit |

The workflows use independent concurrency groups. A new commit cancels stale work for that pull request or branch while unrelated pipelines continue in parallel.

## Delivery sequence

```text
feature PR
   ├── Governance
   ├── Backend
   ├── Frontend
   ├── Infrastructure
   └── Security
          ↓ all required checks pass
        merge to dev
          ↓ promotion PR
        staging
          ↓ optional automatic deploy
          ↓ promotion PR
        prod
          ↓ optional automatic deploy
```

Branch protection prevents merge until the required checks succeed. Deployment runs only after an accepted pull request is merged into `staging` or `prod`; it does not deploy unreviewed feature branches.

## Continuous deployment

`.github/workflows/deploy.yml` deploys:

- `staging` to the GitHub `staging` environment.
- `prod` to the GitHub `production` environment.

Deployment runs on a repository-scoped self-hosted runner installed as a systemd service on the target server. The runner fetches the exact branch in `DEPLOY_PATH`, applies the appropriate Docker Compose configuration, and verifies container state. This avoids exposing a private LAN server to GitHub-hosted runners. Configure the production environment with required reviewers when the GitHub plan and team structure permit it.

Automatic deployment is controlled independently by repository variables:

- `STAGING_CD_ENABLED=true` enables staging deployment with `docker-compose.yml`.
- `PRODUCTION_CD_ENABLED=true` enables production deployment with both `docker-compose.yml` and `docker-compose.production.yml`.

Manual dispatch uses the same environment-specific safety switches. Keep production disabled until TLS, a public hostname, backups, and production secrets are ready.

## Required GitHub environment secrets

Add these secrets separately to the `staging` and `production` environments:

| Secret | Meaning |
| --- | --- |
| `DEPLOY_PATH` | Existing absolute checkout path on the server |
| `DEPLOY_PROJECT_NAME` | Unique Compose project name, such as `groks` or `groks-production` |
| `DEPLOY_OVERRIDE_FILE` | Optional absolute server-only Compose override file |

The server checkout must have read access to the repository and a server-managed `.env`. The self-hosted runner must carry the `groks-server` label and run as the restricted deployment user. Never place production secrets in workflow files or the repository.

Staging and production must use separate checkout paths, Compose project names, databases, Redis volumes, Grok2API volumes, ports, and server-managed configuration files.

## Server prerequisites

- Linux host with Git, Docker Engine, and Docker Compose v2.
- A deployment user allowed to run Docker without unrestricted root SSH.
- Repository cloned at `DEPLOY_PATH` with `origin` set to this GitHub repository.
- Environment-specific `.env`, `BE/.env`, and `grok2api-main/config.yaml` provisioned securely.
- External Grok2API Docker volume created and backed up.

## Rollback

1. Identify the last known-good commit or release tag.
2. Revert through a pull request when time permits; for an incident, use the hotfix process.
3. Redeploy the selected branch after approval.
4. Restore data only under an approved backup/restore procedure.
5. Record impact, timeline, root cause, and preventive actions in the incident issue.
