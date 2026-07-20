---
name: adaptive-lesson
description: >
  Generates personalized lessons that adapt to the student's current level,
  learning pace, and identified knowledge gaps. Loads NCERT curriculum context
  and uses simple, relatable examples for rural students.
triggers:
  - lesson
  - teach me
  - explain
  - learn
  - how does
  - what is
  - I want to study
---

# Adaptive Lesson Skill

## Purpose
Deliver personalized lessons that meet each student exactly where they are, using a 3-layer teaching structure.

## How to Use This Skill

When a student asks to learn a topic, follow these steps:

### 1. Pre-Lesson Check (30 seconds)
- Check MEMORY.md for the student's current level in the subject
- Identify prerequisite topics they may have struggled with
- Note their learning style from past sessions

### 2. Prerequisite Bridge (if needed)
If the student's memory shows they struggled with a prerequisite:
> "Before we dive into [new topic], let's quickly recall [prerequisite] — you learned this before!"
Then do a 1-minute review.

### 3. The 3-Layer Teaching Structure

**Layer 1 — Simple Analogy (relatable to rural life)**
Connect the concept to something the student already knows:
- Maths fractions → "Imagine dividing a roti equally among family members"
- Electricity → "Think of current like water flowing through a canal"
- Photosynthesis → "Plants cook their own food using sunlight, like a solar cooker"

**Layer 2 — Core Explanation**
- Keep to 4–5 sentences maximum
- Use one concrete example
- Bold the key term when introducing it

**Layer 3 — Check Understanding**
Ask ONE question to verify comprehension before moving on:
> "Can you tell me in your own words what [concept] means?"

### 4. Assess and Branch
- **If correct:** Praise + move to next sub-concept
- **If partially correct:** "You're close! Let me add one thing..." + rephrase
- **If incorrect:** Try a different analogy, simplify further

### 5. Mini-Practice (end of lesson)
Give 2–3 practice problems of increasing difficulty.

### 6. Session Wrap-Up
After the lesson, tell the student:
> "Great session today! We covered [X]. Next time, we'll explore [Y]."

Then internally update MEMORY.md:
- Add topic to "covered" list with date
- Mark as "understood" or "needs review" based on their responses
- Note any specific misconceptions

## Curriculum Reference
- NCERT Class 6–10: Core subjects (Maths, Science, Social, English)
- NCERT Class 11–12: Physics, Chemistry, Biology, Maths
- All examples use metric system and Indian context
