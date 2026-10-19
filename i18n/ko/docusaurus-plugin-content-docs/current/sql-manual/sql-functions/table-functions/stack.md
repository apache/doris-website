---
{
    "title": "STACK",
    "language": "ko",
    "description": "stack 함수는 표현식을 행 우선 순서로 여러 행으로 분리하고 마지막 행의 부족한 값을 NULL로 채웁니다."
}
---

<version since="dev">

</version>

## 설명 {#description}

`stack`은 표현식 목록을 고정된 수의 행으로 분리합니다. 표현식은 행 우선 순서로 배치되며, 이는 Spark 및 Hive의 `stack` 함수와 호환됩니다. `stack`을 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용하면 생성된 열을 각 입력 행에 추가할 수 있습니다.

## 구문 {#syntax}

```sql
STACK(<num_rows>, <expr1> [, <expr2> ...])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<num_rows>` | 생성할 행 수를 지정하는 양의 정수 상수입니다. `3 - 1`과 같은 상수 표현식을 지원합니다. |
| `<expr1> [, <expr2> ...]` | 생성된 행에 분배할 표현식입니다. 같은 출력 열에 속한 NULL이 아닌 표현식은 타입이 정확히 같아야 합니다. 필요한 경우 명시적 캐스트를 사용하세요. 표현식은 입력 행의 열을 참조할 수 있습니다. |

## 반환값 {#return-value}

`<num_rows>`개의 행을 반환합니다. 출력 열의 수는 표현식 수를 `<num_rows>`로 나눈 값을 올림한 값입니다. 각 출력 열은 NULL이 아닌 표현식들이 공통으로 갖는 타입을 가지며, `NULL` 표현식만 포함하는 열은 `NULL` 타입을 가집니다. 값은 왼쪽에서 오른쪽으로 한 행씩 할당됩니다. 마지막 행에 표현식이 부족하면 누락된 값을 `NULL`로 채웁니다.

출력 열이 여러 개 생성되는 경우, `LATERAL VIEW` 절에 별칭을 지정하여 각 열에 이름을 부여하세요.

## 사용 시 참고 사항 {#usage-notes}

1. `<num_rows>`는 양의 정수 상수여야 합니다. 열 참조, 정수가 아닌 값, 영 또는 음수는 유효하지 않습니다.
2. 각 출력 열에 할당되는 `NULL`이 아닌 표현식은 타입이 같아야 합니다. `NULL` 표현식만 포함하는 열은 `NULL` 타입을 가집니다.
3. 값은 행 우선 순서로 배치됩니다. 첫 번째 출력 행에는 각 출력 열의 첫 번째 값이 할당되고, 두 번째 행에는 각 출력 열의 두 번째 값이 할당됩니다.
4. `stack`은 테이블 생성 함수이며 일반적으로 `LATERAL VIEW`와 함께 사용합니다.

## 예제 {#examples}

### 기본 사용법 {#basic-usage}

```sql
SELECT c1, c2
FROM (SELECT 1) t
LATERAL VIEW stack(2, 1, 2, 3) s AS c1, c2
ORDER BY c1, c2;
```

```text
+------+------+
| c1   | c2   |
+------+------+
|    1 |    2 |
|    3 | NULL |
+------+------+
```

### 행 우선 배치 {#row-major-layout}

```sql
SELECT c1, c2
FROM (SELECT 1) t
LATERAL VIEW stack(3, 1, 'a', 2, 'b', 3, 'c') s AS c1, c2
ORDER BY c1, c2;
```

```text
+------+------+
| c1   | c2   |
+------+------+
|    1 | a    |
|    2 | b    |
|    3 | c    |
+------+------+
```

마지막 행을 채우는 데 필요한 표현식이 부족하면 누락된 값은 `NULL`이 됩니다.

```sql
SELECT c1
FROM (SELECT 1) t
LATERAL VIEW stack(4, 1, 2, 3) s AS c1
ORDER BY c1;
```

```text
+------+
| c1   |
+------+
| NULL |
|    1 |
|    2 |
|    3 |
+------+
```

### 열 표현식과 타입 검사 {#column-expressions-and-type-checking}

```sql
SELECT id, c1, c2
FROM (
    SELECT 1 AS id, 10 AS a, 'x' AS s1, 20 AS b, 'y' AS s2
) AS test_stack
LATERAL VIEW stack(2, a, s1, b, s2) s AS c1, c2
ORDER BY id, c1, c2;
```

```text
+------+------+------+
| id   | c1   | c2   |
+------+------+------+
|    1 |   10 | x    |
|    1 |   20 | y    |
+------+------+------+
```

표현식은 각 입력 행에 대해 평가됩니다. 이 예제에서는 `a`와 `b`가 하나의 출력 열을 구성하고, `s1`과 `s2`가 다른 출력 열을 구성합니다. 하나의 출력 열에 할당된 표현식의 타입이 서로 호환되지 않으면 쿼리가 분석 오류를 반환합니다.

`NULL` 표현식은 다른 타입의 값과 함께 사용할 수 있습니다. `NULL` 값은 결과에서 부족한 값을 채우는 데 사용되거나 그대로 유지됩니다.

명시적으로 지정한 NULL 표현식은 그대로 유지됩니다.

```sql
SELECT c1
FROM (SELECT 1) t
LATERAL VIEW stack(2, 1, NULL) s AS c1
ORDER BY c1;
```

```text
+------+
| c1   |
+------+
| NULL |
|    1 |
+------+
```
