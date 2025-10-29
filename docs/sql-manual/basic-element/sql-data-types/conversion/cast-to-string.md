---
{
    "title": "Cast to String (Output)",
    "language": "en"
}
---

## Boolean

If the value is true, returns 1. Otherwise returns 0.

```sql
mysql> select cast(true as string) , cast(false as string);
+----------------------+-----------------------+
| cast(true as string) | cast(false as string) |
+----------------------+-----------------------+
| 1                    | 0                     |
+----------------------+-----------------------+
```

## Integer

Converts according to the decimal format of the numeric value, without prefix 0. Non-negative numbers have no '+' prefix, negative numbers have '-' prefix.

Example:

```sql
select cast(cast("123" as int) as string) as str_value;
+-----------+
| str_value |
+-----------+
| 123       |
+-----------+

select cast(cast("-2147483648" as int) as string) as str_value;
+-------------+
| str_value   |
+-------------+
| -2147483648 |
+-------------+
```

## Float

Detailed rules for converting float values to strings:

1. **Special Value Handling**:

   * `NaN` (Not a Number) is converted to the string "NaN"

   * `Infinity` is converted to the string "Infinity"

   * `-Infinity` is converted to the string "-Infinity"

2. **Sign Handling**:

   * Negative numbers have a '-' prefix

   * Positive numbers have no sign prefix

   * Special handling for zero values:

     * `-0.0` is converted to "-0"

     * `+0.0` is converted to "0"

3. **Format Rules**:

   * Uses C printf 'g' format specifier semantics (refer to https://en.cppreference.com/w/c/io/fprintf) to convert floating-point numbers to decimal or scientific notation, depending on the value and the number of significant digits. The number of significant digits is set to 7. If the exponent X of the 'e' style conversion result is:

   * If 7 > X >= -4, then the result uses decimal notation

   * Otherwise, uses scientific notation with a maximum of 6 significant digits after the decimal point

   * Removes trailing zeros after the decimal point

   * If there are no digits after the decimal point, removes the decimal point

Example:

| float          | string          | comment                                        |
| -------------- | --------------- | ---------------------------------------------- |
| 123.456        | "123.456"       |                                                |
| 1234567        | "1234567"       |                                                |
| 123456.12345   | "123456.1"      | e < 7, uses scientific notation, 7 significant digits  |
| 12345678.12345 | "1.234568e+07"  | e >= 7, uses scientific notation, 7 significant digits |
| 0.0001234567   | "0.0001234567"  | e >= -4, does not use scientific notation      |
| -0.0001234567  | "-0.0001234567" | e >= -4, does not use scientific notation      |
| 0.00001234567  | "1.234567e-05"  | e < -4, uses scientific notation               |
| 123.456000     | "123.456"       | Remove trailing zeros                          |
| 123.000        | "123"           | Remove decimal point                           |
| 0.0            | "0"             |                                                |
| -0.0           | "-0"            | Negative zero                                  |
| NaN            | "NaN"           |                                                |
| Infinity       | "Infinity"      |                                                |
| -Infinity      | "-Infinity"     |                                                |

## Double

Detailed rules for converting double values to strings:

1. **Special Value Handling**:

   * `NaN` (Not a Number) is converted to the string "NaN"

   * `Infinity` is converted to the string "Infinity"

   * `-Infinity` is converted to the string "-Infinity"

2. **Sign Handling**:

   * Negative numbers have a '-' prefix

   * Positive numbers have no sign prefix

   * Special handling for zero values:

     * `-0.0` is converted to "-0"

     * `+0.0` is converted to "0"

3. **Format Rules**:

   * Uses C printf 'g' format specifier semantics (refer to https://en.cppreference.com/w/c/io/fprintf) to convert floating-point numbers to decimal or scientific notation, depending on the value and the number of significant digits. The number of significant digits is set to 16. If the exponent X of the 'e' style conversion result is:

   * If 16 > X >= -4, then the result uses decimal notation

   * Otherwise, uses scientific notation with a maximum of 15 significant digits after the decimal point

   * Removes trailing zeros after the decimal point

   * If there are no digits after the decimal point, removes the decimal point

Example:

| double                           | string                  | comment                                               |
| -------------------------------- | ----------------------- | ----------------------------------------------------- |
| 1234567890123456.12345           | "1234567890123456"      | e < 16, does not use scientific notation; 16 significant digits  |
| 12345678901234567.12345          | "1.234567890123457e+16" | e >= 16, uses scientific notation; 16 significant digits       |
| 0.0001234567890123456789         | "0.0001234567890123457" | e >= -4, does not use scientific notation; 16 significant digits |
| 0.000000000000001234567890123456 | "1.234567890123456e-15" | e < -4, uses scientific notation; 16 significant digits        |
| 123.456000                       | "123.456"               | Remove trailing zeros                                 |
| 123.000                          | "123"                   | Remove trailing decimal point                         |
| 0.0                              | "0"                     |                                                       |
| -0.0                             | "-0"                    | Negative zero                                         |
| NaN                              | "NaN"                   |                                                       |
| Infinity                         | "Infinity"              |                                                       |
| -Infinity                        | "-Infinity"             |                                                       |

## Decimal

Converts according to the decimal format of the numeric value. Non-negative numbers have no '+' prefix, negative numbers have '-' prefix, without prefix 0.

For Decimal(P\[,S]) type, when outputting, always displays S digits after the decimal point. If the number of decimal places is less than S, it is padded with zeros. For example, the number 123.456 of type Decimal(18, 6) is converted to 123.456000.

Example:

```sql
select cast(cast("123.456" as decimal(18, 6)) as string) as str_value;
+------------+
| str_value  |
+------------+
| 123.456000 |
+------------+

select cast(cast("-2147483648" as decimalv3(12, 2)) as string) as str_value;
+----------------+
| str_value      |
+----------------+
| -2147483648.00 |
+----------------+
```

## Date

Date type output format is "yyyy-MM-dd", which is 4-digit year, 2-digit month, 2-digit day, separated by "-".

Example:

```sql
select cast(date('20210304') as string);
+----------------------------------+
| cast(date('20210304') as string) |
+----------------------------------+
| 2021-03-04                       |
+----------------------------------+
```

## Datetime

Datetime type output format is "yyyy-MM-dd HH:mm:ss\[.SSSSSS]". If the type's `Scale` is not 0, then outputs the decimal point and `Scale` digits of fractional seconds. Example:

```sql
select cast(cast('20210304' as datetime) as string);
+----------------------------------------------+
| cast(cast('20210304' as datetime) as string) |
+----------------------------------------------+
| 2021-03-04 00:00:00                          |
+----------------------------------------------+

select cast(cast('20020304121212.123' as datetime(3)) as string);
+-----------------------------------------------------------+
| cast(cast('20020304121212.123' as datetime(3)) as string) |
+-----------------------------------------------------------+
| 2002-03-04 12:12:12.123                                   |
+-----------------------------------------------------------+
```

## Time

Time type is output in "hour:minute:second" format. The hour can be at most 3 digits, at least 2 digits, and can be negative; minutes and seconds are always 2 digits. If the type's `Scale` is not 0, then outputs the decimal point and `Scale` digits of fractional seconds.

Example:

```sql
select cast(cast('0' as time) as string);
+-----------------------------------+
| cast(cast('0' as time) as string) |
+-----------------------------------+
| 00:00:00                          |
+-----------------------------------+

select cast(cast('2001314' as time(3)) as string);
+--------------------------------------------+
| cast(cast('2001314' as time(3)) as string) |
+--------------------------------------------+
| 200:13:14.000                              |
+--------------------------------------------+

select cast(cast('-2001314.123' as time(3)) as string);
+-------------------------------------------------+
| cast(cast('-2001314.123' as time(3)) as string) |
+-------------------------------------------------+
| -200:13:14.123                                  |
+-------------------------------------------------+
```

## Array

1. The string representation of an array starts with a left square bracket `[` and ends with a right square bracket `]`.

2. An empty array is represented as `[]`.

3. Array elements in the string are separated by a comma followed by a space `", "`.

4. If an element in the array is of string type, its string representation is surrounded by single quotes `'`.

5. Non-string type elements are directly converted to their own string representation without adding extra quotes.

6. If an array element is `NULL`, it is represented as the string `null`.

```sql
mysql> select cast(array(1,2,3,4) as string);
+--------------------------------+
| cast(array(1,2,3,4) as string) |
+--------------------------------+
| [1, 2, 3, 4]                   |
+--------------------------------+
```

## Map

1. The string representation of a Map starts with a left curly brace `{` and ends with a right curly brace `}`.

2. If the Map is empty, its string representation is `{}`.

3. Key-value pairs in the Map are separated by a comma followed by a space `", "` in the string.

4. Key representation:

   * If the key is of string type, its string representation is surrounded by double quotes `"`.

   * If the key is `NULL`, it is represented as the string `null`.

   * For non-string type keys, they are directly converted to their own string representation without adding extra quotes.

5. Value representation:

   * If the value is of string type, its string representation is surrounded by double quotes `"`.

   * If the value is `NULL`, it is represented as the string `null`.

   * For non-string type values, they are directly converted to their own string representation without adding extra quotes.

6. Key-value pair structure: Each key-value pair is represented in the form `key:value`, with the key and value separated by a colon `:`.

```sql
mysql> select cast(map("abc",123,"def",456) as string);
+------------------------------------------+
| cast(map("abc",123,"def",456) as string) |
+------------------------------------------+
| {"abc":123, "def":456}                   |
+------------------------------------------+
```

## Struct

1. The string representation of a Struct starts with a left curly brace `{` and ends with a right curly brace `}`.

2. If the Struct is empty, its string representation is `{}`.

3. The string representation of a Struct only displays values, not field names.

4. Value representation:

   * If the value is of string type, its string representation is surrounded by double quotes `"`.

   * If the value is `NULL`, it is represented as the string `null`.

   * For non-string type values, they are directly converted to their own string representation without adding extra quotes.

5. Each value is separated by a comma followed by a space `", "`.

```sql
mysql> select struct(123,"abc",3.14);
+-----------------------------------------+
| struct(123,"abc",3.14)                  |
+-----------------------------------------+
| {"col1":123, "col2":"abc", "col3":3.14} |
+-----------------------------------------+
1 row in set (0.03 sec)

mysql> select cast(struct(123,"abc",3.14) as string);
+----------------------------------------+
| cast(struct(123,"abc",3.14) as string) |
+----------------------------------------+
| {123, "abc", 3.14}                     |
+----------------------------------------+
```

## IPv6

The output format of IPv6 type is the standard IPv6 colon-hexadecimal notation:

1. Find the longest consecutive zero segment and compress it with `::`.
2. Non-zero groups are represented in hexadecimal (removing leading zeros).
3. Groups are separated by `:`.

### Special Handling

1. **IPv4 Mapping**:  
   If the first 6 groups are 0 and the 7th group is 0 or 0xffff, the last 4 bytes are displayed in IPv4 format.  
   Example:  
   ```sql
   mysql> select cast('::ffff:192.0.2.1' as ipv6);
   +-----------------------------+
   | cast('::ffff:192.0.2.1' as ipv6) |
   +-----------------------------+
   | ::ffff:192.0.2.1           |
   +-----------------------------+
   ```

2. **Zero Compression Rules**:  
   * Compress only the longest consecutive zero segment.  
   * At least 2 consecutive zero groups are required for compression.  
   * If there are multiple zero segments of the same length, compress the first one.  

Example:

```sql
mysql> select cast('2001:0db8:0000:0000:0000:0000:1428:57ab' as ipv6);
+---------------------------------------------------------+
| cast('2001:0db8:0000:0000:0000:0000:1428:57ab' as ipv6) |
+---------------------------------------------------------+
| 2001:db8::1428:57ab                                     |
+---------------------------------------------------------+

mysql> select cast('::192.0.2.1' as ipv6);
+-----------------------------+
| cast('::192.0.2.1' as ipv6) |
+-----------------------------+
| ::192.0.2.1                 |
+-----------------------------+
```
