// ⚠️ MOCK DATA: بيانات تجريبية للـ Demo mode بس. مش حقيقية ومش جاية من الـ Backend.
// الشركات والوظايف هنا كلها مختلقة. اللينكات example.com هي روابط تجريبية.
// وظيفتين (11 و 12) من غير apply_url علشان نجرّب حالة "مفيش لينك تقديم".
// لما الـ Backend يجهز: VITE_USE_MOCK=false ويتم تجاهل الملف ده.
//
// ملحوظة: التطابق (match_score / matched_skills / missing_skills) بيتحسب في mockApi.js
// من مهارات المستخدم الحالية، فبيتغير لما تعدّلي المهارات.

export const jobSeed =
[
  {
    "id": 1,
    "title": "Junior ML Engineer",
    "company": "DataWave",
    "location": "Cairo, Egypt",
    "work_type": "Hybrid",
    "description": "Help build and deploy machine learning models for our analytics products.",
    "requirements": [
      "Python and ML basics",
      "SQL",
      "Git",
      "Docker (nice to have)",
      "AWS basics"
    ],
    "required_skills": [
      "Python",
      "Machine Learning",
      "SQL",
      "Git",
      "Docker",
      "AWS"
    ],
    "apply_url": "https://example.com/jobs/1"
  },
  {
    "id": 2,
    "title": "NLP Research Intern",
    "company": "Lingua Labs",
    "location": "Remote",
    "work_type": "Remote",
    "description": "Work on Arabic NLP models with our research team.",
    "requirements": [
      "Python",
      "NLP fundamentals",
      "PyTorch",
      "Transformers"
    ],
    "required_skills": [
      "Python",
      "NLP",
      "Machine Learning",
      "PyTorch",
      "Transformers"
    ],
    "apply_url": "https://example.com/jobs/2"
  },
  {
    "id": 3,
    "title": "AI Engineer Intern",
    "company": "Nile Intelligence",
    "location": "Cairo, Egypt",
    "work_type": "On-site",
    "description": "Build features powered by language models and deploy them on the cloud.",
    "requirements": [
      "Python",
      "NLP or ML basics",
      "Prompt engineering",
      "AWS basics"
    ],
    "required_skills": [
      "Python",
      "Machine Learning",
      "NLP",
      "Prompt Engineering",
      "AWS"
    ],
    "apply_url": "https://example.com/jobs/3"
  },
  {
    "id": 4,
    "title": "Data Scientist Intern",
    "company": "Pharos Analytics",
    "location": "Alexandria, Egypt",
    "work_type": "Hybrid",
    "description": "Analyze customer data and present findings to the product team.",
    "requirements": [
      "Python",
      "SQL",
      "Machine learning basics",
      "Statistics",
      "Tableau"
    ],
    "required_skills": [
      "Python",
      "Machine Learning",
      "SQL",
      "Statistics",
      "Tableau"
    ],
    "apply_url": "https://example.com/jobs/4"
  },
  {
    "id": 5,
    "title": "Backend Developer (Python)",
    "company": "Cairo Cloudworks",
    "location": "Remote",
    "work_type": "Remote",
    "description": "Design and maintain APIs that power our mobile and web apps.",
    "requirements": [
      "Python",
      "SQL",
      "Git",
      "FastAPI",
      "Docker",
      "REST API design"
    ],
    "required_skills": [
      "Python",
      "SQL",
      "Git",
      "FastAPI",
      "Docker",
      "REST APIs"
    ],
    "apply_url": "https://example.com/jobs/5"
  },
  {
    "id": 6,
    "title": "Computer Vision Intern",
    "company": "Sightline AI",
    "location": "Giza, Egypt",
    "work_type": "On-site",
    "description": "Train and test image models for quality inspection in factories.",
    "requirements": [
      "Python",
      "Machine learning",
      "OpenCV",
      "PyTorch"
    ],
    "required_skills": [
      "Python",
      "Machine Learning",
      "OpenCV",
      "PyTorch"
    ],
    "apply_url": "https://example.com/jobs/6"
  },
  {
    "id": 7,
    "title": "Frontend Developer",
    "company": "Pixel Studio",
    "location": "Giza, Egypt",
    "work_type": "On-site",
    "description": "Build clean, responsive interfaces for client web apps.",
    "requirements": [
      "React",
      "TypeScript",
      "Git",
      "Figma",
      "UI design basics"
    ],
    "required_skills": [
      "React",
      "Git",
      "TypeScript",
      "Figma",
      "UI Design"
    ],
    "apply_url": "https://example.com/jobs/7"
  },
  {
    "id": 8,
    "title": "Full-Stack Developer",
    "company": "Orbit Apps",
    "location": "Cairo, Egypt",
    "work_type": "Hybrid",
    "description": "Work across the whole stack on a growing SaaS product.",
    "requirements": [
      "React",
      "Node.js",
      "TypeScript",
      "SQL",
      "Git"
    ],
    "required_skills": [
      "React",
      "Git",
      "SQL",
      "Node.js",
      "TypeScript"
    ],
    "apply_url": "https://example.com/jobs/8"
  },
  {
    "id": 9,
    "title": "Game AI Developer",
    "company": "Sandstorm Games",
    "location": "Remote",
    "work_type": "Remote",
    "description": "Create smart enemy and companion behavior for our next game.",
    "requirements": [
      "Machine learning",
      "Unity",
      "C#",
      "Reinforcement learning"
    ],
    "required_skills": [
      "Python",
      "Machine Learning",
      "Unity",
      "C#",
      "Reinforcement Learning"
    ],
    "apply_url": "https://example.com/jobs/9"
  },
  {
    "id": 10,
    "title": "Data Analyst",
    "company": "InsightCo",
    "location": "Remote",
    "work_type": "Remote",
    "description": "Turn business data into dashboards and insights.",
    "requirements": [
      "SQL",
      "Python",
      "Power BI",
      "Excel",
      "Statistics"
    ],
    "required_skills": [
      "SQL",
      "Python",
      "Power BI",
      "Excel",
      "Statistics"
    ],
    "apply_url": "https://example.com/jobs/10"
  },
  {
    "id": 11,
    "title": "Cloud Support Associate",
    "company": "SkyBridge",
    "location": "Cairo, Egypt",
    "work_type": "On-site",
    "description": "Help customers fix problems with their cloud setups.",
    "requirements": [
      "AWS",
      "Linux",
      "Networking basics",
      "Scripting"
    ],
    "required_skills": [
      "Git",
      "Python",
      "AWS",
      "Linux",
      "Networking"
    ],
    "apply_url": null
  },
  {
    "id": 12,
    "title": "UI/UX Designer",
    "company": "Lumen Creative",
    "location": "Hybrid",
    "work_type": "Hybrid",
    "description": "Design web and mobile screens and test them with real users.",
    "requirements": [
      "Figma",
      "UI design",
      "User research",
      "Basic front-end knowledge"
    ],
    "required_skills": [
      "React",
      "Figma",
      "UI Design",
      "User Research"
    ],
    "apply_url": null
  }
];

// مهارات تجريبية بتظهر بعد "تحليل" أي CV في الـ Demo (مش مقروءة من ملفك).
export const sampleSkills = ["Python", "Machine Learning", "NLP", "SQL", "React", "Git"];

// بيانات تجريبية لصفحة CV Review (Sample، مش مستخرجة من الملف المرفوع).
export function makeSampleAnalysis(name, email) {
  return {
    personal: {
      full_name: name,
      email,
      phone: "",
      location: "Cairo, Egypt",
      linkedin_url: "",
      portfolio_url: "",
    },
    summary:
      "Computer science student with hands-on experience in Python, machine learning and web development. (Sample text: replace it with your own.)",
    education: [
      { school: "Sample University", degree: "B.Sc.", field: "Computer Science (AI)", start: "2022", end: "2026" },
    ],
    experience: [
      {
        company: "Sample Company",
        title: "Software Intern",
        start: "2025",
        end: "2025",
        description: "Built and tested features for an internal web tool.",
      },
    ],
    certifications: [{ name: "Sample certificate: Machine Learning Basics", issuer: "Sample Academy", year: "2024" }],
    projects: [
      { name: "Sample project: job recommender", description: "A small app that matches CVs to jobs.", link: "" },
    ],
  };
}
