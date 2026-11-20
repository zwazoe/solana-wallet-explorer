import "dotenv/config";
import { address } from "@solana/kit";
import { SolanaConnection } from "./SolanaConnection";
import { WalletManager } from "./WalletManager";
import { WalletExplorer } from "./WalletExplorer";
import { TransactionManager } from "./TransactionManager";

const SEND_TRANSACTION = process.env.SEND_TRANSACTION === "true";

const walletPath = process.env.WALLET_PATH ?? "./devnet-wallet.json";

const connection = new SolanaConnection();
const walletExplorer = new WalletExplorer(connection);
const walletManager = new WalletManager();
const transactionManager = new TransactionManager(
  connection,
  walletManager,
  walletExplorer,
);

async function main() {
  console.log("Connected to Solana Devnet");
  const wallet = await walletManager.loadOrCreateWallet(walletPath);

  console.log("Wallet Address: ", wallet.address);

  const formatted = await walletExplorer.formattedBalance(
    wallet.address,
    "My Wallet",
  );

  console.log("Connected to Solana Devnet");
  console.log("Wallet balance (SOL): ", formatted);

  const otherWalletAddress = address(
    "83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri",
  );

  const otherFormattedAddress = await walletExplorer.formattedBalance(
    otherWalletAddress,
    "Other Wallet",
  );

  console.log("Other wallet balance (SOL): ", otherFormattedAddress);

  const accountAddress = address("11111111111111111111111111111111");

  await walletExplorer.showAccountInfo(accountAddress);

  if (SEND_TRANSACTION) {
    await transactionManager.send(wallet);
  }
  await walletExplorer.showTransactionHistory(wallet.address);
}

main().catch((error) => {
  console.error(
    "Wallet Explorer stopped: ",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
