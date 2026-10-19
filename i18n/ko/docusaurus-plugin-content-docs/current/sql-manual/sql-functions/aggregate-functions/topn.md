---
{
    "title": "TOPN",
    "language": "ko",
    "description": "TOPN 함수는 지정된 열에서 가장 자주 나타나는 N개의 값을 반환합니다."
}
---

## 설명 {#description}

TOPN 함수는 지정된 열에서 가장 자주 나타나는 N개의 값을 반환합니다. 이 함수는 근사 계산 함수로, 출현 횟수를 기준으로 내림차순 정렬된 결과를 반환합니다.

## 구문 {#syntax}

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 출현 횟수를 집계할 열 또는 표현식입니다. 지원되는 타입: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, IPV4, IPV6, UUID, String. |
| `<top_num>` | 반환할 최빈값의 개수입니다. 양의 INT 상수여야 합니다. |
| `<space_expand_rate>` | 선택적 INT 상수이며, 기본값은 50입니다. 양수이면 중간 상태를 직렬화할 때 최대 `top_num * space_expand_rate`개의 후보를 유지합니다. 일반적으로 값이 클수록 정확도가 높아집니다. 이 값은 로컬 집계 메모리의 엄격한 상한이 아닙니다. Doris 4.1 계열에서는 4.1.5부터 값이 0 이하이면 모든 중간 후보를 유지하지만, 최종 결과에는 여전히 최대 `top_num`개의 값만 포함됩니다. 이 모드는 더 많은 메모리를 사용할 수 있으며, 쿼리 메모리 제한이 계속 적용됩니다. |

## 반환값 {#return-value}

값과 각 값의 출현 횟수가 포함된 JSON 문자열을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}
```sql
-- setup
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');
```

```sql
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits;
```

방문 횟수가 가장 많은 상위 3개 페이지를 찾습니다.

```text
+---------------------+
| top_pages           |
+---------------------+
| {"1":4,"2":2,"4":1} |
+---------------------+
```

```sql
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits where page_id is null;
```

```text
+-----------+
| top_pages |
+-----------+
| NULL      |
+-----------+
```

모든 중간 후보를 유지하되, 가장 자주 나타나는 값만 반환합니다:

```sql
SELECT TOPN(s, 1, 0)
FROM (SELECT 'a' AS s UNION ALL SELECT 'b' UNION ALL SELECT 'a') t;
```

```text
{"a":2}
```
