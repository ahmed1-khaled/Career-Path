import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePageTitle from "../hooks/usePageTitle";
import SkillChips from "../components/SkillChips";

const steps = [
  { title: "Upload your CV", text: "Add a PDF or DOCX (up to 5 MB). We read it to find your skills, education and experience." },
  { title: "Review your profile", text: "Check what we found. Fix mistakes and add anything missing before it's used for matching." },
  { title: "Get matched", text: "See jobs ranked by how well your skills fit, with the skills you have and the ones you still need." },
];

const features = [
  { title: "CV analysis", text: "Turns your CV into a structured profile you can edit." },
  { title: "Skill-based matching", text: "Every job shows a match score and the exact skills behind it." },
  { title: "Skill gap and learning links", text: "For each missing skill, jump to videos and courses to learn it." },
  { title: "Saved jobs", text: "Save the jobs you like and come back to them later." },
  { title: "You stay in control", text: "Edit your profile any time, and delete your CV and data from Settings." },
  { title: "Real application links", text: "StepUp doesn't apply for you. You apply on the employer's own page." },
];

const faqs = [
  { q: "Which CV files can I upload?", a: "PDF and DOCX files up to 5 MB." },
  { q: "How is the match score calculated?", a: "We compare the skills on your profile with the skills each job asks for. The more required skills you have, the higher the score. You can always see which skills matched and which are missing." },
  { q: "Can I change what was found in my CV?", a: "Yes. Your skills, education, experience, projects and certifications are all editable on the CV Review page." },
  { q: "Does StepUp apply to jobs for me?", a: "No. The Apply button opens the employer's own application page." },
  { q: "Can I delete my data?", a: "Yes. You can delete your CV and the data extracted from it, or your whole account, from Settings." },
];

export default function Landing() {
  usePageTitle("");
  const { user } = useAuth();

  return (
    <>
      <section className="landing-hero">
        <div className="container hero-grid">
          <div>
            <h1>Know which jobs fit you, and what to learn next.</h1>
            <p className="lead">
              StepUp reads your CV, matches you with jobs based on your skills, and shows the skills you're missing, with
              learning links for each one.
            </p>
            <div className="actions">
              <Link className="btn btn-lg" to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to dashboard" : "Get started"}
              </Link>
              {!user && (
                <Link className="btn btn-secondary btn-lg" to="/login">
                  Log in
                </Link>
              )}
            </div>
          </div>

          {/* مثال ثابت علشان الزائر يفهم الفكرة. مش بيانات حقيقية. */}
          <aside className="card example" aria-label="Example job match">
            <span className="badge">Example</span>
            <div className="job-head">
              <div>
                <h2>Junior ML Engineer</h2>
                <p className="muted">DataWave · Cairo · Hybrid</p>
              </div>
              <div className="score">67%</div>
            </div>
            <p className="label">Matched skills</p>
            <SkillChips skills={["Python", "Machine Learning", "SQL", "Git"]} type="matched" />
            <p className="label">Missing skills</p>
            <SkillChips skills={["Docker", "AWS"]} type="missing" />
            <p className="muted small">Illustration only. Your matches come from your own CV.</p>
          </aside>
        </div>
      </section>

      <section id="how" className="section">
        <div className="container">
          <h2>How it works</h2>
          <ol className="steps">
            {steps.map((s) => (
              <li key={s.title} className="card">
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="section section-alt">
        <div className="container">
          <h2>What you get</h2>
          <div className="grid">
            {features.map((f) => (
              <div key={f.title} className="card">
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container narrow">
          <h2>Frequently asked questions</h2>
          {faqs.map((f) => (
            <details key={f.q} className="faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {!user && (
        <section className="section section-cta">
          <div className="container narrow center">
            <h2>Ready to find your next step?</h2>
            <Link className="btn btn-lg" to="/signup">
              Create your account
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
