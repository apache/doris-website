---
{
    "title": "UNICODE_NORMALIZE",
    "language": "en"
}
---

## Description

Unicode Normalization. Normalizes the input string according to the specified mode.

## Syntax

```sql
VARCHAR UNICODE_NORMALIZE(VARCHAR str, VARCHAR mode)
```

## Parameters

- `str`: The input string to be normalized. Type: `VARCHAR`
- `mode`: The normalization mode. It must be a constant string. Supported modes (case-insensitive) are:
    - `NFC`: Canonical Decomposition, followed by Canonical Composition.
    - `NFD`: Canonical Decomposition.
    - `NFKC`: Compatibility Decomposition, followed by Canonical Composition.
    - `NFKD`: Compatibility Decomposition.
    - `NFKC_CF`: NFKC followed by Case Folding.

## Return Value

Returns a `VARCHAR` string which is the normalized form of the input string.

## Examples

```sql
SELECT unicode_normalize('Café', 'NFD');
```
```
Café
```

```sql
SELECT unicode_normalize('ABC 123', 'nfkc_cf');
```
```
abc 123
```

## Keywords

UNICODE_NORMALIZE, STRING, UNICODE
