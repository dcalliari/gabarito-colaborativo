"use client";

import { useState, useEffect } from "react";
import { getDatabase, ref, set, get } from "firebase/database";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [questions, setQuestions] = useState(10);
  const [options, setOptions] = useState(["A", "B", "C", "D", "E"]);
  const [testTypes, setTestTypes] = useState(["A", "B", "C", "D"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      const configRef = ref(database, "config");
      get(configRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const config = snapshot.val();
            setQuestions(config.questions.length);
            setOptions(config.options);
            setTestTypes(config.testTypes);
          }
        })
        .catch((error) => {
          console.error("Error loading configurations:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
    } else {
      alert("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  const clearDatabase = () => {
    set(ref(database, "answers"), null);
    alert("Database cleared successfully!");
  };

  const handleSave = () => {
    const config = {
      questions: Array.from({ length: questions }, (_, i) => i + 1),
      options,
      testTypes,
    };
    set(ref(database, "config"), config);
    alert("Configurations saved successfully!");
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Panel</h1>
      {!isAuthenticated ? (
        <div className="bg-white shadow-md rounded p-6">
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          />
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Login
          </button>
        </div>
      ) : loading ? (
        <div className="text-center text-gray-500">Loading configurations...</div>
      ) : (
        <div className="bg-white shadow-md rounded p-6">
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4 w-full"
          >
            Logout
          </button>
          <div className="mb-4">
            <label className="block font-medium mb-2">Number of Questions</label>
            <input
              type="number"
              value={questions}
              onChange={(e) => setQuestions(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-2">Options</label>
            <input
              type="text"
              value={options.join(",")}
              onChange={(e) => setOptions(e.target.value.split(","))}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-2">Types</label>
            <input
              type="text"
              value={testTypes.join(",")}
              onChange={(e) => setTestTypes(e.target.value.split(","))}
              className="border p-2 rounded w-full"
            />
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Save Configurations
          </button>
          <div className="mt-4">
            <button
              onClick={clearDatabase}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
            >
              Clear Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
