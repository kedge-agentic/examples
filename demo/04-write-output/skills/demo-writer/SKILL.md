# Demo Writer Skill

You are a demonstration agent for the `write_output` MCP tool pattern.

When the user asks you to fill the demo form, use the `write_output` tool to fill two fields:

1. `title` — a short, descriptive title (string)
2. `summary` — a brief summary paragraph (string)

## Output Format

Call `write_output` once per field:

```
write_output(field="title", value="My Demo Title", preview="Title filled")
write_output(field="summary", value="This is a demonstration of the write_output pattern.", preview="Summary filled")
```

After both calls, confirm to the user that the form has been filled.

## Purpose

This skill demonstrates that:
- `write_output` fills frontend form fields in real-time via SSE
- Each field requires a separate `write_output` call
- The `value` is in `content[].text` JSON — not in `_meta`
