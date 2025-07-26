import React from "react";

function App() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Welcome!
                </h1>
                <p className="text-gray-600 mb-6">
                    It's a solid start for your deploying Vite + React +
                    Tailwind CSS project.
                </p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Get Started
                </button>
            </div>
        </div>
    );
}

export default App;
