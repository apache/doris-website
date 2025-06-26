---
{
    "title": "FORMAT",
    "language": "en"
}
---

## Description

Returns a formatted string using the specified [format](https://fmt.dev/11.1/syntax/#format-specification-mini-language) string and arguments:

## Syntax

```sql
FORMAT(<format>, <args> [, ...])
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<format>` | The value is to be format mode |  
| `<args>` | The value is to be format within string | 

## Return Value  

The formatted string using a format mode. 

## Example

```sql
select format("{:.5}",pi());
```

```text
+-----------------------+
| format('{:.5}', pi()) |
+-----------------------+
| 3.1416                |
+-----------------------+
```

```sql
select format("{:08.2}",pi());
```

```text
+-------------------------+
| format('{:08.2}', pi()) |
+-------------------------+
| 000003.1                |
+-------------------------+
```

```sql
select format("{0}-{1}","second","first");
```

```text
+--------------------------------------+
| format('{0}-{1}', 'second', 'first') |
+--------------------------------------+
| second-first                         |
+--------------------------------------+
```
