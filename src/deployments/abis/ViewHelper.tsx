export const ViewHelper = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_hook",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getClaimedTokens",
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
      "name": "getMarket",
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
      "name": "getMarkets",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "tuple[]",
          "internalType": "struct Market[]",
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
      "name": "getTokenSupplies",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "outputs": [
        {
          "name": "yesSupply",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "noSupply",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getTokenValues",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        }
      ],
      "outputs": [
        {
          "name": "yesValue",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "noValue",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "yesProbability",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "hook",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract IMarketMakerHook"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "quoteCollateral",
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
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "int256",
          "internalType": "int256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "quoteCollateralNeededForTrade",
      "inputs": [
        {
          "name": "poolId",
          "type": "bytes32",
          "internalType": "PoolId"
        },
        {
          "name": "amountNew",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "amountOld",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "collateralAmount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "collateralAddress",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "int256",
          "internalType": "int256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "error",
      "name": "OutOfBounds",
      "inputs": []
    }
  ] as const;
  