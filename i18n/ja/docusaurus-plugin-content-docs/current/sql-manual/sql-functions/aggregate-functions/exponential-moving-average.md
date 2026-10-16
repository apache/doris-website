---
{
    "title": "EXPONENTIAL_MOVING_AVERAGE",
    "language": "ja",
    "description": "時間インデックスが付いた値について、指定した半減期間を用いて指数平滑移動平均を計算します。"
}
---

## 説明

時間インデックスが付いた値の指数平滑移動平均を計算します。`half_decay` パラメータは半減期間を制御します。これは、過去の値に対する指数関数的な重みが 1/2 に減衰するまでの時間です。

指数移動平均では新しい観測値ほど重みが大きくなり、時間の経過とともに重みが指数関数的に減衰します。この関数は、ノイズの多い時系列データを平滑化し、傾向を検出する場合に特に役立ちます。

アルゴリズムは次のとおりです。

- 各値に `2^(-dt / half_decay)` の重みを割り当てます。`dt` はその値と最新の時点との時間差です。
- 時点が単位間隔で並ぶと仮定し、重み付き合計を重みの合計 `1 / (1 - 2^(-1 / half_decay))` で割った値を結果とします。
- この関数は可換性と結合性を持つため、分散集計に適しています。

## 構文

```sql
EXPONENTIAL_MOVING_AVERAGE(<half_decay>, <value>, <timeunit>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<half_decay>` | 半減期間。定数の数値式である必要があります。サポートされる型は DOUBLE です。 |
| `<value>` | 平均を計算する数値列。サポートされる型は DOUBLE です。 |
| `<timeunit>` | 数値の時間インデックス（生のタイムスタンプではありません）。タイムスタンプ列を使用する場合は、`intDiv(toUnixTimestamp(ts), interval_seconds)` で変換します。サポートされる型は DOUBLE です。 |

## 戻り値

指数平滑移動平均を表す DOUBLE 値を返します。特殊なケースは次のとおりです。

- `half_decay` が 0 の場合、0 を返します。
- `<value>` または `<timeunit>` が NULL の行は計算から除外されます。
- グループ内に有効なデータがない場合、NULL を返します。

## 例

### 基本的な使い方

時間の経過に伴う温度の測定値について、指数移動平均を計算します。

```sql
-- setup
create table temparature_data (
    id int,
    temp double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into temparature_data values
    (1, 10, 1),
    (2, 20, 2),
    (3, 30, 3);
```

```sql
select exponential_moving_average(2.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(2.0, temp, ts) |
+----------------------------------------------------+
|                                  14.39339828220178 |
+----------------------------------------------------+
```

### 半減期間の影響

half_decay が小さいほど、新しい値の重みが大きくなります。

```sql
-- same data as above, but with half_decay=1
select exponential_moving_average(1.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(1.0, temp, ts) |
+----------------------------------------------------+
|                                              21.25 |
+----------------------------------------------------+
```

### GROUP BY と組み合わせる

```sql
-- setup
create table sensor_data (
    sensor_id int,
    reading double,
    ts double
) distributed by hash (sensor_id) buckets 1
properties ("replication_num"="1");

insert into sensor_data values
    (1, 10, 1),
    (1, 20, 2),
    (2, 100, 1),
    (2, 200, 2);
```

```sql
select sensor_id, exponential_moving_average(1.0, reading, ts)
from sensor_data group by sensor_id order by sensor_id;
```

```text
+-----------+-------------------------------------------------------+
| sensor_id | exponential_moving_average(1.0, reading, ts) |
+-----------+-------------------------------------------------------+
|         1 |                                                  12.5 |
|         2 |                                                   125 |
+-----------+-------------------------------------------------------+
```

### NULL の扱い

NULL 値を含む行は計算から除外されます。

```sql
-- setup
create table null_test (
    id int,
    val double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into null_test values
    (1, 10, 1),
    (2, null, 2),
    (3, 20, 3);
```

```sql
select exponential_moving_average(1.0, val, ts) from null_test;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            11.25 |
+-------------------------------------------------+
```

### 空の結果セット

結果セットが空の場合、NULL を返します。

```sql
select exponential_moving_average(1.0, val, ts) from null_test where val > 100;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            NULL |
+-------------------------------------------------+
```

### ウィンドウ関数として使用する

```sql
-- setup
create table time_series (
    ts double,
    val double
) distributed by hash (ts) buckets 1
properties ("replication_num"="1");

insert into time_series values (0, 10), (1, 10), (2, 10);
```

```sql
select
    ts,
    exponential_moving_average(1.0, val, ts)
        over (order by ts rows between unbounded preceding and current row) as ema
from time_series order by ts;
```

```text
+------+-------+
| ts   | ema   |
+------+-------+
|    0 |     5 |
|    1 |   7.5 |
|    2 |  8.75 |
+------+-------+
```

### 定数の要件

`half_decay` パラメータは定数である必要があります。列式を指定するとエラーになります。

```sql
-- this will cause an error: half_decay must be a constant
select exponential_moving_average(val, val, ts) from temparature_data;
```
