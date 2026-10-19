---
{
    "title": "NULL",
    "language": "ko",
    "description": "행의 특정 열에 값이 없으면 해당 열은 NULL이라고 합니다. NULL은 \"NOT NULL\" 제약 조건이 없는 모든 열에 나타날 수 있습니다."
}
---

## NULL 기본 개념 {#basic-introduction-to-null}

행의 특정 열에 값이 없으면 해당 열은 NULL이라고 합니다. NULL은 "NOT NULL" 제약 조건이 없는 모든 열에 나타날 수 있습니다. 실제 값을 알 수 없거나 값이 의미가 없는 경우 NULL을 사용합니다.

숫자 영이나 빈 문자열을 나타내는 데 NULL을 사용하지 마세요. 이들은 서로 같지 않습니다.

NULL이 포함된 산술 표현식의 결과는 항상 NULL입니다. 예를 들어, NULL에 10을 더해도 결과는 NULL입니다. 실제로 모든 연산자는 피연산자로 NULL이 주어지면 NULL을 반환합니다.

## 함수 인수로 사용되는 NULL {#null-as-a-function-argument}

NULL이 인수로 전달되면 대부분의 집계 함수는 NULL을 반환합니다. IFNULL 함수를 사용하면 NULL 값이 발생했을 때 다른 값을 반환할 수 있습니다. 예를 들어, IFNULL(arg, 0) 표현식은 arg가 NULL이면 0을 반환하고, arg가 NULL이 아니면 해당 값을 반환합니다. 각 함수의 구체적인 동작은 "함수" 섹션을 참조하세요.

## NULL과 비교 연산자 {#null-and-comparison-operators}

결과가 NULL인지 확인하려면 비교 조건 IS NULL과 IS NOT NULL만 사용할 수 있습니다. NULL에 의존하는 조건을 사용하면 결과는 UNKNOWN입니다. NULL은 누락된 데이터를 나타내므로, NULL은 어떤 값이나 다른 NULL과 같거나 다르다고 판단할 수 없습니다.

비교가 가능한 상황(예: 내부 값이 NULL인 중첩 타입 비교)에서는 NULL을 항상 현재 타입으로 표현할 수 있는 모든 값보다 작은 것으로 간주합니다. 즉, NULL 자체를 제외한 모든 값보다 작습니다.

```sql
select array(null) < array(-1), array(null) > array(-1);
+-------------------------+-------------------------+
| array(null) < array(-1) | array(null) > array(-1) |
+-------------------------+-------------------------+
|                       1 |                       0 |
+-------------------------+-------------------------+

select array(cast("nan" as double)) > array(null);
+--------------------------------------------+
| array(cast("nan" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+

select array(cast("inf" as double)) > array(null);
+--------------------------------------------+
| array(cast("inf" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```

## 조건식에서의 NULL {#null-in-conditions}

UNKNOWN으로 평가되는 조건은 FALSE와 거의 동일하게 동작합니다. 예를 들어, SELECT 문의 WHERE 절에 있는 조건이 UNKNOWN으로 평가되면 행을 반환하지 않습니다. 다만 UNKNOWN으로 평가되는 조건과 FALSE로 평가되는 조건의 차이는 UNKNOWN 조건의 평가 결과에 추가 연산을 수행해도 UNKNOWN으로 평가된다는 점입니다. 따라서 NOT FALSE의 연산 결과는 TRUE이지만, NOT UNKNOWN의 연산 결과는 UNKNOWN입니다.

아래 테이블은 조건식에서 NULL이 포함된 다양한 평가 예를 보여 줍니다. SELECT 문의 WHERE 절에 UNKNOWN으로 평가되는 조건을 사용하면 쿼리는 행을 반환하지 않습니다.

| **조건식**   | **A의 값** | **평가 결과** |
| :-------------- | :------------- | :------------- |
| `a IS NULL`     | `10`           | `FALSE`        |
| `a IS NOT NULL` | `10`           | `TRUE`         |
| `a IS NULL`     | `NULL`         | `TRUE`         |
| `a IS NOT NULL` | `NULL`         | `FALSE`        |
| `a = NULL`      | `10`           | `UNKNOWN`      |
| `a != NULL`     | `10`           | `UNKNOWN`      |
| `a = NULL`      | `NULL`         | `UNKNOWN`      |
| `a != NULL`     | `NULL`         | `UNKNOWN`      |
| `a = 10`        | `NULL`         | `UNKNOWN`      |
| `a != 10`       | `NULL`         | `UNKNOWN`      |
