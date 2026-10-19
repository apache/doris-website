---
{
    "title": "COUNT",
    "language": "ko",
    "description": "지정된 열에서 NULL이 아닌 레코드 수 또는 전체 레코드 수를 반환합니다."
}
---

## 설명 {#description}

지정된 열에서 NULL이 아닌 레코드 수 또는 전체 레코드 수를 반환합니다.

## 구문 {#syntax}

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 표현식을 지정하면 NULL이 아닌 레코드 수를 세고, 지정하지 않으면 전체 행 수를 셉니다. |

## 반환 값 {#return-value}

반환 타입은 Bigint입니다. expr이 NULL이면 집계하지 않습니다.

## 예제 {#example}

```sql
-- setup
create table test_count(
    id int,
    name varchar(20),
    sex int
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into test_count values
    (1, '1', 1),
    (2, '2', 1),
    (3, '3', 1),
    (4, '0', 1),
    (4, '4', 1),
    (5, NULL, 1);

create table test_insert(
    id int,
    name varchar(20),
    sex int
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into test_insert values
    (1, '1', 1),
    (2, '2', 1),
    (3, '3', 1),
    (4, '0', 1),
    (4, '4', 1),
    (5, NULL, 1);
```

```sql
select count(*) from test_count;
```

```text
+----------+
| count(*) |
+----------+
|        6 |
+----------+
```

```sql
select count(name) from test_insert;
```

```text
+-------------+
| count(name) |
+-------------+
|           5 |
+-------------+
```

```sql
select count(distinct sex) from test_insert;
```

```text
+---------------------+
| count(DISTINCT sex) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select count(distinct id,sex) from test_insert;
```

```text
+-------------------------+
| count(DISTINCT id, sex) |
+-------------------------+
|                       5 |
+-------------------------+
```
