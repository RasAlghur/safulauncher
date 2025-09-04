import { ethers } from "ethers";
import type { TimeframeOption } from "./types";

export function formatTokenAmount(
    amount: string | number,
    decimals: number = 2
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
// Utility functions
/**
 * Description placeholder
 *
 * @param {string} isoString
 * @returns {string}
 */
export function formatUTC(isoString: string): string {
    const date = new Date(isoString);

    const formattedDate = date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    return `${formattedDate}, ${formattedTime}`;
}

export function formatRawAmount(raw: unknown, decimals = 18) {
    if (raw == null) throw new Error("no value");
    // if it's an ethers v6 bigint (typical), formatUnits accepts it directly
    if (typeof raw === "bigint") return ethers.formatUnits(raw, decimals);
    // if it's an ethers BigNumber-like (has _hex), pass its hex
    return ethers.formatUnits(String(raw), decimals);
}

export function formatRelativeTime(dateInput: string | Date): string {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const now = new Date();
    const target = new Date(dateInput);
    const diff = target.getTime() - now.getTime();

    const seconds = Math.round(diff / 1000);
    const minutes = Math.round(diff / (1000 * 60));
    const hours = Math.round(diff / (1000 * 60 * 60));
    const days = Math.round(diff / (1000 * 60 * 60 * 24));

    if (Math.abs(seconds) < 60) {
        return rtf.format(seconds, "second");
    } else if (Math.abs(minutes) < 60) {
        return rtf.format(minutes, "minute");
    } else if (Math.abs(hours) < 24) {
        return rtf.format(hours, "hour");
    } else {
        return rtf.format(days, "day");
    }
}

/**
 * Description placeholder
 *
 * @param {string} address
 * @returns {boolean}
 */
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Calculate period based on timeframe for data fetching
export const calculatePeriod = (timeframe: TimeframeOption): string => {
    if (timeframe.seconds) {
        // For seconds, fetch last few minutes of data
        return `${Math.max(300, timeframe.seconds * 100)}s`; // At least 5 minutes
    } else if (timeframe.minutes) {
        // For minutes, fetch proportional hours
        const hours = Math.max(4, timeframe.minutes * 4);
        return `${hours}h`;
    } else if (timeframe.hours) {
        // For hours, fetch proportional days
        const days = Math.max(1, Math.ceil(timeframe.hours * 3));
        return `${days}d`;
    } else if (timeframe.days) {
        // For days, fetch proportional period
        if (timeframe.days <= 3) {
            return `${timeframe.days * 7}d`; // Show more context
        } else if (timeframe.days === 7) {
            return "2M"; // 2 months for weekly
        } else {
            return "6M"; // 6 months for monthly
        }
    }
    return "30d"; // Default fallback
};