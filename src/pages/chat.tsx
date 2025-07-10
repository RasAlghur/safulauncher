import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEventHandler,
} from "react";
import { FaArrowDown } from "react-icons/fa";
import { base } from "../lib/api";
import { socket } from "../lib/socket";

interface MessagePayload {
  id: string;
  groupId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface oldMessages {
  data: MessagePayload[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  //Note: this is just for styling purposes, you can replace it with your own user ID logic
  // In a real application, you would get the user ID from your authentication system
  const userId = socket.id || "user1"; // Fallback user ID if socket is not connected

  const onMessageSend: FormEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const payload: Pick<MessagePayload, "groupId" | "text" | "userId"> = {
      groupId: "default",
      userId,
      text: message,
    };

    socket.emit("sendMessage", payload);
    setMessage("");

    // Scroll after message is added
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleReceiveMessage = (msg: MessagePayload) => {
      console.log("Received message:", msg);
      setMessages((prevMessages) => [...prevMessages, msg]);
    };

    socket.on("recMessage", handleReceiveMessage);

    return () => {
      socket.off("recMessage", handleReceiveMessage);
      socket.disconnect();
    };
  }, []);

  const fetchMessages = async (page = 1, append = false) => {
    const response = await base.get("community-chat", {
      params: { page },
    });
    const { data } = response.data;
    const oldMessages: oldMessages = data;
    // console.log(oldMessages);

    setHasNextPage(oldMessages.hasNextPage);
    setCurrentPage(oldMessages.currentPage);

    if (append) {
      setMessages((prev) => [...oldMessages.data, ...prev]);
    } else {
      setMessages(oldMessages.data);
    }
  };

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const initialLoad = useRef(true);

  useEffect(() => {
    if (messages.length > 0 && initialLoad.current) {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      initialLoad.current = false;
    }
  }, [messages]);

  const handleScroll = useCallback(async () => {
    const container = chatContainerRef.current;
    if (!container) return;
    // Show button if not at bottom (20px threshold)
    setShowScrollButton(
      container.scrollTop + container.clientHeight < container.scrollHeight - 20
    );

    if (container.scrollTop === 0 && hasNextPage) {
      const nextPage = currentPage + 1;
      const prevHeight = container.scrollHeight;
      await fetchMessages(nextPage, true);
      // Maintain scroll position after loading
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight;
        }
      }, 0);
    }
  }, [hasNextPage, currentPage]);

  // Attach scroll event
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-900">
      <div className="relative">
        <div
          className="h-96 overflow-y-auto"
          ref={chatContainerRef}
          style={{ scrollBehavior: "smooth", scrollbarWidth: "none" }}
        >
          {messages.map((msg, index) => {
            return (
              <div
                key={index}
                className={`${
                  userId === msg.userId ? "flex justify-end" : "justify-start"
                } text-white mb-2`}
              >
                <p>{msg.text}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={scrollToBottom}
          className={`${
            showScrollButton ? "block" : "hidden"
          } absolute bottom-3 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50`}
        >
          <FaArrowDown />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your message here..."
          className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={onMessageSend}
          className="bg-blue-500 h-max text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
