'use client';

export default function MinimalAdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Admin Page</h1>
      <p>This is a minimal admin page without any data fetching.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>If you can see this, the admin page routing is working.</p>
      </div>
    </div>
  );
}