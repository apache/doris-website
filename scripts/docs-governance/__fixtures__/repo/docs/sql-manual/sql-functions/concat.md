---
title: CONCAT
description: Concatenates multiple strings and returns the combined result.
---

# CONCAT

## Description

Concatenates multiple strings.

## Syntax

```sql
CONCAT(<str>, ...)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<str>` | String expression. |

## Return Value

Returns a string. Returns NULL if any input is NULL.

## Example

```sql
SELECT CONCAT('a', 'b');
```

```text
+------------------+
| concat('a', 'b') |
+------------------+
| ab               |
+------------------+
```

