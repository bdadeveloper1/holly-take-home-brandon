import dynamic from 'next/dynamic';

// Dynamically import the modern chat UI Index page using the alias
const ModernChat = dynamic(() => import('modern-chat-pulse/src/pages/Index'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <ModernChat />
    </main>
  );
}
