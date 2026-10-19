---
{
    "title": "TOPN_ARRAY",
    "language": "ko",
    "description": "TOPNARRAY는 지정된 열에서 가장 자주 나타나는 N개의 값을 배열로 반환합니다."
}
---

## 설명 {#description}

TOPN_ARRAY는 지정된 열에서 가장 자주 나타나는 N개의 값을 배열로 반환합니다. 이 함수는 근사 계산 함수이며, 빈도의 내림차순으로 정렬된 결과를 반환합니다.

## 구문 {#syntax}

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 빈도를 집계할 열 또는 표현식입니다. 지원되는 타입: Boolean(Doris 4.1 계열에서는 4.1.5 버전부터 지원), TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, IPV4, IPV6, String. |
| `<top_num>` | 반환할 최빈값의 개수입니다. 양의 INT 상수여야 합니다. |
| `<space_expand_rate>` | 선택 사항인 INT 상수이며, 기본값은 50입니다. 양수이면 중간 상태를 직렬화할 때 최대 `top_num * space_expand_rate`개의 후보를 유지합니다. 값이 클수록 일반적으로 정확도가 높아집니다. 이 값은 로컬 집계 메모리의 상한을 강제하지는 않습니다. Doris 4.1 계열에서는 4.1.5 버전부터 값이 0 이하이면 모든 중간 후보를 유지하며, 최종 결과에는 여전히 최대 `top_num`개의 값만 포함됩니다. 이 모드는 더 많은 메모리를 사용할 수 있으며, 쿼리 메모리 제한이 계속 적용됩니다. |

## 반환값 {#return-value}

가장 자주 나타나는 N개의 값을 포함하는 배열을 반환합니다.
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
SELECT TOPN_ARRAY(page_id, 3) as top_pages
FROM page_visits;
```

방문 횟수가 가장 많은 상위 3개 페이지를 찾습니다.

```text
+-----------+
| top_pages |
+-----------+
| [1, 2, 4] |
+-----------+
```

```sql
SELECT TOPN_ARRAY(page_id, 3) as top_pages FROM page_visits where page_id is null;
```

```text
+-----------+
| top_pages |
+-----------+
| NULL      |
+-----------+
```

BOOLEAN 입력(Doris 4.1 계열에서는 4.1.5 버전부터 지원):

```sql
SELECT TOPN_ARRAY(TRUE, 2), TOPN_ARRAY(CAST(NULL AS BOOLEAN), 2);
```

```text
[1]    NULL
```
