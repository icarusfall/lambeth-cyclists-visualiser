/**
 * Helpers to extract typed values from Notion page property objects.
 * Notion's API returns deeply nested structures — these flatten them.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type Props = Record<string, any>;

export function getTitle(props: Props, key: string): string {
  const prop = props[key];
  if (prop?.type === "title") {
    return prop.title?.map((t: any) => t.plain_text).join("") ?? "";
  }
  return "";
}

export function getRichText(props: Props, key: string): string {
  const prop = props[key];
  if (prop?.type === "rich_text") {
    return prop.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
  }
  return "";
}

export function getSelect(props: Props, key: string): string {
  const prop = props[key];
  if (prop?.type === "select") {
    return prop.select?.name ?? "";
  }
  return "";
}

export function getMultiSelect(props: Props, key: string): string[] {
  const prop = props[key];
  if (prop?.type === "multi_select") {
    return prop.multi_select?.map((s: any) => s.name) ?? [];
  }
  return [];
}

export function getDate(props: Props, key: string): string | null {
  const prop = props[key];
  if (prop?.type === "date") {
    return prop.date?.start ?? null;
  }
  return null;
}

export function getNumber(props: Props, key: string): number {
  const prop = props[key];
  if (prop?.type === "number") {
    return prop.number ?? 0;
  }
  return 0;
}

export function getCheckbox(props: Props, key: string): boolean {
  const prop = props[key];
  if (prop?.type === "checkbox") {
    return prop.checkbox ?? false;
  }
  return false;
}
