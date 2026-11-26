# Quadrant v2: assistant triage, frosted glass, mobile first

This is the plan for the second version. It keeps the board, the method explanation, export, focus mode and the tests, and rebuilds the shell on Next.js so the reasoning can happen on the server.

## Product change

Adding a task stops being a filing action and becomes a short interview.

1. The user types a task and presses **Add**.
2. A sheet asks four yes or no questions, one at a time.
3. A model reads the task plus the four answers and returns a quadrant, a one line reason, a short cleaned up title and a confidence value.
4. The user sees the verdict and can accept it, pick another quadrant themselves, or discard.
5. The task animates into its quadrant.

Manual paths stay first class. The composer chips still place a task directly without the interview, and a task can be moved at any time from its row menu.

## The four questions

They are written to separate urgency from importance rather than asking for the answer.

1. **If this slipped to next week, would something actually break?** Consequence of delay.
2. **Is someone else waiting on it, with a date you do not control?** External commitment.
3. **Does it move a goal you would defend in a review?** Importance.
4. **Could someone else do it nearly as well?** Delegation signal.

Deterministic mapping used as a fallback and as guidance for the model:

| Urgent | Important | Quadrant |
| --- | --- | --- |
| yes | yes | Do now |
| no | yes | Schedule |
| yes | no | Delegate |
| no | no | Drop |

Urgent is `q1 or q2`. Important is `q3`. Question four sharpens the Delegate case: if nobody else could do it, the result stays Delegate but the reason says to timebox it instead.

## Architecture

Next.js App Router on Vercel. The board is a client component, the reasoning is a route handler.

```text
app/
├── layout.tsx           metadata, fonts, theme bootstrap
├── page.tsx             renders the board
├── globals.css          design tokens, glass surfaces, motion rules
└── api/triage/route.ts  POST task + answers -> verdict

components/              board, quadrants, rows, triage sheet, footer
lib/
├── taskLogic.ts         pure task operations (unchanged, still tested)
├── triage.ts            questions, heuristic mapping, shared types
├── storage.ts           localStorage, theme, focus, export, import
└── server/
    ├── openrouter.ts    chat completion with a strict JSON contract
    └── rateLimit.ts     sliding window limiter, injectable clock
```

## The model call

- Endpoint: OpenRouter chat completions, model from `OPENROUTER_MODEL`, default a small fast model.
- `response_format: { type: 'json_object' }`, temperature 0.2, 12 second timeout.
- The prompt carries the four questions, the four answers, the mapping table and the JSON contract. It asks for `quadrant`, `title`, `reason`, `confidence`, and refuses to invent facts.
- Every failure path falls back to the heuristic mapping and marks the result `source: 'heuristic'`, so the interface always completes.
- Without an API key the route returns the heuristic result with `mode: 'offline'`. The UI says so plainly instead of pretending a model answered.

## Rate limiting

- Per IP: 12 triage requests per 10 minutes. Global burst: 60 per minute.
- In memory sliding window with injected clock so it is unit tested.
- Returns `429` with `retryAfter` seconds, and the sheet shows a plain message plus the option to place the task manually.
- Documented honestly: in memory state resets on cold start, so a shared store is the production upgrade.

## Design direction: frosted glass, fluid, quiet

- **Surfaces.** A soft radial field behind everything, then translucent panels at 62 to 78 percent with `backdrop-blur`, a hairline border that is white in light mode and white at 8 percent in dark, and one soft shadow step. No gradients on content, no neon.
- **Colour.** Quadrant hues are the only chroma. Everything else is ink, muted ink, and the glass itself.
- **Type.** Bricolage Grotesque for display, Instrument Sans for interface. Question text is the largest type on the page during triage.
- **Motion.** Motion explains state changes and nothing else: sheet rises with a spring, questions slide horizontally, the verdict card morphs into the board row with a shared layout id. Durations 180 to 320ms, all of it disabled under `prefers-reduced-motion`.

## Mobile rework

- Single column, 16px gutters, no horizontal scroll at 320px.
- The triage sheet becomes a bottom sheet with safe area padding, a 48px action bar and thumb reachable buttons.
- Quadrant cards become compact: name, count and rows, with the description sentence removed below the small breakpoint.
- Task rows raise every control to at least 44px and keep the row menu as the reclassify path.
- Verified at 360, 390 and 430 wide in light and dark.

## Footer

`Made with ♥ by Gautam Vhavle` linking to https://gautamvhavle.xyz/, opening in a new tab with `rel="noreferrer"`, alongside the existing privacy line.

## Testing plan

- Unit: heuristic mapping table, confidence behaviour, rate limiter windows and refill, triage payload validation.
- Browser: the four question flow, keyboard only answering, verdict and accept, manual override, direct placement without the interview, 429 fallback message, and the sheet at mobile width.
- The API is intercepted in browser tests so they never call a real model.

## Non goals for this version

- Accounts, sync, or a database.
- Anything other than four fixed questions.
- Storing task text on the server beyond the request lifetime.
