// src/pages/Launch.tsx
import React, { useCallback, useEffect, useState, type FormEvent } from "react";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    type BaseError,
} from "wagmi";
import { SAFU_LAUNCHER_CA, LAUNCHER_ABI } from "../web3/config";
import { ethers } from "ethers";

export default function Launch() {

    // Basic fields
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [supply, setSupply] = useState<number>(0);
    const [website, setWebsite] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [logo, setLogo] = useState<File | null>(null);


    // Toggles
    const [enableTax, setEnableTax] = useState(false);
    const [enableWhitelist, setEnableWhitelist] = useState(false);
    const [startNow, setStartNow] = useState(true);
    const [lpOption, setLpOption] = useState<"lock" | "burn">("lock");
    const [enableBundle, setEnableBundle] = useState(false);
    const [enablePlatformFee, setEnablePlatformFee] = useState(false);

    // Dynamic groups
    const [taxList, setTaxList] = useState<{ addr: string; bps: number }[]>([]);
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [bundleList, setBundleList] = useState<{ addr: string; pct: number }[]>([]);
    const [bundleEth, setBundleEth] = useState<number>(0);
    const [platformFeeList, setPlatformFeeList] = useState<{ addr: string; pct: number }[]>([]);
    const [platformFeeBps, setPlatformFeeBps] = useState<number>(0);

    const { data: txHash, isPending, error, writeContract } = useWriteContract();
    const { data: result, isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash: txHash });
    // Handlers to add/remove entries
    const addItem = <T,>(arr: T[], setter: React.Dispatch<React.SetStateAction<T[]>>, item: T, max: number) => {
        if (arr.length >= max) return;
        setter([...arr, item]);
    };
    const removeItem = <T,>(arr: T[], setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number) => {
        setter(arr.filter((_, i) => i !== idx));
    };

    // Compute conditional inputs
    const taxBpsSum: bigint = enableTax
        ? taxList.reduce((sum, t) => sum + BigInt(t.bps), 0n)
        : 0n;
    const taxRecipientsAddrs = enableTax
        ? (taxList.map(t => t.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]);
    const taxPercentsArray = enableTax
        ? (taxList.map(t => t.bps) as readonly number[])
        : ([] as readonly number[]);

    const bundleAddrs = enableBundle
        ? (bundleList.map(b => b.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]);
    const bundleShares = enableBundle
        ? (bundleList.map(b => Math.floor(b.pct * 100)) as readonly number[])
        : ([] as readonly number[]);
    const ethValue = enableBundle
        ? ethers.parseEther(bundleEth.toString())
        : 0n;

    const wlArray = enableWhitelist
        ? (whitelist as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]);

    const pfBps = enablePlatformFee ? platformFeeBps : 0;
    const pfAddrs = enablePlatformFee
        ? (platformFeeList.map(p => p.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]);
    const pfPercs = enablePlatformFee
        ? (platformFeeList.map(p => Math.floor(p.pct * 100)) as readonly number[])
        : ([] as readonly number[]);

    // Validation (optional inline checks)
    const validate = () => {
        if (enableTax && taxBpsSum > 1000n) throw new Error("Tax exceeds 10% limit");
        if (enableBundle && bundleList.length > 30) throw new Error("Max 30 bundle entries");
        if (enableWhitelist && whitelist.length > 200) throw new Error("Max 200 whitelist addresses");
        if (
            enablePlatformFee &&
            (pfBps > 500 || pfPercs.reduce((a, b) => a + b, 0) !== 10000)
        ) {
            throw new Error("Invalid platform fee config");
        }
    };

    // Build args
    const argArray: [
        string, string, bigint, bigint, boolean, boolean, boolean,
        readonly `0x${string}`[], readonly number[],
        readonly `0x${string}`[], readonly number[],
        readonly `0x${string}`[], number,
        readonly `0x${string}`[], readonly number[]
    ] = [
            name,
            symbol,
            ethers.parseUnits(supply.toString(), 18),
            taxBpsSum,
            lpOption === "lock",
            enableWhitelist,
            startNow,
            bundleAddrs,
            bundleShares,
            taxRecipientsAddrs,
            taxPercentsArray,
            wlArray,
            pfBps,
            pfAddrs,
            pfPercs,
        ];

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            try {
                validate();
                writeContract({
                    ...LAUNCHER_ABI,
                    functionName: "createToken",
                    args: argArray,
                    value: ethValue,
                });
            } catch (err) {
                console.error(err);
            }
        }, [
        name,
        symbol,
        supply,
        enableTax,
        taxList,
        lpOption,
        enableWhitelist,
        startNow,
        enableBundle,
        bundleList,
        bundleEth,
        whitelist,
        enablePlatformFee,
        platformFeeBps,
        platformFeeList,
    ]
    );


    useEffect(() => {
        if (isConfirmed && result) {
            const fd = new FormData();
            fd.append('name', name);
            fd.append('symbol', symbol);
            fd.append('website', website);
            fd.append('description', description);
            fd.append('tokenCreator', result?.from);
            const topic1 = result?.logs[2].topics[1]; // e.g., "0x000...1234"
            let decodedAddress = "";
            if (topic1) {
                decodedAddress = ethers.getAddress("0x" + topic1.slice(-40));
            }
            fd.append('tokenAddress', decodedAddress);
            if (logo) fd.append('logo', logo);
            fetch('/api/tokens', { method: 'POST', body: fd });
        }
    }, [isConfirmed]);

    console.log("string calldata name | string calldata symbol | uint256 supply | uint256 taxBps_ | bool lockLp | bool whitelistOnly_ | bool startNow | address[] calldata bundleAddrs | uint16[] calldata bundleShares | address[] calldata taxRecipients | uint16[] calldata taxPercents | address[] calldata initialWhitelist | uint16 platformFeeBps_ | address[] calldata platformFeeRecipients_ | uint16[] calldata platformFeePercents_")
    console.log("createToken args:", argArray, "value:", ethValue.toString());

    return (
        <div className="container">
            <h1>Launch Your Token</h1>
            <form id="launch-form" onSubmit={handleSubmit}>
                {/* Name */}
                <label>
                    <span className="mandatory">Name</span>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </label>
                <div className="help">Token name (e.g. “MoonCat”)</div>

                {/* Symbol */}
                <label>
                    <span className="mandatory">Symbol</span>
                    <input
                        type="text"
                        value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        required
                    />
                </label>
                <div className="help">Ticker symbol (e.g. “MCAT”)</div>

                {/* Supply */}
                <label>
                    <span className="mandatory">Supply</span>
                    <input
                        type="number"
                        value={supply}
                        onChange={e => setSupply(parseInt(e.target.value))}
                        required
                    />
                </label>
                <div className="help">Total supply (e.g. 1,000,000,000)</div>
                <input type="url" placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <input type="file" accept="image/*" onChange={e => setLogo(e.target.files?.[0] ?? null)} />

                {/* Tax Toggle */}
                <div className="toggle-group">
                    <span>Enable Tax</span>
                    <div
                        className="toggle"
                        onClick={() => setEnableTax(!enableTax)}
                    >
                        <input
                            type="checkbox"
                            checked={enableTax}
                            readOnly
                        />
                        <div className="knob" />
                    </div>
                </div>
                <div className="help">Collect up to 10% tax on Uniswap trades.</div>

                {/* Tax Section */}
                {enableTax && (
                    <div id="tax-section" className="group">
                        {taxList.map((t, i) => (
                            <div key={i} className="group-item">
                                <input
                                    placeholder="0x…"
                                    value={t.addr}
                                    onChange={e => {
                                        const list = [...taxList];
                                        list[i].addr = e.target.value;
                                        setTaxList(list);
                                    }}
                                />
                                <input
                                    placeholder="e.g.200"
                                    type="number"
                                    value={t.bps}
                                    onChange={e => {
                                        const list = [...taxList];
                                        list[i].bps = parseInt(e.target.value);
                                        setTaxList(list);
                                    }}
                                />
                                <button type="button" onClick={() => removeItem(taxList, setTaxList, i)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem(taxList, setTaxList, { addr: "", bps: 0 }, 5)}>
                            + Add Tax Recipient
                        </button>
                    </div>
                )}

                {/* Whitelist Toggle */}
                <div className="toggle-group">
                    <span>Whitelist Only</span>
                    <div
                        className="toggle"
                        onClick={() => setEnableWhitelist(!enableWhitelist)}
                    >
                        <input type="checkbox" checked={enableWhitelist} readOnly />
                        <div className="knob" />
                    </div>
                </div>
                <div className="help">Only whitelisted addresses can buy initially.</div>

                {/* Whitelist Section */}
                {enableWhitelist && (
                    <div id="wl-section" className="group">
                        {whitelist.map((addr, i) => (
                            <div key={i} className="group-item">
                                <input
                                    placeholder="0x…"
                                    value={addr}
                                    onChange={e => {
                                        const list = [...whitelist];
                                        list[i] = e.target.value;
                                        setWhitelist(list);
                                    }}
                                />
                                <button type="button" onClick={() => removeItem(whitelist, setWhitelist, i)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem(whitelist, setWhitelist, "", 200)}>
                            + Add Whitelist Address
                        </button>
                    </div>
                )}

                {/* Start Now Toggle */}
                <div className="toggle-group">
                    <span>Start Trading Now</span>
                    <div
                        className="toggle"
                        onClick={() => setStartNow(!startNow)}
                    >
                        <input type="checkbox" checked={startNow} readOnly />
                        <div className="knob" />
                    </div>
                </div>
                <div className="help">ON = live immediately; OFF = start later.</div>

                {/* LP Option */}
                <label>
                    <span className="mandatory">LP Option</span>
                    <select
                        value={lpOption}
                        onChange={e => setLpOption(e.target.value as any)}
                        required
                    >
                        <option value="lock">Lock LP (3 months)</option>
                        <option value="burn">Burn LP</option>
                    </select>
                </label>
                <div className="help">Lock or burn liquidity after bonding.</div>

                {/* Bundle Toggle */}
                <div className="toggle-group">
                    <span>Enable Bundle</span>
                    <div
                        className="toggle"
                        onClick={() => setEnableBundle(!enableBundle)}
                    >
                        <input type="checkbox" checked={enableBundle} readOnly />
                        <div className="knob" />
                    </div>
                </div>
                <div className="help">Dev pre-buy (max 15% of supply).</div>

                {/* Bundle Section */}
                {enableBundle && (
                    <div id="bundle-section" className="group">
                        <label>
                            <span>Bundle ETH</span>
                            <input
                                type="number"
                                value={bundleEth}
                                onChange={e => setBundleEth(parseFloat(e.target.value))}
                                placeholder="10"
                            />
                        </label>
                        <div className="help">ETH to spend on initial pre-buy.</div>

                        {bundleList.map((b, i) => (
                            <div key={i} className="group-item">
                                <input
                                    placeholder="0x…"
                                    value={b.addr}
                                    onChange={e => {
                                        const list = [...bundleList];
                                        list[i].addr = e.target.value;
                                        setBundleList(list);
                                    }}
                                />
                                <input
                                    placeholder="e.g.5%"
                                    type="number"
                                    value={b.pct}
                                    onChange={e => {
                                        const list = [...bundleList];
                                        list[i].pct = parseFloat(e.target.value);
                                        setBundleList(list);
                                    }}
                                />
                                <button type="button" onClick={() => removeItem(bundleList, setBundleList, i)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem(bundleList, setBundleList, { addr: "", pct: 0 }, 30)}>
                            + Add Bundle Entry
                        </button>
                    </div>
                )}

                {/* Platform Fee Toggle */}
                <div className="toggle-group">
                    <span>Enable Platform Fees</span>
                    <div
                        className="toggle"
                        onClick={() => setEnablePlatformFee(!enablePlatformFee)}
                    >
                        <input type="checkbox" checked={enablePlatformFee} readOnly />
                        <div className="knob" />
                    </div>
                </div>
                <div className="help">Dev/platform fee (max 5%).</div>

                {/* Platform Fee Section */}
                {enablePlatformFee && (
                    <div id="pf-section" className="group">
                        <label>
                            <span>Platform Fee BPS</span>
                            <input
                                type="number"
                                value={platformFeeBps}
                                onChange={e => setPlatformFeeBps(parseInt(e.target.value))}
                                placeholder="e.g.250"
                            />
                        </label>
                        <div className="help">Max 500 BPS (5%).</div>

                        {platformFeeList.map((p, i) => (
                            <div key={i} className="group-item">
                                <input
                                    placeholder="0x…"
                                    value={p.addr}
                                    onChange={e => {
                                        const list = [...platformFeeList];
                                        list[i].addr = e.target.value;
                                        setPlatformFeeList(list);
                                    }}
                                />
                                <input
                                    placeholder="e.g.50%"
                                    type="number"
                                    value={p.pct}
                                    onChange={e => {
                                        const list = [...platformFeeList];
                                        list[i].pct = parseFloat(e.target.value);
                                        setPlatformFeeList(list);
                                    }}
                                />
                                <button type="button" onClick={() => removeItem(platformFeeList, setPlatformFeeList, i)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem(platformFeeList, setPlatformFeeList, { addr: "", pct: 0 }, 5)}>
                            + Add Platform Fee Recipient
                        </button>
                    </div>
                )}

                {/* Submit */}
                <button type="submit" className="submit-btn" disabled={isPending || isConfirming}>
                    Create Token
                </button>
            </form>

            {error && <p className="text-red-500">Error: {(error as BaseError).message}</p>}
            {isConfirmed && <p className="text-green-500">Token launched!</p>}
        </div>
    );
}
