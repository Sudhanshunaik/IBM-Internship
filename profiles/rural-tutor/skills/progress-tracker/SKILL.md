---
name: progress-tracker
description: >
  Tracks student progress over time, generates visual progress reports,
  identifies learning trends, and sets goals for the next week.
  Reads from persistent memory to build a complete learning journal.
triggers:
  - progress
  - how am I doing
  - my scores
  - report card
  - show my progress
  - weekly report
  - learning summary
---

# Progress Tracker Skill

## Purpose
Give the student a clear, motivating picture of their learning journey — showing
improvement over time and making learning goals concrete.

## Report Generation Steps

### Step 1 — Read All Memory Data
From MEMORY.md, collect:
- All quiz scores with dates
- All topics covered with dates
- Topics marked as understood vs. needs review
- Any goals set in previous sessions

### Step 2 — Calculate Statistics
Compute:
- **Total topics covered** across all sessions
- **Average quiz score** (this week vs. last week)
- **Quiz trend** — improving, stable, or declining?
- **Strongest subject** (highest average score)
- **Weakest subject** (lowest average score)
- **Study streak** — how many consecutive days they studied

### Step 3 — Generate the Visual Report

Present the report in this format:

```
📊 YOUR LEARNING PROGRESS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Student: [Name]
📅 Report Period: [date] to [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 OVERALL STATS
   Total topics studied: [X]
   Total quizzes taken: [X]
   Average score: [X%]  (Last week: [X%]  [↑/↓/→])
   Study streak: [X] days 🔥

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 SUBJECT PERFORMANCE
   Mathematics:  [████████░░] 80%
   Science:      [██████░░░░] 60%
   English:      [█████████░] 90%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ YOU'VE MASTERED:
   • [topic 1]
   • [topic 2]
   • [topic 3]

📖 STILL LEARNING:
   • [topic A] — Keep practicing!
   • [topic B] — Almost there!

🎯 GOALS FOR NEXT WEEK:
   1. Complete [weak topic] lesson
   2. Score 70%+ on a Science quiz
   3. Cover [next curriculum topic]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 [Personalized encouraging message based on their progress trend]
```

### Step 4 — Score Trend Bars
Build ASCII progress bars dynamically:
- 90-100% → [█████████░] Excellent!
- 70-89%  → [████████░░] Good progress!
- 50-69%  → [██████░░░░] Keep going!
- Below 50% → [████░░░░░░] Let's practice more!

### Step 5 — Encouraging Message (Personalized)
Based on their data:
- **Improving:** "You've improved by [X]% this week — that's incredible hard work! Keep it up! 🎉"
- **Stable:** "You're maintaining a great score! Let's push a little harder this week to reach [next milestone]!"
- **Declining:** "It looks like this week was tough. That's okay — everyone has hard weeks! Let's identify what to focus on."
- **First report:** "Great start! Every expert was once a beginner. You're on your way! 🌱"

### Step 6 — Update Memory with Goals
Record the goals set in this session in MEMORY.md so they persist to next session.
