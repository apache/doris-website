---
{
  "title": "IPv6",
  "language": "ja",
  "description": "IPv6型、16バイトのUInt128形式で保存され、IPv6アドレスを表現するために使用される。値の範囲は['::',"
}
---
## IPV6

### description

IPv6型は、IPv6アドレスを表現するために使用され、16バイトのUInt128形式で格納されます。
値の範囲は['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']です。

`値の範囲を超える入力や無効な形式の入力はNULLを返します`

### example

テーブル作成例：

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
データ挿入例:

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```
データ選択の例:

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
## ベストプラクティス：IPv4/IPv6 混在を 1 つの IPV6 列に統一格納し転置インデックスを利用する

1 つの `IPV6` 列に IPv4 と IPv6 の両方のアドレスを格納できます。IPv4 は IPv4-mapped IPv6（`::ffff:x.y.z.w`）形式に正規化して書き込み（例：`192.168.1.1` は `::ffff:192.168.1.1` として格納）、ネイティブ IPv6（例：`2001:16a0:2:200a::2`）はそのまま書き込みます。これにより混在 IP を 1 列で統一管理でき、その列に転置インデックスを張ることで IP フィルタリングを高速化し、等価（`=`）、`IN`、および `is_ip_address_in_range()` などの CIDR 関数がインデックスを利用できます。

### スキーマ

```sql
CREATE TABLE access_log (
  `id`            BIGINT NOT NULL,
  `request_time`  DATETIME NOT NULL,
  `client_ip`     IPV6 NULL COMMENT 'IPv6 として統一格納。IPv4 は ::ffff: 形式で格納',
  INDEX idx_client_ip (`client_ip`) USING INVERTED
) ENGINE=OLAP
DUPLICATE KEY(`id`, `request_time`)
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```

### ロード時の正規化

どのロード方式でも、要点は列マッピングで同じ式を使って生の IP 文字列を IPv6 に変換することです（以下、`ip_str` がソースフィールド、`client_ip` がテーブルの `IPV6` 列）：

```sql
client_ip = COALESCE(
    ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
    to_ipv6_or_null(ip_str)
)
```

- 通常の IPv4 文字列はまず `to_ipv4_or_null()` で `IPV4` に解析し、`ipv4_to_ipv6()` で `::ffff:x.y.z.w` に変換します；
- 有効な IPv4 でない場合、`COALESCE` は `to_ipv6_or_null()` にフォールバックし、ネイティブ IPv6 テキストとして解析します；
- 両方失敗した場合は `NULL` が書き込まれます。不正なデータをエラーにしたい場合は、`_or_null` を厳密な `to_ipv4` / `to_ipv6` に置き換え、ロードのエラーしきい値で処理します。

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

`columns` ヘッダーで同じ変換を行います：

```shell
curl --location-trusted -u user:passwd \
  -H "format: csv" \
  -H "column_separator: ," \
  -H "columns: id, request_time, ip_str, client_ip=COALESCE(ipv4_to_ipv6(to_ipv4_or_null(ip_str)), to_ipv6_or_null(ip_str))" \
  -T data.csv \
  "http://<fe_host>:8030/api/example_db/access_log/_stream_load"
```

#### INSERT INTO（旧 VARCHAR テーブルからの移行）

`SELECT` で生の IP 文字列を IPv6 に変換します（`ip_str` は旧テーブルの VARCHAR 列）：

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

### クエリの書き換え（重要）

すべてが mapped IPv6 として格納された後は、**IPv4 のクエリ条件も mapped IPv6 形式に書き換える必要があります**。そうしないと型／アドレスファミリの不一致でインデックスがスキップされます：

- **IPv6 CIDR**：そのまま記述します。

  ```sql
  is_ip_address_in_range(client_ip, '2001:4860:4801::/48')
  ```

- **IPv4 CIDR → mapped IPv6 CIDR**：アドレスに `::ffff:` プレフィックスを付け、プレフィックス長に **+96** します（mapped アドレスの先頭 96 ビットは固定プレフィックス）。

  | IPv4 CIDR          | mapped IPv6 CIDR            |
  | ------------------ | --------------------------- |
  | `10.42.0.0/16`     | `::ffff:10.42.0.0/112`      |
  | `192.178.4.0/24`   | `::ffff:192.178.4.0/120`    |
  | `3.219.120.76/32`  | `::ffff:3.219.120.76/128`   |

  ```sql
  is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **IPv4 の完全一致**：mapped 値と比較します。

  ```sql
  client_ip = ipv4_to_ipv6(to_ipv4('3.219.120.76'))
  -- または
  client_ip = to_ipv6('::ffff:3.219.120.76')
  ```

- **許可リスト（範囲に該当する行のみ残す）**：`is_ip_address_in_range(...)` をそのままフィルタとして使用します。

  ```sql
  WHERE is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **拒否リスト（範囲に該当する行を除外する）**：`NOT is_ip_address_in_range(...)` を使用し、`is_ip_address_in_range(...) = 0` という書き方は避けます（インデックスへのプッシュダウンが難しくなります）。

  ```sql
  WHERE NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

完全な例（いくつかの範囲を除外する集計）。CIDR 範囲条件を含むため、実行前にしきい値を下げてインデックスの利用を確実にします：

```sql
SET inverted_index_skip_threshold = 0;

SELECT client_ip, COUNT(*) AS cnt
FROM access_log
WHERE request_time BETWEEN '2026-06-01 00:00:00' AND '2026-06-02 00:00:00'
  AND client_ip NOT IN (to_ipv6('::ffff:3.219.120.76'))               -- IPv4 完全一致の除外 -> mapped
  AND NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')   -- IPv4 /16 -> /112
  AND NOT is_ip_address_in_range(client_ip, '2001:4860:4801::/48')    -- IPv6 範囲
GROUP BY client_ip;
```

### インデックスを利用する前提条件

- 列はネイティブ `IPV4` / `IPV6` 型で、`USING INVERTED` の転置インデックスが張られている必要があります；
- `is_ip_address_in_range()` の CIDR 引数は**定数文字列**である必要があります；
- `IPV6` 列は IPv6 CIDR のみを処理し（IPv4 範囲は先に `::ffff:` mapped 形式に変換する必要があります）、`IPV4` 列は IPv4 CIDR のみを処理します。型と CIDR ファミリが一致しない場合はインデックスをスキップして式フィルタにフォールバックします；
- セッション変数 `inverted_index_skip_threshold` のデフォルトは `50`：セグメント内で 50% を超える行がインデックスにヒットすると、インデックスをスキップして直接読み取ります（bypass）。

:::caution CIDR 範囲クエリは `inverted_index_skip_threshold` を下げる必要があります
CIDR 範囲クエリでは、`is_ip_address_in_range()` は内部で `>= 範囲開始` と `<= 範囲終了` の 2 回の BKD クエリに分割されます。**片側それぞれのヒット行数が 50% を超えることが多く**（最終的な積集合が狭くても）、bypass がトリガーされインデックスがスキップされます。そのため、このようなクエリではセッションで `SET inverted_index_skip_threshold = 0;`（またはより小さい値）を設定して初めてインデックスを安定して利用できます。等価 / `IN` は高選択性のポイントルックアップであり、この影響を受けません。
:::

### keywords

IPV6
