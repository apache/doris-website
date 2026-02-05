---
{
    "title": "PRINTF",
    "language": "en",
    "description": "Returns a formatted string using the specified printf string and arguments."
}
---

## Description

Returns a formatted string using the specified [printf](https://pubs.opengroup.org/onlinepubs/009695399/functions/fprintf.html) string and arguments.

:::tip
This function is supported since version 3.0.6.
:::

## Syntax

```sql
PRINTF(<format>, [<args>, ...])
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<format>` | The printf format string. |  
| `<args>` | The arguments to be formatted. | 

## Return Value  

The formatted string using a printf mode. 

## Example

```sql
select printf("hello world");
```

```text
+-----------------------+
| printf("hello world") |
+-----------------------+
| hello world           |
+-----------------------+
```

```sql
select printf('%d-%s-%.2f', 100, 'test', 3.14);
```

```text
+-----------------------------------------+
| printf('%d-%s-%.2f', 100, 'test', 3.14) |
+-----------------------------------------+
| 100-test-3.14                           |
+-----------------------------------------+
```

```sql
select printf('Int: %d, Str: %s, Float: %.2f, Hex: %x', 255, 'test', 3.14159, 255);
```

```text
+-----------------------------------------------------------------------------+
| printf('Int: %d, Str: %s, Float: %.2f, Hex: %x', 255, 'test', 3.14159, 255) |
+-----------------------------------------------------------------------------+
| Int: 255, Str: test, Float: 3.14, Hex: ff                                   |
+-----------------------------------------------------------------------------+
```
