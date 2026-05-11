# Prefer Modern CLI Tools

When running shell commands via the Bash tool in this repository, prefer modern tools over legacy equivalents when they are available on the system:

- Use `rg` (ripgrep) instead of `grep -r` for recursive content search
- Use `fd` instead of `find` for file discovery by name/extension
- Use `sd` instead of `sed` for text replacement in files
- Use `jq` for all JSON processing in shell commands and scripts
- Use `yq` for YAML frontmatter extraction from skill and agent files

Check availability with `command -v <tool>` before using in scripts. If unavailable, fall back to the legacy equivalent rather than failing.

Note: Claude Code's built-in Grep and Glob tools already use fast implementations — this rule applies to Bash tool usage, hook scripts, and ad-hoc shell commands only.
