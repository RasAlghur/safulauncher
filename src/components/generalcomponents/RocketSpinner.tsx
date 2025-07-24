// components/Spinner.tsx
import { FaSpinner } from "react-icons/fa";

const RocketSpinner = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center gap-2">
    <FaSpinner className="animate-spin text-xl text-white" />
    {message && (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {message}
      </span>
    )}
  </div>
);

export default RocketSpinner;
