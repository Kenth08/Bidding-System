import { ethers } from "ethers";

export const PROCURE_CHAIN_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRecord",
    "inputs": [
      {
        "name": "projectId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "recordAward",
    "inputs": [
      {
        "name": "projectId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bidId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "winnerId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bidAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "projectRefId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "noaHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "ntpHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "resolutionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifyRecord",
    "inputs": [
      {
        "name": "recordHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "verified",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "projectId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bidId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "winnerId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bidAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "projectRefId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "noaHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "ntpHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "resolutionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "recordedAt",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "RecordCreated",
    "inputs": [
      {
        "name": "projectId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "bidId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "winnerId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "bidAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "projectRefId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "noaHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "ntpHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "resolutionHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "recordHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "recordedAt",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
];

export function getBlockchainProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getBlockchainSigner() {
  const provider = getBlockchainProvider();
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || "0x746ed89ed1a3b0f8cfb6cfcc8d91f057c7cf180ebceb72d8abc4899345f3310e";
  return new ethers.Wallet(privateKey, provider);
}

export function getProcureChainContract() {
  const signer = getBlockchainSigner();
  const address = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "0x2cc4Ed5C158eA26Eb3a7844490d3EC67a0037CC5";
  return new ethers.Contract(address, PROCURE_CHAIN_ABI, signer);
}
