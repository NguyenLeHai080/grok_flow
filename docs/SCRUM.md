# Scrum Delivery Model

## Roles

- **Product Owner:** owns the Product Goal, orders the backlog, and accepts outcomes.
- **Scrum Master:** protects Scrum events, removes impediments, coaches flow, and improves team effectiveness.
- **Developers:** estimate, implement, test, review, document, and deliver the Sprint Goal.
- **QA/UAT stakeholders:** validate acceptance criteria in `staging` before production promotion.

The Scrum Master facilitates delivery but does not approve quality on behalf of Developers or product value on behalf of the Product Owner.

## Work item lifecycle

```text
Backlog -> Ready -> In Progress -> In Review -> QA/UAT -> Done
```

Every issue should contain a user/business outcome, acceptance criteria, priority, estimate, owner, dependencies, test notes, and definition-of-done checklist.

## Events

- **Sprint Planning:** define a single Sprint Goal and select ready backlog items based on capacity.
- **Daily Scrum:** inspect progress toward the Sprint Goal and adapt the next 24 hours of work.
- **Backlog Refinement:** clarify, split, estimate, and order upcoming work.
- **Sprint Review:** demonstrate the increment from `staging` and collect stakeholder feedback.
- **Sprint Retrospective:** select one measurable process improvement for the next sprint.

For a two-week sprint, use Planning on day one, Daily Scrum each working day, Refinement once or twice, and Review plus Retrospective on the final day.

## Definition of Ready

- Business value and scope are understandable.
- Acceptance criteria are testable.
- Dependencies and risks are identified.
- Required design or technical decisions are available.
- The item is small enough to complete within one sprint.

## Definition of Done

- Acceptance criteria are met.
- Code is reviewed through a pull request.
- Automated checks pass.
- Security and data-handling impacts are reviewed.
- Documentation and migrations are updated.
- QA/UAT evidence exists when required.
- The change is deployable and has a rollback approach.
- The issue and pull request are linked and updated.

## Metrics

Use metrics to improve the system, not rank individuals:

- Sprint Goal success rate.
- Lead time and cycle time.
- Pull request review time.
- Deployment frequency and change failure rate.
- Escaped defects and mean time to recovery.
- Work in progress and blocked-item age.

## GitHub setup

- Use GitHub Projects with status, sprint, priority, size, and owner fields.
- Use milestones for sprint or release boundaries.
- Map one issue to one independently valuable outcome where practical.
- Link pull requests with closing keywords and include the issue ID in commits.
- Use labels such as `type:feature`, `type:bug`, `priority:high`, `status:blocked`, and `area:backend`.
