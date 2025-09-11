---
{
    "title": "Cast to DATETIME Type",
    "language": "en"
}
---

Valid range for DATETIME type:

`[0000-01-01 00:00:00.0000000, 9999-12-31 23:59:59.999999]`

The DATETIME type includes a type parameter `p`, which represents the number of decimal places. The complete representation is `DATETIME(p)` type. For example, DATETIME(6) indicates a DATETIME type that supports microsecond precision.

## FROM String

### Strict Mode

#### BNF definition

```xml
<datetime>       ::= <date> (("T" | " ") <time> <whitespace>* <offset>?)?
                   | <digit>{14} <fraction>? <whitespace>* <offset>?

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<date>           ::= <year> "-" <month1> "-" <day1>
                   | <year> <month2> <day2>

<year>           ::= <digit>{2} | <digit>{4} ; 1970 as the boundary
<month1>         ::= <digit>{1,2}            ; 01–12
<day1>           ::= <digit>{1,2}            ; 01–28/29/30/31 depending on the month

<month2>         ::= <digit>{2}              ; 01–12
<day2>           ::= <digit>{2}              ; 01–28/29/30/31 depending on the month

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<time>           ::= <hour1> (":" <minute1> (":" <second1> <fraction>?)?)?
                   | <hour2> (<minute2> (<second2> <fraction>?)?)?

<hour1>           ::= <digit>{1,2}      ; 00–23
<minute1>         ::= <digit>{1,2}      ; 00–59
<second1>         ::= <digit>{1,2}      ; 00–59

<hour2>           ::= <digit>{2}        ; 00–23
<minute2>         ::= <digit>{2}        ; 00–59
<second2>         ::= <digit>{2}        ; 00–59

<fraction>        ::= "." <digit>*

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<offset>         ::= ( "+" | "-" ) <hour-offset> [ ":"? <minute-offset> ]
                   | <special-tz>
                   | <long-tz>

<hour-offset>    ::= <digit>{1,2}      ; 0–14
<minute-offset>  ::= <digit>{2}        ; 00/30/45

<special-tz>     ::= "CST" | "UTC" | "GMT" | "ZULU" | "Z"   ; case-insensitive
<long-tz>        ::= ( ^<whitespace> )+                     ; e.g. America/New_York

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<digit>          ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<area>           ::= <alpha>+
<location>       ::= (<alpha> | "_")+
<alpha>          ::= "A" | … | "Z" | "a" | … | "z"
<whitespace>     ::= " " | "\t" | "\n" | "\r" | "\v" | "\f"
```

#### Rule Description

Assuming the target type for conversion is `DATETIME(<scale>)`, where `<scale>` ranges from `[0, 6]`.

##### Overall Structure

* Date part is required; time part and timezone part are optional.

* If time appears, the date and time can be separated by an uppercase "T" or a space.

* If a timezone appears, any number of ASCII whitespace characters can separate it from the time.

* Only ASCII characters are accepted. If non-ASCII characters appear in the input string, it will not satisfy the BNF definition above and will be considered a format error.

##### Date Part `<date>`

* Two formats are allowed:

  * With separator: `YYYY-MM-DD`, etc.

  * Concatenated: `YYYYMMDD`, etc.

* `<year>`: two or four digits

  * Two-digit years (00-99): < 70 → 2000+ two digits; ≥ 70 → 1900+ two digits.

  * Four-digit years are used directly.

* Separator only supports `-`

* `<year>`, `<month>`, `<day>` support different lengths in formats with separators; in concatenated formats, `<year>` supports 2 or 4 digits, while other fields are fixed at 2 digits.

##### Time Part `<time>`

* Two formats are allowed:

  * With separators: `HH[:MM[:SS[.fraction]]]`, etc.

  * Concatenated: `HH[MM[SS[.fraction]]]`, etc.

* `<hour>`: 0–23.

* `<minute>`: 0–59.

* `<second>`: 0–59.

* `<fraction>`: Any number of digits after the decimal point. Represents the decimal part of seconds. The highest digit corresponds to the 0.1 second position (hundred milliseconds).

* `<hour>`, `<minute>`, `<second>` allow 1-2 digits in formats with separators, while in concatenated formats, the length is fixed at 2 digits.

* Only consecutive fields from the left can appear while omitting the remaining parts. For example, `<hour>` + `<minute>` is valid, while `<hour>` + `<fraction>` is invalid.

##### Consecutive Digit Format `<digit>{14}`

* Interpreted as year, month, day, hour, minute, second in the format of 4 digits-2 digits-2 digits-2 digits-2 digits-2 digits.

* Then parse any decimal and timezone parts according to the normal rules

##### Timezone Part `<offset>`

* Any whitespace is allowed between the date and timezone

* Case-insensitive

* Three types are allowed:

  1. Numeric offset: `(+|-)HH[:MM]` or `(+|-)HHMM`, etc.

     * `<hour-offset>`: 0–14, leading 0 can be omitted for single-digit values.

     * `<minute-offset>`：00, 30 or 45, the ":" can be omitted.

     * The maximum range for numeric offset is `[-14:00, +14:00]`.

  2. Special UTC identifiers: `Z`/`UTC`/`GMT`/`CST`/`ZULU`. The timezone offset represented by each symbol is:

     * `Z`: +00:00

     * `UTC`: +00:00

     * `GMT`: +00:00

     * `CST`: +08:00

     * `ZULU`: +00:00

  3. Long format timezone name: All valid timezone names contained in the IANA-managed [Timezone Database](https://www.iana.org/time-zones), such as `Europe/Paris`, `Etc/GMT+2`, etc., case insensitive.

     * For timezone name availability, see the [Timezone](../../../../admin-manual/cluster-management/time-zone) documentation.

##### Whitespace

* `<whitespace>`：Any whitespace character, including space, tab, newline, etc.

##### Parsing Logic

For input strings where all input fields of `<datetime>` are valid, Doris fills each field's value into the Result Datetime according to its semantics. The input is assigned to the corresponding parts of the result according to the fields, for example, the matching result of `<year>` sets the year part of the Result, and the matching result of `<fraction>` sets the microsecond part of the Result. All fields not present in the input are set to 0 in their corresponding parts of the Result.

Specifically, if the input date result is 0000 year 00 month 00 day, and if BE CONFIG `allow_zero_date` is `true`, it is not considered a domain error, and the result produced is 0000 year 01 month 01 day.

##### Carry

* If `<fraction>` has more than `<scale>` digits after the decimal point, it will be rounded to `<scale>` digits. If this process produces a carry, the carry will occur normally and ultimately affect any part of the Result.

* If the input contains an `<offset>` part, a carry may occur. `<offset>` normally changes the time value. If the hour or minute produces a carry, the carry will occur normally and ultimately affect the Date part of the Result.

* Since the carries produced by `<offset>` and `<fraction>` do not conflict, both can occur simultaneously and have a combined effect.

##### Error Handling

* **Format error**: If the input does not match any of the above BNF branches, an error is reported immediately.

* **Domain error**: If any part has an invalid value (result is not a valid Gregorian calendar time), an error is reported.

#### Examples

Assume the current Doris time zone is UTC+8 (`+08:00`). For the effect of time zones on time type parsing, see the [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation. The result is taken as an example of DATETIME(6), which is a DATETIME that can accommodate 6 decimal places.

| String                                  | Cast as DATETIME(6) Result       | Comment                                   |
| ------------------------------------ | ---------------------------- | ----------------------------------------- |
| `2023-07-16T19:20:30.123+08:00`      | `2023-07-16 19:20:30.123000` | Date with separator + "T" + seconds and milliseconds + numeric offset. Converting to UTC+8, result remains unchanged.   |
| `2023-07-16T19+08:00`                | `2023-07-16 19:00:00.000000` | Concatenated time format, minutes and seconds omitted. Converting to UTC+8, result remains unchanged.                   |
| `2023-07-16T1920+08:00`              | `2023-07-16 19:20:00.000000` | Concatenated time format, seconds omitted. Converting to UTC+8, result remains unchanged.                    |
| `70-1-1T00:00:00-0000`               | `1970-01-01 08:00:00.000000` | Two-digit year + single/double-digit month and day + separator + concatenated offset. Converting to UTC+8 adds 8 hours.   |
| `19991231T235959.5UTC`               | `2000-01-01 07:59:59.500000` | Concatenated date + "T" + concatenated hours, minutes, seconds + fraction + UTC. Converting to UTC+8 adds 8 hours. |
| `2024-05-01T00:00Asia/Shanghai`      | `2024-05-01 00:00:00.000000` | Incomplete time + timezone name. Converting to UTC+8, result remains unchanged.                   |
| `20231005T081530Europe/London`       | `2023-10-05 15:15:30.000000` | Concatenated date + timezone name. During daylight saving time, GMT+1, converted to UTC+8 by adding 7 hours.     |
| `20230105T081530 Europe/London`      | `2023-10-05 16:15:30.000000` | Concatenated date + timezone name. Outside daylight saving time, GMT+0, converted to UTC+8 by adding 8 hours.    |
| `85-12-25T000000gMt`                 | `1985-12-25 08:00:00.000000` | Mixed case timezone. Converting to UTC+8 adds 8 hours.                     |
| `2024-05-01`                         | `2024-05-01 00:00:00.000000` | Only date                                       |
| `24-5-1`                             | `2024-05-01 00:00:00.000000` | Two-digit year + single-digit month and day                           |
| `2024-05-01 0:1:2.333`               | `2024-05-01 00:01:02.333000` | Date with separator + "T" + single-digit hour, minute, second + milliseconds                   |
| `2024-05-01 0:1:2.`                  | `2024-05-01 00:01:02.000000` | Date with separator + "T" + single-digit hour, minute, second + single decimal point               |
| `20240501 01`                        | `2024-05-01 01:00:00.000000` | Concatenated date + "T" + single-digit hour, omitting minutes and seconds                         |
| `20230716 1920Z`                     | `2023-07-16 19:20:20.000000` | Concatenated date + space + concatenated hour and minute + UTC "Z"                |
| `2024-05-01T0000`                    | `2024-05-01 00:00:00.000000` | Date with separator + "T" + concatenated hour and minute, omitting seconds                      |
| `2024-12-31 23:59:59.9999999`        | `2025-01-01 00:00:00.000000` | Carry to year                                      |
| `2025/06/15T00:00:00.99999999999999` | `2025-06-15 00:00:01.000000` | Any number of decimal places allowed, normal carry                              |
| `2025/06/15T00:00:00.9999987`        | `2025-06-15 00:00:00.999999` | Generates carry to microseconds                                   |
| `2025/06/15T00:00:00.99999849`       | `2025-06-15 00:00:00.999998` | Rounding only considers the adjacent digit, no carry to microseconds generated.                    |
| `2020-12-12 13:12:12-03:00`          | `2020-12-13 00:12:12.000000` | No carry                                       |
| `0023-01-01T00:00Z`                  | `0023-01-01 08:00:00.000000` | Four-digit year is valid                                     |
| `69-12-31`                           | `2069-12-31 00:00:00.000000` | Two-digit year 69 → 2069-12-31                       |
| `70-01-01`                           | `1970-01-01 00:00:00.000000` | Two-digit year 70 → 1970-01-01                       |
| `230102`                             | `2023-01-02 00:00:00.000000` | Short year DATE concatenated format                            |
| `19230101`                           | `1923-01-01 00:00:00.000000` | Long year DATE concatenated format                            |
| `120102030405`                       | Error (format error)                     | Missing DATE - TIME separator                        |
| `20120102030405.123   +08`           | `2012-01-02 03:05:05.123000` | 14-digit concatenated date format + decimal + short timezone offset              |
| `120102030405.999`                   | Error (format error)                     | Missing DATE - TIME separator                        |
| `2023-07-16T19.123+08:00`            | Error (format error)                     | Date has non-consecutive fields (hour+milliseconds skipping minutes and seconds)                    |
| `2024/05/01`                         | Error (format error)                     | Date separator uses '/'                                |
| `24012`                              | Error (format error)                     | Invalid number of digits for date                                   |
| `2411 123`                           | Error (format error)                     | Invalid number of digits for both date and time parts                             |
| `2024-05-01 01:030:02`               | Error (format error)                     | Invalid number of digits for minutes                                   |
| `10000-01-01 00:00:00`               | Error (format error)                     | Invalid number of digits for year                                   |
| `2024-0131T12:00`                    | Error (format error)                     | Mixed use of separators in month concatenated format                               |
| `2024-05-01@00:00`                   | Error (format error)                     | Invalid separator                                    |
| `20120212051`                        | Error (format error)                     | Incorrect number of digits                                      |
| `2024-05-01T00:00XYZ`                | Generally: Error (format error)               | Unknown timezone abbreviation (see [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation)                         |
| `2024-5-1T24:00`                     | Error (domain error)                     | Hour 24 out of range                                  |
| `2024-02-30`                         | Error (domain error)                     | February 30 does not exist                               |
| `2024-05-01T12:60`                   | Error (domain error)                     | Minute 60 out of range                                  |
| `2012-06-30T23:59:60`                | Error (domain error)                     | Leap seconds not allowed                                     |
| `2024-05-01T00:00+14:30`             | Error (domain error)                     | Timezone offset exceeds maximum range                                |
| `2024-05-01T00:00+08:25`             | Error (domain error)                     | Timezone offset minute 25 is invalid                             |
| `9999-12-31 23:59:59.9999999`        | Error (domain error)                     | Carry from reducing decimal places causes result to exceed the domain upper limit                        |

### Non-strict Mode

#### BNF Definition

**In addition to the formats supported in strict mode**, the following are also supported:

```xml
<datetime> ::= <whitespace>* <date> (<delimiter> <time> <whitespace>* <timezone>?)? <whitespace>*

<date> ::= <year> <separator> <month> <separator> <day>
<time> ::= <hour> <separator> <minute> <separator> <second> [<fraction>]

<year> ::= <digit>{4} | <digit>{2}
<month> ::= <digit>{1,2}
<day> ::= <digit>{1,2}
<hour> ::= <digit>{1,2}
<minute> ::= <digit>{1,2}
<second> ::= <digit>{1,2}

<separator> ::= ^(<digit> | <alpha>)
<delimiter> ::= " " | "T" | ":"

<fraction> ::= "." <digit>*

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<offset>         ::= ( "+" | "-" ) <hour-offset> [ ":"? <minute-offset> ]
                   | <special-tz>
                   | <long-tz>

<hour-offset>    ::= <digit>{1,2}      ; 0–14
<minute-offset>  ::= <digit>{2}        ; 00/30/45

<special-tz>     ::= "CST" | "UTC" | "GMT" | "ZULU" | "Z"   ; case-insensitive
<long-tz>        ::= ( ^<whitespace> )+                     ; e.g. America/New_York

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\v" | "\f"

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<alpha>          ::= "A" | … | "Z" | "a" | … | "z"
```

:::caution Behavior Change
Since version 4.0, the \<year> part only supports 2 or 4-digit input. Support for dates or times without separators is more strict, only supporting the 14-digit consecutive integer format, which is supported in strict mode and inherited by non-strict mode.

In parsing each field, extra leading zeros that would exceed the length are no longer allowed. For example, `00012` is invalid for `<day> ::= <digit>{1,2}`.

When encountering unexpected spaces, parsing will fail just like with other unexpected characters, rather than filling the result with already parsed fields.
:::

#### Rule Description

Assume the target type for conversion is `DATETIME(<scale>)`, where `<scale>` has a value range of `[0, 6]`.

In non-strict mode, all formats supported in strict mode can be parsed, and in addition, parsing according to the above BNF definition is supported.

##### Overall Structure

* Date part is required; time part and timezone part are optional.

* The string can have any whitespace characters before and after; date and time are separated by a space or uppercase "T"; each input field can be separated by any symbol that is not a digit or letter; timezone is optional.

* Only ASCII characters are accepted. If non-ASCII characters appear in the input string, it will not satisfy the BNF definition above and will be considered a format error.

##### Date Part `<date>` and Time Part `<time>`

* `<separator>`: Any symbol that is not a digit or letter;

* `<year>`: 2 or 4 digits.

  * Two-digit years (00-99): < 70 → 2000+ two digits; ≥ 70 → 1900+ two digits.

  * Four-digit years are used directly.

* `<fraction>` (optional): Any number of digits after the decimal point.

* Other numeric fields: 1 or 2 digits.

##### Timezone Part `<timezone>` (same as strict mode)

* Any whitespace is allowed between the date and timezone

* Case-insensitive

* Three types are allowed:

  1. Numeric offset: `(+|-)HH[:MM]` or `(+|-)HHMM`

     * `<hour-offset>`: 0-14, leading 0 can be omitted for single-digit values.

     * `<minute-offset>`: 00, 30 or 45, the colon ":" can be omitted.

     * The maximum range for numeric offset is `[-14:00, +14:00]`.

  2. Special UTC identifiers: `Z`/`UTC`/`GMT`/`CST`/`ZULU`. The timezone offset represented by each symbol is:

     * `Z`: +00:00

     * `UTC`: +00:00

     * `GMT`: +00:00

     * `CST`: +08:00

     * `ZULU`: +00:00

  3. Long timezone name: Any valid timezone name in the IANA Timezone Database, such as `Europe/Paris`, `Etc/GMT+2`, etc. (case-insensitive).

     * For the availability of timezone names, see the [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation.

##### Whitespace

* `<whitespace>`：Any whitespace character, including space, tab, newline, etc.

##### Parsing Logic

For any input string that satisfies the above BNF definition, Doris will fill in the corresponding parts of the result Datetime. For example, the year part of the result is set to the matched `<year>` value, and the microsecond part of the result is set to the matched `<fraction>` value. Any parts that do not appear in the input are set to 0 in the result.

In particular, if the input date result is 0000-00-00, and the BE CONFIG `allow_zero_date` is `true`, it is not considered a domain error, and the result is set to 0000-01-01.

##### Carry

* If the number of decimal places in `<fraction>` exceeds `<scale>`, it will be rounded to `<scale>` decimal places. If this process produces a carry, the carry will occur normally and affect any part of the result.

* If the input contains an `<offset>` part, a carry may occur. The `<offset>` normally changes the time value, and if the hour or minute produces a carry, the carry will occur normally and affect the Date part of the result.

* Since the carries produced by `<offset>` and `<fraction>` do not conflict, they can occur simultaneously and affect the result together.

##### Error Handling

* **Format error**: If the input does not match any of the above BNF branches, the return value is NULL.

* **Domain error**: If any part has an invalid value (result is not a valid Gregorian calendar time), NULL is returned.

#### Examples

Assume the current Doris time zone is UTC+8 (`+08:00`). For the effect of time zones on time type parsing, see the [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation. Results are shown using DATETIME(6), which is a DATETIME type that accommodates 6 decimal places.

| String                                         | Cast as DATETIME(6) Result | Comment                                             |
| ------------------------------------------- | ---------------------- | --------------------------------------------------- |
| `  2023-7-4T9-5-3.1Z  `                     | `2023-07-04 17:05:03.100000`           | Leading and trailing spaces; date and time parts separated by `-`, with `T` separating the two parts, and the time zone is Z time zone (0 time zone).          |
| `99.12.31 23.59.59+05:30`                   | `2000-01-01 02:29:59.000000`           | date and time parts separated by `.`. timezone `+05:30` (minute `30` is valid); no "T"            |
| `2000/01/01T00/00/00-230`                   | `2000-01-01 10:30:00.000000`           | `/` separator; timezone without colon and with 1-digit hour `-230`                         |
| `85 1 1T0 0 0. cst`                         | `1985-01-01 00:00:00.000000`           | Space separates all fields; two-digit year maps to `1985`; zero digits after decimal point; short timezone name is case-insensitive              |
| `2024-02-29T23:59:59.999999 UTC`            | `2024-03-01 07:59:59.999999`           | Leap year is valid; high-precision decimal without carry; specific timezone name                                 |
| `70-01-01T00:00:00+14`                      | `1969-12-31 18:00:00.000000`           | Two-digit year `1970`; maximum valid offset `+14`; no minutes part                       |
| `0023-1-1T1:2:3. -00:00`                    | `0023-01-01 09:07:46.000000`           | Four-digit year `0023`; mixed one-digit/two-digit time fields; zero digits after decimal point; offset without sign for minutes                |
| `2025/06/15T00:00:00.0-0`                   | `2025-06-15 08:00:00.000000`           | `/` separator; 1 digit after decimal point; offset `-0` (equivalent to `-00:00`)                 |
| `2025/06/15T00:00:00.99999999999`           | `2025-06-15 00:00:01.000000`           | Any decimal place, carry forward to 6 decimal places                                            |
| `2024-02-29T23-59-60ZULU`                   | NULL (format error)             | Seconds out of range                                                 |
| `2024 12 31T121212.123456 America/New_York` | NULL (format error)             | Pure numeric time without separators                                           |
| `123.123`                                   | NULL (format error)             | Behavior Change: Previously represented 2012-03-12 03:00:00.000000. Now not supported. |
| `12121`                                     | NULL (format error)             | Behavior Change: Previously represented 2012-12-12 00:00:00.000000. Now not supported. |

## From Numeric

All numeric types can be converted to DATETIME type.

:::caution Behavior Change
Since version 4.0, DECIMAL types are converted according to their literal numeric representation. Boolean type conversion to time types is not supported. Parsing of the decimal part of numeric type inputs is supported.
:::

### Strict Mode

#### Rule Description

##### Valid Formats

For integer digits, numbers are filled from the lowest to the highest digit, from the rightmost end of the date to the left. The following are valid formats and their corresponding filling results (excluding the microseconds part):

```sql
3-digit number (abc) => 2000 Year 0a Month bc Day
4-digit number (abcd) => 2000 Year ab Month cd Day
5-digit number (abcde) => 200a Year bc Month de Day
6-digit number (abcdef, where ab >= 70) => 19ab Year cd Month ef Day
6-digit number (abcdef, where ab < 70) => 20ab Year cd Month ef Day
8-digit number (abcdefgh) => abcd Year ef Month gh Day
14-digit number (abcdefghijklmn) => abcd Year ef Month gh Day ij Hour kl Minute mn Second
```

For the decimal part, the number is filled from high to low, from the leftmost end of the date after the decimal point (hundred milliseconds place). If the decimal is an imprecise representation type (float, double), we will use the actual value it represents before the Cast.

##### Carry

If the number of decimal places exceeds `<scale>` places, it will be rounded to `<scale>` decimal places. If this process produces a carry, the carry will occur normally and affect any part of the result.

##### Error Handling

When the input cannot be parsed into a valid DATETIME value according to the rules, an error is reported.

#### Examples

Results are shown using DATETIME(3), which is a DATETIME type that accommodates 3 decimal places.

| Number                           | Cast as DATETIME(6) Result       | Comment           |
| ---------------------------- | ---------------------------- | ----------------- |
| `123.123`                    | `2000-01-23 00:00:00.123000` | 3-digit number + decimal        |
| `20150102030405`             | `2015-01-02 03:04:05.000000` | 14-digit number            |
| `20150102030405.123456`      | `2015-01-02 03:04:05.123456` | 14-digit number + decimal       |
| `20151231235959.99999999999` | `2016-01-01 00:00:00.000000` | 14-digit number，decimal valid，carry to year  |
| `1000`                       | Error                           | Day in 2000-10-00 is invalid |
| `-123.123`                   | Error                           | Negative time cannot produce a valid date      |

### Non-strict Mode

Except for error handling, the behavior in non-strict mode is entirely consistent with strict mode.

#### Rule Description

##### Valid Formats

For integer digits, numbers are filled from the lowest to the highest digit, from the rightmost end of the date to the left. The following are valid formats and their corresponding filling results (excluding the microseconds part):

```sql
3-digit number (abc) => 2000 Year 0a Month bc Day
4-digit number (abcd) => 2000 Year ab Month cd Day
5-digit number (abcde) => 200a Year bc Month de Day
6-digit number (abcdef, where ab >= 70) => 19ab Year cd Month ef Day
6-digit number (abcdef, where ab < 70) => 20ab Year cd Month ef Day
8-digit number (abcdefgh) => abcd Year ef Month gh Day
14-digit number (abcdefghijklmn) => abcd Year ef Month gh Day ij Hour kl Minute mn Second
```

For the decimal part, the number is filled from high to low, from the leftmost end of the date after the decimal point (hundred milliseconds place). If the decimal is an imprecise representation type (float, double), we will use the actual value it represents before the Cast.

##### Carry

If the number of decimal places exceeds `<scale>` places, it will be rounded to `<scale>` decimal places. If this process produces a carry, the carry will occur normally and affect any part of the result.

##### Error Handling

When the input cannot be parsed into a valid DATETIME value according to the rules, NULL is returned.

#### Examples

Results are shown using DATETIME(6), which is a DATETIME type that accommodates 6 decimal places.

| Number                           | Cast as DATETIME(6) Result       | Comment           |
| ---------------------------- | ---------------------------- | ----------------- |
| `123.123`                    | `2000-01-23 00:00:00.123000` | 3-digit number + decimal        |
| `20150102030405`             | `2015-01-02 03:04:05.000000` | 14-digit number            |
| `20150102030405.123456`      | `2015-01-02 03:04:05.123456` | 14-digit number + decimal       |
| `20151231235959.99999999999` | `2016-01-01 00:00:00.000000` | 14-digit number，decimal valid，carry to year  |
| `1000`                       | NULL                         | Day in 2000-10-00 is invalid |
| `-123.123`                   | NULL                         | Negative time cannot produce a valid date      |

## From Datelike Types

Date and Time types can be converted to Datetime type. Since Datetime has different precision values, there are also conversions between Datetime types of different precisions.

### Date

#### Rule Description

When converting from Date, the result is the input date part plus a time part that is all 0. This conversion is always valid.

#### Examples

| Input DATE    | Target Type        | Cast as Datetime Result        |
| ---------- | ----------- | -------------------------- |
| 2012-02-05 | Datetime(0) | 2012-02-05 00:00:00        |
| 2012-02-05 | Datetime(6) | 2012-02-05 00:00:00.000000 |

### Time

#### Rule Description

When converting from Time, the result is the addition of the current date's 00:00:00 time and the Time input. Since this conversion is valid in the foreseeable future (before December 9999), Doris considers it always valid.

#### Examples

Assume the current date is 2025-04-29, then:

| Input TIME     | Cast as DATETIME(0) Result |
| ----------- | ---------------------- |
| `500:00:00` | `2025-05-19 20:00:00`  |
| `23:59:59`  | `2025-04-29 23:59:59`  |

### Datetime

#### Strict Mode

##### Rule Description

When converting from lower precision to higher precision, the newly appearing decimal places are filled with 0, and this conversion is always valid.

When converting from higher precision to lower precision, there will be a carry forward, which can continue to propagate forward. If an overflow occurs, the converted value is invalid.

##### Error Handling

If an overflow occurs, an error is reported.

##### Examples

Assume the current date is 2025-04-29, then:

| Input DATETIME                  | Source Type         | Target Type        | Result DATETIME                  | Comment              |
| ---------------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `2020-12-12 00:00:00.123`    | Datetime(3) | Datetime(6) | `2020-12-12 00:00:00.123000` | Increase precision                 |
| `2020-12-12 00:00:00.123456` | Datetime(6) | Datetime(3) | `2020-12-12 00:00:00.123`    | Decrease precision, no carry             |
| `2020-12-12 00:00:00.99666`  | Datetime(6) | Datetime(2) | `2020-12-12 00:00:01.00`     | Decrease precision, carry to second            |
| `9999-12-31 23:59:59.999999` | Datetime(6) | Datetime(5) | Error                           | Carry overflow, produces an invalid date of year 10000 |

#### Non-Strict Mode

Except for error handling, the behavior of non-strict mode is exactly the same as strict mode.

##### Rule Description

When converting from lower precision to higher precision, the newly appearing decimal places are filled with 0, and this conversion is always valid.

When converting from higher precision to lower precision, there will be a carry forward, which can continue to propagate forward. If an overflow occurs, the converted value is invalid.

##### Error Handling

If an overflow occurs, NULL is returned.

##### Examples

Assume the current date is 2025-04-29, then:

| Input DATETIME                  | Source Type         | Target Type        | Result DATETIME                  | Comment              |
| ---------------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `2020-12-12 00:00:00.123`    | Datetime(3) | Datetime(6) | `2020-12-12 00:00:00.123000` | Increase precision                 |
| `2020-12-12 00:00:00.123456` | Datetime(6) | Datetime(3) | `2020-12-12 00:00:00.123`    | Decrease precision, no carry             |
| `2020-12-12 00:00:00.99666`  | Datetime(6) | Datetime(2) | `2020-12-12 00:00:01.00`     | Decrease precision, carry to second            |
| `9999-12-31 23:59:59.999999` | Datetime(6) | Datetime(5) | NULL                         | Carry overflow, produces an invalid date of year 10000 |
