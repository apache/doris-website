---
{
    "title": "TO_QUANTILE_STATE",
    "language": "ko",
    "description": "이 함수는 숫자 타입을 QUANTILESTATE 타입으로 변환합니다. 압축 매개변수는 선택 사항이며 [2048, 10000] 범위에서 설정할 수 있습니다."
}
---

## 설명 {#description}

이 함수는 숫자 타입을 `QUANTILE_STATE` 타입으로 변환합니다. 압축 매개변수는 선택 사항이며 [2048, 10000] 범위에서 설정할 수 있습니다. 값이 클수록 이후의 근사 분위수 계산 정확도가 높아지고, 메모리 사용량이 늘어나며, 계산 시간이 길어집니다. 압축 매개변수를 지정하지 않거나 값을 [2048, 10000] 범위 밖으로 설정하면 기본값인 2048로 실행됩니다.

## 구문 {#syntax}

```sql
TO_QUANTILE_STATE(<raw_data>, <compression>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<raw_data>` | 대상 컬럼입니다.|
| `<compression>` | 압축 임계값입니다.|

## 반환값 {#return-value}

변환된 `QUANTILE_STATE` 타입의 컬럼입니다.

## 예제 {#example}

```sql
CREATE TABLE IF NOT EXISTS quantile_state_agg_test (
         `dt` int(11) NULL COMMENT "",
         `id` int(11) NULL COMMENT "",
         `price` quantile_state QUANTILE_UNION NOT NULL COMMENT ""
        ) ENGINE=OLAP
        AGGREGATE KEY(`dt`, `id`)
        COMMENT "OLAP"
        DISTRIBUTED BY HASH(`dt`) BUCKETS 1
        PROPERTIES ("replication_num" = "1");

INSERT INTO quantile_state_agg_test VALUES(20220201,0, to_quantile_state(1, 2048));

INSERT INTO quantile_state_agg_test VALUES(20220201,1, to_quantile_state(-1, 2048)),
            (20220201,1, to_quantile_state(0, 2048)),(20220201,1, to_quantile_state(1, 2048)),
            (20220201,1, to_quantile_state(2, 2048)),(20220201,1, to_quantile_state(3, 2048));

SELECT dt, id, quantile_percent(quantile_union(price), 0) FROM quantile_state_agg_test GROUP BY dt, id ORDER BY dt, id
```

결과는 다음과 같습니다.

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
