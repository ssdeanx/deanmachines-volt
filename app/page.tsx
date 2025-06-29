import { Navbar } from "./components/navbar";
import { SupervisorChat } from "./components/supervisor-chat";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#1b1b1b] flex flex-col p-4 overflow-hidden">
      {/* Dot pattern background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1.2px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <Navbar />

      <main className="relative w-full max-w-2xl mx-auto mt-6 z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#00d992] mb-1">VoltAgent Supervisor</h1>
          <p className="text-gray-400">AI-powered task coordination across multiple agents</p>
        </div>

        <SupervisorChat />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Built with Next.js and VoltAgent</p>
        </div>
      </main>
    </div>
  );
}
