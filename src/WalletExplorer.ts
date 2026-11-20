import {
  type Address,
  lamportsToSol,
  formatDecimalFixedPoint,
} from "@solana/kit";

import { SolanaConnection } from "./SolanaConnection";

export class WalletExplorer {
  private readonly rpc;
  constructor(private readonly connection: SolanaConnection) {
    this.rpc = connection.connectWithSolanaRpc().rpc;
  }

  async formattedBalance(
    walletAddress: Address,
    walletName: string = "Wallet",
  ) {
    const balance = await this.connection.retry(() =>
      this.rpc.getBalance(walletAddress).send(),
    );
    console.log(`${walletName} Balance (lamports):`, balance.value);

    const solBalance = lamportsToSol(balance.value);
    const formatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: solBalance.decimals,
    });
    const formatted = formatDecimalFixedPoint(formatter, solBalance);
    return formatted;
  }

  async showAccountInfo(accountAddress: Address) {
    // Retrieve information about the account.
    const accountInfo = await this.connection.retry(() =>
      this.rpc.getAccountInfo(accountAddress).send(),
    );

    if (accountInfo.value !== null) {
      console.log("All account Info: ", accountInfo);
      console.log("Account Address: ", accountAddress);
      console.log("Account Owner: ", accountInfo.value.owner);
      console.log("Executatable: ", accountInfo.value.executable);
      console.log("Lamports: ", accountInfo.value.lamports);
    } else {
      console.log("Account not found on Devnet");
    }
  }

  async showTransactionHistory(walletAddress: Address) {
    const transactions = await this.connection.retry(() =>
      this.rpc
        .getSignaturesForAddress(walletAddress, {
          limit: 5,
          commitment: "confirmed",
        })
        .send(),
    );

    console.log("Transactions found: ", transactions.length);

    for (const t of transactions) {
      console.log("--------------------------------");

      if (t.err) {
        console.log("Error: ", t.err);
        // use continue to go to the next loop.
        // if we wanted to shutdown the entire loop, we would have
        // used break isntead of continue.
        continue;
      }
      console.log("Signature: ", t.signature);
      console.log("Slot: ", t.slot);
      console.log("Confirmation:", t.confirmationStatus);
    }
  }
}
