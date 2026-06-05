---
{
    "title": "IPV6",
    "language": "en",
    "description": "IPv6 type, stored in UInt128 format in 16 bytes, used to represent IPv6 addresses. The range of values is ['::',"
}
---

## IPV6

### description

IPv6 type, stored in UInt128 format in 16 bytes, used to represent IPv6 addresses.
The range of values is ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'].

`Inputs that exceed the value range or have invalid format will return NULL`

### example

Create table example:

```
CREATE TABLE ipv6_test (
  `id` int,
  `ip_v6` ipv6
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

Insert data example:

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```

Select data example:

```
mysql> select * from ipv6_test order by id;
+------+-----------------------------------------+
| id   | ip_v6                                   |
+------+-----------------------------------------+
|    1 | ::                                      |
|    2 | 2001:16a0:2:200a::2                     |
|    3 | ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff |
|    4 | NULL                                    |
+------+-----------------------------------------+
```

## Best Practice: store mixed IPv4/IPv6 in a single IPV6 column with an inverted index

A single `IPV6` column can store both IPv4 and IPv6 addresses: write IPv4 in its IPv4-mapped IPv6 form (`::ffff:x.y.z.w`) — for example `192.168.1.1` is stored as `::ffff:192.168.1.1` — while native IPv6 (such as `2001:16a0:2:200a::2`) is written as-is. This lets a mixed-IP field be managed in one column, and an inverted index on that column accelerates IP filtering, supporting equality (`=`), `IN`, and CIDR functions such as `is_ip_address_in_range()`.

### Schema

```sql
CREATE TABLE access_log (
  `id`            BIGINT NOT NULL,
  `request_time`  DATETIME NOT NULL,
  `client_ip`     IPV6 NULL COMMENT 'Stored uniformly as IPv6; IPv4 stored in ::ffff: form',
  INDEX idx_client_ip (`client_ip`) USING INVERTED
) ENGINE=OLAP
DUPLICATE KEY(`id`, `request_time`)
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```

### Normalizing on load

Regardless of the load method, the key is to use the same expression in the column mapping to convert the raw IP string into IPv6 (below, `ip_str` is the source field and `client_ip` is the table's `IPV6` column):

```sql
client_ip = COALESCE(
    ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
    to_ipv6_or_null(ip_str)
)
```

- A plain IPv4 string is first parsed to `IPV4` by `to_ipv4_or_null()`, then converted to `::ffff:x.y.z.w` by `ipv4_to_ipv6()`;
- If it is not a valid IPv4, `COALESCE` falls back to `to_ipv6_or_null()` and parses it as native IPv6 text;
- If both fail, `NULL` is written. To reject invalid data instead, replace `_or_null` with the strict `to_ipv4` / `to_ipv6` and handle it via the load error threshold.

#### Routine Load

```sql
CREATE ROUTINE LOAD example_db.access_log_job ON access_log
COLUMNS TERMINATED BY ",",
COLUMNS(
  id, request_time, ip_str,
  client_ip = COALESCE(
      ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
      to_ipv6_or_null(ip_str)
  )
)
PROPERTIES ("desired_concurrent_number" = "3", "max_error_number" = "1000")
FROM KAFKA ("kafka_broker_list" = "broker:9092", "kafka_topic" = "ip_logs");
```

#### Stream Load

Apply the same conversion in the `columns` header:

```shell
curl --location-trusted -u user:passwd \
  -H "format: csv" \
  -H "column_separator: ," \
  -H "columns: id, request_time, ip_str, client_ip=COALESCE(ipv4_to_ipv6(to_ipv4_or_null(ip_str)), to_ipv6_or_null(ip_str))" \
  -T data.csv \
  "http://<fe_host>:8030/api/example_db/access_log/_stream_load"
```

#### INSERT INTO (migrating from an old VARCHAR table)

Convert the raw IP string to IPv6 in the `SELECT` (`ip_str` is the VARCHAR column of the old table):

```sql
INSERT INTO access_log (id, request_time, client_ip)
SELECT
  id, request_time,
  COALESCE(
      ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
      to_ipv6_or_null(ip_str)
  )
FROM access_log_varchar;
```

### Rewriting queries (important)

Once everything is stored as mapped IPv6, **IPv4 query conditions must also be rewritten into mapped IPv6 form**; otherwise a type / address-family mismatch causes the index to be skipped:

- **IPv6 CIDR**: write it directly.

  ```sql
  is_ip_address_in_range(client_ip, '2001:4860:4801::/48')
  ```

- **IPv4 CIDR → mapped IPv6 CIDR**: add the `::ffff:` prefix to the address and add **+96** to the prefix length (the first 96 bits of a mapped address are a fixed prefix).

  | IPv4 CIDR          | mapped IPv6 CIDR            |
  | ------------------ | --------------------------- |
  | `10.42.0.0/16`     | `::ffff:10.42.0.0/112`      |
  | `192.178.4.0/24`   | `::ffff:192.178.4.0/120`    |
  | `3.219.120.76/32`  | `::ffff:3.219.120.76/128`   |

  ```sql
  is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **Exact IPv4 match**: compare against the mapped value too.

  ```sql
  client_ip = ipv4_to_ipv6(to_ipv4('3.219.120.76'))
  -- or
  client_ip = to_ipv6('::ffff:3.219.120.76')
  ```

- **Allowlist (keep only rows in the range)**: use `is_ip_address_in_range(...)` directly as the filter.

  ```sql
  WHERE is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **Blocklist (exclude rows in the range)**: use `NOT is_ip_address_in_range(...)`, and avoid the `is_ip_address_in_range(...) = 0` form (which is harder to push down to the index).

  ```sql
  WHERE NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

Full example (a stat query that excludes several ranges). Because it contains CIDR range conditions, lower the threshold first to ensure the index is used:

```sql
SET inverted_index_skip_threshold = 0;

SELECT client_ip, COUNT(*) AS cnt
FROM access_log
WHERE request_time BETWEEN '2026-06-01 00:00:00' AND '2026-06-02 00:00:00'
  AND client_ip NOT IN (to_ipv6('::ffff:3.219.120.76'))               -- exact IPv4 exclusion -> mapped
  AND NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')   -- IPv4 /16 -> /112
  AND NOT is_ip_address_in_range(client_ip, '2001:4860:4801::/48')    -- IPv6 range
GROUP BY client_ip;
```

### Conditions for hitting the index

- The column must be a native `IPV4` / `IPV6` type with a `USING INVERTED` inverted index built on it;
- The CIDR argument of `is_ip_address_in_range()` must be a **constant string**;
- An `IPV6` column only handles IPv6 CIDRs (IPv4 ranges must first be converted to `::ffff:` mapped form), and an `IPV4` column only handles IPv4 CIDRs; a type / CIDR-family mismatch skips the index and falls back to expression filtering;
- The session variable `inverted_index_skip_threshold` defaults to `50`: when more than 50% of the rows in a segment match the index, the index is skipped and data is read directly (bypass).

:::caution CIDR range queries need a lower `inverted_index_skip_threshold`
For a CIDR range query, `is_ip_address_in_range()` is internally split into two BKD queries, `>= range start` and `<= range end`. **Each side alone often matches more than 50% of the rows** (even when the final intersection is narrow), triggering bypass and skipping the index. Such queries therefore need `SET inverted_index_skip_threshold = 0;` (or a smaller value) in the session to hit the index reliably. Equality / `IN` are high-selectivity point lookups and are unaffected.
:::

### keywords

IPV6
