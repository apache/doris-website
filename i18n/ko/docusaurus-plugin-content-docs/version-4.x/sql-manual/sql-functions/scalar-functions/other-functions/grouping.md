---
{
    "title": "GROUPING",
    "language": "ko",
    "description": "GROUP BY 목록에서 지정한 컬럼 표현식이 집계되었는지 여부를 나타냅니다. GROUPING은 컬럼이 집계된 경우 1을 반환합니다(즉,"
}
---

## 설명 {#description}

GROUP BY 목록에서 지정한 컬럼 표현식이 집계되었는지 여부를 나타냅니다. GROUPING은 컬럼이 집계된 경우(즉, ROLLUP, CUBE 또는 GROUPING SETS가 생성한 요약 행에서 가져온 경우) 1을 반환하고, 집계되지 않은 경우 0을 반환합니다. 이 함수는 이러한 연산이 생성한 NULL 값과 데이터에 실제로 존재하는 NULL 값을 구분하는 데 유용합니다.

## 구문 {#syntax}

```sql
GROUPING( <column_expression> )
```

## 매개변수 {#parameters}

| 매개변수             | 설명                                                                  |
|-----------------------|------------------------------------------------------------------------------|
| `<column_expression>` | GROUP BY 절에 나타나는 컬럼 또는 표현식입니다.               |

## 반환값 {#return-value}

BIGINT 값을 반환합니다. 지정한 컬럼 표현식이 집계된 경우 1을 반환하고, 집계되지 않은 경우 0을 반환합니다.

## 예제 {#examples}

다음 예제는 `camp` 컬럼을 기준으로 그룹화하고 `occupation`의 개수를 집계합니다. GROUPING 함수를 `camp` 컬럼에 적용하여 ROLLUP 연산이 추가한 요약 행과 데이터에 실제로 존재하는 NULL 값을 구분합니다.

```sql
CREATE TABLE `roles` (
  role_id       INT,
  occupation    VARCHAR(32),
  camp          VARCHAR(32),
  register_time DATE
)
UNIQUE KEY(role_id)
DISTRIBUTED BY HASH(role_id) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO `roles` VALUES
(0, 'who am I', NULL, NULL),
(1, 'mage', 'alliance', '2018-12-03 16:11:28'),
(2, 'paladin', 'alliance', '2018-11-30 16:11:28'),
(3, 'rogue', 'horde', '2018-12-01 16:11:28'),
(4, 'priest', 'alliance', '2018-12-02 16:11:28'),
(5, 'shaman', 'horde', NULL),
(6, 'warrior', 'alliance', NULL),
(7, 'warlock', 'horde', '2018-12-04 16:11:28'),
(8, 'hunter', 'horde', NULL);

SELECT 
  camp, 
  COUNT(occupation) AS occ_cnt,
  GROUPING(camp) AS grouping
FROM
  `roles`
GROUP BY
  ROLLUP(camp);
```

결과 집합의 `camp` 컬럼에는 NULL 값이 두 개 표시됩니다. grouping 값이 1인 첫 번째 NULL은 ROLLUP 연산이 추가한 요약 행으로, 모든 `camp` 그룹의 집계 결과를 나타냅니다. grouping 값이 0인 두 번째 NULL은 데이터에 실제로 존재하는 NULL 값을 나타냅니다.

```text
+----------+---------+----------+
| camp     | occ_cnt | grouping |
+----------+---------+----------+
| NULL     |       9 |        1 |
| NULL     |       1 |        0 |
| alliance |       4 |        0 |
| horde    |       4 |        0 |
+----------+---------+----------+
```
