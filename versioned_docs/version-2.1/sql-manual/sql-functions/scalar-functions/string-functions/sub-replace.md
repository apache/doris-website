---
{
"title": "SUB_REPLACE",
"language": "en"
}
---

## Description

The `sub_replace` function is used to replace substrings within a string. You can specify the substring to be replaced and the target string to replace it with. It returns a new string where the substring starting from `start` with length `len` in `str` is replaced by `new_str`. If `start` or `len` is a negative integer, it returns NULL. The default value for `len` is the length of `new_str`.

## Syntax

```sql
sub_replace(<str>, <new_str>, [ ,<start> [ , <len> ] ])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The target string in which the replacement will occur |
| `<new_str>` | The string that will replace the specified substring |
| `<start>` | `start` is the position where the replacement operation begins, indicating from which position in the string the replacement will start |
| `<len>` | `len` is an optional parameter that specifies the length of the substring to be replaced |

## Return Value

Returns the string after replacement.

## Examples

```sql
select sub_replace("this is origin str","NEW-STR",1);
```

```text
+-------------------------------------------------+
| sub_replace('this is origin str', 'NEW-STR', 1) |
+-------------------------------------------------+
| tNEW-STRorigin str                              |
+-------------------------------------------------+
```

```sql
select sub_replace("doris","***",1,2);
```

```text
+-----------------------------------+
| sub_replace('doris', '***', 1, 2) |
+-----------------------------------+
| d***is                            |
+-----------------------------------+
```
