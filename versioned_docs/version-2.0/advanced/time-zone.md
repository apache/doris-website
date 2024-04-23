---
{
    "title": "Time Zone",
    "language": "en"
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

# Time Zone

Doris supports custom time zone settings

## Basic concepts

The following two time zone related parameters exist within Doris:

- `system_time_zone` : When the server starts up, it will be set automatically according to the time zone set by the machine, and cannot be modified after it is set.
- `time_zone` : The current time zone of the cluster.

## Specific operations

1. `SHOW VARIABLES LIKE '% time_zone%'`

    View the current time zone related configuration

2. `SET [global] time_zone = 'Asia/Shanghai'`

   This command sets the time zone at the session level. If the `global` keyword is used, Doris FE persists the parameter and it takes effect for all new sessions afterwards.

## Data source

The time zone data contains the name of the time zone, the corresponding time offset, and the change of daylight saving time. On the machine where the BE is located, the sources of the data are as follows:

1. the directory returned by command `TZDIR`. If was not supported, the directory `/usr/share/zoneinfo`.
2. the `zoneinfo` directory generated under the Doris BE deployment directory. The `resource/zoneinfo.tar.gz` directory from the Doris Repository.

Look up the above data sources in order and use the current item if found. If the BE configuration item `use_doris_tzfile` is true, the search for the first item is skipped. If neither is found, the Doris BE will fail to start, please rebuild the BE correctly or get the distribution.

## Impact of time zone

### 1. functions

Includes values displayed by time functions such as `NOW()` or `CURTIME()`, and also time values in `show load`, `show backends`.

However, it does not affect the less than value of the time-type partitioned columns in `create table`, nor does it affect the display of values stored as `date/datetime` types.

Functions affected by time zone:

- `FROM_UNIXTIME`: Given a UTC timestamp, return its date and time in the time zone specified by Doris session `time_zone`. For example, when `time_zone` is `CST`, `FROM_UNIXTIME(0)` returns `1970-01-01 08: 00:00`.

- `UNIX_TIMESTAMP`: Given a date and time, return its UTC timestamp in the time zone specified by Doris session `time_zone`, such as when `time_zone` is `CST` `UNIX_TIMESTAMP('1970-01-01 08:00:00 ')` returns `0`.

- `CURTIME`: Returns the time in the time zone specified by the current Doris session `time_zone`.

- `NOW`: Returns the date and time of the current Doris session `time_zone` specified time zone.

- `CONVERT_TZ`: Convert a datetime from one specified time zone to another.

### 2. Values of time types

For `DATE` and `DATETIME` types, we support time zone conversion when importing data.

- If the data has a time zone, such as "2020-12-12 12:12:12+08:00", and the current Doris `time_zone = +00:00` or the header `timezone` specified by Stream Load is `+00: 00`, then the data is imported into Doris and the actual value is "2020-12-12 04:12:12".

- If the data does not contain a time zone, such as "2020-12-12 12:12:12", the time is considered to be an absolute time and no conversion occurs.

### 3. Daylight Saving Time

Daylight Saving Time is essentially the actual time offset of a named time zone, which changes on certain dates.

For example, the `America/Los_Angeles` time zone contains a Daylight Saving Time adjustment that begins and ends approximately in March and November of each year. That is, the `America/Los_Angeles` actual time zone offset changes from `-08:00` to `-07:00` at the start of Daylight Savings Time in March, and from `-07:00` to `-08:00` at the end of Daylight Savings Time in November.
If you do not want Daylight Saving Time to be turned on, set `time_zone` to `-08:00` instead of `America/Los_Angeles`.

## Usage

Time zone values can be given in a variety of formats. The following standard formats are well supported in Doris:

1. standard named time zone formats, such as "Asia/Shanghai", "America/Los_Angeles".

2. standard offset formats, such as "+02:30", "-10:00".

3. abbreviated time zone formats, currently only support:

   1. "GMT", "UTC", equivalent to "+00:00" time zone

   2. "CST", which is equivalent to the "Asia/Shanghai" time zone

4. single letter Z, for Zulu time zone, equivalent to "+00:00" time zone

Note: Some other formats are currently supported in some imports in Doris due to different implementations. **Production environments should not rely on these formats that are not listed here, and their behaviour may change at any time**, so keep an eye on the relevant changelog for version updates.

## Best Practices

### Time Zone Sensitive Data

The time zone issue involves three main influences:

1. session variable `time_zone` -- cluster timezone

2. header `timezone` specified during import(Stream Load, Broker Load etc.) -- importing timezone

3. timezone type literal "+08:00" in "2023-12-12 08:00:00+08:00" -- data timezone

We can understand it as follows:

Doris is currently compatible with importing data in various time zones into Doris. Since Doris's own `DATETIME` and other time types do not contain time zone information, and the data will not change with time zone changes after being imported, when time data is imported into Doris, it can be divided into the following two categories:

1. Absolute time

   Absolute time means that the data scene it is associated with has nothing to do with time zones. This type of data should be imported without any time zone suffix and will be stored as-is.

2. Time in a specific time zone

   The time in a specific time zone means that the data scenario it is associated with is related to the time zone. For this type of data, it should be imported with a specific time zone suffix. When imported, they will be converted to the Doris cluster `time_zone` time zone or the header `timezone` specified in Stream Load/Broker Load.

   This type of data is converted to absolute time storage in the time zone specified during import after import, so subsequent imports and queries should maintain this time zone to avoid confusion in the meaning of the data.

 * For the Insert statement, we can illustrate it through the following example:

    ```sql
    Doris > select @@time_zone;
    +---------------+
    | @@time_zone   |
    +---------------+
    | Asia/Shanghai |
    +---------------+
    
    Doris > insert into dt values('2020-12-12 12:12:12+02:00'); --- The imported data specifies a time zone of +02:00
    
    Doris > select * from dt;
    +---------------------+
    | dt                  |
    +---------------------+
    | 2020-12-12 18:12:12 | --- Is converted to the Doris cluster time zone Asia/Shanghai, subsequent imports and queries should maintain this time zone.
    +---------------------+
    
    Doris > set time_zone = 'America/Los_Angeles';
    
    Doris > select * from dt;
    +---------------------+
    | dt                  |
    +---------------------+
    | 2020-12-12 18:12:12 | --- If time_zone is modified, the time value will not change accordingly, and its meaning during query will be confused.
    +---------------------+
    ```

 * For import methods such as Stream Load and Broker Load, we can achieve this by specifying header `timezone`. For example, for Stream Load, we can illustrate it through the following example:

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
    | 2020-12-12 18:12:12 | --- Is converted to the Doris cluster time zone Asia/Shanghai, subsequent imports and queries should maintain this time zone.
    +---------------------+
    ```

   :::tip
    * In import methods such as Stream Load and Broker Load, the header `timezone` will overwrite the Doris cluster `time_zone`, so it should be consistent during import.
    * In import methods such as Stream Load and Broker Load, the header `timezone` will affect the functions used in import conversion.
    * If the header `timezone` is not specified when importing, the East Eighth Zone will be used by default.
   :::

**To sum up, the best practice for dealing with time zone issues is:**

:::info Best Practices
1. Confirm the time zone represented by the cluster and set `time_zone` before use, and do not change it after that.

2. Set header `timezone` to be consistent with cluster `time_zone` when importing.

3. For absolute time, import without time zone suffix; for time with time zone, import with specific time zone suffix, and it will be converted to Doris `time_zone` time zone after import.
:::

### Daylight Saving Time

The start and end times for Daylight Saving Time are taken from the [current time zone data source](#data-source) and may not necessarily correspond exactly to the actual officially recognised times for the current year's time zone location. This data is maintained by ICANN. If you need to ensure that Daylight Saving Time behaves as specified for the current year, please make sure that data source selected by Doris is the latest ICANN published time zone data. See below for download access.

### Information Update

Real-world time zone and daylight saving time data may change from time to time for a variety of reasons, and IANA periodically records these changes and updates the corresponding time zone files. If you want the time zone information in Doris to be up to date with the latest IANA data, do one of the followings:

1. Use the Package Manager to update

Depending on the package manager used by the current operating system, you can update the time zone data directly using the corresponding command:

```shell
# yum
> sudo yum update tzdata
# apt
> sudo apt update tzdata
```

The data updated in this way is located under the system `$TZDIR` (typically `usr/share/zoneinfo`). If `use_doris_tzfile = true`, the user should overwrite it to the `zoneinfo` directory in the BE deployment directory.

2. pull the IANA time zone database manually (recommended)

Most Linux distributions have a package manager where tzdata is not synchronised in a timely manner. If the accuracy of the time zone data is important, you can pull the data published by IANA on a regular basis:

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```

Then generate the specific zoneinfo data according the README file in the extracted folder. The generated data should be copied to `$TZDIR` or to the BE deployment directory, depending on the value of the BE config `use_doris_tzfile`.

Please note that all the above operations **must** be restarted **on the corresponding BE to take effect after they are done on the BE machine.

## Extended Reading

- [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

- [IANA Time Zone Database](https://www.iana.org/time-zones)

- [The tz-announce Archives](https://mm.icann.org/pipermail/tz-announce/)
