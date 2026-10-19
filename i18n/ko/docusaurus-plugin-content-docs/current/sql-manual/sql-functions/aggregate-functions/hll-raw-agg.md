---
{
    "title": "HLL_RAW_AGG",
    "language": "ko",
    "description": "HLLRAWAGG 함수는 여러 HyperLogLog 데이터 구조를 하나로 병합하는 데 주로 사용되는 집계 함수입니다."
}
---

## 설명 {#description}

HLL_RAW_AGG 함수는 여러 HyperLogLog 데이터 구조를 하나로 병합하는 데 주로 사용되는 집계 함수입니다.

## 별칭 {#alias}

- HLL_UNION

## 구문 {#syntax}

```sql
HLL_RAW_AGG(<hll>)
HLL_UNION(<hll>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<hll>` | 계산할 표현식으로, HLL 타입을 지원합니다. |

## 반환 값 {#return-value}

집계된 HLL 타입을 반환합니다.
그룹에 유효한 데이터가 없으면 HLL_EMPTY를 반환합니다.

## 예제 {#example}

```sql
-- setup
create table test_uv(
    id int,
    uv_set string
) distributed by hash(id) buckets 1
properties ("replication_num"="1");
insert into test_uv values
    (1, ('a')),
    (1, ('b')),
    (2, ('c')),
    (2, ('d')),
    (3, null);
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              4 |
+------------------------------------------------+
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv where uv_set is null;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              0 |
+------------------------------------------------+
```
