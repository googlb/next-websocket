"use client";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useState, useEffect, useCallback } from "react";
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
import { useToastHelper } from "@/utils/toastHelper";
import { LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

export default function StompWebSocketPage() {
  const [socketUrl, setSocketUrl] = useState("http://localhost:8080/ws");
  const [topic, setTopic] = useState("/v1/topic/miniticker/BTCUSDT");
  const [destination, setDestination] = useState("/v1/subscribe/");
  const [jsonMessage, setJsonMessage] = useState("{}");
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [formatAsJson, setFormatAsJson] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { showToast } = useToastHelper();
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const client = new Client({
        webSocketFactory: () => {
          return new SockJS(socketUrl, null, {
            // withCredentials: true
          });
        },
        debug: (str) => {
          console.log('STOMP: ' + str);
        }
      });

      client.onConnect = () => {
        console.log("连接成功:", socketUrl);
        setIsConnected(true);
        setIsConnecting(false);
      };

      client.onStompError = (frame) => {
        console.error("STOMP错误:", frame);
        setIsConnected(false);
        showToast("连接错误", frame.headers["message"] || "Unknown error");
      };

      client.onWebSocketError = (error) => {
        console.error("WebSocket错误:", error);
        setIsConnected(false);
        showToast("连接错误", "WebSocket connection failed");
        setIsConnecting(false);
      };

      setStompClient(client);

      return () => {
        if (client.active) {
          client.deactivate();
        }
      };
    }
  }, [socketUrl, showToast]);

  const connectToStomp = () => {
    if (!isConnecting && stompClient && !stompClient.active) {
      console.log("尝试连接 WebSocket 客户端:", socketUrl);
      setIsConnecting(true);
      stompClient.activate();
    }
  };

  const disconnectFromStomp = () => {
    if (stompClient && stompClient.active) {
      stompClient.deactivate();
      setIsConnected(false);
    }
  };

  const subscribeToTopic = useCallback(() => {
    if (stompClient && stompClient.active) {
      console.log("尝试订阅主题:", topic);
      stompClient.subscribe(topic, (message) => {
        console.log("接收到消息:", message.body);
        setMessages((prev) => [message.body, ...prev]);
      });
    } else {
      console.error("无法订阅，客户端未连接");
    }
  }, [stompClient, topic]);

  const sendMessage = () => {
    if (stompClient && stompClient.active) {
      try {
        const params = JSON.parse(jsonMessage);
        stompClient.publish({
          destination: destination,
          body: JSON.stringify(params)
        });
        console.log("消息发送成功");
      } catch (error) {
        console.error("发送消息失败:", error);
        showToast("错误", "消息格式不正确");
      }
    } else {
      showToast("错误", "WebSocket未连接");
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