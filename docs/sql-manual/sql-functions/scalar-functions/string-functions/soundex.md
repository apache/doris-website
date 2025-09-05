---
{
    "title": "SOUNDEX",
    "language": "en"
}
---

## Description

The SOUNDEX function computes the [American Soundex](https://en.wikipedia.org/wiki/Soundex) value, which consists of the first letter followed by a three-digit sound code that represents the English pronunciation of the input string.

The function ignores all non-letter characters in the string.

## Syntax

```sql
SOUNDEX ( <expr> )
```

## Arguments

| Argument | Description                |
|----------|----------------------------|
| `<expr>` | The string to compute for. |

## Return Value

Returns a VARCHAR(4) string consisting of an uppercase letter followed by a three-digit numeric sound code representing English pronunciation.

If the string is empty or contains no letter characters, an empty string is returned.

If the input is NULL, NULL is returned.

## Examples

The following table simulates a list of names.
```sql
CREATE TABLE IF NOT EXISTS soundex_test (
     name VARCHAR(20)
) DISTRIBUTED BY HASH(name) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO soundex_test (name) VALUES
('Doris'),
('Smith'), ('Smyth'),
('H'), ('P'), ('Lee'), 
('Robert'), ('R@b-e123rt'),
('123@*%'), (''),
('Ashcraft'), ('Honeyman'), ('Pfister'), (NULL);
```

```sql
SELECT name, soundex(name) AS IDX FROM soundex_test;
```
```text
+------------+------+
| NULL       | NULL |
|            |      |
| 123@*%     |      |
| Ashcraft   | A261 |
| Doris      | D620 |
| H          | H000 |
| Honeyman   | H555 |
| Lee        | L000 |
| P          | P000 |
| Pfister    | P236 |
| R@b-e123rt | R163 |
| Robert     | R163 |
| Smith      | S530 |
| Smyth      | S530 |
+------------+------+
```