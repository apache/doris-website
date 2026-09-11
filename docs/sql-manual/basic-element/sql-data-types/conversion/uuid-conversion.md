---
{
    "title": "Cast to UUID",
    "language": "en",
    "description": "Rules for converting strings and other types to UUID, including strict and non-strict modes, accepted text formats, and migration."
}
---

The [UUID type](../uuid.md) stores a 128-bit identifier in 16 bytes. Its text representation is the 36-character lowercase canonical format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

Use `CAST(<value> AS UUID)` to convert a value to UUID. Strict mode is controlled by `enable_strict_cast`; see the [type conversion overview](./overview.md).

## FROM String

String sources include `CHAR`, `VARCHAR`, and `STRING`.

### Strict Mode

#### BNF Definition

```xml
<uuid> ::= <hex8> "-" <hex4> "-" <hex4> "-" <hex4> "-" <hex12>
         | <hex32>

<hex4> ::= <hexdigit> <hexdigit> <hexdigit> <hexdigit>
<hex8> ::= <hex4> <hex4>
<hex12> ::= <hex8> <hex4>
<hex32> ::= <hex8> <hex8> <hex8> <hex8>

<hexdigit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
             | "a" | "b" | "c" | "d" | "e" | "f"
             | "A" | "B" | "C" | "D" | "E" | "F"
```

#### Rule Description

1. Accepts either the 36-character canonical format with hyphens in the `8-4-4-4-12` pattern or the compact format of 32 hexadecimal digits without hyphens.
2. Hexadecimal letters can be uppercase (`A–F`) or lowercase (`a–f`). Both input formats produce lowercase canonical UUID text.
3. Leading or trailing whitespace, braces, incorrect lengths, misplaced hyphens, and non-hexadecimal characters are invalid.
4. All-zero and all-one UUIDs are valid. Parsing checks only the text format, without constraining the UUID version or variant.
5. `NULL` input returns `NULL`.
6. Invalid text raises an error and fails the query.

#### Examples

| Input String | Parse Result | Comment |
| --- | --- | --- |
| `"550e8400-e29b-41d4-a716-446655440000"` | Success | Standard format with hyphens |
| `"550E8400E29B41D4A716446655440000"` | Success | Compact format with uppercase hexadecimal digits |
| `"00000000-0000-0000-0000-000000000000"` | Success | All-zero UUID; distinct from NULL |
| `"ffffffff-ffff-ffff-ffff-ffffffffffff"` | Success | All-one UUID; version and variant are not validated |
| `""` | Error | Empty string |
| `" 550e8400-e29b-41d4-a716-446655440000 "` | Error | Leading and trailing whitespace |
| `"{550e8400-e29b-41d4-a716-446655440000}"` | Error | Braces are not accepted |
| `"550e8400-e29b-41d4-a716-44665544000"` | Error | Incorrect length |
| `"550e8400e-29b-41d4-a716-446655440000"` | Error | Incorrect hyphen positions |
| `"550e8400-e29b-41d4-a716-44665544000g"` | Error | Non-hexadecimal character g |
| `NULL` | `NULL` | SQL NULL remains NULL |

```sql
SET enable_strict_cast = true;
SELECT CAST('550E8400E29B41D4A716446655440000' AS UUID) AS parsed,
       CAST(CAST('550E8400E29B41D4A716446655440000' AS UUID) AS STRING) AS text_value,
       CAST(NULL AS UUID) AS null_value;
```

```text
+--------------------------------------+--------------------------------------+------------+
| parsed                               | text_value                           | null_value |
+--------------------------------------+--------------------------------------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | 550e8400-e29b-41d4-a716-446655440000 | NULL       |
+--------------------------------------+--------------------------------------+------------+
```

### Non-Strict Mode

#### BNF Definition

```xml
<uuid> ::= <hex8> "-" <hex4> "-" <hex4> "-" <hex4> "-" <hex12>
         | <hex32>

<hex4> ::= <hexdigit> <hexdigit> <hexdigit> <hexdigit>
<hex8> ::= <hex4> <hex4>
<hex12> ::= <hex8> <hex4>
<hex32> ::= <hex8> <hex8> <hex8> <hex8>

<hexdigit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
             | "a" | "b" | "c" | "d" | "e" | "f"
             | "A" | "B" | "C" | "D" | "E" | "F"
```

#### Rule Description

1. Accepts either the 36-character canonical format with hyphens in the `8-4-4-4-12` pattern or the compact format of 32 hexadecimal digits without hyphens.
2. Hexadecimal letters can be uppercase (`A–F`) or lowercase (`a–f`). Both input formats produce lowercase canonical UUID text.
3. Leading or trailing whitespace, braces, incorrect lengths, misplaced hyphens, and non-hexadecimal characters are invalid.
4. All-zero and all-one UUIDs are valid. Parsing checks only the text format, without constraining the UUID version or variant.
5. `NULL` input returns `NULL`.
6. Invalid text returns `NULL` instead of raising an error.

#### Examples

| Input String | Parse Result | Comment |
| --- | --- | --- |
| `"550e8400-e29b-41d4-a716-446655440000"` | Success | Standard format with hyphens |
| `"550E8400E29B41D4A716446655440000"` | Success | Compact format with uppercase hexadecimal digits |
| `"00000000-0000-0000-0000-000000000000"` | Success | All-zero UUID; distinct from NULL |
| `"ffffffff-ffff-ffff-ffff-ffffffffffff"` | Success | All-one UUID; version and variant are not validated |
| `""` | `NULL` | Empty string |
| `" 550e8400-e29b-41d4-a716-446655440000 "` | `NULL` | Leading and trailing whitespace |
| `"{550e8400-e29b-41d4-a716-446655440000}"` | `NULL` | Braces are not accepted |
| `"550e8400-e29b-41d4-a716-44665544000"` | `NULL` | Incorrect length |
| `"550e8400e-29b-41d4-a716-446655440000"` | `NULL` | Incorrect hyphen positions |
| `"550e8400-e29b-41d4-a716-44665544000g"` | `NULL` | Non-hexadecimal character g |
| `NULL` | `NULL` | SQL NULL remains NULL |

```sql
SET enable_strict_cast = false;
SELECT CAST('bad' AS UUID) AS invalid_cast,
       TRY_CAST('{550e8400-e29b-41d4-a716-446655440000}' AS UUID) AS braces;
```

```text
+--------------+--------+
| invalid_cast | braces |
+--------------+--------+
| NULL         | NULL   |
+--------------+--------+
```

## FROM UUID

Casting UUID to UUID preserves its value and `NULL`. Strict and non-strict modes behave identically.

## FROM VARIANT

Conversion from VARIANT to UUID is supported when the VARIANT value contains a convertible scalar. Conversion behavior depends on the scalar value and strict-mode setting.

## FROM Other Types

Direct scalar casts from numeric, date/time, IP, VARBINARY, or JSON types to UUID are unsupported in both strict and non-strict modes. `TRY_CAST` does not make unsupported conversions legal.

## Tolerant Conversion

`TRY_CAST(<string> AS UUID)` returns `NULL` for invalid text or `NULL` input in either mode. For example, invalid text still returns `NULL` with strict mode enabled:

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST('bad' AS UUID) AS invalid_try_cast;
```

```text
+------------------+
| invalid_try_cast |
+------------------+
| NULL             |
+------------------+
```

Executing `SELECT CAST('bad' AS UUID);` in this mode raises an error and fails the query.

Use [TO_UUID_OR_NULL](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md), [TO_UUID_OR_ZERO](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md), or [TO_UUID_OR_DEFAULT](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) to explicitly choose parsing failure behavior independent of `enable_strict_cast`. Note that `TO_UUID_OR_ZERO(NULL)` returns NULL, while `TO_UUID_OR_DEFAULT(NULL)` returns the all-zero UUID.

## Related Conversions and Migration

UUID can be cast to `CHAR`, `VARCHAR`, or `STRING`, producing lowercase canonical text and preserving `NULL` in both modes; see [Cast to String](./cast-to-string.md#uuid). UUID can also be cast to VARIANT. Direct casts from UUID to numeric, date/time, IP, VARBINARY, or JSON types are unsupported.

String and UUID operands are coerced to UUID for comparisons and common-type inference. String parsing follows the rules above; explicit casts make the intent clear.

For the existing `INT_TO_UUID` encoding, first convert to text: `CAST(INT_TO_UUID(encoded_value) AS UUID)`. Direct casts between UUID and LARGEINT are unsupported, and there is no `toUInt128` function. For 16-byte VARBINARY in canonical big-endian order, use `HEX` followed by `CAST(HEX(binary_value) AS UUID)`; arbitrary 16-byte strings are not canonical UUID text.

String elements of complex types can be recursively cast to UUID, for example `CAST(ARRAY('550e8400-e29b-41d4-a716-446655440000') AS ARRAY<UUID>)`. When reading UUID text from JSON, extract it as a string before conversion; direct scalar casts between JSON and UUID are unsupported. Schema change cannot directly change an existing string column to UUID. Populate a new column or table with a conversion expression and check failed values before migration.
