"use client";

import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update, set } from "firebase/database";
import { LuTrash2 } from "react-icons/lu";

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

export default function Home() {
  const [currentProva, setCurrentProva] = useState("A");
  const [answers, setAnswers] = useState<
    Record<string, Record<number, Record<string, { count: number }>>>
  >({});
  const [userSelections, setUserSelections] = useState<
    Record<string, Record<number, string>>
  >({});
  const [config, setConfig] = useState<{
    questions: number[];
    options: string[];
    testTypes: string[];
  } | null>(null);

  useEffect(() => {
    const answersRef = ref(database, "answers");
    onValue(answersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setAnswers(data);
    });

    const storedSelections = localStorage.getItem("userSelections");
    if (storedSelections) {
      setUserSelections(JSON.parse(storedSelections));
    }

    const configRef = ref(database, "config");
    onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      setConfig(data);
    });
  }, []);

  const handleSelect = (question: number, option: string) => {
    if (userSelections[currentProva]?.[question]) return;

    const newSelections = {
      ...userSelections,
      [currentProva]: {
        ...userSelections[currentProva],
        [question]: option,
      },
    };
    setUserSelections(newSelections);

    localStorage.setItem("userSelections", JSON.stringify(newSelections));

    const updates: Record<string, { count: number }> = {};
    const currentCount =
      answers[currentProva]?.[question]?.[option]?.count || 0;
    updates[`answers/${currentProva}/${question}/${option}`] = {
      count: currentCount + 1,
    };
    update(ref(database), updates);
  };

  const handleDeselect = (question: number) => {
    const selectedOption = userSelections[currentProva]?.[question];
    if (!selectedOption) return;

    const newSelections = { ...userSelections };
    delete newSelections[currentProva][question];
    setUserSelections(newSelections);

    localStorage.setItem("userSelections", JSON.stringify(newSelections));

    const currentCount =
      answers[currentProva]?.[question]?.[selectedOption]?.count || 0;
    const updates: Record<string, { count: number }> = {};
    updates[`answers/${currentProva}/${question}/${selectedOption}`] = {
      count: Math.max(currentCount - 1, 0),
    };
    update(ref(database), updates);
  };

  const getHeatColor = (count: number, total: number) => {
    if (total === 0) return "bg-gray-200";
    const percentage = count / total;
    if (percentage > 0.75) return "bg-green-500";
    if (percentage > 0.5) return "bg-green-300";
    if (percentage > 0.25) return "bg-yellow-300";
    return "bg-red-300";
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gabarito Colaborativo</h1>
      <div className="flex gap-4 mb-4">
        {config.testTypes.map((type) => (
          <button
            key={type}
            onClick={() => setCurrentProva(type)}
            className={`px-4 py-2 rounded ${currentProva === type ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
          >
            Tipo {type}
          </button>
        ))}
      </div>
      {config.questions.map((q) => {
        const optionData = answers[currentProva]?.[q] || {};
        const counts = config.options.map((opt) => optionData[opt]?.count || 0);
        const total = counts.reduce((sum, c) => sum + c, 0);

        return (
          <div key={q} className="mb-4">
            <p className="mb-2 font-medium">{q}</p>
            <div className="flex gap-2 items-center">
              {config.options.map((opt) => {
                const count = optionData[opt]?.count || 0;
                const isSelected = userSelections[currentProva]?.[q] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(q, opt)}
                    className={`px-4 py-2 rounded ${getHeatColor(count, total)} ${isSelected ? "ring-2 ring-blue-500" : ""
                      }`}
                  >
                    {opt} ({count})
                  </button>
                );
              })}
              {userSelections[currentProva]?.[q] && (
                <button
                  onClick={() => handleDeselect(q)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Deselect option"
                >
                  <LuTrash2 />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
