"use client";

import { useState } from "react";
import {
  Wand2,
  Database,
  Plus,
  Search,
  Menu,
  X,
  Logs,
  ChartLineIcon,
  MessageCircle,
  DatabaseIcon,
} from "lucide-react";
import QueryRunner from "@/pages/QueryRunner";
import AddDataSource from "@/pages/AddDataSource";
import DataSourceManager from "@/pages/DataSourceManager";
import QueryHistory from "@/pages/QueryHistory";
import PromptStudio from "@/pages/PromptStudio";
import ChatPage from "@/pages/ChatPage";
import DataStudio from "@/pages/DataStudio";
import { Toaster } from "sonner";

const navigationItems = [
  {
    id: "promptstudio",
    label: "Prompt Studio",
    icon: ChartLineIcon,
    description: "View Prompt Studio",
  },
  {
    id: "datastudio",
    label: "Data Studio",
    icon: DatabaseIcon,
    description: "View Data Studio",
  },
  {
    id: "query",
    label: "Query Runner",
    icon: Search,
    description: "Execute SQL queries",
  },
  {
    id: "adddatasource",
    label: "Add Data Source",
    icon: Plus,
    description: "Connect new sources",
  },
  {
    id: "viewdatasources",
    label: "Data Sources",
    icon: Database,
    description: "Manage connections",
  },
  {
    id: "viewquerylog",
    label: "Query Logs",
    icon: Logs,
    description: "View query history",
  },
];

export default function Home() {
  const [view, setView] = useState("promptstudio");
  // const [chatId, setChatId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = async (id: string) => {
    // if (id === "newchat") {
    //   const res = await fetch("http://localhost:8000/chats", {
    //     method: "POST",
    //   });
    //   const data = await res.json();
    //   setChatId(data.chat_id.toString());
    // }
    setView(id);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (view) {
      case "query":
        return <QueryRunner />;
      case "adddatasource":
        return <AddDataSource />;
      case "viewdatasources":
        return <DataSourceManager />;
      case "viewquerylog":
        return <QueryHistory />;
      case "promptstudio":
        return <PromptStudio />;
      case "datastudio":
        return <DataStudio />;
      // case "newchat":
      //   return chatId ? (
      //     <ChatPage chatId={chatId} />
      //   ) : (
      //     <div>Creating chat...</div>
      //   );
      default:
        return <PromptStudio />;
    }
  };

  return (
    <>
      <Toaster richColors />
      <title>SQL Assistant</title>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Text2SQL Assistant
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigationItems.map(({ id, label, icon: Icon }) => {
                const isActive = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNavClick(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-100 text-blue-700 shadow"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 px-6 py-4 space-y-2">
              {navigationItems.map(({ id, label, description, icon: Icon }) => {
                const isActive = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNavClick(id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-5 h-5 mt-1" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm opacity-75">{description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="w-full px-6 py-8">{renderContent()}</main>
      </div>
    </>
  );
}
