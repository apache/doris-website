---
{
    "title": "조건부 함수 개요",
    "language": "ko",
    "description": "조건부 함수는 SQL 쿼리에서 조건에 따른 논리 처리와 분기를 수행하는 내장 함수입니다."
}
---

# 조건부 함수 개요 {#conditional-functions-overview}

조건부 함수는 SQL 쿼리에서 조건에 따른 논리 처리와 분기를 수행하는 내장 함수입니다. 값 선택, NULL 값 처리, 조건별 로직 수행 등 지정된 조건에 따라 서로 다른 작업을 실행하는 데 사용됩니다.

## 벡터화 실행과 조건부 함수 {#vectorized-execution-and-conditional-functions}

Doris는 벡터화 실행 엔진입니다. 하지만 조건부 함수는 직관과 다르게 동작할 수 있습니다.

다음 예제를 살펴보겠습니다.

```sql
mysql> set enable_strict_cast = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Value 128 out of range for type tinyint
```

이 예제에서는 `tinyint`로의 형 변환을 `number < 128`일 때만 수행하도록 `if` 함수를 사용했는데도 오류가 발생합니다. 이는 `if(cond, colA, colB)`와 같은 조건부 함수가 기존에 다음과 같은 방식으로 실행되었기 때문입니다.

1. 먼저 `colA`와 `colB`를 모두 완전히 계산합니다
2. 그런 다음 `cond`의 값에 따라 해당 결과를 선택하여 반환합니다

따라서 `colA`의 값이 실제로 사용되지 않더라도 `colA`가 완전히 계산되므로 오류가 발생합니다.

`if`, `ifnull`, `case`, `coalesce`와 같은 함수도 비슷하게 동작합니다.

`LEAST`와 같은 함수는 값을 비교하려면 본질적으로 모든 매개변수를 계산해야 하므로 이 문제가 발생하지 않습니다.

## 단락 평가 {#short-circuit-evaluation}

Doris 4.0.4에서는 단락 평가를 지원하도록 조건부 함수의 실행 로직을 개선했습니다.

```sql
mysql> set short_circuit_evaluation = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
+--------------------------------------------------------------------------+
| count(if(number < 128, cast(number as tinyint), cast(number as String))) |
+--------------------------------------------------------------------------+
|                                                                      300 |
+--------------------------------------------------------------------------+
```

단락 평가를 활성화하면 `if`, `ifnull`, `case`, `coalesce`와 같은 함수가 여러 상황에서 불필요한 계산을 건너뛸 수 있어 오류를 방지하고 성능을 개선할 수 있습니다.

### 단락 평가 활성화 {#enabling-short-circuit-evaluation}

단락 평가를 활성화하려면 다음과 같이 세션 변수를 설정합니다.

```sql
SET short_circuit_evaluation = true;
```

### 단락 평가의 이점 {#benefits-of-short-circuit-evaluation}

1. **오류 방지**: 조건에 따라 제외된 분기를 실행하지 않아 해당 분기에서 발생할 수 있는 오류를 방지합니다
2. **성능 개선**: 실제로 필요한 분기만 평가하여 불필요한 계산을 줄입니다
3. **더 직관적인 동작**: 조건부 함수가 일반적인 프로그래밍 언어의 조건문과 더 유사하게 동작합니다

## 자주 사용하는 조건부 함수 {#common-conditional-functions}

단락 평가의 이점을 얻을 수 있는 대표적인 조건부 함수는 다음과 같습니다.

- `IF`: 조건에 따라 두 값 중 하나를 반환합니다
- `IFNULL`: 첫 번째 인수가 NULL이 아니면 해당 인수를 반환하고, 그렇지 않으면 두 번째 인수를 반환합니다
- `CASE`: switch-case 문과 유사한 여러 조건 분기를 제공합니다
- `COALESCE`: 인수 목록에서 NULL이 아닌 첫 번째 값을 반환합니다
- `NULLIF`: 두 인수가 같으면 NULL을 반환하고, 그렇지 않으면 첫 번째 인수를 반환합니다

각 함수에 대한 자세한 내용은 해당 함수의 문서 페이지를 참조하세요.
