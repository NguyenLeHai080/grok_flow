# CI/CD and Deployment

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `dev`, `staging`, and `prod`:

- Backend tests with Python 3.12.
- Frontend lint, formatting check, and production build with Node.js 22.
- Docker Compose configuration validation.
- Conventional Commit and issue-reference validation for pull requests.
- Secret scanning with Gitleaks.

## Continuous deployment

`.github/workflows/deploy.yml` deploys:

- `staging` to the GitHub `staging` environment.
- `prod` to the GitHub `production` environment.

The runner connects to the target server through SSH, fetches the exact branch, runs Docker Compose, applies the production Compose configuration, and verifies container state. Configure environment protection so production requires a manual reviewer.

Automatic deployment remains disabled until the repository variable `CD_ENABLED` is set to `true`. This prevents failed or accidental deployments before both environments and their secrets are ready. Manual dispatch uses the same safety switch.

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
