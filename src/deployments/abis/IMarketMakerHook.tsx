export const IMarketMakerHookAbi = [
    {
      "type": "function",
      "name": "claimWinnings",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "claimedTokens",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "outputs": [
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
      "name": "createMarketWithCollateralAndLiquidity",
      "inputs": [
        {
          "name": "oracle",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "collateralAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "collateralAmount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "executeSwap",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        },
        {
          "name": "zeroForOne",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "desiredOutcomeTokens",
          "type": "int128",
          "internalType": "int128"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "hasClaimed",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        },
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "marketCount",
      "inputs": [],
      "outputs": [
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
      "name": "marketPoolIds",
      "inputs": [
        {
          "name": "index",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "markets",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct Market",
          "components": [
            {
              "name": "poolKey",
              "type": "tuple",
              "internalType": "struct PoolKey",
              "components": [
                {
                  "name": "currency0",
                  "type": "address",
                  "internalType": "Currency"
                },
                {
                  "name": "currency1",
                  "type": "address",
                  "internalType": "Currency"
                },
                {
                  "name": "fee",
                  "type": "uint24",
                  "internalType": "uint24"
                },
                {
                  "name": "tickSpacing",
                  "type": "int24",
                  "internalType": "int24"
                },
                {
                  "name": "hooks",
                  "type": "address",
                  "internalType": "contract IHooks"
                }
              ]
            },
            {
              "name": "oracle",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "creator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "yesToken",
              "type": "address",
              "internalType": "contract OutcomeToken"
            },
            {
              "name": "noToken",
              "type": "address",
              "internalType": "contract OutcomeToken"
            },
            {
              "name": "state",
              "type": "uint8",
              "internalType": "enum MarketState"
            },
            {
              "name": "outcome",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "totalCollateral",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "collateralAddress",
              "type": "address",
              "internalType": "address"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "resolveMarket",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        },
        {
          "name": "outcome",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "MarketCancelled",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "PoolId"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "MarketCreated",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "PoolId"
        },
        {
          "name": "oracle",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "yesToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "noToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "state",
          "type": "uint8",
          "indexed": false,
          "internalType": "enum MarketState"
        },
        {
          "name": "outcome",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        },
        {
          "name": "totalCollateral",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "collateralAddress",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "MarketResolved",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "PoolId"
        },
        {
          "name": "outcome",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "WinningsClaimed",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "PoolId"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    }
  ] as const;
  