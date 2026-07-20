---
name: learning-gap-analyzer
description: >
  Analyzes a student's learning history to identify specific knowledge gaps
  and misunderstandings. Provides a prioritized list of topics to review and
  creates a personalized study plan to close the gaps.
triggers:
  - analyze my gaps
  - what should I study
  - study plan
  - where am I weak
  - learning gaps
  - what do I need to improve
---

# Learning Gap Analyzer Skill

## Purpose
Systematically identify what a student doesn't know yet, and create a
clear, prioritized action plan to fill those gaps efficiently.

## Analysis Process

### Step 1 — Collect Evidence
From MEMORY.md, gather:
- Quiz questions answered incorrectly (with topics)
- Topics where the student asked for re-explanation
- Topics marked "needs review"
- Patterns in mistakes (calculation errors? concept misunderstanding? language?)

### Step 2 — Categorize Gaps

**Type A — Foundational Gaps (Critical)**
Missing prerequisite knowledge that blocks learning of advanced topics.
Example: Can't do fractions → will struggle with algebra, ratios, percentages

**Type B — Conceptual Gaps (Important)**
The student has partial understanding but key concepts are missing.
Example: Knows Newton's 1st law but confuses it with 2nd law

**Type C — Application Gaps (Useful)**
The student understands theory but can't apply it to problems.
Example: Knows the formula but can't set up word problems

**Type D — Practice Gaps (Minor)**
Simply needs more practice to solidify understanding.
Example: Makes arithmetic mistakes under pressure

### Step 3 — Build the Gap Map

Present visually:
```
🗺️ YOUR LEARNING GAP MAP
━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL GAPS (Fix first):
   • Fractions & Decimals (blocks: %, Algebra)
   • Atom structure (blocks: Chemical bonding, Reactions)

🟡 IMPORTANT GAPS (Fix next):
   • Newton's 2nd Law application
   • Passive voice in English

🟢 MINOR GAPS (Practice more):
   • Mental arithmetic speed
   • Spelling of scientific terms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4 — Generate a Personalized Study Plan

Create a 2-week plan:

```
📅 YOUR PERSONALIZED STUDY PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1 — Foundation Building

   Day 1-2: Fractions & Decimals
     → Lesson + 5 practice problems
   Day 3-4: Percentages (builds on fractions)
     → Lesson + Quiz
   Day 5:   Review + Mini-test

Week 2 — Concept Strengthening

   Day 1-2: Atom Structure deep dive
     → Lesson + diagram quiz
   Day 3-4: Newton's Laws applications
     → Word problems practice
   Day 5:   Full subject quiz + Progress check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5 — Ask for Commitment
> "Does this study plan sound good to you? Which topic would you like to start with today?"

Then save the study plan to MEMORY.md for reference in future sessions.

### Step 6 — Track Gap Closure
At the start of each session, check: have any gaps been addressed?
If yes, celebrate: "You've closed the [topic] gap — that's real progress! 🎉"
