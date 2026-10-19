---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
    "language": "ko",
    "description": "expr 표현식의 왜도를 반환합니다. 이 함수에서 사용하는 공식은 3차 중심 모멘트 / ((분산)^{1.5})입니다."
}
---

## 설명 {#description}

expr 표현식의 [왜도](https://en.wikipedia.org/wiki/Skewness)를 반환합니다.
이 함수에서 사용하는 공식은 `3rd central moment / ((variance)^{1.5})`입니다.

**관련 명령**

[kurt](./kurt.md)

## 별칭 {#alias}

- SKEW
- SKEW_POP

## 구문 {#syntax}

```sql
SKEWNESS(<col>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 왜도를 계산할 열입니다. Double 타입을 지원합니다. |

## 반환 값 {#return-value}

expr 표현식의 왜도를 Double 타입으로 반환합니다.
분산이 영인 경우 NULL을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#examples}
```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL is ignored
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```

```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```

```sql
-- Each group just has one row, result is NULL
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```

```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
