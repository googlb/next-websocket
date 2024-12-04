"use client"
import { Client } from "@stomp/stompjs";
import { useState, useEffect, useRef } from "react";

// 定义 messageParam 的接口
interface MessageParam {
  key: string;
  value: string | string[];
}

export default function StompWebSocketPage() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8080/ws");
  const [topic, setTopic] = useState("/topic/miniticker/BTCUSDT");
  const [destination, setDestination] = useState("/app/subscribe");
  const [messageParams, setMessageParams] = useState<MessageParam[]>([{ key: "", value: "" }]);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      clientRef.current = new Client({
        brokerURL: socketUrl,
        onConnect: () => {
          console.log("连接成功:", socketUrl);
          setIsConnected(true);
          subscribeToTopic();
        },
        onStompError: (frame) => {
          console.error("连接错误: " + frame.headers["message"]);
          setIsConnected(false);
        },
        onDisconnect: () => {
          setIsConnected(false);
        },
      });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [socketUrl]);

  const connectToStomp = () => {
    if (clientRef.current) {
      clientRef.current.activate();
    }
  };

  const subscribeToTopic = () => {
    if (clientRef.current && isConnected) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      subscriptionRef.current = clientRef.current.subscribe(topic, (message) => {
        try {
          console.log("接收到消息:", message);
          setMessages((prevMessages) => [ message.body,...prevMessages]);
        } catch (error) {
          console.error("消息解析错误:", error);
        }
      });
    }
  };

  const sendMessage = () => {
    console.log("尝试发送消息:", messageParams);

    if (!clientRef.current || !isConnected) {
      console.error("WebSocket 客户端未连接");
      return;
    }

    const params = messageParams.reduce((acc, { key, value }) => {
      if (key && value) {
        acc[key] = Array.isArray(value) ? value : [value];
      }
      return acc;
    }, {} as Record<string, string[]>);

    try {
      clientRef.current.publish({
        destination: destination,
        body: JSON.stringify(params),
      });
      console.log("成功发送消息:", JSON.stringify(params));
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  };

  const addParameterRow = () => {
    setMessageParams([...messageParams, { key: "", value: "" }]);
  };

  const removeParameterRow = (index: number) => {
    setMessageParams(messageParams.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: string, value: string) => {
    const updatedParams = messageParams.map((param, i) => {
      if (i !== index) return param;

      if (field === "value") {
        try {
          // 尝试将输入解析为 JSON
          const parsedValue = JSON.parse(value);
          return { ...param, value: Array.isArray(parsedValue) ? parsedValue : value };
        } catch {
          // 如果解析失败，按字符串处理
          return { ...param, value };
        }
      }

      return { ...param, [field]: value };
    });

    setMessageParams(updatedParams);
  };

  const disconnectFromStomp = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">STOMP WebSocket Client</h1>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="WebSocket URL"
            value={socketUrl}
            onChange={(e) => setSocketUrl(e.target.value)}
            className="flex-grow p-2 border rounded"
            disabled={isConnected}
          />
          {!isConnected ? (
            <button onClick={connectToStomp} className="bg-blue-500 text-white p-2 rounded">
              连接
            </button>
          ) : (
            <button onClick={disconnectFromStomp} className="bg-red-500 text-white p-2 rounded">
              断开
            </button>
          )}
        </div>

        {isConnected && (
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="主题"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-grow p-2 border rounded"
            />
            <button onClick={subscribeToTopic} className="bg-green-500 text-white p-2 rounded">
              订阅
            </button>
          </div>
        )}

        {isConnected && (
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="发送目的地"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex-grow p-2 border rounded"
            />
            <button onClick={sendMessage} className="bg-purple-500 text-white p-2 rounded">
              发送
            </button>
          </div>
        )}

        <div>
          <button onClick={addParameterRow} className="bg-teal-500 text-white p-2 rounded mb-2">
            添加参数
          </button>
        </div>

        {messageParams.map((param, index) => (
          <div key={index} className="flex space-x-2 items-center">
            <input
              type="text"
              placeholder="参数名"
              value={param.key}
              onChange={(e) => updateParameter(index, "key", e.target.value)}
              className="flex-grow p-2 border rounded"
            />
            <input
              type="text"
              placeholder="参数值 (支持 JSON 格式)"
              value={typeof param.value === "string" ? param.value : JSON.stringify(param.value)}
              onChange={(e) => updateParameter(index, "value", e.target.value)}
              className="flex-grow p-2 border rounded"
            />
            <button
              onClick={() => removeParameterRow(index)}
              className="bg-red-500 text-white p-2 rounded"
            >
              删除
            </button>
          </div>
        ))}

        <div className="border rounded h-64 overflow-y-auto">
          <h3 className="p-2 bg-gray-100 sticky top-0">接收到的消息: {messages.length}</h3>
          {messages.map((msg, index) => (
            <div key={index} className="p-2 border-b last:border-0 text-sm">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}