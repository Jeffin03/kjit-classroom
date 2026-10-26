import { after } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  BatchGetCommand,
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb"

/**
 * Shared persistence for the in-memory stores.
 *
 * The stores stay synchronous (services read plain arrays) but every
 * collection is mirrored to a DynamoDB table when `DYNAMODB_TABLE` is set:
 *
 * Table layout (single table):
 *   PK = collection key, SK = "E#<entityId>" for one entity
 *                      SK = "META"           for the collection's version
 *
 * - reads: `ensureFresh()` (called from `resolveAccess`, the single choke
 *   point every API route and the proxy pass through) BatchGets the META
 *   items and re-Queries only the collections whose version changed, at most
 *   once per FRESH_MS window.
 * - writes: store mutators call `mutated()` which tracks the entity as dirty
 *   and schedules a post-response flush via `after()`. The flush writes only
 *   the dirty entities (per-item puts/deletes — concurrent writers on other
 *   instances touch different items and are never clobbered) and bumps the
 *   META version. The first flush of a collection writes the full local
 *   snapshot (after confirming META really is absent) so seeds reach the
 *   table, and always writes META.
 *
 * Without `DYNAMODB_TABLE` everything behaves exactly as before: pure
 * memory. Two writes to the same entity are last-writer-wins, which is the
 * intended semantics for this app.
 */

export const KEYS = {
  assignments: "kc:assignments",
  submissions: "kc:submissions",
  sprints: "kc:sprints",
  roster: "kc:roster",
  onboardingSessions: "kc:onboarding",
  teachers: "kc:teachers",
  announcements: "kc:announcements",
} as const

const COLLECTION_KEYS: string[] = [
  KEYS.assignments,
  KEYS.submissions,
  KEYS.sprints,
  KEYS.roster,
  KEYS.onboardingSessions,
  KEYS.teachers,
  KEYS.announcements,
]

const FRESH_MS = 1_000
const RETRY_MS = 3_000
const META_SK = "META"
const ENTITY_SK_PREFIX = "E#"
const BATCH_MAX = 25

interface Collection {
  key: string
  getAll: () => unknown[]
  replace: (items: unknown[]) => void
  entityId: (item: unknown) => string
}

interface DirtyEntry {
  key: string
  id: string
  /** null = delete */
  value: unknown
}

const collections = new Map<string, Collection>()

let dirty: DirtyEntry[] = []
/** Per-collection META version seen remotely; null = table has no META yet. */
const remoteVersion = new Map<string, number | null>()
let lastChecked = 0
let lastFlushAttempt = 0
let flushScheduled = false
let inflight: Promise<void> | null = null
let doc: DynamoDBDocumentClient | null = null
let table: string | null = null

function enabled(): boolean {
  return !!process.env.DYNAMODB_TABLE
}

function getClient(): { doc: DynamoDBDocumentClient; table: string } {
  if (doc && table) return { doc, table }
  const name = process.env.DYNAMODB_TABLE
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
  if (!name || !region) {
    throw new Error(
      "DynamoDB persistence requires DYNAMODB_TABLE and AWS_REGION " +
        "(or AWS_DEFAULT_REGION) to be set"
    )
  }
  doc = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region,
      // Optional override for tests / DynamoDB Local.
      endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    }),
    { marshallOptions: { removeUndefinedValues: true } }
  )
  table = name
  return { doc, table }
}

export function registerCollection(collection: Collection): void {
  collections.set(collection.key, collection)
  if (!remoteVersion.has(collection.key)) remoteVersion.set(collection.key, null)
}

function applyRemote(key: string, items: unknown[]): void {
  const collection = collections.get(key)
  if (!collection) return

  // No seed re-insertion: seeds belong to the first flush (complete local
  // snapshot) only. Re-adding a seed that the remote lacks would resurrect
  // rows an owner deleted, and only the delete would be visible in the UI
  // while the row silently came back on the next sync.
  collection.replace(items)
  reapplyDirty(key, collection)
}

function reapplyDirty(key: string, collection: Collection): void {
  for (const entry of dirty) {
    if (entry.key !== key) continue
    const items = collection.getAll()
    const index = items.findIndex(
      (item) => collection.entityId(item) === entry.id
    )
    if (entry.value === null) {
      if (index >= 0) items.splice(index, 1)
    } else if (index >= 0) {
      items[index] = entry.value
    } else {
      items.push(entry.value)
    }
  }
}

async function syncInternal(throwOnError: boolean): Promise<void> {
  if (!enabled()) return
  const now = Date.now()
  if (lastChecked && now - lastChecked < FRESH_MS) return
  if (inflight) {
    await inflight
    return
  }

  inflight = (async () => {
    const { doc: d, table: t } = getClient()
    lastChecked = Date.now()

    const { Responses, UnprocessedKeys } = await d.send(new BatchGetCommand({
      RequestItems: {
        [t]: {
          Keys: COLLECTION_KEYS.map((key) => ({ PK: key, SK: META_SK })),
          ConsistentRead: true,
        },
      },
    }))
    if (Object.keys(UnprocessedKeys ?? {}).length > 0) {
      throw new Error("DynamoDB returned unprocessed META keys")
    }

    const metas = new Map<string, number>()
    for (const item of Responses?.[t] ?? []) {
      const meta = item as { PK: string; version?: number }
      if (typeof meta.version === "number") metas.set(meta.PK, meta.version)
    }

    const toPull: string[] = []
    for (const key of COLLECTION_KEYS) {
      const version = metas.get(key)
      if (version === undefined) {
        remoteVersion.set(key, null)
        continue
      }
      if (remoteVersion.get(key) === version) continue
      toPull.push(key)
    }

    if (toPull.length > 0) {
      const results = await Promise.all(
        toPull.map(async (key) => {
          const allItems: { data: unknown }[] = []
          let lastEvaluatedKey: Record<string, unknown> | undefined = undefined
          do {
            const queryRes: {
              Items?: Record<string, unknown>[]
              LastEvaluatedKey?: Record<string, unknown>
            } = await d.send(
              new QueryCommand({
                TableName: t,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
                ExpressionAttributeValues: { ":pk": key, ":prefix": ENTITY_SK_PREFIX },
                ConsistentRead: true,
                ExclusiveStartKey: lastEvaluatedKey,
              })
            )
            if (queryRes.Items) {
              allItems.push(...(queryRes.Items as { data: unknown }[]))
            }
            lastEvaluatedKey = queryRes.LastEvaluatedKey
          } while (lastEvaluatedKey)

          return { key, items: allItems }
        })
      )
      // Only mark versions seen after every query succeeded, so a failed
      // pull is retried on the next request instead of being skipped.
      for (const { key, items } of results) {
        applyRemote(
          key,
          items.map((item) => item.data)
        )
        remoteVersion.set(key, metas.get(key) ?? null)
      }
    }
  })()

  try {
    await inflight
  } catch (error) {
    if (throwOnError) throw error
    console.error("[persistence] sync failed:", error)
  } finally {
    inflight = null
  }
}

/** Pull a newer snapshot if another instance wrote one. */
export async function ensureFresh(): Promise<void> {
  try {
    await syncInternal(false)
  } catch (error) {
    // Never let persistence break an API request — fall back to memory.
    console.error("[persistence] sync failed:", error)
  }
  maybeRetryFlush(Date.now())
}

function maybeRetryFlush(now: number): void {
  if (
    enabled() &&
    dirty.length > 0 &&
    !flushScheduled &&
    now - lastFlushAttempt > RETRY_MS
  ) {
    scheduleFlush()
  }
}

/** Record a local mutation and arrange a post-response flush. */
export function mutated(
  key: string,
  id: string,
  value: unknown | null
): void {
  if (!enabled()) return
  dirty.push({ key, id, value })
  scheduleFlush()
}

export function scheduleFlush(): void {
  if (!enabled() || flushScheduled) return
  flushScheduled = true
  try {
    after(async () => {
      flushScheduled = false
      await flush()
    })
  } catch {
    // No request context (shouldn't happen for store mutations) — fall back
    // to a detached attempt.
    flushScheduled = false
    void flush()
  }
}

async function metaExists(d: DynamoDBDocumentClient, t: string, key: string) {
  const { Item } = await d.send(new GetCommand({
    TableName: t,
    Key: { PK: key, SK: META_SK },
    ProjectionExpression: "SK",
    ConsistentRead: true,
  }))
  return !!Item
}

interface WriteOp {
  put?: Record<string, unknown>
  delete?: { PK: string; SK: string }
}

async function flush(): Promise<void> {
  if (!enabled() || dirty.length === 0) return
  lastFlushAttempt = Date.now()

  let batch: DirtyEntry[] = []
  try {
    const { doc: d, table: t } = getClient()

    batch = dirty
    dirty = []
    if (batch.length === 0) return

    const dirtyByCollection = new Map<string, DirtyEntry[]>()
    for (const entry of batch) {
      const list = dirtyByCollection.get(entry.key) ?? []
      list.push(entry)
      dirtyByCollection.set(entry.key, list)
    }

    const writeItems: Record<string, unknown>[] = []

    for (const [key, entries] of dirtyByCollection) {
      const collection = collections.get(key)
      if (!collection) continue

      // Probe META directly instead of trusting the possibly-stale local
      // view: the first flush ever must write the full snapshot (seeds
      // included), later flushes write only the dirty entities.
      const firstFlush = !(await metaExists(d, t, key))

      // Per-entity ops deduped by entity id, keeping the LAST op for a
      // given entity (put-then-delete → delete wins, matching memory).
      const ops = new Map<string, WriteOp>()

      if (firstFlush) {
        for (const item of collection.getAll()) {
          const id = collection.entityId(item)
          ops.set(id, { put: { PK: key, SK: `${ENTITY_SK_PREFIX}${id}`, data: item } })
        }
        for (const entry of entries) {
          if (entry.value === null) ops.delete(entry.id)
        }
      } else {
        for (const entry of entries) {
          const sk = `${ENTITY_SK_PREFIX}${entry.id}`
          if (entry.value === null) {
            ops.set(entry.id, { delete: { PK: key, SK: sk } })
          } else {
            ops.set(entry.id, { put: { PK: key, SK: sk, data: entry.value } })
          }
        }
      }

      // META doubles as the collection's existence marker and version — a
      // fresh timestamp every flush so readers notice the change.
      writeItems.push({
        PK: key,
        SK: META_SK,
        version: Date.now(),
        updatedAt: new Date().toISOString(),
      })
      for (const op of ops.values()) {
        if (op.put) writeItems.push(op.put)
        else if (op.delete) writeItems.push({ __delete: op.delete })
      }
    }

    // BatchWriteItem accepts max 25 items per call.
    for (let i = 0; i < writeItems.length; i += BATCH_MAX) {
      const requests: Record<string, unknown>[] = []
      for (const item of writeItems.slice(i, i + BATCH_MAX)) {
        const del = (item as { __delete?: { PK: string; SK: string } }).__delete
        if (del) requests.push({ DeleteRequest: { Key: del } })
        else requests.push({ PutRequest: { Item: item } })
      }
      const { UnprocessedItems } = await d.send(
        new BatchWriteCommand({ RequestItems: { [t]: requests } })
      )
      if (Object.keys(UnprocessedItems ?? {}).length > 0) {
        throw new Error("DynamoDB left unprocessed writes")
      }
    }
  } catch (error) {
    // Put the batch back (older entries first so newer ones still win) and
    // let the retry path pick it up.
    dirty = [...batch, ...dirty]
    console.error("[persistence] flush failed:", error)
  }
}
