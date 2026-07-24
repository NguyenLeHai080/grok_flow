import re
import subprocess
import sys


ALLOWED_TYPES = {
    "build",
    "chore",
    "ci",
    "docs",
    "feat",
    "fix",
    "perf",
    "refactor",
    "revert",
    "style",
    "test",
    "vendor",
}
SUBJECT_PATTERN = re.compile(
    rf"^({'|'.join(sorted(ALLOWED_TYPES))})(\([a-z0-9][a-z0-9._/-]*\))?!?: .+ #[1-9][0-9]*$"
)
EXEMPT_PATTERNS = (
    re.compile(r"^Merge "),
    re.compile(r"^Revert "),
    re.compile(r"^chore\(deps\):"),
)


def git_subjects(base_sha: str, head_sha: str) -> list[str]:
    result = subprocess.run(
        ["git", "log", "--format=%s", f"{base_sha}..{head_sha}"],
        check=True,
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: validate_commits.py <base-sha> <head-sha>")
        return 2

    subjects = git_subjects(sys.argv[1], sys.argv[2])
    invalid = [
        subject
        for subject in subjects
        if not SUBJECT_PATTERN.fullmatch(subject)
        and not any(pattern.match(subject) for pattern in EXEMPT_PATTERNS)
    ]

    if invalid:
        print("Invalid commit messages:")
        for subject in invalid:
            print(f"- {subject}")
        print("Expected: type(optional-scope): description #issue-id")
        return 1

    print(f"Validated {len(subjects)} commit message(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
