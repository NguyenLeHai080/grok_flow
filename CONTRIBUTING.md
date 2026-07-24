# Contributing to Groks

## Gitflow

| Branch | Purpose | Deployment |
| --- | --- | --- |
| `prod` | Production-ready source | Production |
| `staging` | QA, UAT, and demonstrations | Staging |
| `dev` | Integration branch | Development |
| `feat/<name>` | Product feature, created from `dev` | None |
| `fix/<name>` | Non-emergency defect, created from `dev` | None |
| `hotfix/<name>` | Emergency production repair, created from `prod` | None |

Direct pushes to `prod` and `staging` are prohibited. Use pull requests with a successful CI run and at least one approval.

## Standard workflow

1. Create or select a GitHub issue and assign it to the sprint.
2. Update local `dev`: `git switch dev && git pull --ff-only`.
3. Create a branch: `git switch -c feat/short-feature-name`.
4. Make focused commits that reference the issue.
5. Push the branch and open a pull request into `dev`.
6. Resolve review feedback and wait for all required checks.
7. Squash-merge after approval and delete the feature branch.
8. Promote `dev` to `staging` by pull request for QA/UAT.
9. Promote `staging` to `prod` by pull request after acceptance.

## Hotfix workflow

1. Create `hotfix/<name>` from `prod`.
2. Fix and verify only the production incident.
3. Open a pull request into `prod` and request expedited review.
4. After deployment, merge `prod` back into `staging` and `dev` using pull requests.
5. Record the root cause and preventive action in the issue.

## Commit convention

Use Conventional Commits:

```text
<type>(optional-scope): <description> #<issue-id>
```

Allowed types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `perf`, `test`, `build`, `ci`, `revert`, and `vendor`.

Examples:

```text
feat(auth): add password reset #42
fix(jobs): prevent duplicate execution #57
docs(gitflow): document hotfix process #61
```

Keep the subject concise, imperative, consistent in language, and without a trailing period. Merge commits and automated dependency commits are exempt from the issue reference rule.

## Pull request quality gate

- Link the issue using `Closes #<id>` or `Refs #<id>`.
- Keep the change scoped to one objective.
- Add or update tests for behavior changes.
- Include screenshots for visible UI changes.
- Document migrations, configuration changes, and rollback steps.
- Never commit credentials, `.env` files, generated databases, logs, or diagnostic media.

See `docs/GITFLOW.md`, `docs/SCRUM.md`, and `docs/DEPLOYMENT.md` for the complete operating model.
