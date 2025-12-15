---
{
    "title": "Cast to TIMESTAMPTZ Type",
    "language": "en"
}
---

The rules for converting string and numeric types to TIMESTAMPTZ type are almost exactly the same as converting to DATETIME type. The difference is that when converting to TIMESTAMPTZ, the converted DATETIME value is ultimately converted to UTC time, which may result in cases where the DATETIME value is valid but the value after conversion to UTC time is invalid. For example:
```sql
set time_zone="+08:00";

select cast("0000-01-01 00:00:00+08:00" as datetimev2);
+-------------------------------------------------+
| cast("0000-01-01 00:00:00+08:00" as datetimev2) |
+-------------------------------------------------+
| 0000-01-01 00:00:00                             |
+-------------------------------------------------+
1 row in set (0.00 sec)

select cast("0000-01-01 00:00:00+08:00" as timestamptz);
+--------------------------------------------------+
| cast("0000-01-01 00:00:00+08:00" as timestamptz) |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
1 row in set (0.04 sec)
```
The string `0000-01-01 00:00:00+08:00` is a valid DATETIME value, but after conversion to UTC time it exceeds the valid range, resulting in `NULL`.

For detailed conversion rules, refer to the [Convert to DATETIME Type](./datetime-conversion.md) documentation.


## From Datelike Types

Supports conversion from Datetime type to Timestamptz type. During conversion, the DATETIME is converted to UTC time based on the current session's time zone. There may be cases where the DATETIME value is valid but the value after conversion to UTC time is invalid.

Since Timestamptz has different precision values, there are also conversions between different precision Timestamptz types.


### Timestamptz

#### Strict Mode

##### Rule Description

When converting from low precision to high precision, newly appeared decimal places are padded with 0, and this conversion is always valid.

When converting from high precision to low precision, rounding will occur, and the carry can continue to propagate forward. If overflow occurs, the converted value is invalid.

##### Error Handling

If overflow occurs, an error is reported.

##### Examples

| Input TIMESTAMPTZ                  | Source Type         | Target Type        | Result TIMESTAMPTZ                  | Comment              |
| ---------------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `2020-12-12 00:00:00.123+08:00`    | Timestamptz(3) | Timestamptz(6) | `2020-12-12 00:00:00.123000+08:00` | Expand precision                 |
| `2020-12-12 00:00:00.123456+08:00` | Timestamptz(6) | Timestamptz(3) | `2020-12-12 00:00:00.123+08:00`    | Reduce precision, no carry             |
| `2020-12-12 00:00:00.996666+08:00`  | Timestamptz(6) | Timestamptz(2) | `2020-12-12 00:00:01.00+08:00`     | Reduce precision, carry to seconds            |
| `9999-12-31 23:59:59.999999+08:00` | Timestamptz(6) | Timestamptz(5) | Error                           | Carry overflow, produces invalid date of year 10000 |

#### Non-strict Mode

Except for error handling, the behavior of non-strict mode is exactly the same as strict mode.

##### Rule Description

When converting from low precision to high precision, newly appeared decimal places are padded with 0, and this conversion is always valid.

When converting from high precision to low precision, rounding will occur, and the carry can continue to propagate forward. If overflow occurs, the converted value is invalid.

##### Error Handling

If overflow occurs, the return value is NULL.

##### Examples

| Input TIMESTAMPTZ                  | Source Type         | Target Type        | Result TIMESTAMPTZ                  | Comment              |
| ---------------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `2020-12-12 00:00:00.123+08:00`    | Timestamptz(3) | Timestamptz(6) | `2020-12-12 00:00:00.123000+08:00` | Expand precision                 |
| `2020-12-12 00:00:00.123456+08:00` | Timestamptz(6) | Timestamptz(3) | `2020-12-12 00:00:00.123+08:00`    | Reduce precision, no carry             |
| `2020-12-12 00:00:00.99666+08:00`  | Timestamptz(6) | Timestamptz(2) | `2020-12-12 00:00:01.00+08:00`     | Reduce precision, carry to seconds            |
| `9999-12-31 23:59:59.999999+08:00` | Timestamptz(6) | Timestamptz(5) | NULL                         | Carry overflow, produces invalid date of year 10000 |

### Datetime

#### Strict Mode

##### Rule Description

When converting from low precision to high precision, newly appeared decimal places are padded with 0, and this conversion is always valid.

When converting from high precision to low precision, rounding will occur, and the carry can continue to propagate forward. If overflow occurs, the converted value is invalid.

##### Error Handling

If overflow occurs, an error is reported.

##### Examples


| Input DATETIME                  | Source Type         | Target Type        | Result TIMESTAMPTZ                  | Comment              |
| ---------------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `2020-12-12 00:00:00.123`    | Datetime(3) | Timestamptz(6) | `2020-12-12 00:00:00.123000+08:00` | Expand precision                 |
| `2020-12-12 00:00:00.123456` | Datetime(6) | Timestamptz(3) | `2020-12-12 00:00:00.123+08:00`    | Reduce precision, no carry             |
| `2020-12-12 00:00:00.99666`  | Datetime(6) | Timestamptz(2) | `2020-12-12 00:00:01.00+08:00`     | Reduce precision, carry to seconds            |
| `9999-12-31 23:59:59.999999` | Datetime(6) | Timestamptz(5) | Error                           | Carry overflow, produces invalid date of year 10000 |

#### Non-strict Mode

Except for error handling, the behavior of non-strict mode is exactly the same as strict mode.

##### Rule Description

When converting from low precision to high precision, newly appeared decimal places are padded with 0, and this conversion is always valid.

When converting from high precision to low precision, rounding will occur, and the carry can continue to propagate forward. If overflow occurs, the converted value is invalid.

##### Error Handling

If overflow occurs, the return value is NULL.

##### Examples

| Input DATETIME                  | Source Type         | Target Type        | Result TIMESTAMPTZ                  | Comment              |
| ---------------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `2020-12-12 00:00:00.123`    | Datetime(3) | Timestamptz(6) | `2020-12-12 00:00:00.123000+08:00` | Expand precision                 |
| `2020-12-12 00:00:00.123456` | Datetime(6) | Timestamptz(3) | `2020-12-12 00:00:00.123+08:00`    | Reduce precision, no carry             |
| `2020-12-12 00:00:00.99666`  | Datetime(6) | Timestamptz(2) | `2020-12-12 00:00:01.00+08:00`     | Reduce precision, carry to seconds            |
| `9999-12-31 23:59:59.999999` | Datetime(6) | Timestamptz(5) | NULL                           | Carry overflow, produces invalid date of year 10000 |
