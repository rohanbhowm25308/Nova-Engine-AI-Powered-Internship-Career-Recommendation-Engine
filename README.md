# Nova-Engine-AI-Powered-Internship-Career-Recommendation-
AI-powered career recommendation platform for personalized internships, projects, learning resources, skill-gap analysis, career readiness, and AI career guidance.

# 🚀 Nova Engine — AI-Powered Career Recommendation Platform

> **Nova Engine** is an AI-powered career recommendation platform designed to help students discover relevant internships, projects, learning resources, and career paths based on their skills, experience, interests, and technical domain.

![Nova Engine](https://img.shields.io/badge/Nova%20Engine-AI%20Career%20Platform-00d9ff?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat-square\&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-black?style=flat-square\&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=flat-square\&logo=javascript)
![Chart.js](https://img.shields.io/badge/Chart.js-Interactive%20Charts-ff6384?style=flat-square\&logo=chartdotjs)

---

## 🌟 Overview

Nova Engine combines **AI-inspired recommendation logic, skill analysis, career analytics, interactive visualizations, and a modern web interface** into one platform.

Users can enter their academic background, technical skills, experience, preferred domain, internship preference, and learning style. Nova Engine then generates personalized recommendations and career insights.

### 🎯 The Goal

The goal of Nova Engine is to help students answer:

* 💼 Which internships are suitable for me?
* 🧠 What skills am I strong in?
* 📚 What should I learn next?
* 🛠️ Which projects should I build?
* 📊 How career-ready am I?
* 🚀 What should my career roadmap look like?

---

# ✨ Features

## 🤖 Personalized Recommendations

Nova Engine provides recommendations for:

* 💼 Internships
* 🛠️ Projects
* 📚 Learning resources
* 🎯 Career paths
* 🧠 Skill development

Recommendations are generated according to the user's entered skills, domain, experience, and preferences.

---

## 📊 AI Career Dashboard

The dashboard analyzes the user's profile and generates multiple career-related scores, including:

* Career Readiness
* Technical Skills
* Experience
* Skill Coverage
* Learning Progress

The results are presented through interactive visual components and analytics.

---

## 🧠 Skill Analysis

The platform analyzes entered skills across multiple technical categories and identifies:

* Current strengths
* Skill coverage
* Missing skills
* Recommended skills
* Domain-specific skill gaps

---

## 📈 Interactive Data Visualization

Nova Engine uses **Chart.js** to visualize career data through:

* Radar charts
* Doughnut charts
* Bar charts
* Line charts
* Pie charts

These visualizations make the user's career profile easier to understand.

---

## 💼 Internship Finder

Users can explore internship recommendations with:

* Remote
* Hybrid
* Onsite

Filtering and sorting options include:

* Search
* Recommendation match
* Rating
* Difficulty
* Internship mode

---

## 🛠️ Project Recommendations

The platform recommends projects based on the user's selected technical domain and current skill level.

Project recommendations are presented through interactive cards containing relevant information such as:

* Project title
* Difficulty
* Duration
* Required skills
* Rating
* Match percentage

---

## 🤖 Nova AI Assistant

Nova Engine includes an interactive career assistant that can help users with:

* Career questions
* Internship guidance
* Project recommendations
* Learning suggestions
* Skill improvement

The assistant can also use the user's generated recommendation results to provide more personalized responses.

---

## 🎙️ Voice Assistant

The platform includes browser-based voice interaction using the **Web Speech API**.

Users can:

1. Click the microphone button.
2. Speak their question.
3. Receive an assistant response.
4. Listen to the response using speech synthesis.

> Voice features work best in Chrome-based browsers.

---

## 📄 Reports & Export

Users can generate and export their career information using:

* 📑 PDF reports
* 📊 CSV export

This makes it easier to save and review career analysis results.

---

## 🎨 Modern UI/UX

Nova Engine focuses heavily on an interactive and futuristic interface.

### UI Features

* Glassmorphism
* Neon-style visual effects
* Animated AI robot
* Particle background
* Responsive design
* Smooth transitions
* Hover animations
* Animated progress indicators
* Multiple themes
* Interactive recommendation cards
* Career dashboard

---

## 🏆 Achievement Badges

The platform includes rule-based achievement badges based on user skills and career readiness.

Examples include:

* 🐍 Python Master
* 🤖 ML Beginner
* 🚀 Career Ready
* 📚 Learning-focused achievements

---

## 🧭 AI Career Roadmap

Nova Engine generates a domain-specific career roadmap showing potential steps for improving skills and progressing toward a selected career direction.

---

# 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Chart.js
* tsParticles
* jsPDF
* Canvas Confetti
* Web Speech API

### Backend

* Python
* Flask
* Flask-CORS
* python-dotenv
* REST API

### Architecture

```text
                ┌─────────────────────────┐
                │       Nova Engine       │
                │   Career Platform       │
                └────────────┬────────────┘
                             │
                  ┌──────────▼──────────┐
                  │      Frontend       │
                  │ HTML/CSS/JavaScript │
                  └──────────┬──────────┘
                             │
                         REST API
                             │
                  ┌──────────▼──────────┐
                  │       Flask         │
                  │      Backend        │
                  └──────────┬──────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
       Recommendation   Skill Analysis   Career Scoring
             │               │                │
             └───────────────┼────────────────┘
                             │
                    Personalized Results
```

---

# 📁 Project Structure

```text
nova-project/
│
├── backend/
│   ├── app.py
│   ├── check_env.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── assistant.js
│   └── config.js
│
├── .gitignore
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/nova-engine.git
cd nova-engine
```

---

## 2. Create a Python Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

---

## 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file inside the `backend` folder:

```env
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=your_model_name
```

**Never commit your `.env` file or API keys to GitHub.**

---

## 5. Start the Backend

```bash
python app.py
```

The Flask backend will run on:

```text
http://127.0.0.1:5050
```

---

## 6. Start the Frontend

Open another terminal:

```bash
cd frontend
python -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

---

# 🔐 Security

API keys and environment variables should never be committed to the repository.

Add the following to `.gitignore`:

```gitignore
.env
__pycache__/
*.pyc
venv/
.venv/
```

If an API key has already been uploaded publicly, **revoke it and generate a new key immediately**.

---

# 📌 Current Implementation

Nova Engine currently uses **deterministic recommendation and scoring logic** for several career-analysis features.

The recommendation engine analyzes user inputs such as:

* Skills
* Technical domain
* Experience
* Programming language
* Internship preference
* Learning style

The system then generates personalized results from the available recommendation data.

The assistant and voice functionality provide an interactive layer on top of the generated career information.

---

# 🚀 Future Improvements

Possible future enhancements include:

* [ ] Real-time internship APIs
* [ ] Live job/internship listings
* [ ] Persistent user accounts
* [ ] Database integration
* [ ] Persistent favorites
* [ ] Real LLM-powered career assistant
* [ ] Advanced ML-based recommendation model
* [ ] Resume parsing
* [ ] Resume scoring
* [ ] LinkedIn profile analysis
* [ ] Automated skill extraction
* [ ] Real company application links
* [ ] Personalized learning-path generation
* [ ] Cloud deployment
* [ ] Mobile application

---

# 🎥 Project Demo

🎬 **YouTube Demo:**
*Add your YouTube video link here*

---

# 📸 Screenshots

Add screenshots of the following sections to make the repository more attractive:

* Home page
* User profile form
* Career dashboard
* Internship recommendations
* Project recommendations
* Skill-gap analysis
* AI assistant
* Career roadmap
* Charts and analytics

Example:

```markdown
![Nova Engine Dashboard](screenshots/dashboard.png)
```

---

# 🎓 Use Case

Nova Engine can be particularly useful for:

* B.Tech / engineering students
* College students looking for internships
* Beginners entering AI/ML
* Data Science learners
* Web developers
* Students preparing career roadmaps
* Learners looking for project ideas

---

# 👨‍💻 Developer

**Rohan Bhowmik**

B.Tech CSE | AI/ML | Data Science | Web Development

Interested in building practical solutions using **Artificial Intelligence, Machine Learning, Data Science, and modern web technologies.**

---

# ⭐ Support

If you find **Nova Engine** useful or interesting:

⭐ Star this repository
🍴 Fork the project
💬 Share your feedback
🚀 Follow for more AI/ML and Data Science projects

---

## 📄 License

This project is intended for educational and portfolio purposes.
