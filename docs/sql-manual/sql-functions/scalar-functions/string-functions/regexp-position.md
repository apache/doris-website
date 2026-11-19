---
{
    "title": "REGEXP_POSITION",
    "language": "en",
    "description": "Returns the position of a regular expression match in a string."
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Returns the byte position of the Nth non-overlapping regular-expression match or a selected capture group in a string. If any argument is `NULL`, the result for that row is `NULL`.

## Syntax

```sql
regexp_position(<haystack>, <pattern>
    [, <position>[, <occurrence>[, <return_option>[, <flags>[, <subexpression>]]]]])
```

Accepts 2–7 positional arguments. `haystack` and `pattern` are required. The optional arguments must be supplied in order: `position`, `occurrence`, `return_option`, `flags`, then `subexpression`. For example, supplying `flags` also requires `position`, `occurrence`, and `return_option`. Square brackets denote optional arguments and are not part of the SQL call.

The public names are `regexp_position`, `regexp_instr`, `regexpPosition`, and `regexpInstr`. Function names are case-insensitive; all four names resolve to `regexp_position`.

## Parameters

| Parameter | Description |
| --- | --- |
| `<haystack>` | Required. `STRING` or `VARCHAR` byte string to search; may vary by row. |
| `<pattern>` | Required. `STRING` or `VARCHAR` constant expression using RE2 syntax, with at most 1024 capture groups. |
| `<position>` | Optional. `TINYINT`, `SMALLINT`, `INT`, or `BIGINT`; defaults to `1`. The 1-based search start in bytes; must be at least 1. |
| `<occurrence>` | Optional. Accepts the same integer types as `position`; defaults to `1`. Selects the Nth whole, non-overlapping match from the search start; must be at least 1. |
| `<return_option>` | Optional. Accepts the same integer types as `position`; defaults to `0`. `0` returns the selected object's start; `1` returns the position immediately after its end. |
| `<flags>` | Optional. `STRING` or `VARCHAR` constant expression; defaults to `''` (empty string). Accepts only lowercase `i`, `c`, `m`, `n`, and `s`. |
| `<subexpression>` | Optional. Accepts the same integer types as `position`; defaults to `0`, selecting the whole match. Positive values select capture groups in opening-parenthesis order and must not exceed the number of groups. |

Every argument also accepts `NULL`.

## Return Value

Returns `BIGINT`, representing a 1-based byte position. Returns `0` when the requested match is not found, or when the selected capture group did not participate or matched an empty string. If any argument is nullable, the return type is `Nullable(BIGINT)`; a row with any argument equal to `NULL` returns `NULL`.

## Example

```sql
SELECT regexp_position('äbc', 'b') AS byte_position;
```

```text
+---------------+
| byte_position |
+---------------+
|             3 |
+---------------+
```

```sql
SELECT regexp_position('foo123bar456', '([a-z]+)([0-9]+)',
                       1, 2, 0, '', 2) AS group_position;
```

```text
+----------------+
| group_position |
+----------------+
|             10 |
+----------------+
```

```sql
SELECT regexp_position(NULL, 'a') AS null_result;
```

```text
+-------------+
| null_result |
+-------------+
|        NULL |
+-------------+
```

## Byte positions

`position` is the 1-based byte position at which searching starts: `1` means the first byte. Returned match positions also count bytes from the beginning of `haystack`, rather than Unicode characters. `return_option = 0` returns the starting byte position of the selected match or capture group; `return_option = 1` returns the byte position immediately after its end.

The search start does not need to fall on a UTF-8 character boundary. A start inside a multibyte character is accepted without rounding or converting it to a character index; the regex searches the original string from that byte offset.

```sql
SELECT regexp_position('äbc', 'b');
```

```text
3
```

```sql
SELECT regexp_position('äbc', 'b', 1, 1, 1);
```

```text
4
```

```sql
SELECT regexp_position('äbc', '.', 2);
```

```text
3
```

```sql
SELECT regexp_position('😀a', '.', 3);
```

```text
5
```

## Zero and NULL results

For valid, non-NULL arguments, the function returns `0` when the requested match is not found, including when `occurrence` exceeds the number of matches or `position` is beyond the end-of-string position (`length(haystack) + 1`). A valid capture group selected by `subexpression` also returns `0` if it did not participate in the requested match. A capture group that participated but matched an empty string also returns `0`, for either `return_option` value.

If any supplied argument is `NULL`, the result for that row is `NULL`, rather than `0`. Once argument expressions have been evaluated, the function skips its own validation of other arguments in that NULL row. This does not suppress errors raised while evaluating or converting the argument expressions themselves. For non-NULL rows, invalid arguments or an invalid pattern still raise an error, even if the search would otherwise return `0`.

```sql
SELECT regexp_position('abc', 'z');
```

```text
0
```

```sql
SELECT regexp_position('b', '(a)?b', 1, 1, 0, '', 1);
```

```text
0
```

```sql
SELECT regexp_position('a', 'a()', 1, 1, 0, '', 1);
```

```text
0
```

```sql
SELECT regexp_position(NULL, 'a');
```

```text
NULL
```

```sql
SELECT regexp_position('abc', 'a', NULL);
```

```text
NULL
```

## Flags

`flags` defaults to `''`. By default, matching is case-sensitive, `.` does not match newline characters, and `^` and `$` match only the boundaries of the complete input.

| Flag | Effect |
| --- | --- |
| `i` | Enables case-insensitive matching. |
| `c` | Enables case-sensitive matching. |
| `m` | Enables multiline anchors: `^` and `$` also match line boundaries. Does not change `.`. |
| `n` | Same as `m`: enables multiline anchors without changing `.`. |
| `s` | Allows `.` to match newline characters. Does not change `^` or `$`. |

Flags are processed from left to right. When `i` and `c` both occur, the last one wins: `ic` is case-sensitive, while `ci` is case-insensitive. Nonempty `flags` are applied before inline modifiers in `pattern`; later inline modifiers in the pattern can override those settings. Empty `flags` adds no modifier prefix.

```sql
SELECT regexp_position('ABC', 'abc', 1, 1, 0, 'ic');
```

```text
0
```

```sql
SELECT regexp_position('ABC', 'abc', 1, 1, 0, 'ci');
```

```text
1
```

## Types, constants, and errors

`haystack`, `pattern`, and `flags` accept only `STRING`, `VARCHAR`, or `NULL`. The four numeric parameters (`position`, `occurrence`, `return_option`, and `subexpression`) accept only `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, or `NULL`. Other types, including `CHAR`, `LARGEINT`, floating-point, `DECIMAL`, and boolean values, require an explicit `CAST` to an accepted type. Numeric strings are not implicitly accepted as numeric parameters.

`pattern` and `flags` must be constant expressions, including deterministic foldable expressions such as `concat('a', 'b')`. Columns and nondeterministic expressions are rejected in these positions. `haystack` and the numeric parameters may vary by row. Incorrect argument counts, unsupported original argument types, and nonconstant `pattern` or `flags` cause analysis errors before implicit type conversion, even when another argument is `NULL`. Errors from evaluating argument expressions or explicit casts follow the usual Doris rules.

After argument expressions have been evaluated, each row containing any `NULL` returns `NULL` without validating the other values in that row. On the first row with all seven arguments non-NULL, the function validates `flags` and compiles `pattern` before checking numeric values; it reuses the compiled pattern for later rows. Empty blocks and blocks with no fully non-NULL row do not trigger flag validation or pattern compilation.

For a fully non-NULL row, the following conditions cause execution errors and fail the query:

- `flags` contains anything other than lowercase `i`, `c`, `m`, `n`, or `s`, including uppercase flags.
- `pattern` fails RE2 compilation, or contains more than 1024 capture groups.
- `position < 1` or `occurrence < 1`.
- `return_option` is neither `0` nor `1`.
- `subexpression` is negative or greater than the number of capture groups; `0` selects the whole match, and positive values select groups in opening-parenthesis order.

The function uses RE2 only, without the Boost fallback controlled by `enable_extended_regex`. RE2 syntax restrictions apply, including unsupported backreferences and lookaround, and its repetition-count limits. Only a UTF-8 compilation failure with RE2 `ErrorBadUTF8` triggers a retry in Latin-1 with the same options; other compilation failures, or a failed retry, raise an error.

Flag errors take precedence over pattern compilation errors, which take precedence over numeric validation. Numeric parameters are then checked in the order `position`, `occurrence`, `return_option`, `subexpression`, before returning `0` for an out-of-range search start or a missing match. Execution errors identify the argument and invalid value or the regular-expression reason; invalid input is not converted to a no-match result.

## Differences from PostgreSQL

PostgreSQL regular-expression position functions count characters. Doris `regexp_position` counts bytes for both the search start and the returned position, so multibyte input can produce different positions. For example, `regexp_position('äbc', 'b')` returns `3` in Doris; the corresponding PostgreSQL `regexp_instr('äbc', 'b')` returns character position `2`.

Doris uses RE2 matching semantics and does not promise PostgreSQL's POSIX longest-match semantics. A pattern that has multiple possible matches can therefore select a different match: for example, matching `a|ab` against `'ab'` selects `a` under RE2's default alternative ordering, whereas POSIX longest-match semantics select `ab`. Review both position counting and pattern behavior when migrating PostgreSQL queries, even when using the `regexp_instr` alias.
