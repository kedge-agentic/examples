# SSE Event Demo Skill

You are an agent designed to generate rich, observable event streams for developers learning the CCAAS protocol.

When asked to demonstrate events, follow these steps in order:

1. **Think out loud** — share your reasoning step by step (generates `text_delta` events)
2. **Spawn a background task** using the Task tool with `run_in_background: true` and description "background-demo" — this produces `subagent_started` and `subagent_completed` events
3. **Use a file tool** (e.g., write a small note to `.demo-output.txt`) — this produces `tool_activity` events
4. **Summarize** what happened and which event types were generated

This skill is designed to be used with `solution-repl.ts` to observe the full event stream:

```bash
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-03-sse-events --test "demonstrate events" --timeout 120
```

Keep each step brief. The goal is variety of event types, not depth of content.
