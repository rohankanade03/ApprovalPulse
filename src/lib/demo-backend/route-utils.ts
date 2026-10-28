import "server-only";

import { jsonError } from "./http";
import { demoStateRepository } from "./repository";
import type { DemoBackendState } from "./types";

export async function readDemoState(): Promise<{ state: DemoBackendState } | { response: ReturnType<typeof jsonError> }> {
  try {
    return { state: await demoStateRepository.read() };
  } catch {
    return { response: jsonError("INTERNAL_ERROR", "Demo data is currently unavailable.", 500) };
  }
}
