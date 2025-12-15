---
{
    "title": "ELT",
    "language": "en"
}
---

## Description

The ELT function returns the string at the specified index position. Index counting starts from 1.

## Syntax

```sql
ELT(<pos>, <str>[, <str> ...])
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<pos>` | Index position (starting from 1). Type: INT |
| `<str>` | String list. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the string at the specified index position.

Special cases:
- If `<pos>` is less than 1 or greater than the number of strings, returns NULL
- If `<pos>` is NULL, returns NULL
- Index starts from 1, the first string has index 1

## Examples

1. Basic usage: Get the 1st string
```sql
SELECT ELT(1, 'aaa', 'bbb', 'ccc');
```
```text
+-----------------------------+
| elt(1, 'aaa', 'bbb', 'ccc') |
+-----------------------------+
| aaa                         |
+-----------------------------+
```

2. Get the 2nd string
```sql
SELECT ELT(2, 'aaa', 'bbb', 'ccc');
```
```text
+-----------------------------+
| elt(2, 'aaa', 'bbb', 'ccc') |
+-----------------------------+
| bbb                         |
+-----------------------------+
```

3. Index out of bounds returns NULL
```sql
SELECT ELT(0, 'aaa', 'bbb'), ELT(5, 'aaa', 'bbb');
```
```text
+----------------------+----------------------+
| elt(0, 'aaa', 'bbb') | elt(5, 'aaa', 'bbb') |
+----------------------+----------------------+
| NULL                 | NULL                 |
+----------------------+----------------------+
```

4. NULL value handling
```sql
SELECT ELT(NULL, 'aaa', 'bbb');
```
```text
+-------------------------+
| elt(NULL, 'aaa', 'bbb') |
+-------------------------+
| NULL                    |
+-------------------------+
```

5. Index exceeds range returns NULL

```sql
SELECT ELT(5, 'aaa', 'bbb', 'ccc');
```

```text
+-----------------------------+
| elt(5, 'aaa', 'bbb', 'ccc') |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

6. Negative index returns NULL

```sql
SELECT ELT(-1, 'first', 'second');
```

```text
+----------------------------+
| elt(-1, 'first', 'second') |
+----------------------------+
| NULL                       |
+----------------------------+
```

7. UTF-8 string

```sql
SELECT 
    ELT(2, 'Hello', 'ṭṛ', 'Hola');
```

```text
+-----------------------------------+
| ELT(2, 'Hello', 'ṭṛ', 'Hola')     |
+-----------------------------------+
| ṭṛ                                |
+-----------------------------------+
```

8. Handling empty strings

```sql
SELECT ELT(2, 'first', '', 'third');
```

```text
+------------------------------+
| elt(2, 'first', '', 'third') |
+------------------------------+
|                              |
+------------------------------+
```