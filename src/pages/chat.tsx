import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEventHandler,
} from "react";
import { FaArrowDown } from "react-icons/fa";
import { socket } from "../lib/socket";
import { base } from "../lib/api";
import { IoChevronForward } from "react-icons/io5";

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
type prop = {
  address: string | undefined;
  tokenAddress: string | undefined;
};
export default function Chat({ address, tokenAddress }: prop) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const onMessageSend: FormEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const payload: Pick<MessagePayload, "groupId" | "text" | "userId"> = {
      groupId: String(tokenAddress),
      userId: String(address),
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

    // Join the group chat room
    socket.emit("joinRoom", String(tokenAddress));

    const handleReceiveMessage = (msg: MessagePayload) => {
      // console.log("Received message:", msg);
      setMessages((prevMessages) => [...prevMessages, msg]);
    };

    socket.on("recMessage", handleReceiveMessage);

    return () => {
      socket.off("recMessage", handleReceiveMessage);
      socket.disconnect();
    };
  }, [tokenAddress]);

  const fetchMessages = useCallback(
    async (page = 1, append = false, groupId = tokenAddress) => {
      const response = await base.get("community-chats", {
        params: { page, groupId },
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
    },
    [tokenAddress]
  );

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
  }, [hasNextPage, currentPage, fetchMessages]);

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
    <div className="flex flex-col h-fit dark:bg-[#0B1120] relative font-sans">
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 relative"
        ref={chatContainerRef}
        style={{ scrollBehavior: "smooth", scrollbarWidth: "none" }}
      >
        {messages.map((msg, index) => {
          const isUser = address === msg.userId;
          const bubbleColor = isUser ? "bg-[#0C2FE0]/75" : "bg-[#0C8CE0]";
          const bubbleAlign = isUser ? "items-end" : "items-start";
          const textAlign = isUser ? "text-right" : "text-left";

          return (
            <div key={index} className={`mb-4 flex flex-col ${bubbleAlign}`}>
              {/* Avatar & Address for incoming messages */}
              {!isUser && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="dark:text-white/80 text-black text-sm font-medium">
                    {msg.userId?.slice(0, 5) + "..." + msg.userId?.slice(-4)}
                  </span>
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`max-w-[75%] ${bubbleColor} text-white px-4 py-3 rounded-l-2xl rounded-tr-2xl ${textAlign}`}
              >
                {msg.text}
              </div>

              {/* Timestamp */}
            </div>
          );
        })}

        {/* Scroll To Bottom */}
        <button
          onClick={scrollToBottom}
          className={`${
            showScrollButton ? "block" : "hidden"
          } absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50`}
        >
          <FaArrowDown />
        </button>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-t-[#0C8CE0]/50 dark:border-white/10 dark:bg-[#0B1120] flex items-center gap-2">
        <input
          type="text"
          placeholder="Enter Your Messages"
          className="flex-1 rounded-full  dark:text-white text-[#141313] dark:placeholder:text-white/60 font-raleway placeholder:text-black/60 px-4 py-2 focus:outline-none "
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={onMessageSend}
          disabled={!address}
          className="bg-[#0C8CE0] hover:bg-[#0C2FE0]/90 text-white p-3 flex items-center justify-center rounded-full"
        >
          <IoChevronForward className="text-xl" />
        </button>
      </div>
    </div>
  );
}
