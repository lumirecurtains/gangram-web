import Link from "next/link";
import ClientFirebaseStatus from "./ClientFirebaseStatus";

export default function Home() {
  return (
    <main>
      <h1>🥛 Gangaram Dairy — Pilot</h1>
      <p>
        <b>Step 1: Firebase + Cloudinary connection skeleton.</b>
        Abhi koi feature nahi — sirf connections check ho rahe hain.
      </p>

      <div className="status-card">
        <h2>🔌 Connection Status</h2>
        <div className="status-item">
          <span>📡 Server (Admin SDK)</span>
          <a href="/api/health" style={{ color: "#d97706", fontWeight: 700 }}>API check karo →</a>
        </div>
        <ClientFirebaseStatus />
      </div>

      <Link className="btn" href="/api/health">🔍 Server Health Check (Firebase Admin + Cloudinary)</Link>
    </main>
  );
}
