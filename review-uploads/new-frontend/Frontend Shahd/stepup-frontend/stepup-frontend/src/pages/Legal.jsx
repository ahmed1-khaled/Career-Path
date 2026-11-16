import usePageTitle from "../hooks/usePageTitle";
import { Alert } from "../components/Status";

// ⚠️ نصوص مبدئية (Template). لازم الفريق يراجعها ويستبدلها بنصوص قانونية حقيقية قبل أي إطلاق.
function Draft() {
  return (
    <Alert type="warning">
      This is a draft template written for the project team. It is not legal advice. Replace it with reviewed
      text before launching to real users.
    </Alert>
  );
}

export function Privacy() {
  usePageTitle("Privacy Policy");
  return (
    <article className="container page legal">
      <h1>Privacy Policy</h1>
      <Draft />
      <h2>What we collect</h2>
      <p>Your account details (name and email), the CV you upload, the information extracted from it, your job preferences, and the jobs you save.</p>
      <h2>How we use it</h2>
      <p>We use your data only to build your profile, match you with jobs, and show you which skills to learn next.</p>
      <h2>Your control</h2>
      <p>You can edit your extracted profile, delete your CV and the data extracted from it, or delete your account from Settings at any time.</p>
      <h2>Contact</h2>
      <p>Add the team's contact email here.</p>
    </article>
  );
}

export function Terms() {
  usePageTitle("Terms of Service");
  return (
    <article className="container page legal">
      <h1>Terms of Service</h1>
      <Draft />
      <h2>Using StepUp</h2>
      <p>StepUp gives career suggestions based on the CV you provide. Suggestions are guidance only and don't guarantee interviews or job offers.</p>
      <h2>Your content</h2>
      <p>You are responsible for the CV and information you upload, and you confirm that you have the right to share it.</p>
      <h2>Job applications</h2>
      <p>StepUp doesn't apply to jobs for you. "Apply" links open the employer's own website, which has its own terms.</p>
      <h2>Changes</h2>
      <p>Add how and when these terms can change.</p>
    </article>
  );
}
