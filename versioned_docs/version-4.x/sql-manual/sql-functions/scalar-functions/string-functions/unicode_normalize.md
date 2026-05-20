---
{
    "title": "UNICODE_NORMALIZE",
    "language": "en",
    "description": "Performs Unicode Normalization on the input string."
}
---

## Description

Performs [Unicode Normalization](https://unicode-org.github.io/icu/userguide/transforms/normalization/) on the input string.

Unicode normalization is the process of converting equivalent Unicode character sequences into a unified form. For example, the character "é" can be represented by a single code point (U+00E9) or by "e" + a combining acute accent (U+0065 + U+0301). Normalization ensures that these equivalent representations are handled uniformly.

## Syntax

```sql
UNICODE_NORMALIZE(<str>, <mode>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The input string to be normalized. Type: VARCHAR |
| `<mode>` | The normalization mode, must be a constant string (case-insensitive). Supported modes:<br/>- `NFC`: Canonical Decomposition, followed by Canonical Composition<br/>- `NFD`: Canonical Decomposition<br/>- `NFKC`: Compatibility Decomposition, followed by Canonical Composition<br/>- `NFKD`: Compatibility Decomposition<br/>- `NFKC_CF`: NFKC followed by Case Folding |

## Return Value

Returns VARCHAR type, representing the normalized result of the input string.

## Examples

1. Difference between NFC and NFD (composed vs decomposed characters)

```sql
-- 'Café' where é may be in composed form, NFD will decompose it into e + combining accent
SELECT length(unicode_normalize('Café', 'NFC')) AS nfc_len, length(unicode_normalize('Café', 'NFD')) AS nfd_len;
```

```text
+---------+---------+
| nfc_len | nfd_len |
+---------+---------+
|       4 |       5 |
+---------+---------+
```

2. NFKC_CF for case folding

```sql
SELECT unicode_normalize('ABC 123', 'nfkc_cf') AS result;
```

```text
+---------+
| result  |
+---------+
| abc 123 |
+---------+
```

3. NFKC handling fullwidth characters (compatibility decomposition)

```sql
-- Fullwidth digits '１２３' will be converted to halfwidth '123'
SELECT unicode_normalize('１２３ＡＢＣ', 'NFKC') AS result;
```

```text
+--------+
| result |
+--------+
| 123ABC |
+--------+
```

4. NFKD handling special symbols (compatibility decomposition)

```sql
-- ℃ (degree Celsius symbol) will be decomposed to °C
SELECT unicode_normalize('25℃', 'NFKD') AS result;
```

```text
+--------+
| result |
+--------+
| 25°C   |
+--------+
```

5. Handling circled numbers

```sql
-- ① ② ③ circled numbers will be converted to regular digits
SELECT unicode_normalize('①②③', 'NFKC') AS result;
```

```text
+--------+
| result |
+--------+
| 123    |
+--------+
```

6. Comparing different modes on the same string

```sql
SELECT 
    unicode_normalize('ﬁ', 'NFC') AS nfc_result,
    unicode_normalize('ﬁ', 'NFKC') AS nfkc_result;
```

```text
+------------+-------------+
| nfc_result | nfkc_result |
+------------+-------------+
| ﬁ          | fi          |
+------------+-------------+
```

7. String equality comparison scenario

```sql
-- Use normalization to compare visually identical but differently encoded strings
SELECT unicode_normalize('café', 'NFC') = unicode_normalize('café', 'NFC') AS is_equal;
```

```text
+----------+
| is_equal |
+----------+
|        1 |
+----------+
```
