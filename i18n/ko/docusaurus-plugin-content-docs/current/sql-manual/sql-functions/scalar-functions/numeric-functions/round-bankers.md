---
{
    "title": "ROUND_BANKERS",
    "language": "ko",
    "description": "은행가 반올림 방식으로 x를 반올림하여 소수점 이하 d자리까지 유지합니다. d의 기본값은 0입니다."
}
---

## 설명 {#description}

은행가 반올림 방식으로 x를 반올림하여 소수점 이하 d자리까지 유지합니다. d의 기본값은 0입니다.

d가 음수이면 소수점 왼쪽의 |d|자리 숫자를 0으로 설정합니다.

x 또는 d가 null이면 null을 반환합니다.

d가 컬럼을 나타내고 첫 번째 매개변수가 Decimal 타입이면 결과 Decimal의 소수점 이하 자릿수는 입력 Decimal과 같습니다.

은행가 반올림 알고리즘의 규칙에 따라 지정된 소수 자릿수로 반올림할 때는 다음과 같이 처리합니다.

- 반올림할 숫자가 5이고 그 뒤에 영이 아닌 숫자가 없으면 바로 앞의 숫자를 확인합니다.
   - 앞의 숫자가 짝수이면 5를 그대로 버립니다.
   - 앞의 숫자가 홀수이면 올림합니다.

- 반올림할 숫자가 5보다 크거나 그 뒤에 영이 아닌 숫자가 있으면 일반적인 반올림 규칙을 적용합니다. 해당 숫자가 5 이상이면 올림하고, 그렇지 않으면 버립니다.

예를 들면 다음과 같습니다.

- 값이 2.5이면 5 앞의 숫자 2가 짝수이므로 반올림 결과는 2입니다.

- 값이 3.5이면 5 앞의 숫자 3이 홀수이므로 반올림 결과는 4입니다.

- 값이 2.51이면 5 뒤의 숫자가 0이 아니므로 바로 올림하여 결과는 3입니다.

## 구문 {#syntax}

```sql
ROUND_BANKERS(<x> [ , <d>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|------------|
| `<x>` | 반올림할 숫자 |
| `<d>` | 선택 사항입니다. 반올림하여 유지할 소수점 이하 자릿수이며, 기본값은 0입니다. |

## 반환값 {#return-value}

정수 또는 부동소수점 수를 반환합니다.

- 기본적으로 매개변수 d = 0이면 은행가 반올림 알고리즘으로 x를 계산한 정수를 반환합니다.

- d가 음수이면 소수점 왼쪽 첫 번째 자릿수가 0인 정수를 반환합니다.

- x와 d가 모두 NULL이면 NULL을 반환합니다.

- d가 컬럼을 나타내고 x가 Decimal 타입이면 동일한 정밀도의 부동소수점 수를 반환합니다.

## 예제 {#example}

<!-- setup-sql
CREATE TABLE test_enhanced_round (rid INT, number INT) DISTRIBUTED BY HASH(rid) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_enhanced_round VALUES (1,1);
-->

```sql
select round_bankers(0.4);
```

```text
+--------------------+
| round_bankers(0.4) |
+--------------------+
|                  0 |
+--------------------+
```

```sql
select round_bankers(-3.5);
```

```text
+---------------------+
| round_bankers(-3.5) |
+---------------------+
|                  -4 |
+---------------------+
```

```sql
select round_bankers(-3.4);
```

```text
+---------------------+
| round_bankers(-3.4) |
+---------------------+
|                  -3 |
+---------------------+
```

```sql
select round_bankers(10.755, 2);
```

```text
+--------------------------+
| round_bankers(10.755, 2) |
+--------------------------+
|                    10.76 |
+--------------------------+
```

```sql
select round_bankers(10.745, 2);
```

```text
+--------------------------+
| round_bankers(10.745, 2) |
+--------------------------+
|                    10.74 |
+--------------------------+
```

```sql
select round_bankers(1667.2725, -2);
```

```text
+------------------------------+
| round_bankers(1667.2725, -2) |
+------------------------------+
|                         1700 |
+------------------------------+
```

```sql
SELECT number
, round_bankers(number * 2.5, number - 1) AS rb_decimal_column
, round_bankers(number * 2.5, 0) AS rb_decimal_literal
, round_bankers(cast(number * 2.5 AS DOUBLE), number - 1) AS rb_double_column
, round_bankers(cast(number * 2.5 AS DOUBLE), 0) AS rb_double_literal
FROM test_enhanced_round
WHERE rid = 1;
```

```text
+--------+-------------------+--------------------+------------------+-------------------+
| number | rb_decimal_column | rb_decimal_literal | rb_double_column | rb_double_literal |
+--------+-------------------+--------------------+------------------+-------------------+
|      1 |               2.0 |                  2 |                2 |                 2 |
+--------+-------------------+--------------------+------------------+-------------------+
```
