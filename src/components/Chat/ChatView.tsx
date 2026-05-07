import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../common/Button";
import { LoadingSpinner } from "../common/LoadingSpinner";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string; // for expert name
}

export const ChatView: React.FC = () => {
  const { currentPersona, defaultProvider, providers } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "你可以随时和我进行自由对话。如果需要头脑风暴，请输入 `/chatroom 话题` 或 `/chatroom 人物1 人物2：话题`，我将为你召唤专家天团！"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chatroom state
  const [chatroomState, setChatroomState] = useState<"idle" | "confirming" | "active">("idle");
  const [chatroomTopic, setChatroomTopic] = useState("");
  const [chatroomExperts, setChatroomExperts] = useState<string[]>([]);

  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    if (!defaultProvider || !providers[defaultProvider]?.enabled) {
      alert("请先在设置中配置并启用 AI 提供商");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    // Append user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    // Check for chatroom trigger
    if (userMessage.startsWith("/chatroom") || userMessage.startsWith("/聊天室")) {
      handleChatroomTrigger(userMessage);
      return;
    }

    if (chatroomState === "confirming") {
      if (userMessage.includes("确认") || userMessage.includes("开始") || userMessage.includes("yes") || userMessage.includes("ok")) {
        startChatroomRound(chatroomTopic, chatroomExperts, 1);
        return;
      } else if (userMessage.includes("结束") || userMessage.includes("取消")) {
        setChatroomState("idle");
        setMessages(prev => [...prev, { role: "assistant", content: "已取消头脑风暴。" }]);
        return;
      } else {
        // Assume user wants to adjust experts
        setChatroomExperts(userMessage.split(/[,，、 ]+/).filter(Boolean));
        setMessages(prev => [...prev, { role: "assistant", content: `专家已更新为：${userMessage}。输入“确认”开始。` }]);
        return;
      }
    }

    if (chatroomState === "active") {
      if (userMessage === "结束") {
        endChatroom();
        return;
      }
      // Follow-up round
      startChatroomRound(chatroomTopic, chatroomExperts, 2, userMessage);
      return;
    }

    // Normal Chat
    setLoading(true);
    try {
      const history = messages.filter(m => m.role !== "system").map(m => ({
        role: m.role,
        content: m.content
      }));
      history.push({ role: "user", content: userMessage });

      // Add a system prompt for normal chat to infer user intent
      const payload = [
        { role: "system", content: "你是小七大人的全能助手。你可以正常对话，也可以识别用户的创作意图（如想要生成选题、大纲、文稿优化等），并在合适的时候主动建议用户使用工具栏的功能。请使用全中文，语言俏皮且专业。" },
        ...history
      ];

      const reply = await invoke<string>("ask_ai", {
        messages: payload,
        personaId: currentPersona?.id,
      });

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: `[错误] ${error}` }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Chatroom Logic ---
  const handleChatroomTrigger = async (cmd: string) => {
    setLoading(true);
    try {
      const match = cmd.match(/^\/(?:chatroom|聊天室)\s*(.*?)(?:[:：]\s*(.*))?$/);
      let expertsStr = match?.[1]?.trim() || "";
      let topic = match?.[2]?.trim() || "";

      if (!topic && expertsStr) {
        topic = expertsStr;
        expertsStr = "";
      }

      if (!topic) {
        setMessages(prev => [...prev, { role: "assistant", content: "自由聊天室。给个话题，我帮你选人；或者直接指定人物（例如：/chatroom 芒格 乔布斯：如何做决策）。" }]);
        setLoading(false);
        return;
      }

      setChatroomTopic(topic);

      if (expertsStr) {
        const experts = expertsStr.split(/[,，、 ]+/).filter(Boolean);
        setChatroomExperts(experts);
        setMessages(prev => [...prev, { role: "assistant", content: `聊天室就绪。话题：「${topic}」\n专家阵容：${experts.join("、")}\n正在准备开场...` }]);
        setChatroomState("active");
        startChatroomRound(topic, experts, 1);
      } else {
        // Ask AI to suggest 3 experts
        const payload = [
          { role: "system", content: "你是一个聊天室主持人。根据用户给定的话题，推荐3位世界级的专家（例如作家、哲学家、企业家等），他们的观点应该具有张力和冲突。直接返回如下格式，不要说多余的话：\n1. 专家A——理由\n2. 专家B——理由\n3. 专家C——理由" },
          { role: "user", content: `话题：${topic}` }
        ];
        const reply = await invoke<string>("ask_ai", { messages: payload });
        
        // Extract names
        const names: string[] = [];
        const regex = /\d\.\s*([^—]+)——/g;
        let m;
        while ((m = regex.exec(reply)) !== null) {
            names.push(m[1].trim());
        }

        if (names.length > 0) {
          setChatroomExperts(names);
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `聊天室就绪。话题：「${topic}」\n\n推荐阵容：\n${reply}\n\n选人原则：观点有张力（能碰撞）。\n请回复“确认”开始，或直接回复你要调整的人选。` 
          }]);
          setChatroomState("confirming");
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: "抱歉，无法推荐专家，请直接指定人物。" }]);
        }
        setLoading(false);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `[错误] ${e}` }]);
      setLoading(false);
    }
  };

  const startChatroomRound = async (topic: string, experts: string[], round: number, followUp?: string) => {
    setLoading(true);
    setChatroomState("active");

    try {
      // Build context for round > 1
      let contextStr = "";
      if (round > 1) {
        const past = messages.filter(m => m.name).map(m => `${m.name}说：${m.content.substring(0, 100)}...`).join("\n");
        contextStr = `\n\n=== 之前的讨论 ===\n${past}\n\n用户新的追问：${followUp}`;
      }

      // Call experts in parallel
      const expertPromises = experts.map(async (expert) => {
        const systemPrompt = `你是${expert}。话题：${topic}。请从你的专属视角、思维方式和说话风格回应。要求：全中文，250字以内，不套公式，给出真实洞察。如果同意，不用重复；如果不同意，直接反驳。` + contextStr;
        const payload = [{ role: "system", content: systemPrompt }, { role: "user", content: followUp || topic }];
        
        try {
          const res = await invoke<string>("ask_ai", { messages: payload });
          return { name: expert, content: res };
        } catch (e) {
          return { name: expert, content: `(发言失败: ${e})` };
        }
      });

      const expertReplies = await Promise.all(expertPromises);

      // Append expert replies
      const newMessages = expertReplies.map(r => ({ role: "assistant" as const, name: r.name, content: r.content }));
      setMessages(prev => [...prev, ...newMessages]);

      // Call Judge
      const judgePrompt = `你是自由聊天室的判官Claude。专家们刚刚对话题“${topic}”进行了讨论。请总结他们的交锋点、补充盲区，并给出具体收获。200字以内，全中文。`;
      const judgePayload = [
        { role: "system", content: judgePrompt },
        { role: "user", content: "专家发言：\n" + expertReplies.map(r => `${r.name}: ${r.content}`).join("\n\n") }
      ];
      
      const judgeReply = await invoke<string>("ask_ai", { messages: judgePayload });
      
      setMessages(prev => [...prev, 
        { role: "assistant", name: "Claude 判官", content: judgeReply },
        { role: "assistant", content: "继续聊？可以追问、换方向、点名某位专家、或加/换人。输入「结束」退出头脑风暴。" }
      ]);

    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `[错误] ${e}` }]);
    } finally {
      setLoading(false);
    }
  };

  const endChatroom = () => {
    setChatroomState("idle");
    setMessages(prev => [...prev, { role: "assistant", content: "头脑风暴已结束！随时可以开启新的聊天室。" }]);
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            backgroundColor: msg.role === "user" ? "var(--color-primary)" : "var(--color-surface-warm-light)",
            color: msg.role === "user" ? "white" : "var(--color-text)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            maxWidth: "80%"
          }}>
            {msg.name && <div style={{ fontWeight: "bold", marginBottom: "4px", color: "var(--color-primary-dark)" }}>💬 {msg.name}</div>}
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {msg.role === "user" ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start" }}>
            <LoadingSpinner />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="card" style={{ display: "flex", gap: "12px", position: "relative" }}>
        {showSlashMenu && (
          <div style={{
            position: "absolute",
            bottom: "100%",
            left: "16px",
            marginBottom: "8px",
            background: "var(--color-surface-warm)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
            overflow: "hidden"
          }}>
            <button
              onClick={() => {
                setInput("/chatroom ");
                setShowSlashMenu(false);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                color: "var(--color-text)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-warm-light)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>/chatroom</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-light)" }}>开启多专家头脑风暴</span>
            </button>
          </div>
        )}
        <textarea
          className="textarea-input"
          placeholder={chatroomState === "idle" ? "输入任何你想聊的内容，或者输入 / 唤出菜单..." : "你可以追问，或者输入「结束」退出聊天室..."}
          value={input}
          onChange={(e) => {
            const val = e.target.value;
            setInput(val);
            if (val === "/") {
              setShowSlashMenu(true);
            } else if (!val.startsWith("/")) {
              setShowSlashMenu(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setShowSlashMenu(false);
              handleSend();
            } else if (e.key === "Escape") {
              setShowSlashMenu(false);
            }
          }}
          rows={3}
          style={{ flex: 1, resize: "none" }}
        />
        <Button variant="primary" onClick={handleSend} disabled={loading || !input.trim()}>
          发送
        </Button>
      </div>
    </div>
  );
};