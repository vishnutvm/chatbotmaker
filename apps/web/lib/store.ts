import { useSyncExternalStore } from "react";
import {
  assistants as seedAssistants,
  knowledgeSources as seedKnowledge,
  type Assistant,
  type KnowledgeSource,
  type KnowledgeType,
} from "@/lib/mock/data";

const VERSION = 1;
const K_ASSISTANTS = `cohere:v${VERSION}:assistants`;
const K_KNOWLEDGE = `cohere:v${VERSION}:knowledge`;
export const K_WIZARD = `cohere:v${VERSION}:wizard`;

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

// Seed on first load
if (isBrowser) {
  if (window.localStorage.getItem(K_ASSISTANTS) === null) {
    write(K_ASSISTANTS, seedAssistants);
  }
  if (window.localStorage.getItem(K_KNOWLEDGE) === null) {
    write(K_KNOWLEDGE, seedKnowledge);
  }
}

// ---- pub/sub ----
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function subscribe(key: string, cb: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => {
    listeners.get(key)?.delete(cb);
  };
}

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

// Cross-tab sync
if (isBrowser) {
  window.addEventListener("storage", (e) => {
    if (e.key && listeners.has(e.key)) emit(e.key);
  });
}

// ---- snapshots (must be stable references between mutations) ----
const snapshots = new Map<string, unknown>();

function getSnapshot<T>(key: string, fallback: T): T {
  if (!snapshots.has(key)) snapshots.set(key, read(key, fallback));
  return snapshots.get(key) as T;
}

function set<T>(key: string, value: T) {
  snapshots.set(key, value);
  write(key, value);
  emit(key);
}

function getServerSnapshot<T>(fallback: T): T {
  return fallback;
}

// ---- assistants ----
export function getAssistants(): Assistant[] {
  return getSnapshot<Assistant[]>(K_ASSISTANTS, seedAssistants);
}

export function useAssistants(): Assistant[] {
  return useSyncExternalStore(
    (cb) => subscribe(K_ASSISTANTS, cb),
    () => getSnapshot<Assistant[]>(K_ASSISTANTS, seedAssistants),
    () => getServerSnapshot(seedAssistants),
  );
}

export function useAssistant(id: string): Assistant | undefined {
  const list = useAssistants();
  return list.find((a) => a.id === id);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `assistant-${Date.now().toString(36)}`;
}

function uniqueId(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function addAssistant(input: Partial<Assistant> & { name: string }): Assistant {
  const list = getAssistants();
  const id = uniqueId(slugify(input.name), list.map((a) => a.id));
  const now = "just now";
  const assistant: Assistant = {
    id,
    name: input.name,
    description: input.description ?? "",
    status: input.status ?? "draft",
    purpose: input.purpose ?? "Custom Assistant",
    conversations: input.conversations ?? 0,
    messages: input.messages ?? 0,
    knowledgeSources: input.knowledgeSources ?? 0,
    lastUpdated: input.lastUpdated ?? now,
    resolutionRate: input.resolutionRate ?? 0,
  };
  set<Assistant[]>(K_ASSISTANTS, [assistant, ...list]);
  return assistant;
}

export function updateAssistant(id: string, patch: Partial<Assistant>) {
  const list = getAssistants();
  set<Assistant[]>(
    K_ASSISTANTS,
    list.map((a) => (a.id === id ? { ...a, ...patch, lastUpdated: "just now" } : a)),
  );
}

export function deleteAssistant(id: string) {
  const list = getAssistants();
  set<Assistant[]>(K_ASSISTANTS, list.filter((a) => a.id !== id));
  const ks = getKnowledge();
  set<KnowledgeSource[]>(K_KNOWLEDGE, ks.filter((k) => k.assistantId !== id));
}

// ---- knowledge ----
export function getKnowledge(): KnowledgeSource[] {
  return getSnapshot<KnowledgeSource[]>(K_KNOWLEDGE, seedKnowledge);
}

export function useKnowledgeSources(assistantId?: string): KnowledgeSource[] {
  const all = useSyncExternalStore(
    (cb) => subscribe(K_KNOWLEDGE, cb),
    () => getSnapshot<KnowledgeSource[]>(K_KNOWLEDGE, seedKnowledge),
    () => getServerSnapshot(seedKnowledge),
  );
  return assistantId ? all.filter((k) => k.assistantId === assistantId) : all;
}

export function addKnowledge(input: {
  assistantId: string;
  name: string;
  type: KnowledgeType;
  pages?: number;
}): KnowledgeSource {
  const list = getKnowledge();
  const source: KnowledgeSource = {
    id: `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name,
    type: input.type,
    status: "ready",
    pages: input.pages ?? 1,
    updated: "just now",
    assistantId: input.assistantId,
  };
  set<KnowledgeSource[]>(K_KNOWLEDGE, [source, ...list]);

  // keep denormalized count on the assistant in sync
  const assistants = getAssistants();
  const owner = assistants.find((a) => a.id === input.assistantId);
  if (owner) {
    const count = [source, ...list].filter((k) => k.assistantId === input.assistantId).length;
    updateAssistant(input.assistantId, { knowledgeSources: count });
  }
  return source;
}

export function removeKnowledge(id: string) {
  const list = getKnowledge();
  const target = list.find((k) => k.id === id);
  set<KnowledgeSource[]>(K_KNOWLEDGE, list.filter((k) => k.id !== id));
  if (target) {
    const count = list.filter((k) => k.assistantId === target.assistantId && k.id !== id).length;
    updateAssistant(target.assistantId, { knowledgeSources: count });
  }
}
