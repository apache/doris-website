---
{
    "title": "UUID_V4",
    "language": "en",
    "description": "Generate a random version 4 value of the native UUID type, with aliases and support for per-row column defaults."
}
---

## Description

Generates a version 4 UUID of the native UUID type. Version 4 uses random values.

## Alias

`GENERATE_UUID_V4`, `GENERATEUUIDV4`.

## Usage Notes

Generates a value independently for each row. It takes no arguments, so passing `NULL` is invalid. It can be a dynamic default for a UUID column in `CREATE TABLE`; `ALTER TABLE ADD COLUMN` does not support this dynamic default. See the [UUID type](../../../basic-element/sql-data-types/uuid.md).

## Syntax

```sql
UUID_V4()
```

## Parameters

| Parameter | Description |
| --- | --- |
| None | Takes no arguments. |

## Return Value

Returns the `UUID` type, never `NULL`. Values are displayed in the 36-character lowercase canonical format.

## Example

```sql
SELECT UUID_VERSION(UUID_V4()) AS version,
       LENGTH(CAST(UUID_V4() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 4       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V4()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV4()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 4             | 4                     |
+---------------+-----------------------+
```
