"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "lambeth-cyclists-auth";
const PASSWORD = "lambeth";

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (checking) return null;
  if (authed) return <>{children}</>;

  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-80 text-center"
      >
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          Lambeth Cyclists
        </h1>
        <p className="text-sm text-gray-500 mb-6">Committee members only</p>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {error && (
          <p className="text-red-600 text-sm mt-2">Incorrect password</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full bg-gray-900 text-white py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
