---
{
    "title": "GROUP_BIT_XOR",
    "language": "ko",
    "description": "단일 정수 열 또는 표현식의 모든 값에 대해 비트 XOR 연산을 수행합니다."
}
---

## 설명 {#description}

단일 정수 열 또는 표현식의 모든 값에 대해 비트 XOR 연산을 수행합니다.

## 구문 {#syntax}

```sql
GROUP_BIT_XOR(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 지원하는 타입: TinyInt, SmallInt, Integer, BigInt, LargeInt. |

## 반환 값 {#return-value}

<expr>와 동일한 타입의 정수 값을 반환합니다. 모든 값이 NULL이면 NULL을 반환합니다. NULL 값은 비트 연산에서 제외됩니다.

## 예제 {#example}

```sql
-- setup
create table group_bit(
    value int
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into group_bit values
    (3),
    (1),
    (2),
    (4),
    (NULL);
```

```sql
select group_bit_xor(value) from group_bit;
```

```text
+----------------------+
| group_bit_xor(value) |
+----------------------+
|                    4 |
+----------------------+
```

```sql
select group_bit_xor(value) from group_bit where value is null;
```

```text
+----------------------+
| group_bit_xor(value) |
+----------------------+
|                 NULL |
+----------------------+
```
