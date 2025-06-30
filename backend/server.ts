// safu-dapp/backend/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { ethers } from "ethers";
import dotenv from "dotenv";
// import { fileURLToPath } from 'url';
import axios from "axios";

// ----- Startup Logs -----
console.log("🟢 [startup] Starting SAFU API server...");
dotenv.config();
console.log("✅ [env] Loaded environment variables. PORT =", process.env.PORT);

// ----- Interfaces -----
interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  createdAt: string; // ISO timestamp
  expiresAt?: string;
}

interface TxLog {
  tokenAddress: string;
  type: "buy" | "sell";
  ethAmount: string; // ETH spent (buy) or received (sell)
  tokenAmount: string; // tokens received (buy) or sold (sell)
  timestamp: string; // ISO
  txnHash: string;
  wallet: string;
  isBundleTransaction?: boolean; // Optional for bundle transactions
  originalTxnHash?: string; // Optional for bundle transactions
  bundleIndex?: number; // Optional for bundle transactions
}

// ----- Setup -----
const app = express();
app.use(cors());
// // Use CORS middleware to allow requests from your frontend
// app.use(cors({
//     origin: 'http://localhost:5173', // Allow only this origin (frontend)
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type'],
// }));
app.use(express.json());
console.log("✅ [express] Middleware configured.");
app.use(express.urlencoded({ extended: true }));

// const __filename = fileURLToPath(import.meta.url);
// const __dirname1 = path.dirname(__filename);

let input: any;
try {
  // Define the compiler input object
  input = {
    language: "Solidity",
    sources: {
      "lib/openzeppelin-contracts/contracts/interfaces/draft-IERC6093.sol": {
        content:
          "// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v5.1.0) (interfaces/draft-IERC6093.sol)\npragma solidity ^0.8.20;\n\n/**\n * @dev Standard ERC-20 Errors\n * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.\n */\ninterface IERC20Errors {\n    /**\n     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     * @param balance Current balance for the interacting account.\n     * @param needed Minimum amount required to perform a transfer.\n     */\n    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);\n\n    /**\n     * @dev Indicates a failure with the token `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     */\n    error ERC20InvalidSender(address sender);\n\n    /**\n     * @dev Indicates a failure with the token `receiver`. Used in transfers.\n     * @param receiver Address to which tokens are being transferred.\n     */\n    error ERC20InvalidReceiver(address receiver);\n\n    /**\n     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.\n     * @param spender Address that may be allowed to operate on tokens without being their owner.\n     * @param allowance Amount of tokens a `spender` is allowed to operate with.\n     * @param needed Minimum amount required to perform a transfer.\n     */\n    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);\n\n    /**\n     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.\n     * @param approver Address initiating an approval operation.\n     */\n    error ERC20InvalidApprover(address approver);\n\n    /**\n     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.\n     * @param spender Address that may be allowed to operate on tokens without being their owner.\n     */\n    error ERC20InvalidSpender(address spender);\n}\n\n/**\n * @dev Standard ERC-721 Errors\n * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.\n */\ninterface IERC721Errors {\n    /**\n     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.\n     * Used in balance queries.\n     * @param owner Address of the current owner of a token.\n     */\n    error ERC721InvalidOwner(address owner);\n\n    /**\n     * @dev Indicates a `tokenId` whose `owner` is the zero address.\n     * @param tokenId Identifier number of a token.\n     */\n    error ERC721NonexistentToken(uint256 tokenId);\n\n    /**\n     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     * @param tokenId Identifier number of a token.\n     * @param owner Address of the current owner of a token.\n     */\n    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);\n\n    /**\n     * @dev Indicates a failure with the token `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     */\n    error ERC721InvalidSender(address sender);\n\n    /**\n     * @dev Indicates a failure with the token `receiver`. Used in transfers.\n     * @param receiver Address to which tokens are being transferred.\n     */\n    error ERC721InvalidReceiver(address receiver);\n\n    /**\n     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     * @param tokenId Identifier number of a token.\n     */\n    error ERC721InsufficientApproval(address operator, uint256 tokenId);\n\n    /**\n     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.\n     * @param approver Address initiating an approval operation.\n     */\n    error ERC721InvalidApprover(address approver);\n\n    /**\n     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     */\n    error ERC721InvalidOperator(address operator);\n}\n\n/**\n * @dev Standard ERC-1155 Errors\n * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.\n */\ninterface IERC1155Errors {\n    /**\n     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     * @param balance Current balance for the interacting account.\n     * @param needed Minimum amount required to perform a transfer.\n     * @param tokenId Identifier number of a token.\n     */\n    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);\n\n    /**\n     * @dev Indicates a failure with the token `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     */\n    error ERC1155InvalidSender(address sender);\n\n    /**\n     * @dev Indicates a failure with the token `receiver`. Used in transfers.\n     * @param receiver Address to which tokens are being transferred.\n     */\n    error ERC1155InvalidReceiver(address receiver);\n\n    /**\n     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     * @param owner Address of the current owner of a token.\n     */\n    error ERC1155MissingApprovalForAll(address operator, address owner);\n\n    /**\n     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.\n     * @param approver Address initiating an approval operation.\n     */\n    error ERC1155InvalidApprover(address approver);\n\n    /**\n     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     */\n    error ERC1155InvalidOperator(address operator);\n\n    /**\n     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.\n     * Used in batch transfers.\n     * @param idsLength Length of the array of token identifiers\n     * @param valuesLength Length of the array of token amounts\n     */\n    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);\n}\n",
      },
      "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol": {
        content:
          '// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC20/ERC20.sol)\n\npragma solidity ^0.8.20;\n\nimport {IERC20} from "./IERC20.sol";\nimport {IERC20Metadata} from "./extensions/IERC20Metadata.sol";\nimport {Context} from "../../utils/Context.sol";\nimport {IERC20Errors} from "../../interfaces/draft-IERC6093.sol";\n\n/**\n * @dev Implementation of the {IERC20} interface.\n *\n * This implementation is agnostic to the way tokens are created. This means\n * that a supply mechanism has to be added in a derived contract using {_mint}.\n *\n * TIP: For a detailed writeup see our guide\n * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How\n * to implement supply mechanisms].\n *\n * The default value of {decimals} is 18. To change this, you should override\n * this function so it returns a different value.\n *\n * We have followed general OpenZeppelin Contracts guidelines: functions revert\n * instead returning `false` on failure. This behavior is nonetheless\n * conventional and does not conflict with the expectations of ERC-20\n * applications.\n */\nabstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {\n    mapping(address account => uint256) private _balances;\n\n    mapping(address account => mapping(address spender => uint256)) private _allowances;\n\n    uint256 private _totalSupply;\n\n    string private _name;\n    string private _symbol;\n\n    /**\n     * @dev Sets the values for {name} and {symbol}.\n     *\n     * Both values are immutable: they can only be set once during construction.\n     */\n    constructor(string memory name_, string memory symbol_) {\n        _name = name_;\n        _symbol = symbol_;\n    }\n\n    /**\n     * @dev Returns the name of the token.\n     */\n    function name() public view virtual returns (string memory) {\n        return _name;\n    }\n\n    /**\n     * @dev Returns the symbol of the token, usually a shorter version of the\n     * name.\n     */\n    function symbol() public view virtual returns (string memory) {\n        return _symbol;\n    }\n\n    /**\n     * @dev Returns the number of decimals used to get its user representation.\n     * For example, if `decimals` equals `2`, a balance of `505` tokens should\n     * be displayed to a user as `5.05` (`505 / 10 ** 2`).\n     *\n     * Tokens usually opt for a value of 18, imitating the relationship between\n     * Ether and Wei. This is the default value returned by this function, unless\n     * it\'s overridden.\n     *\n     * NOTE: This information is only used for _display_ purposes: it in\n     * no way affects any of the arithmetic of the contract, including\n     * {IERC20-balanceOf} and {IERC20-transfer}.\n     */\n    function decimals() public view virtual returns (uint8) {\n        return 18;\n    }\n\n    /**\n     * @dev See {IERC20-totalSupply}.\n     */\n    function totalSupply() public view virtual returns (uint256) {\n        return _totalSupply;\n    }\n\n    /**\n     * @dev See {IERC20-balanceOf}.\n     */\n    function balanceOf(address account) public view virtual returns (uint256) {\n        return _balances[account];\n    }\n\n    /**\n     * @dev See {IERC20-transfer}.\n     *\n     * Requirements:\n     *\n     * - `to` cannot be the zero address.\n     * - the caller must have a balance of at least `value`.\n     */\n    function transfer(address to, uint256 value) public virtual returns (bool) {\n        address owner = _msgSender();\n        _transfer(owner, to, value);\n        return true;\n    }\n\n    /**\n     * @dev See {IERC20-allowance}.\n     */\n    function allowance(address owner, address spender) public view virtual returns (uint256) {\n        return _allowances[owner][spender];\n    }\n\n    /**\n     * @dev See {IERC20-approve}.\n     *\n     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on\n     * `transferFrom`. This is semantically equivalent to an infinite approval.\n     *\n     * Requirements:\n     *\n     * - `spender` cannot be the zero address.\n     */\n    function approve(address spender, uint256 value) public virtual returns (bool) {\n        address owner = _msgSender();\n        _approve(owner, spender, value);\n        return true;\n    }\n\n    /**\n     * @dev See {IERC20-transferFrom}.\n     *\n     * Skips emitting an {Approval} event indicating an allowance update. This is not\n     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].\n     *\n     * NOTE: Does not update the allowance if the current allowance\n     * is the maximum `uint256`.\n     *\n     * Requirements:\n     *\n     * - `from` and `to` cannot be the zero address.\n     * - `from` must have a balance of at least `value`.\n     * - the caller must have allowance for ``from``\'s tokens of at least\n     * `value`.\n     */\n    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {\n        address spender = _msgSender();\n        _spendAllowance(from, spender, value);\n        _transfer(from, to, value);\n        return true;\n    }\n\n    /**\n     * @dev Moves a `value` amount of tokens from `from` to `to`.\n     *\n     * This internal function is equivalent to {transfer}, and can be used to\n     * e.g. implement automatic token fees, slashing mechanisms, etc.\n     *\n     * Emits a {Transfer} event.\n     *\n     * NOTE: This function is not virtual, {_update} should be overridden instead.\n     */\n    function _transfer(address from, address to, uint256 value) internal {\n        if (from == address(0)) {\n            revert ERC20InvalidSender(address(0));\n        }\n        if (to == address(0)) {\n            revert ERC20InvalidReceiver(address(0));\n        }\n        _update(from, to, value);\n    }\n\n    /**\n     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`\n     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding\n     * this function.\n     *\n     * Emits a {Transfer} event.\n     */\n    function _update(address from, address to, uint256 value) internal virtual {\n        if (from == address(0)) {\n            // Overflow check required: The rest of the code assumes that totalSupply never overflows\n            _totalSupply += value;\n        } else {\n            uint256 fromBalance = _balances[from];\n            if (fromBalance < value) {\n                revert ERC20InsufficientBalance(from, fromBalance, value);\n            }\n            unchecked {\n                // Overflow not possible: value <= fromBalance <= totalSupply.\n                _balances[from] = fromBalance - value;\n            }\n        }\n\n        if (to == address(0)) {\n            unchecked {\n                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.\n                _totalSupply -= value;\n            }\n        } else {\n            unchecked {\n                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.\n                _balances[to] += value;\n            }\n        }\n\n        emit Transfer(from, to, value);\n    }\n\n    /**\n     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).\n     * Relies on the `_update` mechanism\n     *\n     * Emits a {Transfer} event with `from` set to the zero address.\n     *\n     * NOTE: This function is not virtual, {_update} should be overridden instead.\n     */\n    function _mint(address account, uint256 value) internal {\n        if (account == address(0)) {\n            revert ERC20InvalidReceiver(address(0));\n        }\n        _update(address(0), account, value);\n    }\n\n    /**\n     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.\n     * Relies on the `_update` mechanism.\n     *\n     * Emits a {Transfer} event with `to` set to the zero address.\n     *\n     * NOTE: This function is not virtual, {_update} should be overridden instead\n     */\n    function _burn(address account, uint256 value) internal {\n        if (account == address(0)) {\n            revert ERC20InvalidSender(address(0));\n        }\n        _update(account, address(0), value);\n    }\n\n    /**\n     * @dev Sets `value` as the allowance of `spender` over the `owner`\'s tokens.\n     *\n     * This internal function is equivalent to `approve`, and can be used to\n     * e.g. set automatic allowances for certain subsystems, etc.\n     *\n     * Emits an {Approval} event.\n     *\n     * Requirements:\n     *\n     * - `owner` cannot be the zero address.\n     * - `spender` cannot be the zero address.\n     *\n     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.\n     */\n    function _approve(address owner, address spender, uint256 value) internal {\n        _approve(owner, spender, value, true);\n    }\n\n    /**\n     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.\n     *\n     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by\n     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any\n     * `Approval` event during `transferFrom` operations.\n     *\n     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to\n     * true using the following override:\n     *\n     * ```solidity\n     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {\n     *     super._approve(owner, spender, value, true);\n     * }\n     * ```\n     *\n     * Requirements are the same as {_approve}.\n     */\n    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {\n        if (owner == address(0)) {\n            revert ERC20InvalidApprover(address(0));\n        }\n        if (spender == address(0)) {\n            revert ERC20InvalidSpender(address(0));\n        }\n        _allowances[owner][spender] = value;\n        if (emitEvent) {\n            emit Approval(owner, spender, value);\n        }\n    }\n\n    /**\n     * @dev Updates `owner`\'s allowance for `spender` based on spent `value`.\n     *\n     * Does not update the allowance value in case of infinite allowance.\n     * Revert if not enough allowance is available.\n     *\n     * Does not emit an {Approval} event.\n     */\n    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {\n        uint256 currentAllowance = allowance(owner, spender);\n        if (currentAllowance < type(uint256).max) {\n            if (currentAllowance < value) {\n                revert ERC20InsufficientAllowance(spender, currentAllowance, value);\n            }\n            unchecked {\n                _approve(owner, spender, currentAllowance - value, false);\n            }\n        }\n    }\n}\n',
      },
      "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol": {
        content:
          "// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)\n\npragma solidity ^0.8.20;\n\n/**\n * @dev Interface of the ERC-20 standard as defined in the ERC.\n */\ninterface IERC20 {\n    /**\n     * @dev Emitted when `value` tokens are moved from one account (`from`) to\n     * another (`to`).\n     *\n     * Note that `value` may be zero.\n     */\n    event Transfer(address indexed from, address indexed to, uint256 value);\n\n    /**\n     * @dev Emitted when the allowance of a `spender` for an `owner` is set by\n     * a call to {approve}. `value` is the new allowance.\n     */\n    event Approval(address indexed owner, address indexed spender, uint256 value);\n\n    /**\n     * @dev Returns the value of tokens in existence.\n     */\n    function totalSupply() external view returns (uint256);\n\n    /**\n     * @dev Returns the value of tokens owned by `account`.\n     */\n    function balanceOf(address account) external view returns (uint256);\n\n    /**\n     * @dev Moves a `value` amount of tokens from the caller's account to `to`.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * Emits a {Transfer} event.\n     */\n    function transfer(address to, uint256 value) external returns (bool);\n\n    /**\n     * @dev Returns the remaining number of tokens that `spender` will be\n     * allowed to spend on behalf of `owner` through {transferFrom}. This is\n     * zero by default.\n     *\n     * This value changes when {approve} or {transferFrom} are called.\n     */\n    function allowance(address owner, address spender) external view returns (uint256);\n\n    /**\n     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the\n     * caller's tokens.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * IMPORTANT: Beware that changing an allowance with this method brings the risk\n     * that someone may use both the old and the new allowance by unfortunate\n     * transaction ordering. One possible solution to mitigate this race\n     * condition is to first reduce the spender's allowance to 0 and set the\n     * desired value afterwards:\n     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729\n     *\n     * Emits an {Approval} event.\n     */\n    function approve(address spender, uint256 value) external returns (bool);\n\n    /**\n     * @dev Moves a `value` amount of tokens from `from` to `to` using the\n     * allowance mechanism. `value` is then deducted from the caller's\n     * allowance.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * Emits a {Transfer} event.\n     */\n    function transferFrom(address from, address to, uint256 value) external returns (bool);\n}\n",
      },
      "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol":
        {
          content:
            '// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/extensions/IERC20Metadata.sol)\n\npragma solidity ^0.8.20;\n\nimport {IERC20} from "../IERC20.sol";\n\n/**\n * @dev Interface for the optional metadata functions from the ERC-20 standard.\n */\ninterface IERC20Metadata is IERC20 {\n    /**\n     * @dev Returns the name of the token.\n     */\n    function name() external view returns (string memory);\n\n    /**\n     * @dev Returns the symbol of the token.\n     */\n    function symbol() external view returns (string memory);\n\n    /**\n     * @dev Returns the decimals places of the token.\n     */\n    function decimals() external view returns (uint8);\n}\n',
        },
      "lib/openzeppelin-contracts/contracts/utils/Context.sol": {
        content:
          "// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)\n\npragma solidity ^0.8.20;\n\n/**\n * @dev Provides information about the current execution context, including the\n * sender of the transaction and its data. While these are generally available\n * via msg.sender and msg.data, they should not be accessed in such a direct\n * manner, since when dealing with meta-transactions the account sending and\n * paying for execution may not be the actual sender (as far as an application\n * is concerned).\n *\n * This contract is only required for intermediate, library-like contracts.\n */\nabstract contract Context {\n    function _msgSender() internal view virtual returns (address) {\n        return msg.sender;\n    }\n\n    function _msgData() internal view virtual returns (bytes calldata) {\n        return msg.data;\n    }\n\n    function _contextSuffixLength() internal view virtual returns (uint256) {\n        return 0;\n    }\n}\n",
      },
      "src/ERC_PF.sol": {
        content:
          '// src/ERC_PF.sol\n\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";\n\ninterface IUniswapV2Router02 {\n    function factory() external pure returns (address);\n    function addLiquidityETH(\n        address token,\n        uint amountTokenDesired,\n        uint amountTokenMin,\n        uint amountETHMin,\n        address to,\n        uint deadline\n    )\n        external\n        payable\n        returns (uint amountToken, uint amountETH, uint liquidity);\n    function swapExactTokensForETHSupportingFeeOnTransferTokens(\n        uint amountIn,\n        uint amountOutMin,\n        address[] calldata path,\n        address to,\n        uint deadline\n    ) external;\n}\n\ncontract SafuToken is ERC20 {\n    IUniswapV2Router02 public immutable router;\n    address public immutable WETH;\n    address public uniswapPair;\n\n    address[] public taxRecipients; // ≤5\n    uint16[] public taxBps; // sum ≤1000\n    uint16 public totalTaxBps; // cached sum\n\n    address private _recipient;\n    bool public lpSeeded;\n\n    uint16 public constant TRIGGER_BPS = 2; // 0.02% of totalSupply\n    uint16 public constant MAX_SWAP_MULTIPLIER = 20; // max 20× trigger per swap\n\n    constructor(\n        string memory name_,\n        string memory symbol_,\n        uint256 supply_,\n        address router_,\n        address weth_,\n        address[] memory recipients_,\n        uint16[] memory bps_,\n        address recipient_\n    ) ERC20(name_, symbol_) {\n        uint256 sumB;\n        require(\n            recipients_.length == bps_.length && recipients_.length <= 5,\n            "Tax array error"\n        );\n        for (uint i = 0; i < bps_.length; i++) {\n            sumB += bps_[i];\n            taxBps.push(bps_[i]);\n            taxRecipients.push(recipients_[i]);\n        }\n        require(sumB <= 1000, "Tax >10%");\n        totalTaxBps = uint16(sumB);\n\n        _recipient = recipient_;\n        router = IUniswapV2Router02(router_);\n        WETH = weth_;\n        _mint(recipient_, supply_);\n    }\n\n    function setUniswapPair(address pair_) external {\n        require(msg.sender == _recipient, "No Role");\n        require(uniswapPair == address(0), "Pair set");\n        uniswapPair = pair_;\n    }\n\n    function _swapAndDistribute(uint256 tokenAmt) internal {\n        _approve(address(this), address(router), tokenAmt);\n        address[] memory path = new address[](2);\n        path[0] = address(this);\n        path[1] = WETH;\n        for (uint i = 0; i < taxRecipients.length; i++) {\n            uint256 share = (tokenAmt * taxBps[i]) / totalTaxBps;\n            router.swapExactTokensForETHSupportingFeeOnTransferTokens(\n                share,\n                0,\n                path,\n                taxRecipients[i],\n                block.timestamp\n            );\n        }\n    }\n\n    function _update(\n        address from,\n        address to,\n        uint256 amount\n    ) internal override {\n\n        // ─── 1) LP‐SEEDING EXCEPTION ─────────────────────────────────────────────\n        // the very first router‐driven transfer (recipient → pair) \n        // initial LP seed.  Skip ALL tax logic here.\n        if (msg.sender == address(router) && !lpSeeded) {\n            if (from != _recipient && to != _recipient) {\n                revert("Only recipient can seed the initial LP");\n            }\n            lpSeeded = true;\n            // do a clean transfer with no tax\n            super._update(from, to, amount);\n            return;\n        }\n\n        bool isSell = ((to == uniswapPair && to != address(0)) && lpSeeded);\n        bool isBuy = ((from == uniswapPair && from != address(0)) && lpSeeded);\n\n        uint256 value = amount;\n\n        // ─── 2) BUY TAX ─────────────────────────────────────────────────────────\n        if (isBuy && totalTaxBps > 0) {\n            uint256 buyTax = (value * totalTaxBps) / 10000;\n            if (buyTax > 0) {\n                super._update(from, address(this), buyTax);\n                value -= buyTax;\n            }\n        }\n\n        // ─── 3) SELL TAX ────────────────────────────────────────────────────────\n        if (isSell && totalTaxBps > 0) {\n            uint256 sellTax = (value * totalTaxBps) / 10000;\n            if (sellTax > 0) {\n                super._update(from, address(this), sellTax);\n                value -= sellTax;\n            }\n        }\n\n        // ─── 4) NET TRANSFER ────────────────────────────────────────────────────\n        super._update(from, to, value);\n\n        // ─── 5) AUTO‐SWAP & DISTRIBUTE ON SELL ──────────────────────────────────\n        if (isSell && from != address(this)) {\n            uint256 contractTokens = balanceOf(address(this));\n            if (contractTokens == 0) return;\n\n            uint256 supply = totalSupply();\n            uint256 swapThreshold = (supply * TRIGGER_BPS) / 10000;\n            if (contractTokens < swapThreshold) return;\n\n            uint256 maxSwapAmount = swapThreshold * MAX_SWAP_MULTIPLIER;\n            uint256 toSwap = contractTokens > maxSwapAmount\n                ? maxSwapAmount\n                : contractTokens;\n\n            _swapAndDistribute(toSwap);\n        }\n    }\n}\n',
      },
    },
    settings: {
      remappings: [
        "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
        "erc4626-tests/=lib/openzeppelin-contracts/lib/erc4626-tests/",
        "forge-std/=lib/forge-std/src/",
        "halmos-cheatcodes/=lib/openzeppelin-contracts/lib/halmos-cheatcodes/src/",
        "openzeppelin-contracts/=lib/openzeppelin-contracts/",
      ],
      optimizer: {
        enabled: true,
        runs: 200,
      },
      metadata: {
        useLiteralContent: false,
        bytecodeHash: "ipfs",
        appendCBOR: true,
      },
      outputSelection: {
        "lib/openzeppelin-contracts/contracts/interfaces/draft-IERC6093.sol": {
          "": ["ast"],
          "*": [
            "abi",
            "evm.bytecode.object",
            "evm.bytecode.sourceMap",
            "evm.bytecode.linkReferences",
            "evm.deployedBytecode.object",
            "evm.deployedBytecode.sourceMap",
            "evm.deployedBytecode.linkReferences",
            "evm.deployedBytecode.immutableReferences",
            "evm.methodIdentifiers",
            "metadata",
          ],
        },
        "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol": {
          "": ["ast"],
          "*": [
            "abi",
            "evm.bytecode.object",
            "evm.bytecode.sourceMap",
            "evm.bytecode.linkReferences",
            "evm.deployedBytecode.object",
            "evm.deployedBytecode.sourceMap",
            "evm.deployedBytecode.linkReferences",
            "evm.deployedBytecode.immutableReferences",
            "evm.methodIdentifiers",
            "metadata",
          ],
        },
        "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol": {
          "": ["ast"],
          "*": [
            "abi",
            "evm.bytecode.object",
            "evm.bytecode.sourceMap",
            "evm.bytecode.linkReferences",
            "evm.deployedBytecode.object",
            "evm.deployedBytecode.sourceMap",
            "evm.deployedBytecode.linkReferences",
            "evm.deployedBytecode.immutableReferences",
            "evm.methodIdentifiers",
            "metadata",
          ],
        },
        "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol":
          {
            "": ["ast"],
            "*": [
              "abi",
              "evm.bytecode.object",
              "evm.bytecode.sourceMap",
              "evm.bytecode.linkReferences",
              "evm.deployedBytecode.object",
              "evm.deployedBytecode.sourceMap",
              "evm.deployedBytecode.linkReferences",
              "evm.deployedBytecode.immutableReferences",
              "evm.methodIdentifiers",
              "metadata",
            ],
          },
        "lib/openzeppelin-contracts/contracts/utils/Context.sol": {
          "": ["ast"],
          "*": [
            "abi",
            "evm.bytecode.object",
            "evm.bytecode.sourceMap",
            "evm.bytecode.linkReferences",
            "evm.deployedBytecode.object",
            "evm.deployedBytecode.sourceMap",
            "evm.deployedBytecode.linkReferences",
            "evm.deployedBytecode.immutableReferences",
            "evm.methodIdentifiers",
            "metadata",
          ],
        },
        "src/ERC_PF.sol": {
          "": ["ast"],
          "*": [
            "abi",
            "evm.bytecode.object",
            "evm.bytecode.sourceMap",
            "evm.bytecode.linkReferences",
            "evm.deployedBytecode.object",
            "evm.deployedBytecode.sourceMap",
            "evm.deployedBytecode.linkReferences",
            "evm.deployedBytecode.immutableReferences",
            "evm.methodIdentifiers",
            "metadata",
          ],
        },
      },
      evmVersion: "cancun",
      viaIR: true,
      libraries: {},
    },
  };

  // verify();
} catch (err) {
  console.error("❌ [startup] Fatal error reading or parsing Solidity:", err);
  process.exit(1);
}

// async function verify() {
//   const apikey = process.env.ETHERSCAN_API_KEY;
//   const encodedMessageWithoutPrefix = "000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000033b2e3c9fd0803ce8000000000000000000000000000000ee567fe1712faf6149d80da1e6934e354124cfe3000000000000000000000000fff9976782d46cc05630d1f6ebab18b2324d6b14000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000072a12631962d2a3ebf869771384e1473dd29284600000000000000000000000000000000000000000000000000000000000000044d6361740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044d6361740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
//   const verificationData: Record<string, string> = {
//     apiKey: apikey ?? "",
//     module: "contract",
//     action: "verifysourcecode",
//     contractaddress: "0x88338E2B96FF08f21f9bbc04f54d6d8D2b782e77",
//     sourceCode: JSON.stringify(input), // Your contract source code
//     codeformat: "solidity-standard-json-input",
//     contractname: "src/ERC_PF.sol:SafuToken", // Contract name
//     compilerversion: "v0.8.29+commit.ab55807c", // Ensure this matches the compiler version you used
//     constructorArguements: encodedMessageWithoutPrefix, // Encoded constructor arguments
//   };

//   // console.log("encodedMessageWithoutPrefix", encodedMessageWithoutPrefix)
//   // console.log("tokenAddress", tokenAddress)
//   console.log("verificationData", verificationData)

//   const etherscanApiUrl = process.env.ETHERSCAN_API_URL || "";
//   // Submit verification request
//   const response = await axios.post(etherscanApiUrl, new URLSearchParams(verificationData), {
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//   });

//   console.log("Verification response:", response.data);
//   const statusUrl = `${etherscanApiUrl}&module=contract&action=checkverifystatus&apikey=${apikey}&guid=${response.data.result}`;
//   console.log("Check the status here:", statusUrl);

// }

console.log("🟡 [filesystem] Ensuring data directories exist...");
const dataDir = path.resolve(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const tokensFile = path.join(dataDir, "tokens.json");
const txFile = path.join(dataDir, "transactions.json");
if (!fs.existsSync(tokensFile)) fs.writeFileSync(tokensFile, "[]", "utf8");
if (!fs.existsSync(txFile)) fs.writeFileSync(txFile, "[]", "utf8");
console.log("✅ [filesystem] Data directory ready at", dataDir);

// File uploads
console.log("🟡 [uploads] Configuring file uploads...");
const uploadDir = path.resolve(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace(/[^a-z0-9.]/gi, "_")}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    cb(null, /image\/.+/.test(file.mimetype));
  },
});
console.log("✅ [uploads] Upload middleware configured.");

// ----- Routes -----
console.log("🟡 [routes] Initializing endpoints...");

// ----- Token Endpoints -----
app.get("/api/tokens", (_req: Request, res: Response) => {
  console.log("ℹ️  [GET /api/tokens] Fetching all tokens");
  const tokens: TokenMetadata[] = JSON.parse(
    fs.readFileSync(tokensFile, "utf8")
  );
  tokens.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(tokens);
});

app.post(
  "/api/tokens",
  upload.single("logo"),
  (req: Request, res: Response) => {
    console.log("ℹ️  [POST /api/tokens] New token metadata request");
    const {
      name,
      symbol,
      website,
      description,
      tokenAddress,
      tokenCreator,
      createdAt,
      expiresAt,
    } = req.body;
    if (!name || !symbol || !tokenAddress || !tokenCreator || !createdAt) {
      return res.status(400).json({ error: "Missing required token metadata" });
    }
    const newToken: TokenMetadata = {
      name,
      symbol,
      tokenAddress,
      tokenCreator,
      createdAt,
    };
    if (website) newToken.website = website;
    if (description) newToken.description = description;
    if (expiresAt) newToken.expiresAt = expiresAt;
    if (req.file) newToken.logoFilename = req.file.filename;
    const arr = JSON.parse(
      fs.readFileSync(tokensFile, "utf8")
    ) as TokenMetadata[];
    arr.push(newToken);
    fs.writeFileSync(tokensFile, JSON.stringify(arr, null, 2), "utf8");
    res.json({ success: true, metadata: newToken });
  }
);

// Enhanced server-side validation for transactions endpoint
app.post("/api/transactions", (req: Request, res: Response) => {
  const {
    tokenAddress,
    type,
    ethAmount,
    tokenAmount,
    timestamp,
    txnHash,
    wallet,
    isBundleTransaction,
    originalTxnHash,
    bundleIndex,
  } = req.body as TxLog;

  // Basic field validation
  if (
    !tokenAddress ||
    !type ||
    !ethAmount ||
    !tokenAmount ||
    !timestamp ||
    !txnHash ||
    !wallet
  ) {
    return res.status(400).json({ error: "Missing transaction fields" });
  }

  // Validate transaction type
  if (type !== "buy" && type !== "sell") {
    return res
      .status(400)
      .json({ error: 'Invalid transaction type. Must be "buy" or "sell"' });
  }

  // Validate timestamp
  if (isNaN(Date.parse(timestamp))) {
    return res.status(400).json({ error: "Invalid timestamp" });
  }

  // Validate numeric amounts
  const ethAmountNum = parseFloat(ethAmount);
  const tokenAmountNum = parseFloat(tokenAmount);

  if (isNaN(ethAmountNum) || ethAmountNum < 0) {
    return res
      .status(400)
      .json({ error: "Invalid ETH amount. Must be a valid positive number" });
  }

  if (isNaN(tokenAmountNum) || tokenAmountNum < 0) {
    return res
      .status(400)
      .json({ error: "Invalid token amount. Must be a valid positive number" });
  }

  // Validate addresses (basic hex check)
  if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: "Invalid token address format" });
  }

  if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: "Invalid wallet address format" });
  }

  // Validate transaction hash format
  if (!txnHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return res.status(400).json({ error: "Invalid transaction hash format" });
  }

  // If it's a bundle transaction, validate originalTxnHash format too
  if (
    isBundleTransaction &&
    (!originalTxnHash || !originalTxnHash.match(/^0x[a-fA-F0-9]{64}$/))
  ) {
    return res.status(400).json({
      error: "Invalid original transaction hash format for bundle transaction",
    });
  }

  // If it's a bundle transaction, validate originalTxnHash format too
  if (
    isBundleTransaction &&
    (!originalTxnHash || !originalTxnHash.match(/^0x[a-fA-F0-9]{64}$/))
  ) {
    return res.status(400).json({
      error: "Invalid original transaction hash format for bundle transaction",
    });
  }

  // Check for duplicate transactions based on transaction type
  const txArr = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
  let duplicate;

  if (isBundleTransaction) {
    // For bundle transactions, check for duplicate using originalTxnHash + wallet combination
    duplicate = txArr.find(
      (tx) =>
        tx.originalTxnHash === originalTxnHash &&
        tx.wallet.toLowerCase() === wallet.toLowerCase() &&
        tx.isBundleTransaction === true
    );
  } else {
    // For regular transactions, check using txnHash + wallet combination
    duplicate = txArr.find(
      (tx) =>
        tx.txnHash === txnHash &&
        tx.wallet.toLowerCase() === wallet.toLowerCase() &&
        (tx.isBundleTransaction === false ||
          tx.isBundleTransaction === undefined)
    );
  }

  if (duplicate) {
    return res.status(409).json({
      error: isBundleTransaction
        ? "Bundle transaction already exists for this wallet and original transaction"
        : "Transaction already exists for this wallet",
    });
  }

  // Create the entry with validated data
  const entry: TxLog = {
    tokenAddress: tokenAddress.toLowerCase(), // Normalize to lowercase
    type,
    ethAmount: ethAmountNum.toString(), // Normalize the number format
    tokenAmount: tokenAmountNum.toString(),
    timestamp,
    txnHash,
    wallet: wallet.toLowerCase(),
    isBundleTransaction,
    originalTxnHash,
    bundleIndex,
  };

  try {
    txArr.push(entry);
    fs.writeFileSync(txFile, JSON.stringify(txArr, null, 2), "utf8");
    res.json({ success: true, entry });
  } catch (error) {
    console.error("Error saving transaction:", error);
    res.status(500).json({ error: "Failed to save transaction" });
  }
});

// Get *all* transactions
app.get("/api/transactions", (_req: Request, res: Response) => {
  try {
    const txArr = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
    // Optionally sort newest first:
    txArr.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json(txArr);
  } catch (err) {
    console.error("Error reading transactions:", err);
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

// Get transactions for a token
app.get("/api/transactions/:tokenAddress", (req: Request, res: Response) => {
  const addr = req.params.tokenAddress.toLowerCase();
  const allTx = JSON.parse(fs.readFileSync(txFile, "utf8")) as any[];
  const filtered = allTx
    .filter((t) => t.tokenAddress.toLowerCase() === addr)
    .filter((t) => t.type === "buy" || t.type === "sell")
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  res.json(filtered);
});

// Get 24h volume
app.get("/api/volume/:tokenAddress", async (req: Request, res: Response) => {
  try {
    const addr = req.params.tokenAddress.toLowerCase();
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const block = await provider.getBlock("latest");
    if (!block) {
      return res.status(500).json({ error: "Could not fetch latest block" });
    }
    const cutoff = block.timestamp * 1000 - 24 * 60 * 60 * 1000;
    const allTx = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
    const recent = allTx.filter(
      (tx) =>
        tx.tokenAddress.toLowerCase() === addr &&
        new Date(tx.timestamp).getTime() >= cutoff
    );
    const volume = recent.reduce(
      (acc, tx) => {
        acc.totalEth += parseFloat(tx.ethAmount);
        acc.totalTokens += parseFloat(tx.tokenAmount);
        if (tx.type === "buy") acc.buyEth += parseFloat(tx.ethAmount);
        if (tx.type === "sell") acc.sellTokens += parseFloat(tx.tokenAmount);
        return acc;
      },
      { totalEth: 0, totalTokens: 0, buyEth: 0, sellTokens: 0 }
    );
    res.json({ tokenAddress: addr, period: "24h", volume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not compute volume" });
  }
});

// Enhanced OHLC endpoint for server.ts

interface TimeframeConfig {
  bucketSize: number; // in milliseconds
  maxDataPoints: number;
  defaultPeriod: string;
}

const TIMEFRAME_CONFIGS: Record<string, TimeframeConfig> = {
  "1s": { bucketSize: 1000, maxDataPoints: 300, defaultPeriod: "5m" },
  "1m": { bucketSize: 60000, maxDataPoints: 240, defaultPeriod: "4h" },
  "5m": { bucketSize: 300000, maxDataPoints: 200, defaultPeriod: "16h" },
  "15m": { bucketSize: 900000, maxDataPoints: 200, defaultPeriod: "2d" },
  "1h": { bucketSize: 3600000, maxDataPoints: 168, defaultPeriod: "7d" },
  "2h": { bucketSize: 7200000, maxDataPoints: 168, defaultPeriod: "2w" },
  "4h": { bucketSize: 14400000, maxDataPoints: 168, defaultPeriod: "4w" },
  "8h": { bucketSize: 28800000, maxDataPoints: 168, defaultPeriod: "8w" },
  "12h": { bucketSize: 43200000, maxDataPoints: 168, defaultPeriod: "12w" },
  "1D": { bucketSize: 86400000, maxDataPoints: 365, defaultPeriod: "1y" },
  "3D": { bucketSize: 259200000, maxDataPoints: 200, defaultPeriod: "2y" },
  "1W": { bucketSize: 604800000, maxDataPoints: 104, defaultPeriod: "2y" },
  "1M": { bucketSize: 2592000000, maxDataPoints: 60, defaultPeriod: "5y" },
};

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([smhdwMy])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 days

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return (
    value * (multipliers[unit as keyof typeof multipliers] || multipliers.d)
  );
}

// Enhanced OHLC endpoint
app.get("/api/ohlc/:tokenAddress", (req, res) => {
  const { tokenAddress } = req.params;
  const { resolution = "15m" } = req.query;

  try {
    // Get timeframe configuration
    const config = TIMEFRAME_CONFIGS[resolution as string];
    if (!config) {
      return res.status(400).json({ error: "Invalid resolution" });
    }

    // const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    // const block = await provider.getBlock('latest');
    // if (!block) {
    //   return res.status(500).json({ error: 'Could not fetch latest block' });
    // }
    // const cutoff = (block.timestamp * 1000) - 24 * 60 * 60 * 1000;

    console.log(`OHLC Request: ${tokenAddress}, resolution: ${resolution}`);

    // Load and filter transactions
    const txs = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
    const relevant = txs.filter((tx) => {
      const txTime = new Date(tx.timestamp).getTime();
      return (
        tx.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
        parseFloat(tx.ethAmount) > 0 &&
        parseFloat(tx.tokenAmount) > 0
      );
    });

    console.log(`Found ${relevant.length} relevant transactions`);

    if (relevant.length === 0) {
      return res.json([]);
    }

    // Sort by timestamp
    relevant.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get the time range of all transactions
    const firstTxTime = new Date(relevant[0].timestamp).getTime();
    const lastTxTime = new Date(
      relevant[relevant.length - 1].timestamp
    ).getTime();
    const totalTimeSpan = lastTxTime - firstTxTime;

    console.log(
      `Time range: ${new Date(firstTxTime).toISOString()} to ${new Date(
        lastTxTime
      ).toISOString()}`
    );
    console.log(
      `Total time span: ${Math.floor(
        totalTimeSpan / (24 * 60 * 60 * 1000)
      )} days`
    );

    // Group into buckets
    const buckets: Record<
      number,
      {
        transactions: TxLog[];
        prices: number[];
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        trades: number;
      }
    > = {};

    // Process each transaction
    for (const tx of relevant) {
      const timestamp = new Date(tx.timestamp).getTime();
      const bucketKey =
        Math.floor(timestamp / config.bucketSize) * config.bucketSize;
      const price = parseFloat(tx.ethAmount) / parseFloat(tx.tokenAmount);

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          transactions: [],
          prices: [],
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0,
          trades: 0,
        };
      }

      const bucket = buckets[bucketKey];
      bucket.transactions.push(tx);
      bucket.prices.push(price);

      // Update OHLC
      if (bucket.prices.length === 1) {
        bucket.open = price; // First price in bucket
      }
      bucket.high = Math.max(bucket.high, price);
      bucket.low = Math.min(bucket.low, price);
      bucket.close = price; // Last price in bucket (will be overwritten)
      bucket.volume += parseFloat(tx.ethAmount);
      bucket.trades += 1;
    }

    // Convert to chart format
    const bars = Object.entries(buckets)
      .map(([timeKey, bucket]) => ({
        time: Math.floor(parseInt(timeKey) / 1000), // Convert to seconds
        open: bucket.open,
        high: bucket.high,
        low: bucket.low,
        close: bucket.close,
        volume: bucket.volume,
        trades: bucket.trades,
      }))
      .sort((a, b) => a.time - b.time);

    // Limit data points if necessary
    const shouldLimit = bars.length > config.maxDataPoints * 2; // More lenient limit
    const finalBars = shouldLimit
      ? bars.slice(-config.maxDataPoints) // Keep the most recent data
      : bars;

    if (shouldLimit) {
      console.log(
        `Limited bars from ${bars.length} to ${finalBars.length} (keeping most recent)`
      );
    }

    const filledBars = shouldFillGaps(resolution as string)
      ? fillTimeGaps(finalBars, config.bucketSize)
      : finalBars;

    console.log(
      `Generated ${filledBars.length} OHLC bars covering full transaction history`
    );

    const response = {
      data: filledBars,
      metadata: {
        totalTransactions: relevant.length,
        totalBars: bars.length,
        returnedBars: filledBars.length,
        timeRange: {
          start: firstTxTime,
          end: lastTxTime,
          spanDays: Math.floor(totalTimeSpan / (24 * 60 * 60 * 1000)),
        },
        resolution: resolution,
        bucketSizeMs: config.bucketSize,
        wasLimited: shouldLimit,
      },
    };

    // For backward compatibility, return just the data array if no metadata is requested
    res.json(filledBars);
  } catch (error) {
    console.error("Error generating OHLC data:", error);
    res.status(500).json({ error: "Failed to generate OHLC data" });
  }
});

function shouldFillGaps(resolution: string): boolean {
  // Fill gaps for longer timeframes to ensure smooth charts
  return ["1h", "2h", "4h", "8h", "12h", "1D", "3D", "1W", "1M"].includes(
    resolution
  );
}

function fillTimeGaps(bars: any[], bucketSize: number) {
  if (bars.length === 0) return bars;

  const result = [];
  let lastPrice = bars[0].open;

  for (let i = 0; i < bars.length; i++) {
    const currentBar = bars[i];

    // If this is not the first bar, check for gaps
    if (i > 0) {
      const prevTime = bars[i - 1].time;
      const expectedTime = prevTime + bucketSize / 1000;
      const actualTime = currentBar.time;

      // Fill gaps if there's more than one bucket missing
      let fillTime = expectedTime;
      while (fillTime < actualTime) {
        result.push({
          time: fillTime,
          open: lastPrice,
          high: lastPrice,
          low: lastPrice,
          close: lastPrice,
          volume: 0,
          trades: 0,
        });
        fillTime += bucketSize / 1000;
      }
    }

    result.push(currentBar);
    lastPrice = currentBar.close;
  }

  return result;
}

// Add a new endpoint to get available timeframes for a token
app.get("/api/timeframes/:tokenAddress", (req: Request, res: Response) => {
  const { tokenAddress } = req.params;

  try {
    const txs = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
    const tokenTxs = txs.filter(
      (tx) => tx.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (tokenTxs.length === 0) {
      return res.json({ availableTimeframes: [], recommendedTimeframe: "15m" });
    }

    // Sort by timestamp
    tokenTxs.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstTx = new Date(tokenTxs[0].timestamp).getTime();
    const lastTx = new Date(tokenTxs[tokenTxs.length - 1].timestamp).getTime();
    const dataSpan = lastTx - firstTx;

    // Determine which timeframes make sense based on data span
    const availableTimeframes = [];
    let recommendedTimeframe = "15m";

    if (dataSpan >= 60000) availableTimeframes.push("1s"); // At least 1 minute of data
    if (dataSpan >= 300000) availableTimeframes.push("1m"); // At least 5 minutes
    if (dataSpan >= 1800000) availableTimeframes.push("5m"); // At least 30 minutes
    if (dataSpan >= 3600000) availableTimeframes.push("15m"); // At least 1 hour
    if (dataSpan >= 86400000) {
      // At least 1 day
      availableTimeframes.push("1h", "2h", "4h", "8h", "12h");
      recommendedTimeframe = "1h";
    }
    if (dataSpan >= 259200000) availableTimeframes.push("1D"); // At least 3 days
    if (dataSpan >= 777600000) availableTimeframes.push("3D"); // At least 9 days
    if (dataSpan >= 1814400000) availableTimeframes.push("1W"); // At least 3 weeks
    if (dataSpan >= 7776000000) availableTimeframes.push("1M"); // At least 3 months

    // Set recommended timeframe based on data span
    if (dataSpan < 3600000) recommendedTimeframe = "1m";
    else if (dataSpan < 86400000) recommendedTimeframe = "15m";
    else if (dataSpan < 604800000) recommendedTimeframe = "1h";
    else if (dataSpan < 2592000000) recommendedTimeframe = "1D";
    else recommendedTimeframe = "1W";

    res.json({
      availableTimeframes,
      recommendedTimeframe,
      dataSpan: {
        milliseconds: dataSpan,
        days: Math.floor(dataSpan / 86400000),
        firstTransaction: tokenTxs[0].timestamp,
        lastTransaction: tokenTxs[tokenTxs.length - 1].timestamp,
        totalTransactions: tokenTxs.length,
      },
    });
  } catch (error) {
    console.error("Error getting timeframes:", error);
    res.status(500).json({ error: "Failed to get available timeframes" });
  }
});

// Performance optimization endpoint - get aggregated statistics
app.get("/api/stats/:tokenAddress", (req: Request, res: Response) => {
  const { tokenAddress } = req.params;
  const { period = "24h" } = req.query;

  try {
    const periodMs = parsePeriod(period as string);
    const cutoff = Date.now() - periodMs;

    const txs = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
    const relevant = txs.filter(
      (tx) =>
        tx.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
        new Date(tx.timestamp).getTime() >= cutoff
    );

    if (relevant.length === 0) {
      return res.json({
        volume: 0,
        trades: 0,
        priceChange: 0,
        high: 0,
        low: 0,
        period: period,
      });
    }

    const prices = relevant.map(
      (tx) => parseFloat(tx.ethAmount) / parseFloat(tx.tokenAmount)
    );
    const volume = relevant.reduce(
      (sum, tx) => sum + parseFloat(tx.ethAmount),
      0
    );

    res.json({
      volume,
      trades: relevant.length,
      priceChange:
        prices.length > 1
          ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
          : 0,
      high: Math.max(...prices),
      low: Math.min(...prices),
      current: prices[prices.length - 1],
      period: period,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

// Also add a debug endpoint to check raw transaction data
app.get(
  "/api/debug/transactions/:tokenAddress",
  (req: Request, res: Response) => {
    const { tokenAddress } = req.params;

    try {
      const txs = JSON.parse(fs.readFileSync(txFile, "utf8")) as TxLog[];
      const relevant = txs.filter(
        (tx) => tx.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      );

      const processed = relevant.map((tx) => ({
        ...tx,
        price: parseFloat(tx.ethAmount) / parseFloat(tx.tokenAmount),
        timestamp: new Date(tx.timestamp).toISOString(),
      }));

      res.json({
        total: txs.length,
        relevant: relevant.length,
        tokenAddress,
        transactions: processed.slice(0, 10), // First 10 for debugging
        summary: {
          totalVolume: relevant.reduce(
            (sum, tx) => sum + parseFloat(tx.ethAmount),
            0
          ),
          avgPrice:
            relevant.length > 0
              ? relevant.reduce(
                  (sum, tx) =>
                    sum + parseFloat(tx.ethAmount) / parseFloat(tx.tokenAmount),
                  0
                ) / relevant.length
              : 0,
        },
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: "Debug failed" });
    }
  }
);

app.post("/verify", async (req, res) => {
  try {
    const { encodedMessageWithoutPrefix, tokenAddress } = req.body; // Extract the parameters from the request body
    // const { tokenAddress } = req.body; // Extract the parameters from the request body
    if (!tokenAddress) {
      return res.status(400).json({ error: "Missing params" });
    }
    const apikey = process.env.ETHERSCAN_API_KEY;
    const verificationData: Record<string, string> = {
      apiKey: apikey ?? "",
      module: "contract",
      action: "verifysourcecode",
      contractaddress: tokenAddress,
      sourceCode: JSON.stringify(input), // Your contract source code
      codeformat: "solidity-standard-json-input",
      contractname: "src/ERC_PF.sol:SafuToken", // Contract name
      compilerversion: "v0.8.29+commit.ab55807c", // Ensure this matches the compiler version you used
      constructorArguements: encodedMessageWithoutPrefix, // Encoded constructor arguments
    };

    // console.log("encodedMessageWithoutPrefix", encodedMessageWithoutPrefix)
    console.log("tokenAddress", tokenAddress);
    console.log("verificationData", verificationData);

    const etherscanApiUrl = process.env.ETHERSCAN_API_URL || "";
    // Submit verification request
    const response = await axios.post(
      etherscanApiUrl,
      new URLSearchParams(verificationData),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    // Type assertion to access .result safely
    const verificationResponse = response.data as { result: string };
    console.log("Verification response:", verificationResponse);
    const statusUrl = `${etherscanApiUrl}&module=contract&action=checkverifystatus&apikey=${apikey}&guid=${verificationResponse.result}`;
    console.log("Check the status here:", statusUrl);

    // Return the response to frontend
    res.json(response.data);
  } catch (error) {
    console.error("Error during contract verification:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
