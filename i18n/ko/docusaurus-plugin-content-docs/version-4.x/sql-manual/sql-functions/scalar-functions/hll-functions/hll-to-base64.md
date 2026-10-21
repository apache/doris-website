---
{
    "title": "HLL_TO_BASE64",
    "language": "ko",
    "description": "입력된 HLL을 base64로 인코딩된 문자열로 변환합니다."
}
---

## 설명 {#description}

입력된 HLL을 base64로 인코딩된 문자열로 변환합니다.

## 구문 {#syntax}

```sql
HLL_TO_BASE64(<hll_input>)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                          |
| ------------ | ---------------------------------------------------- |
| `<hll_input>` | base64로 인코딩된 문자열로 변환할 HyperLogLog (HLL) 데이터입니다. |

## 반환값 {#return-value}

HLL을 Base64로 인코딩한 문자열을 반환합니다.
HLL이 `NULL`이면 `NULL`을 반환합니다.

::: note

HLL 내 요소의 순서는 보장되지 않으므로 내용이 같아도 생성되는 Base64 문자열이 항상 같지는 않을 수 있습니다. 하지만 `hll_from_base64`로 디코딩한 HLL은 동일합니다.

:::

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

```sql
select hll_to_base64(NULL);
```

```text
+---------------------+
| hll_to_base64(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select hll_to_base64(hll_empty());
```

```text
+----------------------------+
| hll_to_base64(hll_empty()) |
+----------------------------+
| AA==                       |
+----------------------------+
```

```sql
select hll_to_base64(hll_hash('abc'));
```

```text
+--------------------------------+
| hll_to_base64(hll_hash('abc')) |
+--------------------------------+
| AQEC5XSzrpDsdw==               |
+--------------------------------+
```

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
