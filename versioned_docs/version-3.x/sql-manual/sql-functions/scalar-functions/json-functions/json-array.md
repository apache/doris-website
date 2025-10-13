---
{
    "title": "JSON_ARRAY",
    "language": "en"
}
---

## Description
Generate a json array containing the specified values, return empty if no values


## Syntax
```sql
JSON_ARRAY (<a>, ...)
```

## Parameters
| Parameter | Description                                                                                                   |
|------|---------------------------------------------------------------------------------------------------------------|
| `<a>, ...` | Elements to be included in the JSON array. It can be a single or multiple values of any type, including NULL. |


## Return Values
Returns a JSON array containing the specified values. If no values are specified, an empty JSON array is returned.


## Examples

```sql
select json_array();
```

```text
+--------------+
| json_array() |
+--------------+
| []           |
+--------------+
```

```sql
select json_array(null);
```

```text
+--------------------+
| json_array('NULL') |
+--------------------+
| [NULL]             |
+--------------------+
```
```sql
SELECT json_array(1, "abc", NULL, TRUE, CURTIME());
```

```text
+-----------------------------------------------+
| json_array(1, 'abc', 'NULL', TRUE, curtime()) |
+-----------------------------------------------+
| [1, "abc", NULL, TRUE, "10:41:15"]            |
+-----------------------------------------------+
```

```sql
select json_array("a", null, "c");
```

```text
+------------------------------+
| json_array('a', 'NULL', 'c') |
+------------------------------+
| ["a", NULL, "c"]             |
+------------------------------+
```
