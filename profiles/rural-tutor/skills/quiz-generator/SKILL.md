---
name: quiz-generator
description: >
  Generates adaptive quizzes based on the student's performance history and
  learning gaps. Prioritizes weak areas while mixing in easy questions to
  build confidence. Tracks quiz results in persistent memory.
triggers:
  - quiz
  - test me
  - practice questions
  - assessment
  - question
  - exam practice
  - let's practice
---

# Quiz Generator Skill

## Purpose
Generate personalized quizzes that challenge the student in their weak areas
while maintaining their confidence with topics they've mastered.

## Quiz Generation Algorithm

### Step 1 — Read Student Memory
From MEMORY.md, extract:
- **Weak topics** — marked as "needs review" or "struggled"
- **Recent topics** — covered in the last 3 sessions
- **Strong topics** — consistently answered correctly
- **Student's class level** — for difficulty calibration

### Step 2 — Build the Question Mix
Use this distribution for a 10-question quiz:

| Category | Count | Difficulty | Purpose |
|---|---|---|---|
| Weak topics | 4 questions | Medium | Build mastery |
| Recent topics | 3 questions | Easy-Medium | Reinforce learning |
| Strong topics | 2 questions | Easy | Maintain confidence |
| Challenge | 1 question | Hard | Growth mindset |

For a 5-question quiz, halve everything and keep 1 challenge question.

### Step 3 — Question Format by Level

**Class 6–8 (Beginner):**
- Multiple choice (4 options, A/B/C/D)
- True/False with explanation required
- Fill in the blank

**Class 9–10 (Intermediate):**
- Short answer (1–2 sentences)
- Match the column
- Diagram-based (describe without actual image)

**Class 11–12 (Advanced):**
- Word problems requiring multi-step solutions
- Conceptual questions ("Why does X happen?")
- Application questions ("If Y, what would happen to Z?")

### Step 4 — Delivery Format

Present each question one at a time:
```
📝 Question 3 of 10
─────────────────────
[Question text]

A) Option one
B) Option two
C) Option three
D) Option four

Take your time! Type the letter of your answer.
```

### Step 5 — Evaluate Each Answer

**Correct answer:**
> ✅ Correct! Well done!
> 💡 [Brief explanation of WHY it's correct — 1 sentence]

**Incorrect answer:**
> ⚠️ Not quite! The correct answer is [X].
> 📖 [Clear explanation — 2–3 sentences]
> [Relatable rural example if possible]

### Step 6 — Final Score Report

After all questions, generate:

```
🎓 Quiz Complete! Here's your result:

📊 Score: [X]/[Y] ([percentage]%)

✅ Topics you know well:
  • [topic 1]
  • [topic 2]

📚 Topics to practice more:
  • [topic 3] — [specific sub-concept]

🎯 Next session recommendation:
  We should focus on [weakest topic]. Want to do a lesson on that now?
```

### Step 7 — Update Memory

After quiz completion:
- Record the date, subject, score in MEMORY.md
- Update each topic's status (understood / needs review / struggling)
- Flag topics that scored below 60% for priority review
