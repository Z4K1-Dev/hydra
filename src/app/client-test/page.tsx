'use client';

import { useState, useEffect } from 'react';

export default function ClientTestPage() {
  const [message, setMessage] = useState('Loading...');
  const [time, setTime] = useState('');

  useEffect(() => {
    console.log('Client test page - useEffect running');
    setMessage('Client-side JavaScript is working!');
    setTime(new Date().toLocaleString());
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Client Test Page</h1>
      <div className="mb-4 p-4 bg-blue-100 rounded">
        <p><strong>Message:</strong> {message}</p>
        <p><strong>Time:</strong> {time}</p>
      </div>
      <p className="text-sm text-gray-600">
        If you see the message and time above, client-side JavaScript is working.
      </p>
    </div>
  );
}