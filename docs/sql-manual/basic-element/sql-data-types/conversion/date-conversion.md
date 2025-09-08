---
{
    "title": "Cast to DATE",
    "language": "en"
}
---

Valid range for DATE type: `[0000-01-01, 9999-12-31]`

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

* Only '-' is supported as a separator.

* `<year>`, `<month>`, and `<day>` support different lengths in the separated format; in the concatenated format, `<year>` supports 2 or 4 digits, and others are fixed at 2 digits.

##### Time Part `<time>`

* Two formats are allowed:

  * With separator: `HH[:MM[:SS[.fraction]]]`, etc.

  * Concatenated: `HH[MM[SS[.fraction]]]`, etc.

* `<hour>`: 0–23.

* `<minute>`: 0–59.

* `<second>`: 0–59.

* `<fraction>`: any number of digits after the decimal point, representing the fractional part of seconds. The highest digit corresponds to 0.1 second (hundred milliseconds).

* `<hour>`, `<minute>`, and `<second>` allow 1-2 digits in separated format; in concatenated format, the length is fixed at 2 digits.

* Only a few consecutive fields from the left can appear, omitting the rest; for example, `<hour>` + `<minute>` is valid, but `<hour>` + `<fraction>` is not.

##### Continuous Digit Format `<digit>{14}`

* Interpreted as 4 digits-2 digits-2 digits-2 digits-2 digits-2 digits for year, month, day, hour, minute, second.

* Then, parse any possible decimal and timezone parts according to the rules.

##### Timezone Part `<offset>`

* Any whitespace characters are allowed between the date and the timezone

* Case-insensitive

* Three types are allowed:

  1. Numeric offset: `(+|-)HH[:MM]` or `(+|-)HHMM`, etc.

     * `<hour-offset>`: 0–14, leading 0 can be omitted for single-digit values.

     * `<minute-offset>`：00, 30 or 45, the ":" can be omitted.

     * The maximum range of numeric offset is `[-14:00, +14:00]`.

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

For input strings where all input fields of `<datetime>` are valid, Doris only reads the `<date>` part and uses its result as the target value after conversion. The input is assigned to the corresponding parts of the result according to the fields, for example, the matching result of `<year>` sets the year part of the result, and the matching result of `<month>` sets the month part of the result, and the matching result of `<day>` sets the day part of the result.

Specifically, if the input date result is 0000 year 00 month 00 day, and if BE CONFIG `allow_zero_date` is `true`, it is not considered a domain error, and the result produced is 0000 year 01 month 01 day.

##### Carry

No carry occurs.

##### Error Handling

* **Format error**: If the input does not match any of the above BNF branches, an error is reported immediately.

* **Domain error**: If the `<date>` part is invalid (i.e., does not result in a valid Gregorian calendar date), an error is reported.

#### Examples

Assume the current Doris time zone is UTC+8 (`+08:00`). For the effect of time zones on time type parsing, see the [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation.

| String                                  | Cast as DATE Result | Comment                       |
| ------------------------------------ | --------------- | ----------------------------- |
| `2023-07-16T19:20:30.123+08:00`      | `2023-07-16`    | Date with separator + 'T' + seconds and milliseconds + numeric offset   |
| `2023-07-16T19+08:00`                | `2023-07-16`    | Concatenated time format, omitting minutes and seconds. Result unchanged when converted to UTC+8.       |
| `2023-07-16T1920+08:00`              | `2023-07-16`    | Concatenated time format, omitting seconds. Result unchanged when converted to UTC+8.        |
| `70-1-1T00:00:00-0000`               | `1970-01-01`    | Two-digit year + single/double digit month/day + separator + concatenated offset     |
| `19991231T235960.5UTC`               | `1999-12-31`    | Concatenated date + 'T' + concatenated time + fraction + UTC   |
| `2024-02-29 12:00:00 Europe/Paris`   | `2024-02-29`    | Valid leap year date + space + complete time + space + timezone name |
| `2024-05-01T00:00Asia/Shanghai`      | `2024-05-01`    | Incomplete time + timezone name                   |
| `20231005T081530Europe/London`       | `2023-10-05`    | Concatenated date + timezone name                    |
| `85-12-25T0000gMt`                   | `1985-12-25`    | Mixed case timezone                       |
| `2024-05-01`                         | `2024-05-01`    | Date only                           |
| `24-5-1`                             | `2024-05-01`    | 2-digit year + 1-digit month + 1-digit day               |
| `2024-05-01 0:1:2.333`               | `2024-05-01`    | Concatenated date + 'T' + single-digit hour/minute/second + milliseconds       |
| `2024-05-01 0:1:2.`                  | `2024-05-01`    | Concatenated date + 'T' + single-digit hour/minute/second + standalone decimal point   |
| `20240501 01`                        | `2024-05-01`    | Concatenated date + ' ' + omitted minutes and seconds             |
| `20230716 1920Z`                     | `2023-07-16`    | Concatenated date + space + concatenated hour/minute + UTC 'Z'    |
| `20240501T0000`                      | `2024-05-01`    | Concatenated date + 'T' + concatenated time omitting seconds          |
| `2024-12-31 23:59:59.9999999`        | `2024-12-31`    | Date with separator + space + time with milliseconds, time part is ignored   |
| `2025/06/15T00:00:00.99999999999999` | `2025-06-15`    | Any number of decimal places allowed                       |
| `2020-12-12 13:12:12-03:00`          | `2020-12-12`    | No carry                           |
| `0023-01-01T00:00Z`                  | `0023-01-01`    | Valid four-digit year                         |
| `69-12-31`                           | `1969-12-31`    | Two-digit year 69 → 1969-12-31           |
| `70-01-01`                           | `1970-01-01`    | Two-digit year 70 → 1970-01-01           |
| `230102`                             | `2023-01-02`    | Concatenated DATE format with short year                |
| `19230101`                           | `1923-01-01`    | Concatenated DATE format with long year                |
| `120102030405`                       | Error (format error)        | Missing DATE - TIME separator            |
| `20120102030405.123   +08`           | `2012-01-02`    | 14-digit concatenated date + decimal + short timezone offset  |
| `120102030405.999`                   | Error (format error)        | Missing DATE - TIME separator            |
| `2020-05-05 12:30:60`                | `2020-05-05`    | Invalid seconds, but not part of DATE interpretation          |
| `2023-07-16T19.123+08:00`            | Error (format error)        | Date contains non-contiguous fields (hour + milliseconds skip minute, second)        |
| `2024/05/01`                         | Error (format error)        | Date separator uses '/'                    |
| `24012`                              | Error (format error)        | Invalid date digit count                       |
| `2411 123`                           | Error (format error)        | Invalid digit count for both date and time parts                 |
| `2024-05-01 01:030:02`               | Error (format error)        | Invalid minute digit count                       |
| `10000-01-01 00:00:00`               | Error (format error)        | Invalid year digit count                       |
| `2024-0131T12:00`                    | Error (format error)        | Mixed separators in concatenated month format                   |
| `2024-05-01@00:00`                   | Error (format error)        | Incorrect separator                        |
| `20120212051`                        | Error (format error)        | Digit count error                          |
| `2024-05-01T00:00XYZ`                | Generally: Error (format error)  | Unknown timezone abbreviation (see [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation)             |
| `2024-5-1T24:00`                     | Error (domain error)        | Hour 24 out of range                      |
| `2024-02-30`                         | Error (domain error)        | February 30 does not exist                   |
| `2024-05-01T12:60`                   | Error (domain error)        | Minute 60 out of range                      |
| `2012-06-30T23:59:60`                | Error (domain error)        | Leap seconds not allowed                         |
| `2024-05-01T00:00+14:30`             | Error (domain error)        | Timezone offset exceeds maximum range                    |
| `2024-05-01T00:00+08:25`             | Error (domain error)        | Timezone offset minute 25 is invalid                 |

### Non-strict Mode

#### BNF definition

**In addition to the formats supported in strict mode, the following are also supported:**

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

<separator> ::= any symbol except digits or letters
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
Since version 4.0, the \<year> part only supports 2 or 4 digit numeric input. For date or time input without separators, stricter rules apply: only the 14-digit continuous integer format is supported—this is enforced in strict mode and inherited by non-strict mode.

Parsing of each field no longer allows exceeding the length due to extra leading zeros. For example, `00012` for `<day> ::= <digit>{1,2}` is invalid.

If an unexpected whitespace is encountered, parsing will fail just as it would with any other unexpected character, rather than using already parsed fields to fill the result.
:::

#### Rule Description

In non-strict mode, all formats supported in strict mode can be parsed, and in addition, parsing according to the above BNF definition is supported.

##### Overall Structure

* The date part is required; the time part and the time zone part are optional.

* Any ASCII whitespace characters may appear at the beginning or end of the string; date and time are separated by a space or uppercase 'T'; any symbol other than digits and letters can be used as a separator between input fields; timezone is optional.

* Only ASCII characters are accepted. If non-ASCII characters appear in the input string, it will not satisfy the BNF definition above and will be considered a format error.

##### Date part `<date>` and time part `<time>`

* `<separator>`: any symbol except digits and letters;

* `<year>`: 2 or 4 digits.

  * Two-digit years (00-99): < 70 → 2000+ two digits; ≥ 70 → 1900+ two digits.

  * Four-digit years are used directly.

* `<fraction>` (optional): any number of digits after the decimal point.

* Other numeric fields: 1 or 2 digits.

##### Timezone part `<timezone>` (same as strict mode)

* Any whitespace characters are allowed between the date and the time zone.

* Case is not distinguished.

* Three types are allowed:

  1. Numeric offset: `(+|-)HH[:MM]` or `(+|-)HHMM`

     * `<hour-offset>`: 0–14, leading 0 can be omitted for single-digit values.

     * `<minute-offset>`：00, 30 or 45, the ":" can be omitted.

     * The maximum range of numeric offset is `[-14:00, +14:00]`.

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

For any input string that satisfies the above BNF definition, Doris will fill in the corresponding parts of the result Date. For example, the year part of the result is set to the matched `<year>` value, and the microsecond part of the result is set to the matched `<fraction>` value. Any parts that do not appear in the input are set to 0 in the result.

##### Carry

:::caution Behavior Change
Since version 4.0, when parsing DATE type, the part other than \<date> does not produce any carry or numeric impact.
:::

No carry occurs.

##### Error Handling

* **Format error**: If the input does not match any of the above BNF branches, the return value is NULL.

* **Domain error**: If the `<date>` part is invalid (i.e., does not result in a valid Gregorian calendar date), the return value is NULL.

:::caution Behavior Change
Since version 4.0, when parsing DATE type, if parts other than \<date> have domain errors, they do not affect the result.
:::

#### Examples

Assume the current Doris time zone is UTC+8 (`+08:00`). For the effect of time zones on time type parsing, see the [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation.

| String                                         | Cast as DATE Result | Comment                                    |
| ------------------------------------------- | --------------- | ------------------------------------------ |
| `2023-7-4T9-5-3.1Z`                         | `2023-07-04`    | Leading and trailing whitespace; date `2023-7-4` (`-` separator, supports single-digit month/day); time and timezone are valid |
| `99.12.31 23.59.59+05:30`                   | `1999-12-31`    | `.` separates date and time; timezone `+05:30` (minute `30` is valid); no 'T'   |
| `2000/01/01T00/00/00-230`                   | `2000-01-01`    | `/` separator; timezone without colon and single-digit hour `-230'                |
| `85 1 1T0 0 0. CST`                         | `1985-01-01`    | All fields separated by spaces; two-digit year maps to `1985`; zero digits after decimal point; short timezone name is case-insensitive     |
| `2024-02-29T23:59:59.999999 UTC`            | `2024-02-29`    | Valid leap year; high-precision decimal does not carry; specific timezone name                        |
| `70-01-01T00:00:00+14`                      | `1970-01-01`    | Two-digit year `1970`; maximum legal offset `+14`; no minute part              |
| `0023-1-1T1:2:3. -00:00`                    | `0023-01-01`    | Four-digit year `0023`; mixed one/two-digit time fields; zero digits after decimal; offset with no sign for minutes       |
| `2025/06/15T00:00:00.0-0`                   | `2025-06-15`    | `/` separator; one digit after decimal; offset `-0` (equivalent to `-00:00`)        |
| `2025/06/15T00:00:00.99999999999`           | `2025-06-15`    | Any number of decimal places, ignored                                   |
| `2024-02-29T23-59-60ZULU`                   | NULL (format error)      | Second out of range                                        |
| `2024 12 31T121212.123456 America/New_York` | NULL (format error)      | Pure numeric time without separator                                  |
| `123.123`                                   | NULL (format error)      | Behavior change: previously represented 2012-03-12. Now not supported.        |
| `12121`                                     | NULL (format error)      | Behavior change: previously represented 2012-12-12. Now not supported.        |

## From Numeric

Supports conversion from all numeric types to DATE type.

:::caution Behavior Change
Since 4.0, DECIMAL type is converted according to its literal numeric value. Conversion from Boolean to time types is not supported. Parsing of fractional parts in numeric input is supported.
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
14-digit number (abcdefghijklmn) => abcd Year ef Month gh Day
```

##### Error Handling

If the input cannot produce a valid DATE value after parsing according to the rules, an error is reported.

#### Examples

| Number                        | Cast as DATE Result | Comment           |
| ---------------------------- | --------------- | ----------------- |
| `123.123`                    | `2000-01-23`    | 3-digit number      |
| `20150102030405`             | `2015-01-02`    | 14-digit number     |
| `20150102030405.123456`      | `2015-01-02`    | 14-digit number, valid decimal |
| `20151231235959.99999999999` | `2015-12-31`    | 14-digit number, valid decimal |
| `1000`                       | Error            | Invalid day in 2000-10-00 |
| `-123.123`                   | Error            | Negative time cannot produce a valid date |

### Non-strict Mode

Except for error handling, the behavior of non-strict mode is exactly the same as strict mode.

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
14-digit number (abcdefghijklmn) => abcd Year ef Month gh Day
```

##### Error Handling

If the input cannot produce a valid DATE value after parsing according to the rules, NULL is returned.

#### Examples

| Number                        | Cast as DATE Result | Comment           |
| ---------------------------- | --------------- | ----------------- |
| `123.123`                    | `2000-01-23`    | 3-digit number      |
| `20150102030405`             | `2015-01-02`    | 14-digit number     |
| `20150102030405.123456`      | `2015-01-02`    | 14-digit number, valid decimal |
| `20151231235959.99999999999` | `2015-12-31`    | 14-digit number, valid decimal |
| `1000`                       | NULL            | Invalid day in 2000-10-00 |
| `-123.123`                   | NULL            | Negative time cannot produce a valid date |

## From Datelike Types

Supports conversion from Datetime and Time types to Date type.

### Datetime

#### Rule Description

When converting from Datetime, the result is the date part of the input. This conversion is always valid.

#### Examples

| Input Datetime                 | Cast as Date Result |
| ---------------------------- | --------------- |
| `2012-02-05 12:35:24.123456` | `2012-02-05`    |

### Time

#### Rule Description

When converting from Time, the result is the sum of the current date and the Time input. Since this conversion is valid in the foreseeable future (before December 9999), Doris considers it always valid.

#### Examples

Assume the current date is 2025-04-29, then:

| Input Time     | Cast as Date Result |
| ------------ | --------------- |
| `500:00:00`  | `2025-05-19`    |
| `23:59:59`   | `2025-04-29`    |
| `-128:00:00` | `2025-04-23`    |
