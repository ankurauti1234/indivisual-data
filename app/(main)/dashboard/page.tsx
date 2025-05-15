// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Rely on middleware to handle token verification for /dashboard
  // If the request reaches here, the token is valid (middleware passed)

  return (
    <div>
      <h1 className="text-2xl">Welcome to the Dashboard</h1>
      {/* Your dashboard content */}
    </ div>
  );
}