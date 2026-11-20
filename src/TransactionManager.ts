import {
  lamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  assertIsTransactionWithBlockhashLifetime,
  type KeyPairSigner,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { SolanaConnection } from "./SolanaConnection";
import { WalletManager } from "./WalletManager";
import { WalletExplorer } from "./WalletExplorer";

export class TransactionManager {
  constructor(
    private readonly connection: SolanaConnection,
    private readonly walletManager: WalletManager,
    private readonly walletExplorer: WalletExplorer,
  ) {}

  async send(wallet: KeyPairSigner) {
    const { rpc, rpcSubscriptions } = this.connection.connectWithSolanaRpc();
    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    const recipientWallet = await this.walletManager.loadOrCreateWallet(
      process.env.RECIPIENT_WALLET_PATH ?? "./devnet-recipient.json",
    );
    const payload = {
      source: wallet,
      destination: recipientWallet.address,
      amount: lamports(1_000_000n),
    };

    const transferInstruction = getTransferSolInstruction(payload);

    const { value: latestBlockhash } = await this.connection.retry(() =>
      rpc.getLatestBlockhash().send(),
    );

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (message) => setTransactionMessageFeePayerSigner(wallet, message),
      (message) =>
        setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
      (message) =>
        appendTransactionMessageInstruction(transferInstruction, message),
    );

    console.log("Sender: ", wallet.address);
    console.log("Recipient: ", recipientWallet.address);
    console.log("Transfer amount: ", "0.001 SOL");

    console.log(
      "Number of instruction: ",
      transactionMessage.instructions.length,
    );

    console.log("Transaction message created successfully");

    const signedTransaction =
      await signTransactionMessageWithSigners(transactionMessage);
    const signature = getSignatureFromTransaction(signedTransaction);

    console.log("Transaction signed successfully");
    console.log("Signature: ", signature);

    assertIsTransactionWithBlockhashLifetime(signedTransaction);

    await sendAndConfirm(signedTransaction, {
      commitment: "confirmed",
    });

    console.log(
      "Sender SOL: ",
      await this.walletExplorer.formattedBalance(wallet.address, "Sender"),
    );

    console.log(
      "Recipient SOL:",
      await this.walletExplorer.formattedBalance(
        recipientWallet.address,
        "Recipient",
      ),
    );
  }
}
