---
{
    "title": "IPV6",
    "language": "ja",
    "description": "IPv6 アドレスを表す型で、16 バイトの UInt128 形式で格納されます。値の範囲は ['::',"
}
---

## IPV6

### 説明

IPv6 型は IPv6 アドレスを表し、16 バイトの UInt128 形式で格納されます。
値の範囲は ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'] です。

値の範囲を超える入力や形式が無効な入力は NULL を返します。

`Inputs that exceed the value range or have invalid format will return NULL`

### 例

テーブルの作成例：

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

データの挿入例：

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```

データの検索例：

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

## ベストプラクティス：転置インデックス付きの単一の IPV6 列に IPv4 と IPv6 を混在させて格納する

単一の `IPV6` 列には IPv4 と IPv6 の両方のアドレスを格納できます。IPv4 は IPv4 マップド IPv6 形式（`::ffff:x.y.z.w`）で書き込みます。たとえば `192.168.1.1` は `::ffff:192.168.1.1` として格納します。ネイティブ IPv6（`2001:16a0:2:200a::2` など）はそのまま書き込みます。これにより、両方のアドレスが混在する IP フィールドを単一の列で管理できます。その列に転置インデックスを作成すると、等価比較（`=`）、`IN`、`is_ip_address_in_range()` などの CIDR 関数を使った IP フィルタリングが高速になります。

### スキーマ

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

### ロード時の正規化

どのロード方法でも、列マッピングに同じ式を使い、元の IP 文字列を IPv6 に変換することが重要です（以下では `ip_str` が入力フィールド、`client_ip` がテーブルの `IPV6` 列です）。

```sql
client_ip = COALESCE(
    ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
    to_ipv6_or_null(ip_str)
)
```

- 通常の IPv4 文字列は、まず `IPV4` として `to_ipv4_or_null()` で解析し、次に `::ffff:x.y.z.w` 形式へ `ipv4_to_ipv6()` で変換します。
- 有効な IPv4 でない場合、`COALESCE` は `to_ipv6_or_null()` に切り替え、ネイティブ IPv6 の文字列として解析します。
- 両方の解析に失敗した場合は `NULL` を書き込みます。無効なデータを拒否するには、代わりに `_or_null` を厳格な `to_ipv4` / `to_ipv6` に置き換え、ロード時のエラーしきい値で処理します。

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

`columns` ヘッダーに同じ変換を指定します。

```shell
curl --location-trusted -u user:passwd \
  -H "format: csv" \
  -H "column_separator: ," \
  -H "columns: id, request_time, ip_str, client_ip=COALESCE(ipv4_to_ipv6(to_ipv4_or_null(ip_str)), to_ipv6_or_null(ip_str))" \
  -T data.csv \
  "http://<fe_host>:8030/api/example_db/access_log/_stream_load"
```

#### INSERT INTO（旧 VARCHAR テーブルからの移行）

`SELECT` で元の IP 文字列を IPv6 に変換します（`ip_str` は旧テーブルの VARCHAR 列です）。

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

すべてを IPv6 マップド形式で格納した後は、**IPv4 の検索条件も対応する IPv6 形式に書き換える必要があります**。書き換えない場合、型またはアドレスファミリーが一致せず、インデックスが使用されません。

- **IPv6 CIDR**：そのまま指定します。

  ```sql
  is_ip_address_in_range(client_ip, '2001:4860:4801::/48')
  ```

- **IPv4 CIDR → マップド IPv6 CIDR**：アドレスに `::ffff:` プレフィックスを追加し、プレフィックス長に **+96** を加えます（マップドアドレスの先頭 96 ビットは固定のプレフィックスです）。

  | IPv4 CIDR          | マッピング後の IPv6 CIDR    |
  | ------------------ | --------------------------- |
  | `10.42.0.0/16`     | `::ffff:10.42.0.0/112`      |
  | `192.178.4.0/24`   | `::ffff:192.178.4.0/120`    |
  | `3.219.120.76/32`  | `::ffff:3.219.120.76/128`   |

  ```sql
  is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **IPv4 の完全一致**：マッピング後の値と比較します。

  ```sql
  client_ip = ipv4_to_ipv6(to_ipv4('3.219.120.76'))
  -- or
  client_ip = to_ipv6('::ffff:3.219.120.76')
  ```

- **許可リスト（範囲内の行だけを残す）**：`is_ip_address_in_range(...)` をそのままフィルター条件に使います。

  ```sql
  WHERE is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **拒否リスト（範囲内の行を除外する）**：`NOT is_ip_address_in_range(...)` を使います。`is_ip_address_in_range(...) = 0` はインデックスにプッシュダウンしにくいため避けます。

  ```sql
  WHERE NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

完全な例（複数の範囲を除外する統計クエリ）を示します。CIDR 範囲条件が含まれるため、インデックスを使用させるには、先にしきい値を下げます。

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

### インデックスが使用される条件

- 対象の列はネイティブの `IPV4` / `IPV6` 型であり、その列に `USING INVERTED` の転置インデックスが作成されている必要があります。
- `is_ip_address_in_range()` の CIDR 引数は**定数文字列**である必要があります。
- `IPV6` 列は IPv6 CIDR のみを処理します（IPv4 の範囲は先に `::ffff:` 形式に変換する必要があります）。`IPV4` 列は IPv4 CIDR のみを処理します。型と CIDR のアドレスファミリーが一致しない場合、インデックスは使用されず、式によるフィルタリングに切り替わります。
- セッション変数 `inverted_index_skip_threshold` のデフォルト値は `50` です。セグメント内でインデックスに一致する行が 50% を超えると、インデックスを使用せずにデータを直接読み取ります（バイパス）。

:::caution CIDR 範囲クエリでは `inverted_index_skip_threshold` を下げてください
CIDR 範囲クエリでは、`is_ip_address_in_range()` は内部で範囲の開始を表す `>= range start` と範囲の終了を表す `<= range end` という二つの BKD クエリに分割されます。最終的な共通部分が狭くても、**各条件は単独で行の 50% を超えて一致することが多く**、バイパスが発生してインデックスが使用されません。このようなクエリで確実にインデックスを使用するには、セッションで `SET inverted_index_skip_threshold = 0;`（またはより小さい値）を指定します。等価比較や `IN` は選択性の高い点検索なので、この問題の影響を受けません。
:::

### キーワード

IPV6
