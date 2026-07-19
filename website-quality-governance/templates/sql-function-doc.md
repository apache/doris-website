---
title: FUNCTION_NAME
description: Briefly describe what FUNCTION_NAME does and when users should use it.
---

# FUNCTION_NAME

## Description

Describe the function in one concise paragraph. Include defining NULL-handling behavior here when it is central to the function.

## Syntax

```sql
FUNCTION_NAME(<argument> [, <optional_argument>])
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<argument>` | Required. Accepted type, constraints, and meaning. |
| `<optional_argument>` | Optional. Accepted type, default value, constraints, and meaning. |

## Return Value

Returns `<TYPE>`, describing what the value represents. Returns NULL when `<condition>`; if the function never returns NULL, state that explicitly.

## Example

```sql
SELECT FUNCTION_NAME(<example_value>);
```

```text
+-------------------------------+
| FUNCTION_NAME(<example_value>) |
+-------------------------------+
| <expected_result>             |
+-------------------------------+
```
