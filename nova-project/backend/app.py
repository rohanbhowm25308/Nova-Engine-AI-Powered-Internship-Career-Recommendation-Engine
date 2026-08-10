"""
Nova Engine — AI Recommendation Engine backend (v2)
Pure JSON REST API. All scoring/recommendation logic here is deterministic,
rule-based Python — not a live ML model or LLM call. It's structured so the
scoring functions can be swapped for a trained model later without changing
the API contract.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import os
import json
import urllib.request
import urllib.error

try:
    from dotenv import load_dotenv
    load_dotenv()  # reads a .env file in this same folder, if present
except ImportError:
    pass  # python-dotenv not installed — GROQ_API_KEY can still be set as a real env var

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Groq-powered chat (optional). Put your key in a `.env` file in this same
# backend/ folder (see .env.example) — it's loaded automatically above.
# Without it, /api/chat returns a 503 and the frontend automatically falls
# back to its built-in rule-based replies — the app still works either way.
# Get a free key at https://console.groq.com
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

ASSISTANT_SYSTEM_PROMPT = (
    "You are Nova, the AI career-guidance assistant embedded in a student "
    "recommendation-engine web app. You help with: choosing internships, "
    "project ideas, learning resources, and honest career advice — including "
    "open-ended questions like whether AI/ML, a specific domain, or a career "
    "path is a good fit for the user. Be encouraging but HONEST and BALANCED: "
    "mention real trade-offs and don't oversell any single field. Keep replies "
    "concise — 2 to 5 sentences, conversational, no markdown headers. If the "
    "user's profile or recommendation results are included below, use them to "
    "personalize your answer (reference their actual skills, domain, or "
    "readiness score); if that context is empty, answer generally and suggest "
    "they fill out the form for personalized advice."
)


def call_groq(messages, max_tokens=400):
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not configured on the server")
    body = json.dumps({
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.6,
    }).encode("utf-8")
    req = urllib.request.Request(GROQ_URL, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    req.add_header("Authorization", f"Bearer {GROQ_API_KEY}")
    # Cloudflare (which fronts api.groq.com) blocks requests carrying urllib's
    # default "Python-urllib/3.x" User-Agent as bot traffic (Cloudflare error
    # 1010). A normal-looking User-Agent avoids that entirely.
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()

# ---------------------------------------------------------------------------
# Domain dataset (internships / projects / resources)
# ---------------------------------------------------------------------------
DOMAINS = ["Web Development", "AI & Machine Learning", "Data Science", "Cybersecurity",
           "Mobile App Development", "Cloud Computing", "UI/UX Design", "Blockchain & Web3"]

GLOBAL_INTERNSHIPS = [
    {"role": "Google AI Internship", "company": "Google", "mode": "Hybrid", "size": "MNC",
     "duration": "3 Months", "rating": 4.9, "difficulty": "Advanced",
     "skills": ["Python", "Machine Learning", "TensorFlow"]},
    {"role": "Microsoft Internship", "company": "Microsoft", "mode": "Onsite", "size": "MNC",
     "duration": "3 Months", "rating": 4.8, "difficulty": "Intermediate",
     "skills": ["C++", "Cloud", "Data Structures"]},
    {"role": "IBM SkillsBuild Internship", "company": "IBM", "mode": "Remote", "size": "MNC",
     "duration": "2 Months", "rating": 4.6, "difficulty": "Beginner",
     "skills": ["Python", "Data Science", "SQL"]},
    {"role": "Deloitte Internship", "company": "Deloitte", "mode": "Hybrid", "size": "MNC",
     "duration": "2 Months", "rating": 4.5, "difficulty": "Intermediate",
     "skills": ["Excel", "Analytics", "Communication"]},
    {"role": "TCS Research Internship", "company": "TCS", "mode": "Remote", "size": "MNC",
     "duration": "3 Months", "rating": 4.4, "difficulty": "Advanced",
     "skills": ["Research", "Python", "Machine Learning"]},
]

DOMAIN_INTERNSHIPS = {
    "Web Development": [
        {"role": "Frontend Engineering Intern", "company": "Early-stage SaaS startup", "mode": "Remote", "size": "Startup", "duration": "2 Months", "rating": 4.3, "difficulty": "Beginner", "skills": ["React", "CSS", "JavaScript"]},
        {"role": "Full-Stack Developer Intern", "company": "Digital agency", "mode": "Hybrid", "size": "Product Company", "duration": "3 Months", "rating": 4.5, "difficulty": "Intermediate", "skills": ["Node.js", "React", "MongoDB"]},
    ],
    "AI & Machine Learning": [
        {"role": "Machine Learning Research Intern", "company": "AI research lab", "mode": "Remote", "size": "Startup", "duration": "3 Months", "rating": 4.7, "difficulty": "Advanced", "skills": ["Python", "PyTorch", "Math"]},
        {"role": "Applied ML Intern", "company": "Product team at a tech company", "mode": "Hybrid", "size": "Product Company", "duration": "2 Months", "rating": 4.6, "difficulty": "Intermediate", "skills": ["Python", "Machine Learning"]},
    ],
    "Data Science": [
        {"role": "Data Analyst Intern", "company": "Retail analytics team", "mode": "Onsite", "size": "MNC", "duration": "2 Months", "rating": 4.2, "difficulty": "Beginner", "skills": ["SQL", "Python", "Excel"]},
        {"role": "Data Science Intern", "company": "FinTech company", "mode": "Hybrid", "size": "Product Company", "duration": "3 Months", "rating": 4.5, "difficulty": "Intermediate", "skills": ["Python", "Statistics", "Pandas"]},
    ],
    "Cybersecurity": [
        {"role": "SOC Analyst Intern", "company": "Managed security provider", "mode": "Onsite", "size": "MNC", "duration": "2 Months", "rating": 4.3, "difficulty": "Beginner", "skills": ["Networking", "Linux"]},
        {"role": "Application Security Intern", "company": "SaaS company", "mode": "Remote", "size": "Startup", "duration": "3 Months", "rating": 4.4, "difficulty": "Advanced", "skills": ["OWASP", "Python"]},
    ],
    "Mobile App Development": [
        {"role": "Android Developer Intern", "company": "Consumer app startup", "mode": "Remote", "size": "Startup", "duration": "2 Months", "rating": 4.3, "difficulty": "Beginner", "skills": ["Kotlin", "Android SDK"]},
        {"role": "iOS Developer Intern", "company": "Health-tech company", "mode": "Hybrid", "size": "Product Company", "duration": "3 Months", "rating": 4.5, "difficulty": "Intermediate", "skills": ["Swift", "SwiftUI"]},
    ],
    "Cloud Computing": [
        {"role": "Cloud Infrastructure Intern", "company": "Platform engineering team", "mode": "Remote", "size": "MNC", "duration": "3 Months", "rating": 4.4, "difficulty": "Intermediate", "skills": ["AWS", "Terraform"]},
        {"role": "DevOps Intern", "company": "Fast-growing startup", "mode": "Hybrid", "size": "Startup", "duration": "2 Months", "rating": 4.3, "difficulty": "Beginner", "skills": ["Docker", "CI/CD"]},
    ],
    "UI/UX Design": [
        {"role": "Product Design Intern", "company": "Consumer app startup", "mode": "Remote", "size": "Startup", "duration": "2 Months", "rating": 4.4, "difficulty": "Beginner", "skills": ["Figma", "Prototyping"]},
        {"role": "UX Research Intern", "company": "Enterprise software company", "mode": "Onsite", "size": "MNC", "duration": "3 Months", "rating": 4.5, "difficulty": "Intermediate", "skills": ["User Research", "Figma"]},
    ],
    "Blockchain & Web3": [
        {"role": "Smart Contract Developer Intern", "company": "DeFi protocol team", "mode": "Remote", "size": "Startup", "duration": "3 Months", "rating": 4.5, "difficulty": "Advanced", "skills": ["Solidity", "Ethereum"]},
        {"role": "Web3 Frontend Intern", "company": "NFT / dApp startup", "mode": "Hybrid", "size": "Startup", "duration": "2 Months", "rating": 4.2, "difficulty": "Intermediate", "skills": ["React", "Ethers.js"]},
    ],
}

# difficulty-tiered project pools. AI & Machine Learning uses the exact
# example set requested; other domains get an equivalent 3-tier pool.
DOMAIN_PROJECTS = {
    "Web Development": {
        "Beginner": [{"title": "Portfolio Website", "skills": ["HTML", "CSS"], "time": "1 Week"},
                     {"title": "Weather App", "skills": ["JavaScript", "API"], "time": "1 Week"}],
        "Intermediate": [{"title": "E-commerce Storefront", "skills": ["React", "Node.js"], "time": "3 Weeks"},
                          {"title": "Real-time Chat App", "skills": ["WebSockets", "React"], "time": "2 Weeks"}],
        "Advanced": [{"title": "Server-Rendered Blog Platform", "skills": ["Next.js", "SEO"], "time": "4 Weeks"},
                     {"title": "Component Library + Design System", "skills": ["React", "Storybook"], "time": "4 Weeks"}],
    },
    "AI & Machine Learning": {
        "Beginner": [{"title": "Calculator", "skills": ["Python"], "time": "3 Days"},
                     {"title": "Portfolio", "skills": ["HTML", "CSS"], "time": "1 Week"},
                     {"title": "Weather App", "skills": ["Python", "API"], "time": "1 Week"}],
        "Intermediate": [{"title": "Chatbot", "skills": ["Python", "NLP"], "time": "2 Weeks"},
                          {"title": "Resume Screening Tool", "skills": ["Python", "NLP"], "time": "2 Weeks"},
                          {"title": "Sentiment Analysis", "skills": ["Python", "Scikit-learn"], "time": "2 Weeks"}],
        "Advanced": [{"title": "Multi-Agent AI System", "skills": ["Python", "LLMs"], "time": "4 Weeks"},
                     {"title": "RAG Chatbot", "skills": ["Python", "Embeddings", "Vector DB"], "time": "3 Weeks"},
                     {"title": "Recommendation System", "skills": ["Python", "Collaborative Filtering"], "time": "3 Weeks"},
                     {"title": "LLM Application", "skills": ["Python", "Prompt Engineering"], "time": "3 Weeks"}],
    },
    "Data Science": {
        "Beginner": [{"title": "Exploratory Data Analysis Report", "skills": ["Pandas", "Matplotlib"], "time": "1 Week"},
                     {"title": "Titanic Survival Prediction", "skills": ["Python", "Scikit-learn"], "time": "1 Week"}],
        "Intermediate": [{"title": "Sales Forecasting Model", "skills": ["Python", "Time Series"], "time": "2 Weeks"},
                          {"title": "Customer Segmentation", "skills": ["K-Means", "Pandas"], "time": "2 Weeks"}],
        "Advanced": [{"title": "End-to-End Analytics Pipeline", "skills": ["Airflow", "SQL"], "time": "4 Weeks"},
                     {"title": "A/B Testing Toolkit", "skills": ["Statistics", "Python"], "time": "3 Weeks"}],
    },
    "Cybersecurity": {
        "Beginner": [{"title": "Vulnerable VM Walkthrough", "skills": ["Linux"], "time": "1 Week"},
                     {"title": "Password Policy Auditor", "skills": ["Python"], "time": "1 Week"}],
        "Intermediate": [{"title": "Network Anomaly Detector", "skills": ["Python", "Wireshark"], "time": "2 Weeks"},
                          {"title": "CTF Write-up Portfolio", "skills": ["Security Basics"], "time": "2 Weeks"}],
        "Advanced": [{"title": "Automated Security Scanner", "skills": ["Python", "OWASP"], "time": "3 Weeks"},
                     {"title": "SOC Detection Rules Pack", "skills": ["SIEM"], "time": "3 Weeks"}],
    },
    "Mobile App Development": {
        "Beginner": [{"title": "Habit Tracker App", "skills": ["Kotlin"], "time": "1 Week"},
                     {"title": "Notes App", "skills": ["Swift"], "time": "1 Week"}],
        "Intermediate": [{"title": "Offline-First Notes App", "skills": ["SQLite"], "time": "2 Weeks"},
                          {"title": "Chat App with Push Notifications", "skills": ["Firebase"], "time": "2 Weeks"}],
        "Advanced": [{"title": "AR Measurement Tool", "skills": ["ARKit/ARCore"], "time": "4 Weeks"},
                     {"title": "Cross-Platform Expense Tracker", "skills": ["Flutter"], "time": "3 Weeks"}],
    },
    "Cloud Computing": {
        "Beginner": [{"title": "Dockerized Multi-Service App", "skills": ["Docker"], "time": "1 Week"},
                     {"title": "Static Site CI/CD", "skills": ["GitHub Actions"], "time": "1 Week"}],
        "Intermediate": [{"title": "CI/CD Pipeline From Scratch", "skills": ["Jenkins"], "time": "2 Weeks"},
                          {"title": "Infra-as-Code Templates", "skills": ["Terraform"], "time": "2 Weeks"}],
        "Advanced": [{"title": "Kubernetes Autoscaling Cluster", "skills": ["K8s"], "time": "4 Weeks"},
                     {"title": "Full Observability Stack", "skills": ["Prometheus", "Grafana"], "time": "3 Weeks"}],
    },
    "UI/UX Design": {
        "Beginner": [{"title": "Redesign Case Study", "skills": ["Figma"], "time": "1 Week"},
                     {"title": "Mobile App Wireframes", "skills": ["Figma"], "time": "1 Week"}],
        "Intermediate": [{"title": "Design System Starter Kit", "skills": ["Figma", "Tokens"], "time": "2 Weeks"},
                          {"title": "Usability Test & Report", "skills": ["Research"], "time": "2 Weeks"}],
        "Advanced": [{"title": "High-Fidelity App Prototype", "skills": ["Figma", "Motion"], "time": "3 Weeks"},
                     {"title": "Accessibility Audit", "skills": ["WCAG"], "time": "3 Weeks"}],
    },
    "Blockchain & Web3": {
        "Beginner": [{"title": "ERC-20 Token + Faucet", "skills": ["Solidity"], "time": "1 Week"},
                     {"title": "NFT Metadata Viewer", "skills": ["Web3.js"], "time": "1 Week"}],
        "Intermediate": [{"title": "NFT Minting dApp", "skills": ["Solidity", "React"], "time": "2 Weeks"},
                          {"title": "Decentralized Voting App", "skills": ["Solidity"], "time": "2 Weeks"}],
        "Advanced": [{"title": "DeFi Staking Contract", "skills": ["Solidity", "Testing"], "time": "3 Weeks"},
                     {"title": "Multi-sig Wallet", "skills": ["Solidity", "Security"], "time": "4 Weeks"}],
    },
}

RESOURCE_PLATFORMS = ["YouTube", "Coursera", "Udemy", "IBM SkillsBuild", "Kaggle", "freeCodeCamp", "Documentation"]

DOMAIN_RESOURCES = {
    "Web Development": [
        {"title": "Full-Stack Open", "platform": "Documentation", "duration": "40 hrs", "price": "Free"},
        {"title": "The Complete Web Developer Course", "platform": "Udemy", "duration": "30 hrs", "price": "Paid"},
        {"title": "responsive Web Design", "platform": "freeCodeCamp", "duration": "20 hrs", "price": "Free"},
    ],
    "AI & Machine Learning": [
        {"title": "Machine Learning Specialization", "platform": "Coursera", "duration": "60 hrs", "price": "Paid"},
        {"title": "Intro to Deep Learning", "platform": "YouTube", "duration": "12 hrs", "price": "Free"},
        {"title": "AI Foundations", "platform": "IBM SkillsBuild", "duration": "15 hrs", "price": "Free"},
    ],
    "Data Science": [
        {"title": "Data Science Micro-courses", "platform": "Kaggle", "duration": "10 hrs", "price": "Free"},
        {"title": "Python for Data Science", "platform": "Coursera", "duration": "25 hrs", "price": "Paid"},
        {"title": "SQL for Data Analysis", "platform": "Udemy", "duration": "12 hrs", "price": "Paid"},
    ],
    "Cybersecurity": [
        {"title": "Cybersecurity Fundamentals", "platform": "IBM SkillsBuild", "duration": "15 hrs", "price": "Free"},
        {"title": "Ethical Hacking Bootcamp", "platform": "Udemy", "duration": "35 hrs", "price": "Paid"},
        {"title": "OWASP Top 10 Explained", "platform": "YouTube", "duration": "4 hrs", "price": "Free"},
    ],
    "Mobile App Development": [
        {"title": "Android Basics", "platform": "Documentation", "duration": "20 hrs", "price": "Free"},
        {"title": "100 Days of SwiftUI", "platform": "YouTube", "duration": "50 hrs", "price": "Free"},
        {"title": "Flutter Complete Guide", "platform": "Udemy", "duration": "40 hrs", "price": "Paid"},
    ],
    "Cloud Computing": [
        {"title": "AWS Cloud Practitioner", "platform": "Coursera", "duration": "20 hrs", "price": "Paid"},
        {"title": "Docker & Kubernetes Crash Course", "platform": "YouTube", "duration": "8 hrs", "price": "Free"},
        {"title": "Terraform Docs Walkthrough", "platform": "Documentation", "duration": "6 hrs", "price": "Free"},
    ],
    "UI/UX Design": [
        {"title": "Google UX Design Certificate", "platform": "Coursera", "duration": "80 hrs", "price": "Paid"},
        {"title": "Figma for Beginners", "platform": "YouTube", "duration": "5 hrs", "price": "Free"},
        {"title": "UX Research Methods", "platform": "Udemy", "duration": "10 hrs", "price": "Paid"},
    ],
    "Blockchain & Web3": [
        {"title": "CryptoZombies", "platform": "Documentation", "duration": "10 hrs", "price": "Free"},
        {"title": "Solidity & Smart Contracts", "platform": "Udemy", "duration": "20 hrs", "price": "Paid"},
        {"title": "Ethereum Dev Bootcamp", "platform": "YouTube", "duration": "15 hrs", "price": "Free"},
    ],
}

# Skill categories used for the skill radar / gap analysis. Each maps to
# keywords we look for (case-insensitive substring match) in the user's
# entered skills + preferred language.
SKILL_CATEGORIES = {
    "Python": ["python", "django", "flask", "pandas", "numpy"],
    "Machine Learning": ["ml", "machine learning", "scikit", "tensorflow", "pytorch", "keras", "deep learning", "nlp"],
    "Data Science": ["data science", "pandas", "numpy", "statistics", "tableau", "power bi", "excel"],
    "Web Development": ["html", "css", "javascript", "react", "node", "vue", "angular", "typescript", "next.js"],
    "Cloud Computing": ["aws", "azure", "gcp", "cloud"],
    "Cybersecurity": ["security", "owasp", "networking", "linux", "pentest", "cybersecurity"],
    "Mobile": ["kotlin", "swift", "flutter", "android", "ios", "react native"],
    "Design": ["figma", "ui", "ux", "design", "prototyping"],
}

# Primary keyword(s) = a direct, unambiguous match for the category (typing
# this basically means "I know this"). Secondary = related/adjacent skills
# that suggest partial exposure. This split is what lets an exact match like
# typing "Python" score near 100%, instead of being averaged down.
SKILL_CATEGORY_SPEC = {
    "Python":                 {"primary": ["python"], "secondary": ["django", "flask", "pandas", "numpy"]},
    "JavaScript / Web":       {"primary": ["javascript", "web development"], "secondary": ["html", "css", "react", "node", "vue", "angular", "typescript", "next.js"]},
    "Machine Learning":       {"primary": ["machine learning", "ml"], "secondary": ["scikit-learn", "scikit", "tensorflow", "pytorch", "keras", "deep learning", "nlp", "computer vision"]},
    "Data Science":           {"primary": ["data science"], "secondary": ["pandas", "numpy", "statistics", "tableau", "power bi", "excel"]},
    "Databases & SQL":        {"primary": ["sql", "database"], "secondary": ["mongodb", "postgresql", "mysql", "nosql"]},
    "Cloud Computing":        {"primary": ["cloud", "aws", "azure", "gcp"], "secondary": ["cloud computing"]},
    "DevOps":                 {"primary": ["devops"], "secondary": ["docker", "kubernetes", "ci/cd", "jenkins", "terraform"]},
    "Cybersecurity":          {"primary": ["cybersecurity", "security"], "secondary": ["networking", "owasp", "penetration testing", "linux"]},
    "Mobile Development":     {"primary": ["mobile"], "secondary": ["kotlin", "swift", "flutter", "android", "ios", "react native"]},
    "UI/UX Design":           {"primary": ["design", "ui design", "ux"], "secondary": ["figma", "prototyping", "user research"]},
    "DSA":                    {"primary": ["dsa", "data structures", "algorithms"], "secondary": ["competitive programming", "leetcode"]},
    "Game Development":       {"primary": ["game development", "unity", "unreal"], "secondary": ["c#", "game design"]},
    "Systems (C/C++)":        {"primary": ["c++", "c"], "secondary": ["embedded c", "embedded", "microcontroller", "systems programming"]},
    "Blockchain & Web3":      {"primary": ["blockchain", "solidity", "web3"], "secondary": ["ethereum", "smart contracts"]},
    "Product Management":     {"primary": ["product management", "agile", "scrum"], "secondary": ["roadmapping"]},
    "Digital Marketing":      {"primary": ["digital marketing", "seo"], "secondary": ["content strategy", "analytics", "social media"]},
}

CORE_STACK = {
    "Web Development": ["HTML", "CSS", "JavaScript", "React", "Git"],
    "AI & Machine Learning": ["Python", "Machine Learning", "NumPy", "Pandas", "Git"],
    "Data Science": ["Python", "SQL", "Pandas", "Statistics", "Git"],
    "Cybersecurity": ["Networking", "Linux", "Python", "OWASP", "Git"],
    "Mobile App Development": ["Kotlin", "Swift", "Git", "REST APIs", "UI Design"],
    "Cloud Computing": ["Docker", "AWS", "Terraform", "CI/CD", "Linux"],
    "UI/UX Design": ["Figma", "User Research", "Prototyping", "Design Systems", "HTML"],
    "Blockchain & Web3": ["Solidity", "Ethereum", "JavaScript", "Web3.js", "Git"],
}

ROADMAPS = {
    "AI & Machine Learning": ["Python", "Statistics & Math", "Machine Learning", "Deep Learning", "LLMs", "Agentic AI", "ML Engineer"],
    "Data Science": ["Python", "SQL", "Statistics", "Pandas & Visualization", "Machine Learning", "Data Scientist"],
    "Web Development": ["HTML/CSS", "JavaScript", "React", "Backend (Node)", "Databases", "Full-Stack Developer"],
    "Cybersecurity": ["Networking", "Linux", "Security Fundamentals", "Pentesting", "Security Engineer"],
    "Mobile App Development": ["Programming Basics", "Kotlin/Swift", "UI Frameworks", "APIs", "Mobile Engineer"],
    "Cloud Computing": ["Linux", "Networking", "Docker", "Kubernetes", "CI/CD", "DevOps Engineer"],
    "UI/UX Design": ["Design Fundamentals", "Figma", "User Research", "Prototyping", "Product Designer"],
    "Blockchain & Web3": ["JavaScript", "Solidity", "Smart Contracts", "Security", "Blockchain Developer"],
}

# ---------------------------------------------------------------------------
# Additional domains — generated from a template so every one is fully
# functional (has internships/projects/resources/core stack/roadmap) without
# hand-authoring hundreds of items. The original 8 domains above keep their
# hand-curated content; these get a consistent, still-varied generated set.
# ---------------------------------------------------------------------------
NEW_DOMAINS = [
    {"name": "Frontend Development", "core": ["HTML", "CSS", "JavaScript", "React", "Git"],
     "roadmap": ["HTML/CSS", "JavaScript", "React", "State Management", "Testing", "Frontend Engineer"]},
    {"name": "Backend Development", "core": ["Node.js", "Python", "Databases", "REST APIs", "Git"],
     "roadmap": ["Programming Basics", "Databases", "APIs", "Authentication", "Scalability", "Backend Engineer"]},
    {"name": "Full Stack Development", "core": ["HTML", "JavaScript", "React", "Node.js", "Databases"],
     "roadmap": ["Frontend Basics", "Backend Basics", "Databases", "APIs", "Deployment", "Full-Stack Developer"]},
    {"name": "DevOps", "core": ["Linux", "Docker", "Kubernetes", "CI/CD", "Scripting"],
     "roadmap": ["Linux", "Scripting", "Docker", "CI/CD", "Kubernetes", "DevOps Engineer"]},
    {"name": "Data Engineering", "core": ["SQL", "Python", "ETL", "Spark", "Airflow"],
     "roadmap": ["SQL", "Python", "ETL Pipelines", "Big Data Tools", "Orchestration", "Data Engineer"]},
    {"name": "Data Structures & Algorithms", "core": ["DSA", "C++", "Problem Solving", "Competitive Programming", "Git"],
     "roadmap": ["Basic Programming", "Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Competitive Practice", "SDE Ready"]},
    {"name": "Game Development", "core": ["C#", "Unity", "Game Design", "Physics", "Git"],
     "roadmap": ["Programming Basics", "Unity/Unreal", "Game Design", "Physics & Animation", "Polish & Publish", "Game Developer"]},
    {"name": "AR/VR Development", "core": ["Unity", "ARKit", "ARCore", "3D Modeling", "C#"],
     "roadmap": ["3D Basics", "Unity", "AR Frameworks", "VR SDKs", "Interaction Design", "AR/VR Developer"]},
    {"name": "Embedded Systems & IoT", "core": ["Embedded C", "Microcontrollers", "IoT Protocols", "Circuit Design", "Git"],
     "roadmap": ["Electronics Basics", "Embedded C", "Microcontrollers", "IoT Protocols", "Real Projects", "Embedded Engineer"]},
    {"name": "Product Management", "core": ["Roadmapping", "Agile", "User Research", "Analytics", "Communication"],
     "roadmap": ["Product Fundamentals", "User Research", "Roadmapping", "Analytics", "Stakeholder Management", "Product Manager"]},
    {"name": "Digital Marketing", "core": ["SEO", "Content Strategy", "Analytics", "Social Media", "Communication"],
     "roadmap": ["Marketing Fundamentals", "SEO", "Content Strategy", "Analytics", "Campaign Management", "Marketing Specialist"]},
]

_COMPANY_FLAVORS = ["Growing tech startup", "Product team at a mid-size company", "Innovation lab",
                    "Digital-first agency", "Enterprise engineering team"]
_MODES = ["Remote", "Hybrid", "Onsite"]
_SIZES = ["Startup", "Product Company", "MNC"]

for i, spec in enumerate(NEW_DOMAINS):
    name = spec["name"]
    core = spec["core"]
    rng = random.Random(len(name) * 7 + i)
    DOMAINS.append(name)
    CORE_STACK[name] = core
    ROADMAPS[name] = spec["roadmap"]

    DOMAIN_INTERNSHIPS[name] = [
        {"role": f"{name} Intern", "company": rng.choice(_COMPANY_FLAVORS),
         "mode": rng.choice(_MODES), "size": rng.choice(_SIZES), "duration": rng.choice(["2 Months", "3 Months"]),
         "rating": round(rng.uniform(4.1, 4.8), 1), "difficulty": rng.choice(["Beginner", "Intermediate"]),
         "skills": core[:3]},
        {"role": f"{name} Research Intern", "company": rng.choice(_COMPANY_FLAVORS),
         "mode": rng.choice(_MODES), "size": rng.choice(_SIZES), "duration": rng.choice(["2 Months", "3 Months"]),
         "rating": round(rng.uniform(4.1, 4.8), 1), "difficulty": rng.choice(["Intermediate", "Advanced"]),
         "skills": core[1:4]},
    ]

    DOMAIN_PROJECTS[name] = {
        "Beginner": [
            {"title": f"{name} Fundamentals Project", "skills": core[:2], "time": "1 Week"},
            {"title": f"{name} Mini App", "skills": core[:2], "time": "1 Week"},
        ],
        "Intermediate": [
            {"title": f"{name} Capstone Build", "skills": core[1:3], "time": "2 Weeks"},
            {"title": f"Applied {name} Project", "skills": core[1:3], "time": "2 Weeks"},
        ],
        "Advanced": [
            {"title": f"Production-Grade {name} System", "skills": core[2:4] or core, "time": "4 Weeks"},
            {"title": f"Advanced {name} Case Study", "skills": core[2:4] or core, "time": "3 Weeks"},
        ],
    }

    DOMAIN_RESOURCES[name] = [
        {"title": f"{name} Crash Course", "platform": "YouTube", "duration": "6 hrs", "price": "Free"},
        {"title": f"{name} Specialization", "platform": "Coursera", "duration": "30 hrs", "price": "Paid"},
        {"title": f"{name} Bootcamp", "platform": "Udemy", "duration": "20 hrs", "price": "Paid"},
    ]

EXP_WEIGHT = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
VALID_YEARS = {"1st Year", "2nd Year", "3rd Year", "Final Year", "Graduate"}


# ---------------------------------------------------------------------------
# Scoring logic
# ---------------------------------------------------------------------------
def compute_skill_scores(skills, language):
    """A skill the user actually typed should dominate the chart — a direct
    ("primary") match scores 90-98%, a related ("secondary") skill scores
    55-78% depending on how many secondary hits there are, and categories
    with zero evidence get a small, deliberately low deterministic baseline
    (never enough to look like a real signal)."""
    known = [s.strip().lower() for s in skills if s and s.strip()]
    if language and language.strip():
        known.append(language.strip().lower())

    def any_match(keyword):
        # Short keywords (like "c", "r", "ml", "go") must match a whole
        # known skill exactly — substring matching on a 1-2 char keyword
        # produces false positives ("c" inside "javascript", "ml" inside
        # "html"). Longer keywords are safe to substring-match both ways.
        if len(keyword) <= 2:
            return keyword in known
        return any(keyword == k or keyword in k or k in keyword for k in known)

    scores = {}
    for cat, spec in SKILL_CATEGORY_SPEC.items():
        primary_hit = any(any_match(kw) for kw in spec["primary"])
        secondary_hits = sum(1 for kw in spec["secondary"] if any_match(kw))

        if primary_hit and secondary_hits >= 2:
            score = 98
        elif primary_hit and secondary_hits >= 1:
            score = 94
        elif primary_hit:
            score = 100
        elif secondary_hits >= 3:
            score = 78
        elif secondary_hits == 2:
            score = 66
        elif secondary_hits == 1:
            score = 55
        else:
            # No evidence at all — small, clearly-non-competing baseline so
            # the chart doesn't look empty, but it never rivals a real match.
            seed = (sum(ord(c) for c in cat) + len(known) * 3) % 9
            score = 4 + seed  # 4-12
        scores[cat] = score
    return scores


def compute_dashboard(profile, skill_scores):
    domain = profile["domain"]
    exp_w = EXP_WEIGHT.get(profile["experience"], 2)
    n_skills = len(profile["skills"])

    avg_skill = sum(skill_scores.values()) / len(skill_scores)
    domain_cat_map = {
        "Web Development": "JavaScript / Web", "AI & Machine Learning": "Machine Learning",
        "Data Science": "Data Science", "Cybersecurity": "Cybersecurity",
        "Mobile App Development": "Mobile Development", "Cloud Computing": "Cloud Computing",
        "UI/UX Design": "UI/UX Design", "Blockchain & Web3": "Blockchain & Web3",
        "Frontend Development": "JavaScript / Web", "Backend Development": "JavaScript / Web",
        "Full Stack Development": "JavaScript / Web", "DevOps": "DevOps",
        "Data Engineering": "Databases & SQL", "Data Structures & Algorithms": "DSA",
        "Game Development": "Game Development", "AR/VR Development": "Game Development",
        "Embedded Systems & IoT": "Systems (C/C++)", "Product Management": "Product Management",
        "Digital Marketing": "Digital Marketing",
    }
    match_percent = min(98, round(skill_scores.get(domain_cat_map.get(domain, "Python"), 40) * 0.7 + exp_w * 8))
    career_readiness = min(98, round(40 + exp_w * 12 + min(n_skills * 5, 25) + avg_skill * 0.15))
    internship_readiness = min(98, round((career_readiness + match_percent) / 2))
    learning_progress = min(98, round(30 + exp_w * 20 + min(n_skills * 3, 15)))

    return {
        "skills_score": round(avg_skill),
        "match_percent": match_percent,
        "career_readiness": career_readiness,
        "internship_readiness": internship_readiness,
        "learning_progress": learning_progress,
    }


def compute_skill_gap(domain, skills, language=None):
    # A skill is "known" whether it came from the free-typed skills list or
    # from the Preferred Language dropdown — both represent things the user
    # actually told us they know, so both should count here.
    known = list(skills) + ([language] if language else [])
    have = {s.lower() for s in known}
    core = CORE_STACK.get(domain, [])
    missing = [c for c in core if c.lower() not in have]
    have_display = known[:6]
    return {"have": have_display, "missing": missing[:5]}


def compute_badges(profile, dash):
    badges = ["AI Explorer"]
    known = list(profile["skills"]) + ([profile["language"]] if profile.get("language") else [])
    skills_lower = [s.lower() for s in known]
    if "python" in skills_lower:
        badges.append("Python Master")
    if profile["domain"] == "AI & Machine Learning" and profile["experience"] == "Beginner":
        badges.append("ML Beginner")
    if profile["experience"] == "Advanced":
        badges.append("Future Engineer")
    if dash["career_readiness"] >= 80:
        badges.append("Career Ready")
    return badges


def compute_insights(profile, dash, gap):
    domain = profile["domain"]
    insights = []
    if profile["skills"]:
        insights.append(f"You show solid strength in {profile['skills'][0]} for {domain}.")
    if gap["missing"]:
        insights.append(f"Consider learning {', '.join(gap['missing'][:2])} to round out your {domain} skill set.")
    if dash["career_readiness"] >= 75:
        insights.append(f"You're ready to start applying for {domain} internships.")
    else:
        insights.append(f"Build 1-2 more projects in {domain} before applying broadly.")
    roadmap = ROADMAPS.get(domain, [])
    if roadmap:
        insights.append(f"Recommended long-term path: {roadmap[-1]}.")
    return insights


def build_match_score(seed, idx):
    base = 96 - idx * 4
    jitter = ((seed + idx * 17) % 7) - 3
    return max(75, min(98, base + jitter))


_TOPUP_COMPANIES = ["TechNova Labs", "ByteWorks", "InnovateX", "CloudNine Systems", "Nexus Softwares",
                     "PixelForge Studio", "DataSphere Inc.", "CodeCraft Technologies", "NextGen Solutions",
                     "BluePeak Digital"]
_TOPUP_MODES = ["Remote", "Hybrid", "Onsite"]
_TOPUP_SIZES = ["Startup", "Product Company", "MNC"]
_TOPUP_DURATIONS = ["1 Month", "2 Months", "3 Months"]
_TOPUP_DIFFS = ["Beginner", "Intermediate", "Advanced"]


def top_up_internships(domain, pool, target, seed):
    """Ensure at least `target` internships, cycling modes so the final
    list is always a genuine Remote/Hybrid/Onsite mix, not a fluke."""
    rng = random.Random(seed + 99)
    base_skills = (pool[0]["skills"] if pool else [domain])[:3]
    i = 0
    while len(pool) < target:
        company = _TOPUP_COMPANIES[i % len(_TOPUP_COMPANIES)]
        pool.append({
            "role": f"{domain} Intern",
            "company": company,
            "mode": _TOPUP_MODES[i % 3],                      # forces even mode rotation
            "size": rng.choice(_TOPUP_SIZES),
            "duration": rng.choice(_TOPUP_DURATIONS),
            "rating": round(rng.uniform(4.0, 4.9), 1),
            "difficulty": rng.choice(_TOPUP_DIFFS),
            "skills": base_skills,
        })
        i += 1
    return pool


def top_up_projects(domain, pool, target, seed):
    rng = random.Random(seed + 199)
    tiers = ["Beginner", "Intermediate", "Advanced"]
    i = 0
    while len(pool) < target:
        tier = tiers[i % 3]
        pool.append({
            "title": f"{domain} Practice Project #{i+1}",
            "skills": CORE_STACK.get(domain, [domain])[:2],
            "time": rng.choice(["1 Week", "2 Weeks", "3 Weeks"]),
            "difficulty": tier,
        })
        i += 1
    return pool


def top_up_resources(domain, pool, target, seed):
    rng = random.Random(seed + 299)
    i = 0
    while len(pool) < target:
        platform = RESOURCE_PLATFORMS[i % len(RESOURCE_PLATFORMS)]
        pool.append({
            "title": f"{domain} Deep Dive #{i+1}",
            "platform": platform,
            "duration": rng.choice(["4 hrs", "8 hrs", "15 hrs", "25 hrs"]),
            "price": rng.choice(["Free", "Paid"]),
        })
        i += 1
    return pool


def generate_recommendations(profile):
    domain = profile["domain"]
    experience = profile["experience"]
    skills = profile["skills"]
    language = profile["language"]

    seed = (len(profile["name"]) * 13 + len(skills) * 7 + len(profile["year"])) or 5
    rng = random.Random(seed)

    TARGET = 10

    # Internships: domain-specific + global big-name ones, topped up so
    # there are always TARGET items with a real Remote/Hybrid/Onsite mix.
    pool = DOMAIN_INTERNSHIPS.get(domain, [])[:] + GLOBAL_INTERNSHIPS[:]
    pool = [dict(p) for p in pool]  # don't mutate the shared dataset
    pool = top_up_internships(domain, pool, TARGET, seed)
    rng.shuffle(pool)
    internships = pool[:TARGET]
    for i, item in enumerate(internships):
        item["match"] = build_match_score(seed, i)

    # Projects: matching difficulty tier + neighbors, topped up to TARGET
    tier_order = ["Beginner", "Intermediate", "Advanced"]
    tier_idx = tier_order.index(experience) if experience in tier_order else 1
    project_pool = []
    for offset in (0, -1, 1):
        t = tier_idx + offset
        if 0 <= t < len(tier_order):
            for p in DOMAIN_PROJECTS.get(domain, {}).get(tier_order[t], []):
                project_pool.append({**p, "difficulty": tier_order[t]})
    project_pool = top_up_projects(domain, project_pool, TARGET, seed)
    rng2 = random.Random(seed + 1)
    rng2.shuffle(project_pool)
    projects = project_pool[:TARGET]
    for i, item in enumerate(projects):
        item["match"] = build_match_score(seed + 1, i)

    # Resources, topped up to TARGET
    res_pool = DOMAIN_RESOURCES.get(domain, [])[:]
    res_pool = top_up_resources(domain, res_pool, TARGET, seed)
    rng3 = random.Random(seed + 2)
    rng3.shuffle(res_pool)
    resources = res_pool[:TARGET]
    for i, item in enumerate(resources):
        item["match"] = build_match_score(seed + 2, i)

    skill_scores = compute_skill_scores(skills, language)
    dashboard = compute_dashboard(profile, skill_scores)
    gap = compute_skill_gap(domain, skills, profile.get("language"))
    badges = compute_badges(profile, dashboard)
    insights = compute_insights(profile, dashboard, gap)
    roadmap = ROADMAPS.get(domain, [])

    # chart-ready data
    radar = [{"label": k, "value": v} for k, v in skill_scores.items()]
    pop_rng = random.Random(7)
    raw_weights = [pop_rng.uniform(3, 25) for _ in DOMAINS]
    total_w = sum(raw_weights)
    domain_popularity = [{"label": d, "value": round(w / total_w * 100, 1)}
                          for d, w in zip(DOMAINS, raw_weights)]
    recommendation_pie = [
        {"label": "Internships", "value": len(internships)},
        {"label": "Projects", "value": len(projects)},
        {"label": "Resources", "value": len(resources)},
    ]
    modes = {}
    for it in internships:
        modes[it["mode"]] = modes.get(it["mode"], 0) + 1
    internship_distribution = [{"label": k, "value": v} for k, v in modes.items()]
    learning_trend = [max(5, dashboard["learning_progress"] - (5 - i) * 8) for i in range(6)]

    match_meter = sorted(radar, key=lambda x: -x["value"])[:3]
    match_meter = [{"label": m["label"], "percent": m["value"], "stars": round(m["value"] / 20)} for m in match_meter]

    return {
        "internships": internships,
        "projects": projects,
        "resources": resources,
        "dashboard": dashboard,
        "skill_scores": skill_scores,
        "skill_gap": gap,
        "badges": badges,
        "insights": insights,
        "roadmap": roadmap,
        "match_meter": match_meter,
        "charts": {
            "radar": radar,
            "domain_popularity": domain_popularity,
            "recommendation_pie": recommendation_pie,
            "internship_distribution": internship_distribution,
            "learning_trend": learning_trend,
        },
    }


@app.route("/")
def index():
    return jsonify({"service": "Nova Engine API", "status": "ok",
                     "endpoints": ["/api/domains", "/api/recommend", "/api/chat", "/api/chat-status"]})


@app.route("/api/domains", methods=["GET"])
def api_domains():
    return jsonify({"domains": DOMAINS})


@app.route("/api/chat-status", methods=["GET"])
def api_chat_status():
    return jsonify({"configured": bool(GROQ_API_KEY), "model": GROQ_MODEL if GROQ_API_KEY else None})


@app.route("/api/chat", methods=["POST"])
def api_chat():
    payload = request.get_json(silent=True) or {}
    user_message = (payload.get("message") or "").strip()
    context = payload.get("context") or {}
    history = payload.get("history") or []  # [{role:'user'|'assistant', content:str}, ...]

    if not user_message:
        return jsonify({"ok": False, "error": "Empty message"}), 400
    if not GROQ_API_KEY:
        return jsonify({"ok": False, "error": "GROQ_API_KEY not configured on the server"}), 503

    system_content = ASSISTANT_SYSTEM_PROMPT
    if context:
        system_content += f"\n\nUser profile & recommendation context (JSON, may be partial):\n{json.dumps(context)[:3000]}"

    messages = [{"role": "system", "content": system_content}]
    for turn in history[-8:]:  # keep the payload small
        role = turn.get("role")
        content = (turn.get("content") or "")[:600]
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    try:
        reply = call_groq(messages)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        return jsonify({"ok": False, "error": f"Groq API error ({e.code})", "detail": detail[:400]}), 502
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 502

    return jsonify({"ok": True, "reply": reply})


@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    college = (payload.get("college") or "").strip()
    year = payload.get("year") or ""
    branch = (payload.get("branch") or "").strip()
    domain = payload.get("domain") or ""
    experience = payload.get("experience") or ""
    language = payload.get("language") or ""
    skills = payload.get("skills") or []
    internship_mode = payload.get("internship_mode") or "Any"
    learning_style = payload.get("learning_style") or "Any"

    errors = {}
    if not name:
        errors["name"] = "Full name is required."
    if year not in VALID_YEARS:
        errors["year"] = "Please select a valid current year."
    if domain not in DOMAIN_INTERNSHIPS:
        errors["domain"] = "Please select a valid domain."
    if experience not in EXP_WEIGHT:
        errors["experience"] = "Please select a valid experience level."
    if not language:
        errors["language"] = "Please select a preferred language."
    if not isinstance(skills, list):
        errors["skills"] = "Skills must be a list of strings."

    if errors:
        return jsonify({"ok": False, "errors": errors}), 400

    profile = {
        "name": name, "college": college, "year": year, "branch": branch,
        "domain": domain, "experience": experience, "language": language,
        "skills": skills, "internship_mode": internship_mode, "learning_style": learning_style,
    }
    results = generate_recommendations(profile)

    return jsonify({"ok": True, "profile": profile, "results": results})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)