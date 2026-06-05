---
{
    "title": "IPV6",
    "language": "zh-CN",
    "description": "IPv6 类型，以 UInt128 的形式存储在 16 个字节中，用于表示 IPv6 地址。 取值范围是 ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']。"
}
---

## IPV6

## 描述

IPv6 类型，以 UInt128 的形式存储在 16 个字节中，用于表示 IPv6 地址。
取值范围是 ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']。

`超出取值范围或者格式非法的输入将返回NULL`

## 举例
    
建表示例如下：

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

插入数据示例：

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```

查询数据示例：

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

## 最佳实践：用 IPV6 统一存储混合 IPv4/IPv6 并走倒排索引

一个 `IPV6` 列可以同时存储 IPv4 和 IPv6 两种地址：把 IPv4 规范化成 IPv4-mapped IPv6（`::ffff:x.y.z.w`）后写入，例如 `192.168.1.1` 存成 `::ffff:192.168.1.1`，原生 IPv6（如 `2001:16a0:2:200a::2`）照常写入。这样混合 IP 就能用同一列统一管理，并在该列上建倒排索引来过滤 IP，支持等值（`=`）、`IN`、以及 `is_ip_address_in_range()` 等 CIDR 函数走索引加速。

### 建模

```sql
CREATE TABLE access_log (
  `id`            BIGINT NOT NULL,
  `request_time`  DATETIME NOT NULL,
  `client_ip`     IPV6 NULL COMMENT '统一存储为 IPv6，IPv4 以 ::ffff: 形式存储',
  INDEX idx_client_ip (`client_ip`) USING INVERTED
) ENGINE=OLAP
DUPLICATE KEY(`id`, `request_time`)
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```

### 导入时归一化

无论用哪种导入方式，核心都是在列映射里用同一个表达式把原始 IP 字符串转成 IPv6（下面 `ip_str` 为源字段，`client_ip` 为表的 `IPV6` 列）：

```sql
client_ip = COALESCE(
    ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
    to_ipv6_or_null(ip_str)
)
```

- 普通 IPv4 字符串先用 `to_ipv4_or_null()` 解析为 `IPV4`，再用 `ipv4_to_ipv6()` 转成 `::ffff:x.y.z.w`；
- 不是合法 IPv4 时 `COALESCE` 落到 `to_ipv6_or_null()`，按原生 IPv6 文本解析；
- 两者都失败则写入 `NULL`。若希望非法数据直接报错，可把 `_or_null` 换成严格的 `to_ipv4` / `to_ipv6`，并配合导入的错误阈值处理。

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

在 `columns` 头里做同样的转换：

```shell
curl --location-trusted -u user:passwd \
  -H "format: csv" \
  -H "column_separator: ," \
  -H "columns: id, request_time, ip_str, client_ip=COALESCE(ipv4_to_ipv6(to_ipv4_or_null(ip_str)), to_ipv6_or_null(ip_str))" \
  -T data.csv \
  "http://<fe_host>:8030/api/example_db/access_log/_stream_load"
```

#### INSERT INTO（从旧 VARCHAR 表迁移）

在 `SELECT` 里把原始 IP 字符串统一转成 IPv6（`ip_str` 为旧表的 VARCHAR 列）：

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

### 查询改写（关键）

存储统一成 mapped IPv6 后，**IPv4 的查询条件也必须改写成 mapped IPv6 形式**，否则类型/网段族不匹配会导致跳过索引：

- **IPv6 CIDR**：直接写。

  ```sql
  is_ip_address_in_range(client_ip, '2001:4860:4801::/48')
  ```

- **IPv4 CIDR → mapped IPv6 CIDR**：地址加 `::ffff:` 前缀，前缀长度 **+96**（mapped 地址前 96 位是固定前缀）。

  | IPv4 CIDR          | mapped IPv6 CIDR            |
  | ------------------ | --------------------------- |
  | `10.42.0.0/16`     | `::ffff:10.42.0.0/112`      |
  | `192.178.4.0/24`   | `::ffff:192.178.4.0/120`    |
  | `3.219.120.76/32`  | `::ffff:3.219.120.76/128`   |

  ```sql
  is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **IPv4 精确匹配**：同样比较 mapped 值。

  ```sql
  client_ip = ipv4_to_ipv6(to_ipv4('3.219.120.76'))
  -- 或
  client_ip = to_ipv6('::ffff:3.219.120.76')
  ```

- **白名单（只保留命中网段的行）**：直接用 `is_ip_address_in_range(...)` 作为过滤条件。

  ```sql
  WHERE is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **黑名单（排除命中网段的行）**：用 `NOT is_ip_address_in_range(...)`，避免 `is_ip_address_in_range(...) = 0` 这种写法（后者更难走索引下推）。

  ```sql
  WHERE NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

完整示例（一段“排除若干网段”的统计）。因为包含 CIDR 范围条件，运行前先调低阈值确保命中索引：

```sql
SET inverted_index_skip_threshold = 0;

SELECT client_ip, COUNT(*) AS cnt
FROM access_log
WHERE request_time BETWEEN '2026-06-01 00:00:00' AND '2026-06-02 00:00:00'
  AND client_ip NOT IN (to_ipv6('::ffff:3.219.120.76'))               -- IPv4 精确排除 → mapped
  AND NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')   -- IPv4 /16 → /112
  AND NOT is_ip_address_in_range(client_ip, '2001:4860:4801::/48')    -- IPv6 网段
GROUP BY client_ip;
```

### 走索引的前提

- 列必须是原生 `IPV4` / `IPV6` 类型，且已建 `USING INVERTED` 倒排索引；
- `is_ip_address_in_range()` 的 CIDR 参数必须是**常量字符串**；
- `IPV6` 列只处理 IPv6 CIDR（IPv4 网段需先转成 `::ffff:` mapped 形式），`IPV4` 列只处理 IPv4 CIDR，类型与 CIDR 族不匹配会跳过索引、回退到表达式过滤；
- 会话变量 `inverted_index_skip_threshold` 默认 `50`：当一个 segment 中超过 50% 的行命中索引时会跳过索引、直接读取（bypass）。

:::caution CIDR 范围查询需要调低 `inverted_index_skip_threshold`
对 CIDR 范围查询，`is_ip_address_in_range()` 内部会拆成 `>= 网段起始` 和 `<= 网段结束` 两次 BKD 查询，**单边各自命中的行数往往都超过 50%**（即便最终交集很窄），从而触发 bypass、跳过索引。因此这类查询需要在会话里设 `SET inverted_index_skip_threshold = 0;`（或较小值）才能稳定命中索引。等值 / `IN` 是高选择性点查，不受此影响。
:::

### keywords

IPV6
