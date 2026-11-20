import { createSolanaRpcSubscriptions, createSolanaRpc } from "@solana/kit";

const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;

export class SolanaConnection {
  readonly connectWithSolanaRpc = () => {
    const rpc = createSolanaRpc(
      SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    );
    const rpcSubscriptions = createSolanaRpcSubscriptions(
      SOLANA_WS_URL ?? "wss://api.devnet.solana.com",
    );
    return { rpc, rpcSubscriptions };
  };

  // Retry failed RPC requests.
  async retry<T>(operation: () => Promise<T>): Promise<T> {
    const delays = [3000, 5000, 15000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === delays.length) {
          throw new Error("RPC requests failed after all attempts", {
            cause: error,
          });
        }

        const seconds = delays[attempt] / 1000;

        console.log(`RPC request failed. Retrying in ${seconds} seconds ...`);

        await new Promise<void>((resolve) =>
          setTimeout(resolve, delays[attempt]),
        );
      }
    }
    throw new Error("RPC requests failed");
  }
}
