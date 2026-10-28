import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createDefaultDemoBackendState } from "./default-state";
import type { DemoBackendState, DemoStateMutation, DemoStateRepository } from "./types";
import { parseDemoBackendState } from "./validation";

const statePath = join(process.cwd(), "data", "approval-pulse-demo.json");

export class DemoStatePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoStatePersistenceError";
  }
}

export class JsonDemoStateRepository implements DemoStateRepository {
  private initialization: Promise<void> | undefined;
  private writeQueue: Promise<void> = Promise.resolve();

  async read(): Promise<DemoBackendState> {
    await this.ensureInitialized();
    return this.readPersistedState();
  }

  async update(mutation: DemoStateMutation): Promise<DemoBackendState> {
    return this.runExclusive(async () => {
      await this.ensureInitialized();
      const current = await this.readPersistedState();
      const next = await mutation(structuredClone(current));
      const validated = parseDemoBackendState(next);
      const updated: DemoBackendState = {
        ...validated,
        revision: current.revision + 1,
        schemaVersion: current.schemaVersion,
        updatedAt: new Date().toISOString(),
      };
      await this.writeState(updated);
      return structuredClone(updated);
    });
  }

  async reset(): Promise<DemoBackendState> {
    return this.runExclusive(async () => {
      await this.ensureInitialized();
      const current = await this.readPersistedState();
      const defaults = createDefaultDemoBackendState();
      const reset: DemoBackendState = {
        ...defaults,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      await this.writeState(reset);
      return structuredClone(reset);
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialization) this.initialization = this.initializeIfMissing();
    return this.initialization;
  }

  private async initializeIfMissing(): Promise<void> {
    try {
      await access(statePath, fsConstants.F_OK);
    } catch (error) {
      if (!isMissingFile(error)) throw new DemoStatePersistenceError("Demo state storage could not be accessed.");
      await mkdir(dirname(statePath), { recursive: true });
      try {
        await access(statePath, fsConstants.F_OK);
      } catch (secondError) {
        if (!isMissingFile(secondError)) throw new DemoStatePersistenceError("Demo state storage could not be accessed.");
        await this.writeState(createDefaultDemoBackendState());
      }
    }
  }

  private async readPersistedState(): Promise<DemoBackendState> {
    let source: string;
    try {
      source = await readFile(statePath, "utf8");
    } catch {
      throw new DemoStatePersistenceError("Demo state storage could not be read.");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch {
      throw new DemoStatePersistenceError("Demo state storage contains invalid JSON and was not changed.");
    }
    try {
      return structuredClone(parseDemoBackendState(parsed));
    } catch {
      throw new DemoStatePersistenceError("Demo state storage has an unsupported or invalid schema and was not changed.");
    }
  }

  private async writeState(state: DemoBackendState): Promise<void> {
    const validated = parseDemoBackendState(state);
    const temporaryPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
    try {
      await mkdir(dirname(statePath), { recursive: true });
      await writeFile(temporaryPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
      await rename(temporaryPath, statePath);
    } catch {
      throw new DemoStatePersistenceError("Demo state storage could not be updated.");
    }
  }

  private async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(operation, operation);
    this.writeQueue = run.then(() => undefined, () => undefined);
    return run;
  }
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}
