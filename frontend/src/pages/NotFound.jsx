import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";
import { Empty } from "../components/Status";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="container page">
      <Empty title="Page not found" text="The page you're looking for doesn't exist or was moved.">
        <Link className="btn" to="/">
          Go to the home page
        </Link>
      </Empty>
    </div>
  );
}
