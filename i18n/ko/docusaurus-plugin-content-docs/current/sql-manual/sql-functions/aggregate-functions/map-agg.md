---
{
    "title": "MAP_AGG",
    "language": "ko",
    "description": "MAPAGG 함수는 여러 데이터 행의 키-값 쌍을 바탕으로 매핑 구조를 만드는 데 사용됩니다."
}
---

## 설명 {#description}

MAP_AGG 함수는 여러 데이터 행의 키-값 쌍을 바탕으로 매핑 구조를 만드는 데 사용됩니다.

중복 키가 있는 경우, `MAP_AGG`는 집계 중 처음 발견한 값을 유지하고 이미 존재하는 키의 이후 값은 무시합니다. 부분 집계 상태를 병합할 때도 병합 대상 상태에 이미 존재하는 값이 유지됩니다.

“처음 발견한 값”은 삽입 순서가 아니라 처리 순서를 기준으로 합니다. 스캔, 병렬 실행, 부분 상태의 병합 순서에 따라 유지되는 값이 달라질 수 있으므로, 중복 키에 대해 선택되는 값이 쿼리마다 동일하다고 보장할 수 없습니다. 외부 `ORDER BY`는 결과 행만 정렬하며, 중복 키에 대해 어떤 값이 유지되는지는 결정하지 않습니다.

## 구문 {#syntax}

```sql
MAP_AGG(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | 키로 사용할 표현식입니다. 지원되는 타입: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, String, UUID. |
| `<expr2>` | 값으로 사용할 표현식입니다. 지원되는 타입: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, String, UUID. |

## 반환 값 {#return-value}

Map 타입의 값을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 Map을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE nation (
    n_nationkey INT,
    n_name STRING,
    n_regionkey INT
) DISTRIBUTED BY HASH(n_nationkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO nation VALUES
    (0, 'ALGERIA', 0),
    (1, 'ARGENTINA', 1),
    (2, 'BRAZIL', 1),
    (3, 'CANADA', 1);
```

```sql
select `n_regionkey`, map_agg(`n_nationkey`, `n_name`) from `nation` group by `n_regionkey`;
```

```text
+-------------+-----------------------------------------+
| n_regionkey | map_agg(`n_nationkey`, `n_name`)        |
+-------------+-----------------------------------------+
|           0 | {0:"ALGERIA"}                           |
|           1 | {1:"ARGENTINA", 2:"BRAZIL", 3:"CANADA"} |
+-------------+-----------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation`;
```

```text
+------------------------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5)                 |
+------------------------------------------------------+
| {"ALGERIA":0, "ARGENTINA":1, "BRAZIL":2, "CANADA":3} |
+------------------------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation` where n_nationkey is null;
```

```text
+--------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5) |
+--------------------------------------+
| {}                                   |
+--------------------------------------+
```

다음 쿼리에는 중복 키가 있으므로 결과에는 키-값 쌍이 하나만 포함됩니다. 어떤 값이 먼저 처리되는지에 따라 결과는 `{1:"a"}` 또는 `{1:"b"}`가 될 수 있습니다. 가능한 출력의 한 예는 다음과 같습니다.

```sql
SELECT MAP_AGG(k, v) AS result
FROM (
    SELECT 1 AS k, 'a' AS v
    UNION ALL
    SELECT 1 AS k, 'b' AS v
) AS input;
```

```text
+---------+
| result  |
+---------+
| {1:"a"} |
+---------+
```
