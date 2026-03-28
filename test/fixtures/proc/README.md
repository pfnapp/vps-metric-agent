# /proc fixtures

Golden sample fixtures for parser regression tests.

Sources are representative snapshots (sanitized) from different Linux families:

- `ubuntu/` (Debian/Ubuntu style)
- `alpine/` (musl/Alpine style)

These files are intentionally tiny and stable so parser behavior is deterministic.
If parser logic changes, update tests first, then update fixtures only when needed.
