import {
  generateKeyPairSigner,
  writeKeyPairSigner,
  createKeyPairSignerFromBytes,
} from "@solana/kit";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

export class WalletManager {
  async loadOrCreateWallet(path: string) {
    if (existsSync(path)) {
      const savedWallet = await readFile(path, "utf8");
      const bytes = new Uint8Array(JSON.parse(savedWallet));
      const wallet = await createKeyPairSignerFromBytes(bytes);
      return wallet;
    }

    const wallet = await generateKeyPairSigner(true);
    await writeKeyPairSigner(wallet, path);
    return wallet;
  }
}
