import { useApiClient } from "../lib/api";

interface VerifyContractParams {
  encodedMessageWithoutPrefix: string;
  tokenAddress: string;
}

export const verifyContract = async ({
  encodedMessageWithoutPrefix,
  tokenAddress,
}: VerifyContractParams) => {
  // export const verifyContract = async ({ tokenAddress }: VerifyContractParams) => {
  try {
    // Prepare the data to send to the backend
    const base = useApiClient();
    const data = {
      encodedMessageWithoutPrefix,
      tokenAddress,
    };
    // Call the /verify endpoint on the backend
    const response = await base.post(`verify`, data);

    // Handle the response (you can customize this to return relevant data)
    return response.data; // Return data for further use in the component
  } catch (error) {
    console.error("Error during contract verification:", error);
    throw new Error("Error during contract verification. Please try again.");
  }
};