import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <h1>Page not found</h1>
      <p>This route is not part of the rebuilt platform yet.</p>
      <Link to="/dashboard">Go to dashboard</Link>
    </main>
  );
}
