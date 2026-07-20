# Project Guru: Adaptive AI Tutor for Rural Education

**Project Guru** is an intelligent, offline-friendly, and highly adaptive AI tutor built on the **Hermes Agent framework**. It is designed specifically to democratize access to quality education for students in rural areas who face limited connectivity and educational resources.

## 🎯 The Vision
To provide personalized, 1-on-1 tutoring that builds confidence, reframes mistakes as learning opportunities, and adapts to the student's unique pace and language.

## ✨ Key Features
- **Adaptive Learning:** Simplifies complex concepts using relatable, local examples (e.g., farming, village life, nature) if a student struggles.
- **Multilingual Support:** Asks for language preference upfront and can seamlessly teach in English, Hindi, Telugu, Tamil, and other regional languages.
- **Continuous Memory:** Tracks topics the student finds easy or difficult across sessions, ensuring a continuous educational journey.
- **Dynamic Quizzes:** Generates custom quizzes that target weak areas while mixing in easier questions to build confidence.
- **Low-Bandwidth Optimized:** Explanations are kept concise (3-5 sentences) to ensure compatibility with low-bandwidth messaging platforms.
- **Curriculum Agnostic:** Can teach any requested syllabus (NCERT, CBSE, ICSE, or State Boards). It programmatically searches the web for official syllabus details to guarantee accuracy.

## 🏗️ Technical Architecture
This project is powered by the **Hermes Agent framework** (by Nous Research):
- **Core Engine:** Routes requests to advanced Large Language Models (LLMs) via external API providers.
- **Execution Backend:** Utilizes a secure, sandboxed Docker environment (`python3.11-nodejs20`) to safely execute code and terminal commands.
- **State Management:** Manages concurrency, sessions, and memory using local SQLite databases (`state.db`, `projects.db`).
- **Profile Configuration:** The behavior of "Guru" is strictly defined in `profiles/guru/SOUL.md`.

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sudhanshunaik/IBM-Internship.git
   cd IBM-Internship
   ```

2. **Prerequisites:**
   - Ensure you have **Docker** installed and running (used for the secure execution sandbox).
   - Ensure the Hermes CLI is installed on your system. If not, you can run the included `hermes-setup.exe` (Windows).

3. **Configuration:**
   - Create a `.env` file in the root directory.
   - Add your necessary API keys for your LLM provider (e.g., Anthropic, OpenAI, or Minimax).

4. **Run the Rural Tutor:**
   - Start the Hermes agent using the Guru profile:
   ```bash
   hermes --profile guru
   ```

## 🚀 Impact
Project Guru brings world-class, personalized tutoring to remote areas, scaling quality education effortlessly and fostering a growth mindset in every student.

---
*Developed as part of the IBM Internship program.*
