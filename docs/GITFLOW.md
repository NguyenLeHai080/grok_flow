# Gitflow Operating Standard

## Branch topology

```text
feat/* --PR--> dev --PR--> staging --PR--> prod
                    QA/UAT              production

prod --> hotfix/* --PR--> prod --PR--> staging and dev
```

`dev`, `staging`, and `prod` are long-lived. Feature, fix, and hotfix branches are short-lived and deleted after merge.

## Branch naming

- `feat/<issue-id>-<slug>` for product work.
- `fix/<issue-id>-<slug>` for regular defects.
- `hotfix/<issue-id>-<slug>` for production incidents.
- `chore/<issue-id>-<slug>` for maintenance.
- `docs/<issue-id>-<slug>` for documentation.

Use lowercase ASCII and hyphens, for example `feat/42-login-page`.

## Promotion rules

### Feature to development

Create the branch from the latest `dev`. Open the pull request back to `dev`; do not target `staging` or `prod` directly.

### Development to staging

Open a promotion pull request from `dev` to `staging`. Describe included issues, test evidence, migration steps, configuration changes, and rollback plan. QA records acceptance in the pull request.

### Staging to production

Open a promotion pull request from `staging` to `prod`. Production deployment starts only after approval and all required checks pass. Tag successful releases using semantic versioning, such as `v1.4.0`.

### Production hotfix

Create the hotfix from `prod`, then merge it into `prod` through a pull request. Immediately open synchronization pull requests from `prod` to `staging`, then from `staging` to `dev`. Resolve conflicts explicitly; never force-push a protected branch.

## Repository rulesets

Configure `prod` and `staging` with:

- Pull requests required before merging.
- At least one approving review.
- Stale approvals dismissed after new commits.
- Conversation resolution required.
- Required checks: `Backend tests`, `Frontend quality`, `Compose validation`, and `Commit policy`.
- Force pushes and branch deletion blocked.
- Administrators included in enforcement where the GitHub plan permits it.

Configure `dev` with required pull requests and CI checks. Direct pushes may be restricted to maintainers only, but pull requests remain the default path.

## Merge strategy

- Squash merge feature/fix branches for a clean issue-focused history.
- Merge commit promotion pull requests to preserve release boundaries.
- Never rewrite shared branch history.
- Delete short-lived branches after successful merge.

## Local Git command reference

```bash
git clone https://github.com/NguyenLeHai080/grok_flow.git
git switch dev
git pull --ff-only
git switch -c feat/42-login-page
git add <files>
git commit -m "feat(auth): add login page #42"
git push -u origin feat/42-login-page
```

For a hotfix:

```bash
git switch prod
git pull --ff-only
git switch -c hotfix/73-login-error
git commit -m "fix(auth): resolve login error #73"
git push -u origin hotfix/73-login-error
```
