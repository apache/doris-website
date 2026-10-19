---
{
    "title": "HLL_FROM_BASE64",
    "language": "ko",
    "description": "base64로 인코딩된 문자열(일반적으로 HLLTOBASE64 함수의 결과)을 HLL로 변환합니다. 입력 문자열이 유효하지 않거나 NULL이면,"
}
---

## 설명 {#description}

base64로 인코딩된 문자열(일반적으로 `HLL_TO_BASE64` 함수의 결과)을 HLL로 변환합니다. 입력 문자열이 유효하지 않거나 NULL이면 함수는 NULL을 반환합니다.

## 구문 {#syntax}

```sql
HLL_FROM_BASE64(<input>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `<input>` | base64로 인코딩된 문자열로, 일반적으로 `HLL_TO_BASE64` 함수로 생성됩니다. 입력 문자열이 유효하지 않거나 NULL이면 함수는 NULL을 반환합니다. |

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```

```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(''))));
```

```text
+---------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('')))) |
+---------------------------------------------------------------+
|                                                             1 |
+---------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL))));
```

```text
+-----------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL)))) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```
