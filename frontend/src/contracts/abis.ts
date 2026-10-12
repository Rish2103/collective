export const MockERC20ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) returns ()",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const CollectivePoolABI = [
  "function nextPoolId() view returns (uint256)",
  "function pools(uint256) view returns (uint256 id, address creator, address recipient, address token, uint256 targetAmount, uint256 deadline, uint256 totalContributed, uint8 state, string title, string description)",
  "function contributions(uint256 poolId, address contributor) view returns (uint256)",
  "function getContributors(uint256 poolId) view returns (address[])",
  "function getComputedState(uint256 poolId) view returns (uint8)",
  "function getPoolCount() view returns (uint256)",
  "function createPool(address token, address recipient, uint256 targetAmount, uint256 durationSeconds, string title, string description) returns (uint256)",
  "function contribute(uint256 poolId, uint256 amount)",
  "function claimPayout(uint256 poolId)",
  "function claimRefund(uint256 poolId)",
  "event PoolCreated(uint256 indexed poolId, address indexed creator, address indexed recipient, address token, uint256 targetAmount, uint256 deadline, string title)",
  "event ContributionMade(uint256 indexed poolId, address indexed contributor, uint256 amount, uint256 totalContributed)",
  "event PayoutClaimed(uint256 indexed poolId, address indexed recipient, uint256 amount)",
  "event RefundClaimed(uint256 indexed poolId, address indexed contributor, uint256 amount)"
];
