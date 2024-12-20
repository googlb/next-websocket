"use client";

import { Client } from "@stomp/stompjs";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToastHelper } from "@/utils/toastHelper"; // 引入封装的工具类
import { LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";
// import ReactJson from "react-json-view";
const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

export default function StompWebSocketPage() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8080/ws");
  const [topic, setTopic] = useState("/v1/topic/miniticker/BTCUSDT");
  const [destination, setDestination] = useState("/v1/subscribe/");

  const [jsonMessage, setJsonMessage] = useState("{}"); // 新增的状态
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [formatAsJson, setFormatAsJson] = useState(true); // 控制是否格式化为 JSON
  const [isCollapsed, setIsCollapsed] = useState(false); // 控制 JSON 是否折叠
  // const { toast } = useToast();
  const { showToast } = useToastHelper(); // 使用封装的工具方法

  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const subscribeToTopic = useCallback(() => {
    console.log("尝试订阅主题:", topic);
    if (clientRef.current && isConnected) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      subscriptionRef.current = clientRef.current.subscribe(
        topic,
        (message) => {
          try {
            console.log("接收到消息:", message.body);
            setMessages((prevMessages) => [message.body, ...prevMessages]);
          } catch (error) {
            console.error("消息解析错误:", error);
          }
        }
      );
      console.log("订阅成功:", topic);
    }else{
      console.error("无法订阅，客户端未连接或已断开");
    }
  }, [clientRef, isConnected, setMessages, topic]);

  useEffect(() => {

    if (typeof window !== "undefined") {
      clientRef.current = new Client({
        brokerURL: socketUrl,
        onConnect: () => {
          console.log("连接成功:", socketUrl);
          setIsConnected(true);
          // // subscribeToTopic();
          setTimeout(() => {
            setIsConnecting(false);
          }, 1000);
        },
        onStompError: (frame) => {
          console.error("连接错误: " + frame.headers["message"]);
          setIsConnected(false);
          showToast(
             "连接错误.","There was a problem with your request.",
          );
        },
        onDisconnect: () => {
          console.log("断开连接");
          setIsConnected(false);
        },
        onWebSocketError: (error) => {
          showToast("连接错误.", 'onWebSocketError');
          console.error("onWebSocketError 错误:", error);
          setIsConnected(false);
          if (clientRef.current) {
            clientRef.current.deactivate();
          }
          setTimeout(() => {
            setIsConnecting(false);
          }, 1000);
        },
      });
    }

    return () => {
      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch (error) {
          console.error("连接激活失败:", error);
          console.log("调用 toast 函数前的检查");

        }
      }
    };
  }, [showToast, socketUrl]);

  const connectToStomp = () => {
    if (!isConnecting) {
      console.log("尝试连接 WebSocket 客户端:", socketUrl);
      setIsConnecting(true);
      if (clientRef.current) {
        clientRef.current.activate();
      }
    }
  };

  const sendMessage = () => {
    console.log("尝试发送消息:", jsonMessage);

    if (!clientRef.current || !isConnected) {
      console.error("WebSocket 客户端未连接");
      return;
    }

    try {
      const params = JSON.parse(jsonMessage); // 解析 JSON 字符串为对象

      clientRef.current.publish({
        destination: destination,
        body: JSON.stringify(params),
      });

      console.log("成功发送消息:", JSON.stringify(params));
    } catch (error) {
      console.error("发送消息失败或JSON解析错误:", error);
    }
  };

  const disconnectFromStomp = () => {
    console.log("尝试断开 WebSocket 客户端");
    if (clientRef.current) {
      clientRef.current.deactivate();
    }
  };

  const clearMessages = () => {
    setMessages([]); // 清空消息
  };

  return (
    <div className="mx-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} className="gap-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex space-x-2 p-2">
              <Input
                type="text"
                placeholder="WebSocket URL"
                value={socketUrl}
                onChange={(e) => setSocketUrl(e.target.value)}
                disabled={isConnected}
              />
              {!isConnected ? (
                <Button
                  onClick={connectToStomp}
                  className="bg-blue-500 text-white "
                >
                  {isConnecting ? <LoaderCircle className="animate-spin" /> : '连接'}
                </Button>
              ) : (
                <Button
                  onClick={disconnectFromStomp}
                  className="bg-red-500 text-white "
                >
                  断开
                </Button>
              )}
            </div>

            {isConnected && (
              <div className="flex space-x-2 px-2 items-center">
                <Label htmlFor="topic" className="flex text-center w-20">主题</Label>
                <Input
                  type="text"
                  placeholder="主题"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <Button
                  onClick={subscribeToTopic}
                  className="bg-green-500 text-white "
                >
                  订阅
                </Button>
              </div>
            )}

            {isConnected && (
              <div className="flex flex-col space-y-2 items-center p-2">
                <div className="flex items-center w-full">
                  <Label htmlFor="topic" className="flex text-center w-20">发送地址</Label>
                  <Input
                    type="text"
                    placeholder="发送目的地"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>

                <Textarea
                  placeholder="输入 JSON 消息体"
                  value={jsonMessage}
                  onChange={(e) => setJsonMessage(e.target.value)}
                  className="flex-grow p-2 border rounded h-32"
                />
                <Button
                  onClick={sendMessage}
                  className="bg-green-500 text-white "
                >
                  发送
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="mx-2" />
        <ResizablePanel defaultSize={50}>
          <div className="p-2 max-w-3xl mx-auto">
            {/* 控制选项 */}
            <div className="flex items-center space-x-6 mb-4">
              {/* 是否格式化为 JSON */}
              <RadioGroup
                defaultValue="true"
                className="flex space-x-4"
                onValueChange={(value) => setFormatAsJson(value === "true")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="format-json" />
                  <label htmlFor="format-json" className="text-sm">
                    格式化为 JSON
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="raw-string" />
                  <label htmlFor="raw-string" className="text-sm">
                    原始字符串
                  </label>
                </div>
              </RadioGroup>

              {/* 是否折叠 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="collapse-checkbox"
                  checked={isCollapsed}
                  onCheckedChange={(checked) => setIsCollapsed(!!checked)}
                />
                <label htmlFor="collapse-checkbox" className="text-sm">
                  折叠 JSON
                </label>
              </div>
              <Button
                onClick={clearMessages}
                variant="destructive"
                className="size-sm"
              >
                清空消息
              </Button>
            </div>
            <div className="flex my-2 bg-gray-100 gap-2 p-2">
              接收到的消息: {messages.length}
            </div>
            <div className="rounded-md border p-4 max-h-[50vh] min-h-[80vh] overflow-y-auto">
              <div>
                {messages.map((msg, index) => {
                  let parsedMsg;
                  try {
                    parsedMsg = JSON.parse(msg); // 尝试将字符串解析为 JSON 对象
                  } catch (error) {
                    parsedMsg = null;
                    console.log(error); // 如果解析失败，返回 null
                  }

                  return (
                    <div
                      key={index}
                      className="p-2 border-b last:border-0 text-sm"
                    >
                      {formatAsJson && parsedMsg ? (
                        // 如果解析成功，使用 ReactJson 展示
                        <ReactJson
                          src={parsedMsg}
                          collapsed={isCollapsed}
                          name={false}
                        />
                      ) : (
                        // 如果解析失败，直接显示原始字符串
                        <pre className="whitespace-pre-wrap break-words text-sm font-mono">
                          {msg}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}