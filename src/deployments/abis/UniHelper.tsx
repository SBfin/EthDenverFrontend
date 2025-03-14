export const UniHelper = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_quoter",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_poolManager",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "calculateCollateralNeeded",
      "inputs": [
        {
          "name": "market",
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
        },
        {
          "name": "zeroForOne",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "absAmount",
          "type": "uint128",
          "internalType": "uint128"
        },
        {
          "name": "isSell",
          "type": "bool",
          "internalType": "bool"
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
      "name": "createUniswapPool",
      "inputs": [
        {
          "name": "pool",
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
        }
      ],
      "outputs": [
        {
          "name": "",
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
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "poolManager",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract IPoolManager"
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
      "type": "function",
      "name": "quoteOppositeTokens",
      "inputs": [
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
          "name": "zeroForOne",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "absAmount",
          "type": "uint128",
          "internalType": "uint128"
        },
        {
          "name": "isSell",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [
        {
          "name": "oppositeTokensToMint",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "quoter",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract IV4Quoter"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "simulateSwap",
      "inputs": [
        {
          "name": "market",
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
      "outputs": [
        {
          "name": "collateralNeeded",
          "type": "int256",
          "internalType": "int256"
        },
        {
          "name": "oppositeTokensToMint",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "error",
      "name": "OutOfBounds",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UnexpectedRevertBytes",
      "inputs": [
        {
          "name": "revertData",
          "type": "bytes",
          "internalType": "bytes"
        }
      ]
    }
  ] as const;
  