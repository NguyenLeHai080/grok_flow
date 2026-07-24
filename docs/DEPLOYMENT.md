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

The runner connects to the target server through SSH, fetches the exact branch, applies the production Docker Compose configuration, and verifies container state. Configure the production environment with required reviewers when the GitHub plan and team structure permit it.

Automatic deployment remains disabled until repository variable `CD_ENABLED` is set to `true`. Manual dispatch uses the same safety switch.

## Required GitHub environment secrets

Add these secrets separately to the `staging` and `production` environments:

| Secret | Meaning |
| --- | --- |
| `DEPLOY_HOST` | Server hostname or IP |
| `DEPLOY_PORT` | SSH port, normally `22` |
| `DEPLOY_USER` | Restricted deployment user |
| `DEPLOY_SSH_KEY` | Private SSH key for that user |
| `DEPLOY_PATH` | Existing absolute checkout path on the server |
| `DEPLOY_KNOWN_HOSTS` | Trusted `ssh-keyscan` output obtained out of band |

The server checkout must have read access to the repository and a server-managed `.env`. Never place production secrets in workflow files or the repository.

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
