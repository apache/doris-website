---
{
    "title": "JSON_QUOTE",
    "language": "en",
    "description": "Enclose jsonvalue in double quotes (\"), escape special characters contained."
}
---

## Description
Enclose json_value in double quotes ("), escape special characters contained.

## Syntax
```sql
JSON_QUOTE (<a>)
```

## Parameters

| Parameter | Description                                       |
|-----------|------------------------------------------|
| `<a>`     | The value of the json_value to be enclosed.   |


## Return Values
Return a json_value. Special cases are as follows:
* If the passed parameter is NULL, return NULL.

### Examples
```sql
SELECT json_quote('null'), json_quote('"null"');
```
```text
+--------------------+----------------------+
| json_quote('null') | json_quote('"null"') |
+--------------------+----------------------+
| "null"             | "\"null\""           |
+--------------------+----------------------+
```
```sql
SELECT json_quote('[1, 2, 3]');
```
```text
+-------------------------+
| json_quote('[1, 2, 3]') |
+-------------------------+
| "[1, 2, 3]"             |
+-------------------------+
```
```sql
SELECT json_quote(null);
```
```text
+------------------+
| json_quote(null) |
+------------------+
| NULL             |
+------------------+
```
```sql
select json_quote("\n\b\r\t");
```
```text
+------------------------+
| json_quote('\n\b\r\t') |
+------------------------+
| "\n\b\r\t"             |
+------------------------+
```
