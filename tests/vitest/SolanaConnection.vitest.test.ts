import { test, expect, vi } from "vitest";
import { SolanaConnection } from "../../src/SolanaConnection";

test("RPC request succeeds on the first attempt", async () => {
  const connection = new SolanaConnection();
  let attempts = 0;
  const result = await connection.retry(async () => {
    attempts++;
    return "Success";
  });

  expect(result).toBe("Success");
  expect(attempts).toBe(1);
});

test("RPC request retries after a failure", async () => {
  vi.useFakeTimers();

  try {
    const connection = new SolanaConnection();
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error("Connection failed");
      }
      return "Success";
    };
    const resultPromise = connection.retry(operation);
    await vi.advanceTimersByTimeAsync(3000);
    const result = await resultPromise;
    expect(result).toBe("Success");
    expect(attempts).toBe(2);
  } finally {
    vi.useRealTimers();
  }
});

test("RPC request fails after all attempts", async () => {
  vi.useFakeTimers();

  try {
    const connection = new SolanaConnection();
    let attempts = 0;

    const operation = async () => {
      attempts++;
      throw new Error("Connection failed");
    };

    const resultPromise = connection.retry(operation);
    const assertion = expect(resultPromise).rejects.toThrow(
      "RPC requests failed after all attempts",
    );

    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(15000);

    await assertion;

    expect(attempts).toBe(4);
  } finally {
    vi.useRealTimers();
  }
});
