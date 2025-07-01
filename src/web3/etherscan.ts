import axios from "axios";

/**
 * Description placeholder
 *
 * @interface VerifyContractParams
 * @typedef {VerifyContractParams}
 */
interface VerifyContractParams {
  /**
   * Description placeholder
   *
   * @type {string}
   */
  encodedMessageWithoutPrefix: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  tokenAddress: string;
}

/**
 * Description placeholder
 *
 * @async
 * @param {VerifyContractParams} param0
 * @param {string} param0.encodedMessageWithoutPrefix
 * @param {string} param0.tokenAddress
 * @returns {unknown}
 */
export const verifyContract = async ({
  encodedMessageWithoutPrefix,
  tokenAddress,
}: VerifyContractParams) => {
  // export const verifyContract = async ({ tokenAddress }: VerifyContractParams) => {
  try {
    // Prepare the data to send to the backend
    const data = {
      encodedMessageWithoutPrefix,
      tokenAddress,
    };
    const API = import.meta.env.VITE_API_BASE_URL;
    // Call the /verify endpoint on the backend
    const response = await axios.post(`${API}/verify`, data);

    // Handle the response (you can customize this to return relevant data)
    return response.data; // Return data for further use in the component
  } catch (error) {
    console.error("Error during contract verification:", error);
    throw new Error("Error during contract verification. Please try again.");
  }
};
