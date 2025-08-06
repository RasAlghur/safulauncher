import { useState } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";

interface CopyButtonProps {
  value: string;
  className?: string;
}

const CopyButton = ({ value, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`ml-2 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <FaCheck className="text-green-500" /> : <FaRegCopy />}
    </button>
  );
};

export default CopyButton;
