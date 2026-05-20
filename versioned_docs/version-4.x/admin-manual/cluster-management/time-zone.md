---
{
    "title": "Time Zone Management",
    "language": "en",
    "description": "Learn about Doris time zone parameters, configuration methods, daylight saving time handling, and time zone conversion during data ingestion. Master best practices for time-zone-sensitive data.",
    "keywords": [
        "Doris time zone",
        "time_zone",
        "system_time_zone",
        "set time_zone",
        "Asia/Shanghai",
        "time zone configuration",
        "daylight saving time",
        "tzdata",
        "IANA time zone",
        "Stream Load timezone",
        "DATETIME time zone",
        "TIMESTAMPTZ"
    ]
}
---

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenarios: Cluster initialization time zone configuration / Cross-time-zone data ingestion / Daylight saving time adjustment -->

Doris supports custom time zone settings. This document describes the meaning of time-zone-related parameters in Doris, how to view and configure them, how the time zone affects functions and data types, how daylight saving time is handled, and best practices for time-zone-sensitive data.

## Applicable Scenarios

| Scenario | Description |
| --- | --- |
| Cluster initialization | Set `time_zone` after deployment based on business location or a unified standard |
| Cross-time-zone data ingestion | Ingest data with or without time zone information through Stream Load, Broker Load, and similar methods |
| Function result alignment | Adjust the time zone for the return values of functions such as `NOW()`, `CURTIME()`, and `FROM_UNIXTIME` |
| Daylight saving time handling | Handle named time zones (such as `America/Los_Angeles`) that involve daylight saving time transitions |
| Time zone data update | Update the time zone data on the BE machines after IANA releases a new tzdata version |

## Basic Concepts

Doris has the following two time-zone-related parameters:

| Parameter | Modifiable | Description |
| --- | --- | --- |
| `system_time_zone` | No | Set automatically by the system based on the machine's local time zone when the server starts. It cannot be modified after being set. |
| `time_zone` | Yes | The current time zone of the cluster. It is the same as `system_time_zone` when the cluster starts and remains unchanged unless modified manually. |

## View and Set the Time Zone

### View the Current Time Zone

Run the following SQL statement to view the time-zone-related variables:

```sql
show variables like '%time_zone%';
```

### Set the Time Zone

Modify `time_zone` with a `SET` statement:

```sql
SET [global] time_zone = 'Asia/Shanghai';
```

- Without the `global` keyword: takes effect only in the current session.
- With the `global` keyword: Doris FE persists the parameter, and it takes effect for all subsequent new sessions.

### Time Zone Data Source

Time zone data includes time zone names, corresponding time offsets, daylight saving time changes, and other information. On the BE machine, the data is sourced from the directory returned by the `TZDIR` command. If the command is not supported, the source is the `/usr/share/zoneinfo` directory.

## Time Zone Value Formats

Time zone values can be given in several formats. The following are the standard formats that Doris fully supports:

| Type | Example | Description |
| --- | --- | --- |
| Standard named time zone | `Asia/Shanghai`, `America/Los_Angeles`, `Etc/GMT+3` | Sourced from the [local time zone data](#time-zone-data-source) |
| Standard offset format | `+02:30`, `-10:00` | Special offsets such as `+12:03` are not supported |
| Abbreviated time zone | `GMT`, `UTC` | Equivalent to the `+00:00` time zone |
| Abbreviated time zone | `CST` | Equivalent to the `Asia/Shanghai` time zone |
| Single letter Z | `Z` | Represents the Zulu time zone, equivalent to the `+00:00` time zone |

In addition, letter parsing is case-insensitive.

:::caution Note
Because of implementation differences, some other formats are currently supported in certain ingestion methods. **Production environments must not rely on formats that are not listed here. Their behavior may change at any time.** Watch the changelog of each release for related updates.
:::

## Effects of the Time Zone

### Effect on Functions

The time zone affects the values returned by time functions such as `NOW()` and `CURTIME()`, as well as the time values shown in `SHOW LOAD` and `SHOW BACKENDS`.

However, it does **not** affect the `LESS THAN` values of time-typed partition columns in `CREATE TABLE`, and it does not affect the displayed values of data stored as `DATE` or `DATETIME` types.

Functions affected by the time zone:

| Function | Behavior |
| --- | --- |
| `FROM_UNIXTIME` | Given a UTC timestamp, returns the date and time in the time zone specified by the Doris session `time_zone`. For example, when `time_zone` is `CST`, `FROM_UNIXTIME(0)` returns `1970-01-01 08:00:00`. |
| `UNIX_TIMESTAMP` | Given a date and time, returns the UTC timestamp under the time zone specified by the Doris session `time_zone`. For example, when `time_zone` is `CST`, `UNIX_TIMESTAMP('1970-01-01 08:00:00')` returns `0`. |
| `CURTIME` | Returns the current time in the time zone specified by the Doris session `time_zone`. |
| `NOW` | Returns the current date and time in the time zone specified by the Doris session `time_zone`. |
| `CONVERT_TZ` | Converts a date and time from one specified time zone to another. |

### Effect on Time Types

#### DATE / DATETIME Types

For the `DATE` and `DATETIME` types, time zone conversion is supported during data ingestion:

- **Data with time zone**: For example, given `2020-12-12 12:12:12+08:00` and a Stream Load header `timezone` of `+00:00`, the actual value stored in Doris is `2020-12-12 04:12:12`.
- **Data without time zone**: For example, `2020-12-12 12:12:12` is treated as an absolute time, and no conversion occurs.

#### TIMESTAMPTZ Type

The `TIMESTAMPTZ` type also supports time zone conversion during data ingestion: the input time value is uniformly converted to UTC (Coordinated Universal Time), and the output applies the current session's time zone.

- **Data with time zone**: For example, for `2020-12-12 12:12:12+08:00`, Doris uses the provided time zone information for the conversion.
- **Data without time zone**: For example, for `2020-12-12 12:12:12`, Doris uses the current session's time zone setting for the conversion.

The current session's `time_zone` affects the output of the `TIMESTAMPTZ` type. For example, if the current session has `time_zone="+08:00"` and the `TIMESTAMPTZ` value is `2020-12-12 12:12:12+08:00`, changing `time_zone` changes the output value:

```sql
set time_zone = "+08:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 12:12:12+08:00 |
+---------------------------+

set time_zone = "+07:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 11:12:12+07:00 |
+---------------------------+
```

### Daylight Saving Time

Daylight saving time means that the actual offset of a named time zone changes within a certain date range.

For example, the `America/Los_Angeles` time zone has one daylight saving time transition each year, starting around March and ending around November. When daylight saving time begins in March, the actual offset of `America/Los_Angeles` changes from `-08:00` to `-07:00`. When daylight saving time ends in November, it changes back from `-07:00` to `-08:00`.

If you do not want to enable daylight saving time, set `time_zone` to `-08:00` instead of `America/Los_Angeles`.

## Best Practices

### Handling Time-Zone-Sensitive Data

<!-- Knowledge type: Best practice -->
<!-- Applicable scenarios: Cross-time-zone data ingestion and queries -->

Time zone issues involve three main factors:

1. **Cluster time zone**: the session variable `time_zone`.
2. **Ingestion time zone**: the header `timezone` specified during Stream Load, Broker Load, and similar ingestion methods.
3. **Data time zone**: the time-zone literal in the data (for example, the `+08:00` in `2023-12-12 08:00:00+08:00`).

Doris currently supports ingesting data from any time zone into Doris. Because Doris time types such as `DATETIME` do not carry time zone information internally and the stored data does not change with the time zone after ingestion, time data ingested into Doris falls into two categories:

1. **Absolute time**

    Absolute time means the data scenario is time-zone-independent. For this kind of data, do not include any time zone suffix during ingestion. The data is stored as is.

2. **Time in a specific time zone**

    Time in a specific time zone means the data scenario is time-zone-dependent. For this kind of data, include the specific time zone suffix during ingestion. During ingestion, the data is converted to the time zone specified by the Doris cluster `time_zone` or by the header `timezone` in Stream Load or Broker Load.

    After ingestion, this kind of data is stored as the absolute time in the time zone specified during ingestion. Subsequent ingestion and queries must keep the same time zone to avoid disrupting the meaning of the data.

#### Insert Statement Example

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > insert into dt values('2020-12-12 12:12:12+02:00'); --- The ingested data specifies the time zone as +02:00

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- Converted to the Doris cluster time zone Asia/Shanghai. Subsequent ingestion and queries must keep this time zone.
+---------------------+

Doris > set time_zone = 'America/Los_Angeles';

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- If time_zone is changed, the time value does not change, and its meaning at query time becomes inconsistent.
+---------------------+
```

#### Stream Load Example

For ingestion methods such as Stream Load and Broker Load, time zone conversion can be performed by specifying the header `timezone`. For example:

```shell
cat dt.csv
2020-12-12 12:12:12+02:00

curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode: true" \
    -H "timezone: Asia/Shanghai" \
    -T dt.csv -XPUT \
    http://127.0.0.1:8030/api/test/dt/_stream_load
```

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- Converted to the Doris cluster time zone Asia/Shanghai. Subsequent ingestion and queries must keep this time zone.
+---------------------+
```

:::tip
- For ingestion methods such as Stream Load and Broker Load, the header `timezone` overrides the Doris cluster `time_zone`, so keep them consistent during ingestion.
- For ingestion methods such as Stream Load and Broker Load, the header `timezone` affects the functions used during ingestion conversion.
- If the header `timezone` is not specified during ingestion, the current cluster time zone is used by default.
:::

#### Best Practice Summary

:::info Best practice
1. Confirm the time zone the cluster represents before use, set `time_zone`, and do not change it afterward.
2. Set the header `timezone` to match the cluster `time_zone` during ingestion.
3. For absolute time, do not include a time zone suffix during ingestion. For time-zone-aware time, include the specific time zone suffix during ingestion. After ingestion, the data is converted to the Doris `time_zone` time zone.
:::

### Daylight Saving Time Recommendations

The start and end times of daylight saving time come from the [current time zone data source](#time-zone-data-source) and are not necessarily exactly the same as the official times confirmed in the relevant region for the current year. This data is maintained by ICANN.

To make sure daylight saving time behavior matches the official rules of the current year, make sure the data source used by Doris is the latest time zone data published by ICANN. See below for the download method.

## Update Time Zone Information

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Time zone data synchronization / IANA tzdata update -->

Real-world time zone and daylight saving time data changes from time to time for various reasons. IANA regularly records these changes and updates the corresponding time zone files. To keep the time zone information in Doris consistent with the latest IANA data, use one of the following two methods:

### Method 1: Update with a Package Manager

Depending on the package manager used by the current operating system, update the time zone data directly with the corresponding command:

```shell
# yum
sudo yum update tzdata
# apt
sudo apt update tzdata
```

The data updated by this method is located under the system `$TZDIR` (usually `/usr/share/zoneinfo`).

### Method 2: Pull the IANA Time Zone Database Directly (Recommended)

For most Linux distributions, tzdata is not synchronized in a timely manner through the package manager. If you have higher requirements for the accuracy of time zone data, pull the data periodically published by IANA directly:

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```

Then follow the README in the extracted folder to generate the specific zoneinfo data. Copy the generated data to the `$TZDIR` directory and overwrite the existing files.

:::caution Important
After all the above operations are completed on the BE machine, **the corresponding BE must be restarted** for the changes to take effect.
:::

## FAQ

### Q: After changing `time_zone`, the query results for existing data change unexpectedly?

Types such as `DATETIME` do not carry time zone information internally, and changing the cluster time zone after ingestion does not change the stored values. Confirm the cluster time zone before use, set `time_zone`, and do not change it afterward.

### Q: The time offset of Stream Load ingested data does not match expectations?

The header `timezone` is inconsistent with the cluster `time_zone`. Keep the header `timezone` consistent with the cluster `time_zone`.

### Q: The time returned by `NOW()` does not match the local time?

The cluster `time_zone` is inconsistent with the local time zone. Adjust it with `SET global time_zone = 'Asia/Shanghai'`.

### Q: The daylight saving time transition of a named time zone does not match the current-year rules?

The tzdata on the BE machine is outdated. Update tzdata with a package manager or by pulling the IANA tzdata directly, then restart the BE.

### Q: I am using `America/Los_Angeles` but do not want to enable daylight saving time?

Named time zones include daylight saving time rules. Use a fixed offset format such as `-08:00` instead.

## Further Reading

- Time zone format list: [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- IANA Time Zone Database: [IANA Time Zone Database](https://www.iana.org/time-zones)
- ICANN Time Zone Database: [The tz-announce Archives](https://mm.icann.org/pipermail/tz-announce/)
