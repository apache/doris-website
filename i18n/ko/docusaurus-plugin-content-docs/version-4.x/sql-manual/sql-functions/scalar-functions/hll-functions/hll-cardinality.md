---
{
    "title": "HLL_CARDINALITY",
    "language": "ko",
    "description": "HLLCARDINALITY는 HyperLogLog (HLL) 타입 값의 카디널리티를 계산합니다."
}
---

## 설명 {#description}

`HLL_CARDINALITY`는 HyperLogLog (HLL) 타입 값의 카디널리티를 계산합니다. 대규모 데이터 세트에서 고유한 요소의 개수를 추정하는 데 적합한 근사 카운팅 알고리즘입니다.

## 구문 {#syntax}

```sql
HLL_CARDINALITY(<hll>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명                                              |
| ---------- | -------------------------------------------------------- |
| `<hll>`    | 카디널리티를 추정할 데이터 세트를 나타내는 HLL 타입 값입니다. |

## 반환 값 {#return-value}

HLL 타입 값의 추정 카디널리티를 반환합니다. 이는 데이터 세트에서 고유한 요소의 개수를 나타냅니다.

## 예제 {#example}

<!-- setup-sql
CREATE TABLE test_uv (id INT, uv_set HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_uv VALUES (1, hll_hash('a')), (1, hll_hash('b')), (1, hll_hash('c'));
-->

```sql
select HLL_CARDINALITY(uv_set) from test_uv;
```

```text
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```
