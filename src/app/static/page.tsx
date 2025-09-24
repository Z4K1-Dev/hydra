export default function StaticTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Static Test Page</h1>
      <p>This is a static page with no client-side data fetching.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>If you can see this, the basic page rendering is working.</p>
        <p className="text-sm text-gray-600 mt-2">
          Time: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}