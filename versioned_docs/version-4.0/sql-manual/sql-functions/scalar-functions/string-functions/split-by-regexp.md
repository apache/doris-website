---
{
    "title": "SPLIT_BY_REGEXP",
    "language": "en"
}
---

## Description

Split the input string into an array of strings according to the specified regular expression.

## Syntax

```sql
SPLIT_BY_REGEXP ( <str>, <pattern> [, <max_limit>] )
```

## Parameters

| Parameter      | Description                           |
|---------|------------------------------|
| `<str>` | The string to be split                     |
| `<pattern>` | Regular expression                        |
| `<max_limit>` | Optional parameter, whether to limit the number of elements in the returned string array. The default is no limit |

## Return Value

Return an array of strings split according to the specified regular expression. Special cases:

- If any of the parameters is NULL, NULL is returned.

## Examples

```sql
SELECT split_by_regexp('abcde',"");
```

```text
+------------------------------+
| split_by_regexp('abcde', '') |
+------------------------------+
| ["a", "b", "c", "d", "e"]    |
+------------------------------+
```

```sql
select split_by_regexp('a12bc23de345f',"\\d+");
```

```text
+-----------------------------------------+
| split_by_regexp('a12bc23de345f', '\d+') |
+-----------------------------------------+
| ["a", "bc", "de", "f"]                  |
+-----------------------------------------+
```
