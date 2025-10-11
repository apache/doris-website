---
{
    "title": "TIMESTAMPTZ",
    "language": "en"
}
---

## Description

TIMESTAMPTZ is the data type in Doris used to store date and time information with time zone awareness, corresponding to TIMESTAMP WITH TIME ZONE in standard SQL.

In different database systems, time zone-aware timestamp types have various naming conventions:
- PostgreSQL and Oracle use TIMESTAMP WITH TIME ZONE
- SQL Server uses DATETIMEOFFSET
- Some other databases use TIMESTAMP WITH LOCAL TIME ZONE

According to SQL standards, the standalone TIMESTAMP type should not carry time zone information (equivalent to TIMESTAMP WITHOUT TIME ZONE). Considering user habits and ease of use, Doris chose the more concise name TIMESTAMPTZ to represent the timestamp type with time zone. Note that currently Doris does not have a separate TIMESTAMP type, as users can effectively use DATETIME to store time information.

The range of TIMESTAMPTZ is the same as DATETIME, being `[0000-01-01 00:00:00.000000, 9999-12-31 23:59:59.999999]`, with a fixed microsecond precision. The default output format is 'yyyy-MM-dd HH:mm:ss.SSSSSS +XX:XX', where +XX:XX represents the time zone offset.

### Working Principle

TIMESTAMPTZ implementation does not store time zone information with each row of data, but instead adopts the following mechanism:
1. During storage: All input time values are converted to UTC (Coordinated Universal Time)
2. During query: Based on the session's time zone setting (specified via the `time_zone` variable), UTC time is automatically converted to the corresponding time zone for display

Therefore, TIMESTAMPTZ can be understood as a DATETIME type with time zone conversion functionality, where Doris automatically handles time zone conversions internally.

### Time Zone Handling Rules

- When input strings contain time zone information (e.g., "2020-01-01 00:00:00 +03:00"), Doris uses that time zone information for conversion
- When input strings do not contain time zone information (e.g., "2020-01-01 00:00:00"), Doris uses the current session's time zone setting for conversion

### Storage and Usage

In Doris, a TIMESTAMPTZ type field occupies 8 bytes of storage space.

TIMESTAMPTZ and DATETIME types support mutual conversion, with appropriate time zone adjustments during conversion. TIMESTAMPTZ supports implicit conversion to DATETIME, allowing functions that do not directly support TIMESTAMPTZ to process this type of data.

## Examples

```sql
-- Using the current time zone (assuming +08:00) to convert a time string without time zone information
select cast("2020-01-01 00:00:00" as timestamptz);
```

```text
+--------------------------------------------+
| cast("2020-01-01 00:00:00" as timestamptz) |
+--------------------------------------------+
| 2020-01-01 00:00:00.000000 +08:00          |
+--------------------------------------------+
```

```sql
-- Using a time string with time zone information
select cast("2020-01-01 00:00:00 +03:00" as timestamptz);
```

```text
+---------------------------------------------------+
| cast("2020-01-01 00:00:00 +03:00" as timestamptz) |
+---------------------------------------------------+
| 2020-01-01 00:00:00.000000 +03:00                 |
+---------------------------------------------------+
```

```sql
-- Converting TIMESTAMPTZ to DATETIME (with time zone conversion based on current time zone)
select cast(cast("2020-01-01 00:00:00 +03:00" as timestamptz) as datetime);
```

```text
+----------------------------------------------------------------------+
| cast(cast("2020-01-01 00:00:00 +03:00" as timestamptz) as datetime ) |
+----------------------------------------------------------------------+
| 2020-01-01 05:00:00                                                  |
+----------------------------------------------------------------------+
```

```sql
-- Converting DATETIME to TIMESTAMPTZ
select cast(cast('2023-01-02 01:00:00' as datetime) as timestamptz);
```

```text
+----------------------------------------------------------------+
| cast(cast('2023-01-02 01:00:00' as datetime) as timestamptz )  |
+----------------------------------------------------------------+
| 2023-01-02 01:00:00.000000 +08:00                              |
+----------------------------------------------------------------+
```

```sql
-- Using TIMESTAMPTZ in functions
select HOUR(cast("2020-01-01 00:00:00 +03:00" as timestamptz));
```

```text
+---------------------------------------------------------+
| HOUR(cast("2020-01-01 00:00:00 +03:00" as timestamptz)) |
+---------------------------------------------------------+
|                                                       5 |
+---------------------------------------------------------+
```
