---
{
    "title": "HLL_UNION_AGG",
    "language": "ko",
    "description": "HLLUNIONAGG 함수는 주로 여러 HyperLogLog 데이터 구조를 병합하고 근사 카디널리티를 추정하는 데 사용되는 집계 함수입니다. "
}
---

## 설명 {#description}

HLL_UNION_AGG 함수는 주로 여러 HyperLogLog 데이터 구조를 병합하고 병합 후의 근사 카디널리티를 추정하는 데 사용되는 집계 함수입니다.

## 구문 {#syntax}

```sql
hll_union_agg(<hll>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<hll>` | 계산할 표현식으로, HLL 타입을 지원합니다. |

## 반환 값 {#return-value}

BIGINT 타입의 카디널리티 값을 반환합니다.
그룹에 유효한 데이터가 없으면 0을 반환합니다.

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
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv;
```

```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv where uv_set is null;
```

```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
