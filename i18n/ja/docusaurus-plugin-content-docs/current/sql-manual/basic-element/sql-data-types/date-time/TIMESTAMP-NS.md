---
{
    "title": "TIMESTAMP_NS",
    "language": "ja",
    "description": "TIMESTAMP_NS は、タイムゾーン情報を持たない日付と時刻を、固定のナノ秒精度で格納します。"
}
---

## 説明

`TIMESTAMP_NS` は、タイムゾーン情報を持たない日付と時刻を、固定のナノ秒精度で格納します。イベントの発生時刻やトレースなど、`DATETIME(6)` のマイクロ秒精度では不十分なデータに使用します。

Doris は内部的に、Unix エポックを基準とするナノ秒数を符号付き 64 ビット整数として格納します。そのため、`TIMESTAMP_NS` 列のサイズは 8 バイトで、正確な値の範囲は次のとおりです。

```text
[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]
```

出力形式は `yyyy-MM-dd HH:mm:ss.SSSSSSSSS` です。小数部の九桁は、末尾がゼロの場合も常に表示されます。

`DATETIME(p)` と異なり、`TIMESTAMP_NS` の精度は変更できません。`TIMESTAMP_NS(9)` のような宣言は無効です。

`TIMESTAMP_NS` は、キー列、パーティション列、バケット列、シーケンス列、値列として使用できます。また、`ARRAY`、`MAP`、`STRUCT`、型付き `VARIANT` の値でもサポートされます。

## 構文

```sql
TIMESTAMP_NS
```

## タイムゾーンの扱い

`TIMESTAMP_NS` はタイムゾーンを格納しません。セッション変数 `time_zone` を変更しても、格納済みの値は変わりません。

入力文字列にタイムゾーンのオフセットまたは名前が含まれる場合、Doris は解析時に入力をセッションまたは取り込み時のタイムゾーンに変換し、その結果のローカルな日付と時刻をタイムゾーン情報なしで格納します。入力にタイムゾーンがない場合は、その日付と時刻の各要素をそのまま格納します。

異なるセッションタイムゾーンで表示する必要がある特定の時点を表す値には、代わりに [`TIMESTAMPTZ`](./TIMESTAMPTZ.md) を使用してください。

## 変換と演算

文字列には、小数秒を最大九桁まで指定できます。それを超える桁数を指定すると、Doris はナノ秒単位に丸めます。この丸めによって、次の秒や日付への繰り上がりが発生する場合があります。サポートされる範囲外の値は無効です。

`TIMESTAMP_NS` は、数値型、文字型、`DATE`、`DATETIME`、`TIME`、`TIMESTAMPTZ`、`VARIANT` 型との相互変換をサポートします。精度の低い日時型に変換すると、値は変換先の精度に丸められます。詳しい規則については、[TIMESTAMP_NS へのキャスト](../conversion/timestamp-ns-conversion.md) を参照してください。

`TIMESTAMP_NS` は、日時の抽出、書式設定、算術演算、比較、集約、条件処理、ウィンドウ関数で使用できます。結果が `TIMESTAMP_NS` のままである演算では、小数秒の九桁すべてが保持されます。結果がサポートされる範囲を超える演算では、値が循環する代わりにエラーが報告されます。

ナノ秒固有の演算については、[`NANOSECOND`](../../../sql-functions/scalar-functions/date-time-functions/nanosecond.md)、[`NANOSECONDS_ADD`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-add.md)、[`NANOSECONDS_SUB`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-sub.md)、[`NANOSECONDS_DIFF`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-diff.md) を参照してください。

## 例

テーブルを作成し、ナノ秒精度の値を格納します。

```sql
CREATE TABLE events (
    id BIGINT,
    event_time TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO events VALUES
    (1, '1970-01-01 00:00:00.000000001'),
    (2, '2024-02-29 12:34:56.123456789'),
    (3, NULL);

SELECT * FROM events ORDER BY id;
```

```text
+------+-------------------------------+
| id   | event_time                    |
+------+-------------------------------+
|    1 | 1970-01-01 00:00:00.000000001 |
|    2 | 2024-02-29 12:34:56.123456789 |
|    3 | NULL                          |
+------+-------------------------------+
```

小数秒の十桁目はナノ秒単位に丸められます。

```sql
SELECT CAST('1970-01-01 00:00:00.1234567895' AS TIMESTAMP_NS) AS ts;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 1970-01-01 00:00:00.123456790 |
+-------------------------------+
```

タイムゾーンの接尾辞は、入力の解析時にのみ適用されます。セッションタイムゾーンを変更しても、格納済みの値は変わりません。

```sql
SET time_zone = '+08:00';
CREATE TABLE timezone_example (
    id INT,
    ts TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO timezone_example VALUES
    (1, '2023-08-17T01:41:18.123456789Z');

SET time_zone = '+00:00';
SELECT ts FROM timezone_example;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 2023-08-17 09:41:18.123456789 |
+-------------------------------+
```

`NULL` を入力すると `NULL` が返されます。

```sql
SELECT CAST(NULL AS TIMESTAMP_NS) AS ts;
```

```text
+------+
| ts   |
+------+
| NULL |
+------+
```
