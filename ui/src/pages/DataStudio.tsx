"use client";

import { useEffect, useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatPage from "@/pages/ChatPage";

export default function DataStudio() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatTitle, setSelectedChatTitle] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:8000/chats")
      .then((res) => res.json())
      .then((data) => {
        setChats(Array.isArray(data.chats) ? data.chats : []);
      });
  }, []);

  const handleNewChat = async () => {
    const res = await fetch("http://localhost:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setChats((prev) => [data, ...prev]);
    setSelectedChatId(data.id);
    setSelectedChatTitle(data.title || "Untitled Chat");
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar
        chats={chats}
        onSelect={(id) => {
          setSelectedChatId(id);
          const selected = chats.find((c) => c.id === id);
          setSelectedChatTitle(selected?.title || "");
        }}
        onNewChat={handleNewChat}
        selectedChatId={selectedChatId}
        onRenameChat={async (chatId, newTitle) => {
          await fetch(`http://localhost:8000/chats/${chatId}/rename`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          });
          // Refresh local state
          setChats((prev) =>
            prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
          );
        }}
      />
      <div className="flex-1">
        {selectedChatId ? (
          <ChatPage chatId={selectedChatId} chatTitle={selectedChatTitle} />
        ) : (
          <div className="p-6 text-slate-500">Select a chat to get started</div>
        )}
      </div>
    </div>
  );
}
