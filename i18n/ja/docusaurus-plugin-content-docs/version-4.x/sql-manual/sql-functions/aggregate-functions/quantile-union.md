---
{
    "title": "QUANTILE_UNION",
    "language": "ja",
    "description": "QUANTILEUNION 関数は分位数計算の複数の中間結果を統合します。"
}
---

## 説明

`QUANTILE_UNION` 関数は分位数計算の複数の中間結果を統合します。通常は `QUANTILE_STATE` と併用し、多段階の分位数計算が必要な場合に適しています。

## 構文

```sql
QUANTILE_UNION(<query_state>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<query_state>` | 集約するデータ。QuantileState 型をサポートします。 |

## 戻り値

後続の分位数計算に使用する QuantileState 型の集約状態を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 使用例

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5, 'east'),
(2, 15.2, 'east'),
(3, 20.1, 'west'),
(4, 25.8, 'east'),
(5, 30.3, 'west'),
(6, 35.7, 'east'),
(7, 40.2, 'west'),
(8, 45.9, 'east'),
(9, 50.4, 'west'),
(10, 100.6, 'east');
```

```sql
SELECT 
    region,
    QUANTILE_PERCENT(
        QUANTILE_UNION(
            TO_QUANTILE_STATE(response_time, 2048)
        ),
        0.5
    ) AS median_response_time
FROM response_times
GROUP BY region;
```

地域別の応答時間の第 50 パーセンタイルを計算します。

```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```

```sql
SELECT QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048))
FROM response_times where response_time is null;
```

グループ内に有効なデータがない場合は NULL を返します。

```text
+--------------------------------------------------------+
| QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048)) |
+--------------------------------------------------------+
| NULL                                                   |
+--------------------------------------------------------+
```
