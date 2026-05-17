---
{
    "title": "REVERSE",
    "language": "en",
    "description": "The REVERSE function is used to reverse the order of an input sequence. For string arguments, it returns a string with the character order reversed;"
}
---

## Description

The REVERSE function is used to reverse the order of an input sequence. For string arguments, it returns a string with the character order reversed; for array arguments, it returns an array with the element order reversed. This function reverses by character and can correctly handle UTF-8 multi-byte characters.

## Syntax

```sql
REVERSE(<seq>)
```

## Parameters

| Parameter | Description |
|---------|----------------|
| `<seq>` | The string or array to reverse. Type: VARCHAR or ARRAY |

## Return Value

Returns the reversed sequence of the same type as the input:
- String input: Returns VARCHAR type, a string with reversed character order
- Array input: Returns ARRAY type, an array with reversed element order

Special cases:
- If parameter is NULL, returns NULL
- If string is empty, returns empty string
- If array is empty, returns empty array
- A single-character string remains the same after reversal

## Examples

1. Basic string reversal
```sql
SELECT REVERSE('hello');
```
```text
+------------------+
| REVERSE('hello') |
+------------------+
| olleh            |
+------------------+
```

2. Array element reversal
```sql
SELECT REVERSE(['hello', 'world']);
```
```text
+-----------------------------+
| REVERSE(['hello', 'world']) |
+-----------------------------+
| ["world", "hello"]          |
+-----------------------------+
```

3. NULL value handling
```sql
SELECT REVERSE(NULL);
```
```text
+---------------+
| REVERSE(NULL) |
+---------------+
| NULL          |
+---------------+
```

4. Empty string and empty array
```sql
SELECT REVERSE(''), REVERSE([]);
```
```text
+-------------+-------------+
| REVERSE('') | REVERSE([]) |
+-------------+-------------+
|             | []          |
+-------------+-------------+
```

5. Single character and single element
```sql
SELECT REVERSE('A'), REVERSE(['single']);
```
```text
+--------------+--------------------+
| REVERSE('A') | REVERSE(['single']) |
+--------------+--------------------+
| A            | ["single"]         |
+--------------+--------------------+
```

6. Numbers and special characters
```sql
SELECT REVERSE('12345'), REVERSE('!@#$%');
```
```text
+------------------+------------------+
| REVERSE('12345') | REVERSE('!@#$%') |
+------------------+------------------+
| 54321            | %$#@!            |
+------------------+------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT REVERSE('ṭṛì ḍḍumai'), REVERSE('ḍḍumannàri');
```
```text
+-----------------------+------------------------+
| REVERSE('ṭṛì ḍḍumai') | REVERSE('ḍḍumannàri') |
+-----------------------+------------------------+
| iamuḍḍ ìṛṭ            | irànnaumuḍḍ            |
+-----------------------+------------------------+
```

8. Mixed character types
```sql
SELECT REVERSE('Hello123'), REVERSE('test@email.com');
```
```text
+---------------------+--------------------------+
| REVERSE('Hello123') | REVERSE('test@email.com') |
+---------------------+--------------------------+
| 321olleH            | moc.liame@tset           |
+---------------------+--------------------------+
```

9. Multi-element array
```sql
SELECT REVERSE([1, 2, 3, 4, 5]), REVERSE(['a', 'b', 'c']);
```
```text
+---------------------------+------------------------+
| REVERSE([1, 2, 3, 4, 5])  | REVERSE(['a', 'b', 'c']) |
+---------------------------+------------------------+
| [5, 4, 3, 2, 1]           | ["c", "b", "a"]        |
+---------------------------+------------------------+
```

10. Palindrome test
```sql
SELECT REVERSE('level'), REVERSE('12321');
```
```text
+------------------+-------------------+
| REVERSE('level') | REVERSE('12321')  |
+------------------+-------------------+
| level            | 12321             |
+------------------+-------------------+
```

## Description

The REVERSE function is used to reverse the order of characters in a string or the order of elements in an array.

## Syntax

```sql
REVERSE( <seq> )
```

## Parameters

| Parameter | Description             |
|-----------|----------------|
| `<seq>`   | The string or array whose order needs to be reversed. |

## Return Value

Returns the string or array with the reversed order. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT reverse('hello');
```

```text
+------------------+
| REVERSE('hello') |
+------------------+
| olleh            |
+------------------+
```

```sql
SELECT reverse(['hello', 'world']);
```

```text
+-----------------------------+
| reverse(['hello', 'world']) |
+-----------------------------+
| ["world", "hello"]          |
+-----------------------------+
```
