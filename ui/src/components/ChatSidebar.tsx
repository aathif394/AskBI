import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";

interface ChatSidebarProps {
  chats: any[];
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  selectedChatId: string | null;
}

export default function ChatSidebar({
  chats,
  onSelect,
  onNewChat,
  onRenameChat,
  selectedChatId,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");

  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingId(chatId);
    setTempTitle(currentTitle);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      onRenameChat(chatId, tempTitle.trim() || "Untitled Chat");
      setEditingId(null);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <aside className="w-[250px] bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="text-slate-700 font-semibold text-sm">Chats</h2>
        <button
          onClick={onNewChat}
          className="text-blue-600 hover:text-blue-700"
          title="New chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.map((chat) => {
          const isEditing = editingId === chat.id;
          const isSelected = selectedChatId === chat.id;

          return (
            <div
              key={chat.id}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-200",
                isSelected && "bg-slate-200 font-medium"
              )}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, chat.id)}
                  onBlur={() => setEditingId(null)}
                  className="flex-1 text-sm px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <button
                  onClick={() => onSelect(chat.id)}
                  onDoubleClick={() => startEditing(chat.id, chat.title || "")}
                  className="flex-1 text-left text-sm truncate text-slate-700"
                >
                  {chat.title || "Untitled Chat"}
                </button>
              )}

              {!isEditing && (
                <button
                  onClick={() => startEditing(chat.id, chat.title || "")}
                  title="Rename"
                  className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
