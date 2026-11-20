---
name: "brand-dna"
description: "Use when someone wants brand DNA, brand strategy or a brand identity for an idea. Runs research, psychology, positioning and visual skills in order, then recommends one position."
---

# Brand DNA Director

Turn a one-line idea into a brand built on evidence. You direct other skills, give each a clear job, and make the decision none of them makes alone.

**Copy how great brands decide, never how they look:**
- Own one idea, and give something up to own it.
- Build on a real customer fear or want, not a category cliché.
- Keep what the category needs for trust. Break from it only on purpose.
- Repeat distinctive assets (colour, shape, phrase) until they belong to you.
- Back every promise with something the business actually does.

Avis, No. 2 behind Hertz, turned that position into "We Try Harder". Copy the move, not the red. Never copy a rival's name, logo or slogan.

## Pick a mode

| | Quick | Deep |
|---|---|---|
| Use when | Testing an idea, or "quick", "rough" | "Best", "full", launching, or a real product |
| Skills loaded | None. Follow each step's Quick note | All skills named below |
| Research | 5-8 sources, 3 rivals | 15+ sources, 5 rivals, 2 adjacent alternatives |
| Approval | No stop. Recommend and name the runner-up | Stop at Step 6 |
| Output | One-page DNA and a board prompt | Full document, design system and board |

If there is no signal, use Quick and offer Deep at the end. Deep reuses Quick's files.

## Setup

**Intake:** get the idea, market (country or city) and customer. Infer what you can. Ask one question only if the market can't be inferred, because brand DNA changes by market. If nobody is there to answer, choose and state your choice.

**Handoff files:** work in `brand-dna/[idea-slug]/`, and reuse any files already there. Each step saves one file under 400 words, not counting links. Later steps read these files, not the full research.

**Evidence labels:** tag every claim `[RESEARCH]` with a link, `[JUDGMENT]`, or `[ASSUMED]`. Never invent quotes, numbers, testimonials or rival facts. If evidence is thin, say so and lower your confidence.

**Running skills:**
- Load each skill with the Skill tool when its step starts, using the name this session lists (it may carry a prefix such as `anthropic-skills:`).
- If a skill is missing, do its job yourself to the same handoff spec.
- When a skill asks a question, answer it from the handoff files, or mark a guess `[ASSUMED]`. Only Step 6 goes to the user.

## Step 1: Rough brief

`product-marketing` → `00-brief.md`

- Skip its codebase study and section-by-section interview. Draft from the one-liner and mark guesses `[ASSUMED]`.
- Leave Customer Language, Differentiation and Proof Points blank for now.
- If `.agents/product-marketing.md` exists for this product, start from it. If it covers a different product, leave it untouched and tell each later skill to use `00-brief.md` instead. If none exists, save a copy there, because later skills look for it.

**Quick:** write five lines: what it is, who it's for, market, price level, main alternative.

## Step 2: Customer truth

`customer-research` → `01-customers.md`

- Use its Mode 2 (online sources). Deliverables are the synthesis and a quote bank, so don't ask.
- Search 1-3 star rival reviews, app reviews, Reddit, local forums and YouTube comments for this market. If a source is blocked, move to another.
- Read some 5-star reviews too. Complaints show fears, but praise shows what people actually value.
- Record 3-5 themes ranked by frequency and intensity, each with its High/Medium/Low confidence and two short quotes with link and date.
- Name the functional, emotional and social job, and the single biggest fear.

**Quick:** 5-8 sources and 3 themes.

## Step 3: Rival map

Web search, then `competitor-profiling` → `02-rivals.md`

- Search for rivals first, because that skill needs URLs. Include market leaders, direct rivals and adjacent alternatives (a different solution to the same problem).
- Run it as a quick scan focused on positioning, pricing and reviews.
- Skip its SEO and backlink phases: they don't inform brand. If Firecrawl isn't connected, use the web tools you have.
- It doesn't record visual identity, so add this for each rival: main promise, tone, price position, primary colours, type style, logo type, image style.
- **See colours, don't recall them.** Page text doesn't show colours. Use a browser screenshot if available. A tool that doesn't return the picture to you doesn't count. Otherwise write `not observed`, and never fill it from memory.
- End with three lists: what everyone does (category codes), which promises nobody owns (the gap), and what each leader owns.

**Quick:** 3 rivals, using homepage and review pages only.

## Step 4: Psychology

`marketing-psychology` → `03-psychology.md`

- Don't run its whole list. Choose the 3-5 models that best explain the evidence in `01-customers.md`.
- For each, write: evidence, model, what it means for the brand, how it could backfire.
- Treat these as hypotheses, not findings.
- No fake urgency, false scarcity, hidden fees or other dark patterns.

**Quick:** 2-3 models, without loading the skill.

## Step 5: Decide

This is your job, and it matters most. Save to `04-positions.md`.

Write 2-3 truly different positions, not three tones of one idea. For each:

- **Position:** For [who], [brand] is the [category] that [one idea], because [reason to believe].
- **Evidence:** the customer theme and rival gap behind it.
- **Must be true:** what the business has to actually do (policy, cost, operations).
- **Gives up:** who or what it isn't for.
- **Personality:** three adjectives it is, two it isn't.
- **Colour direction:** a colour family and its reasoning.

**Colour rule:** colours have no fixed meanings, so "blue = trust" is never a reason. Reason from personality fit, distance from rivals' observed colours, real use (phone screens, sunlight, signage, the places this brand appears), and cultural meaning in this market.

**Kill tests:**
- Could the top rival claim this tomorrow? Sharpen it or drop it.
- Can this team really deliver "Must be true" now? If not, drop it.
- Does it rest on at least one High or Medium theme? If not, mark it speculative.

Score each position 1-5 on pain strength, rival gap, deliverability and how hard it is to copy. Scores are `[JUDGMENT]`. Recommend one and explain why in words, not just by the total.

## Step 6: Approval

**Deep:** ask with AskUserQuestion. Put the recommended position first, with one line on each option's trade-off, then wait. The user may mix options. If nobody is there to answer, continue with the recommendation and say so at the top of the document.

**Quick:** don't stop.

## Step 7: Final brief

`product-marketing` → `05-brief-final.md` (Deep only)

Rewrite the brief with the chosen position, real customer words, rivals and voice. Clear `[ASSUMED]` where research confirmed it. Leave Proof Points empty unless they are real. Update `.agents/product-marketing.md` under the same rule as Step 1.

## Step 8: Visual system

`design-consultation` → `brand-dna/[idea-slug]/DESIGN.md`

- Answer its product and "memorable thing" questions from the chosen position.
- Use `02-rivals.md` instead of its research phase.
- Its setup scripts may be missing. Continue without them.
- Its safe choices should match the category codes, and its risks should serve the position.
- Don't overwrite any existing `DESIGN.md` in the project.

**Quick:** give a palette (primary, accent, neutrals) with hex values, and one font pair, each with a reason.

**Both modes:** calculate text contrast with code rather than judging by eye, aiming for at least 4.5:1. Compare the primary colour against rivals' observed colours.

## Step 9: Brand board

`brandkit` (or `brandkit-skills`, whichever is listed) → `06-board-prompt.md`

- Skip its strategy inference and use the chosen position.
- Its defaults lean dark and tech (charcoal canvas, terminals). The chosen palette, type and personality override them.
- Choose applications this business really uses, not generic mockups.
- If this session has an image generator, make one board.
- If it doesn't, write the ready-to-paste prompt from its template, and build a preview page showing the real colours, fonts and wordmark.
- Call every logo a concept. It needs a vector redraw and a trademark check before use.

**Quick:** write the prompt only, without loading the skill.

## Step 10: Check and deliver

**Check first:**
- Every `[RESEARCH]` claim has a link. Reopen the sources behind the top three claims to confirm them.
- Hide the brand name. Could the DNA describe a rival? If so, return to Step 5.
- Count how many rivals' colours you actually saw. If fewer than half, call the colour choice provisional.

**Brand DNA document:**
1. The one idea, in one sentence
2. Position, and why it wins
3. Customer truth: themes and quotes
4. Rival map and the gap
5. Psychology behind it
6. Promises the business must keep
7. Personality and voice: do, don't, sample lines
8. Name direction, if unnamed: 3-5 options, marked "availability and trademark not checked" unless you checked
9. Colour and type, with reasons
10. Logo idea
11. What this brand will never do
12. Test first: three cheap tests with real customers, and what result would change the position
13. Sources

**Quick:** one page covering items 1, 2, 6, 9 and 12, plus sources.

Publish it as a Docs artifact if that type is listed, otherwise send a Markdown file. In chat, give only the one idea, the recommended position, the weakest part of the evidence, and the next test. Say plainly that this is a strong hypothesis until real customers confirm it.

If the user later changes the position, rerun from Step 7 and keep the research.