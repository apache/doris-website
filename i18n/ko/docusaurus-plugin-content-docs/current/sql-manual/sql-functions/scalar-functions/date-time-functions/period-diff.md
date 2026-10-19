---
{
    "title": "PERIOD_DIFF",
    "language": "ko",
    "description": "두 연월 간의 개월 수 차이를 계산합니다."
}
---

## 설명 {#description}
두 연월 간의 개월 수 차이를 계산합니다.

여기서 `<period>`는 정수이며, 마지막 두 자리는 월(01-12)을, 그 앞의 숫자는 연도를 나타냅니다.
이 함수는 period_1 - period_2를 계산한 결과를 부호를 포함하여 반환합니다.

연도 부분이 100보다 작으면 [정해진 규칙](#parameters)에 따라 네 자리 연도 형식으로 변환됩니다.

이 함수의 동작은 MySQL의 [PERIOD_DIFF 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-diff)와 일치합니다.

## 구문 {#syntax}

```sql
PERIOD_DIFF(`<period_1>`, `<period_2>`)
```

## 매개변수 {#parameters}

| 매개변수      | 설명                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------|
| `<period_1>`   | 연도와 월로 구성된 연월을 나타냅니다. <ul><li>**형식**: 마지막 두 자리는 월을 나타내며, 반드시 `[1, 12]` 범위에 있어야 합니다. 그 앞의 숫자는 연도를 나타내며, 연도의 자릿수에는 제한이 없으므로 네 자리를 초과할 수 있습니다.</li><li>**연도 추론**: 마지막 두 자리를 제외한 모든 숫자를 그대로 연도 값으로 사용합니다. 연도가 두 자리 숫자(범위: [00, 99])인 경우, 70보다 작으면 20YY로 해석하고, 70 이상이면 19YY로 해석합니다.</li><li>**값 범위**: `[0, 2^63-1]` 범위의 정수 매개변수를 허용합니다.</li></ul> |
| `<period_2>`   | 다른 연월을 나타냅니다. 형식 요건은 `<period_1>`과 같습니다. |

## 반환 값 {#return-value}

`<period_1>`의 총 개월 수에서 `<period_2>`의 총 개월 수를 뺀 정수를 반환합니다.

매개변수 중 하나라도 NULL이거나 값을 BIGINT로 변환할 수 없으면 NULL을 반환합니다.

매개변수가 음수이거나 월 부분이 유효하지 않으면 함수에서 오류가 발생합니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE test_period_diff (period_1 LARGEINT, period_2 LARGEINT) DISTRIBUTED BY HASH(period_1) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_period_diff VALUES (200802,200703),(200703,200802),(7001,6912),(NULL,2510),(2510,NULL),(9223372036854775807,101),(9223372036854775808,101);
-->

```sql
SELECT `period_1`, `period_2`, PERIOD_DIFF(`period_1`, `period_2`) AS DIFF FROM `test_period_diff`;
```
```text
+---------------------+----------+---------------------+
| period_1            | period_2 | DIFF                |
+---------------------+----------+---------------------+
| 200802              |   200703 |                  11 |
| 200703              |   200802 |                 -11 |
| 7001                |     6912 |               -1199 |
| NULL                |     2510 |                NULL |
| 2510                |     NULL |                NULL |
| 9223372036854775807 |      101 | 1106804644422549090 |
| 9223372036854775808 |      101 |                NULL |
+---------------------+----------+---------------------+
```
마지막 행에서는 `period_1`이 BIGINT의 상한(2^63-1)을 초과하므로 출력은 NULL입니다.

```sql
SELECT PERIOD_DIFF(1, -1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```
