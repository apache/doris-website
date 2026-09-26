---
{
    "title": "UUID_V7",
    "language": "en",
    "description": "Generate a native UUID v7 containing a millisecond timestamp, with aliases, column defaults, and ordering limitations."
}
---

## Description

Generates a version 7 UUID of the native UUID type. Version 7 includes a Unix timestamp in milliseconds and is useful for identifiers that roughly sort by generation time.

## Alias

`GENERATE_UUID_V7`, `GENERATEUUIDV7`.

## Usage Notes

Generates a value independently for each row. It takes no arguments, so passing `NULL` is invalid. It can be a dynamic default for a UUID column in `CREATE TABLE`; `ALTER TABLE ADD COLUMN` does not support this dynamic default. See the [UUID type](../../../basic-element/sql-data-types/uuid.md).

The generator uses an increasing timestamp and counter within each BE process. It does not guarantee global generation order across BEs. Clock rollback or counter overflow can put the encoded timestamp ahead of the wall clock. Do not use it as an exact event timestamp or a global sequence number.

## Syntax

```sql
UUID_V7()
```

## Parameters

| Parameter | Description |
| --- | --- |
| None | Takes no arguments. |

## Return Value

Returns the `UUID` type, never `NULL`. Values are displayed in the 36-character lowercase canonical format.

## Example

```sql
SELECT UUID_VERSION(UUID_V7()) AS version,
       LENGTH(CAST(UUID_V7() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 7       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V7()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV7()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 7             | 7                     |
+---------------+-----------------------+
```
