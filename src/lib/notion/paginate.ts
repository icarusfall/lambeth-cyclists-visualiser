import type {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getNotionClient } from "./client";

type PageObject = QueryDatabaseResponse["results"][number];

/**
 * Async generator that paginates through an entire Notion database.
 * Yields arrays of page objects (100 per batch).
 * Handles rate limiting with exponential backoff.
 */
export async function* paginateDatabase(
  databaseId: string,
  filter?: QueryDatabaseParameters["filter"],
  sorts?: QueryDatabaseParameters["sorts"]
): AsyncGenerator<PageObject[]> {
  const notion = getNotionClient();
  let cursor: string | undefined = undefined;
  let hasMore = true;
  let retries = 0;
  const maxRetries = 5;

  while (hasMore) {
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        filter,
        sorts,
        start_cursor: cursor,
        page_size: 100,
      });

      yield response.results;

      hasMore = response.has_more;
      cursor = response.next_cursor ?? undefined;
      retries = 0;
    } catch (err: unknown) {
      const error = err as { status?: number; headers?: Record<string, string> };
      if (error.status === 429 && retries < maxRetries) {
        const retryAfter = error.headers?.["retry-after"];
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * 2 ** retries, 30000);
        retries++;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Fetches all records from a Notion database, returning a flat array.
 */
export async function fetchAllPages(
  databaseId: string,
  filter?: QueryDatabaseParameters["filter"],
  sorts?: QueryDatabaseParameters["sorts"]
): Promise<PageObject[]> {
  const all: PageObject[] = [];
  for await (const batch of paginateDatabase(databaseId, filter, sorts)) {
    all.push(...batch);
  }
  return all;
}
