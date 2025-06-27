// ChatPage.tsx
"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

import { useChatState } from "../hooks/useChatState";
import { useDataSource } from "../hooks/useDataSource";
import { runQuery, generateSqlStream } from "../lib/api";

import SuggestedQueries from "@/components/SuggestedQueries";
import PromptBar from "@/components/PromptBar";
import ChatMessageRenderer from "@/components/ChatMessageRenderer";
import ScrollToBottom from "@/components/ScrollToBottom";

export default function ChatPage({
  chatId,
  chatTitle,
}: {
  chatId: string;
  chatTitle: string;
}) {
  const {
    question,
    setQuestion,
    steps,
    setSteps,
    sqlOutput,
    setSqlOutput,
    loading,
    setLoading,
    chatEndRef,
  } = useChatState();

  const {
    dataSources,
    selectedSourceId,
    handleSourceChange,
    dbConfig,
    suggestions,
    loadingSuggestions,
  } = useDataSource();

  const [messages, setMessages] = useState<any[]>([]);
  const [restoring, setRestoring] = useState(true);
  const [restoredCount, setRestoredCount] = useState(0);
  const [isNewChat, setIsNewChat] = useState(true);

  const [messageStates, setMessageStates] = useState<
    Record<
      number,
      {
        editableSql: string;
        queryResult: any;
        queryError: string | null;
        running: boolean;
        showData: boolean;
      }
    >
  >({});

  const scrollToEnd = () => {
    setTimeout(() => {
      chatEndRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    async function fetchChatMessages() {
      try {
        const res = await fetch(
          `http://localhost:8000/chats/${chatId}/messages`
        );
        const data = await res.json();
        const fetchedMessages = data.messages || [];

        setMessages(fetchedMessages);
        setRestoredCount(fetchedMessages.length);
        setIsNewChat(fetchedMessages.length === 0);

        // Initialize message states for restored messages
        const initialStates: Record<number, any> = {};
        fetchedMessages.forEach((msg: any, idx: number) => {
          if (msg.type === "query_result") {
            initialStates[idx] = {
              editableSql: msg.content.sql || "",
              queryResult: null,
              queryError: null,
              running: false,
              showData: false,
            };
          } else if (msg.type === "data_preview") {
            // For data_preview messages, we need to find the previous query_result message
            // and update its state to show the data
            for (let i = idx - 1; i >= 0; i--) {
              if (fetchedMessages[i].type === "query_result") {
                if (!initialStates[i]) {
                  initialStates[i] = {
                    editableSql: fetchedMessages[i].content.sql || "",
                    queryResult: msg.content.data,
                    queryError: null,
                    running: false,
                    showData: true,
                  };
                } else {
                  initialStates[i].queryResult = msg.content.data;
                  initialStates[i].showData = true;
                }
                break;
              }
            }
          }
        });
        setMessageStates(initialStates);
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
        setIsNewChat(true);
        setRestoredCount(0);
      } finally {
        setRestoring(false);
      }
    }

    fetchChatMessages();
  }, [chatId]);

  const saveMessage = async (role: string, type: string, content: any) => {
    try {
      await fetch(`http://localhost:8000/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, type, content }),
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const onAsk = async () => {
    if (!selectedSourceId) return;

    const userMessage = {
      role: "user",
      type: "text",
      content: { text: question },
      created_at: new Date().toISOString(),
    };

    const assistantStreamingMessage = {
      role: "assistant",
      type: "query_result",
      content: {
        steps: [],
        sql: "",
        question,
        source_id: selectedSourceId,
      },
      created_at: new Date().toISOString(),
    };

    // Append both user and assistant messages at once
    setMessages((prev) => {
      const newMessages = [...prev, userMessage, assistantStreamingMessage];
      const streamingMessageIndex = newMessages.length - 1;

      setMessageStates((prevStates) => ({
        ...prevStates,
        [streamingMessageIndex]: {
          editableSql: "",
          queryResult: null,
          queryError: null,
          running: false,
          showData: false,
        },
      }));

      return newMessages;
    });

    // Save both messages to DB
    saveMessage("user", "text", userMessage.content);

    scrollToEnd();
    setLoading(true);
    setSteps([]);
    setSqlOutput("");

    const newSteps: any[] = [];
    let fullSql = "";

    // const context = messages
    //   .map((msg) => ({
    //     role: msg.role,
    //     type: msg.type,
    //     content: msg.content,
    //   }))
    //   .concat([{ role: "user", type: "text", content: { text: question } }]); // Include current question too
    const context = messages
      .filter(
        (msg) =>
          // Include only user questions and assistant thinking steps
          (msg.type === "text" || msg.type === "thought") &&
          (msg.role === "user" || msg.role === "assistant")
      )
      .map((msg) => ({
        role: msg.role,
        type: msg.type,
        content: msg.content,
      }))
      .concat([
        {
          role: "user",
          type: "text",
          content: { text: question, sql: sqlOutput },
        },
      ]); // add current question

    try {
      await generateSqlStream(
        question,
        selectedSourceId,
        (step) => {
          newSteps.push(step);
          setSteps([...newSteps]);

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: {
                ...updated[lastIdx].content,
                steps: [...newSteps],
              },
            };
            return updated;
          });
        },
        (chunk) => {
          fullSql += chunk;
          setSqlOutput(fullSql);

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;

            updated[lastIdx] = {
              ...updated[lastIdx],
              content: {
                ...updated[lastIdx].content,
                sql: fullSql,
              },
            };

            setMessageStates((prevStates) => ({
              ...prevStates,
              [lastIdx]: {
                ...prevStates[lastIdx],
                editableSql: fullSql,
              },
            }));

            return updated;
          });
        },
        context // Pass full context here
      );

      const finalMessage = {
        role: "assistant",
        type: "query_result",
        content: {
          steps: newSteps,
          sql: fullSql,
          question,
          source_id: selectedSourceId,
        },
        created_at: new Date().toISOString(),
      };

      // Save only assistant message, user message was saved already
      saveMessage("assistant", "query_result", finalMessage.content);
    } catch (error) {
      console.error("Error generating SQL:", error);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const createOnRunHandler = (messageIndex: number) => {
    return async () => {
      if (!dbConfig) return;

      const currentState = messageStates[messageIndex];
      if (!currentState) return;

      setMessageStates((prev) => ({
        ...prev,
        [messageIndex]: {
          ...prev[messageIndex],
          running: true,
          queryError: null,
          queryResult: null,
        },
      }));

      try {
        const data = await runQuery(
          dbConfig,
          currentState.editableSql,
          question
        );

        if (data.status === "success") {
          setMessageStates((prev) => ({
            ...prev,
            [messageIndex]: {
              ...prev[messageIndex],
              queryResult: data,
              showData: true,
            },
          }));

          const resultMessage = {
            role: "assistant",
            type: "data_preview",
            content: { data },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, resultMessage]);
          saveMessage("assistant", "data_preview", resultMessage.content);
        } else {
          setMessageStates((prev) => ({
            ...prev,
            [messageIndex]: {
              ...prev[messageIndex],
              queryError: data,
            },
          }));
        }
      } catch (e: any) {
        setMessageStates((prev) => ({
          ...prev,
          [messageIndex]: {
            ...prev[messageIndex],
            queryError: e.message,
          },
        }));
      } finally {
        setMessageStates((prev) => ({
          ...prev,
          [messageIndex]: {
            ...prev[messageIndex],
            running: false,
          },
        }));
      }
    };
  };

  const updateEditableSql = (messageIndex: number, newSql: string) => {
    setMessageStates((prev) => ({
      ...prev,
      [messageIndex]: {
        ...prev[messageIndex],
        editableSql: newSql,
      },
    }));
  };

  const updateShowData = (messageIndex: number, show: boolean) => {
    setMessageStates((prev) => ({
      ...prev,
      [messageIndex]: {
        ...prev[messageIndex],
        showData: show,
      },
    }));
  };

  // Don't render anything while restoring
  if (restoring) {
    return (
      <div className="relative h-screen flex flex-col bg-white">
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-900">
              {chatTitle}
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col bg-white">
      <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">{chatTitle}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-screen-lg mx-auto space-y-6">
          {messages.map((msg, idx) => {
            const messageState = messageStates[idx];
            // A message is readonly if it was restored from the database
            const isReadOnly = idx < restoredCount;

            // Only render ChatMessageRenderer for messages that need interactive elements
            // For data_preview messages, they're already handled by the previous query_result message
            if (msg.type === "data_preview") {
              return null;
            }

            return (
              <ChatMessageRenderer
                key={`${idx}-${msg.created_at}`}
                message={msg}
                question={msg.content?.question || question}
                editableSql={messageState?.editableSql || ""}
                setEditableSql={(newSql) => updateEditableSql(idx, newSql)}
                queryResult={messageState?.queryResult || null}
                queryError={messageState?.queryError || null}
                running={messageState?.running || false}
                showData={messageState?.showData || false}
                setShowData={(show) => updateShowData(idx, show)}
                setQueryError={(error) => {
                  setMessageStates((prev) => ({
                    ...prev,
                    [idx]: {
                      ...prev[idx],
                      queryError: error,
                    },
                  }));
                }}
                onRun={createOnRunHandler(idx)}
                readOnly={isReadOnly}
              />
            );
          })}

          {loading &&
            // Only show thinking if the last message is NOT already a streaming assistant response
            !(
              messages[messages.length - 1]?.role === "assistant" &&
              messages[messages.length - 1]?.type === "query_result"
            ) && (
              <ChatMessageRenderer
                message={{
                  role: "assistant",
                  type: "thinking",
                  content: { text: "Analyzing your question..." },
                }}
                readOnly
              />
            )}

          <div ref={chatEndRef} />
        </div>
        <ScrollToBottom chatEndRef={chatEndRef} />
      </div>

      <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200">
        <SuggestedQueries
          suggestions={suggestions}
          loading={loadingSuggestions}
          onSelect={(q) => setQuestion(q)}
        />
        <PromptBar
          selectedSourceId={selectedSourceId}
          dataSources={dataSources}
          handleSourceChange={handleSourceChange}
          question={question}
          loading={loading}
          setQuestion={setQuestion}
          onAsk={onAsk}
        />
      </div>
    </div>
  );
}
