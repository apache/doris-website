---
{
    "title": "GROUP_CONCAT",
    "language": "ko",
    "description": "GROUPCONCAT 함수는 결과 집합의 여러 행을 하나의 문자열로 연결합니다."
}
---

## 설명 {#description}

GROUP_CONCAT 함수는 결과 집합의 여러 행을 하나의 문자열로 연결합니다.

## 구문 {#syntax}

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ------------ | ---------------------- |
| `<str>`      | 필수. 연결할 값을 나타내는 표현식입니다. |
| `<sep>`      | 선택 사항. 문자열 사이의 구분자입니다. |
| `<col_name>` | 선택 사항. 정렬에 사용할 열입니다.   |
| `<expr>`     | 선택 사항. 정렬에 사용할 표현식입니다. |

## 반환 값 {#return-value}

VARCHAR 타입의 값을 반환합니다.
입력 데이터에 NULL이 포함되어 있으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table test(
    value varchar(10)
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into test values
    ("a"),
    ("b"),
    ("c"),
    ("c");
```

```sql
select GROUP_CONCAT(value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```

```sql
select GROUP_CONCAT(value ORDER BY value DESC) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| c, c, b, a            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value ORDER BY value DESC) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| c, b, a               |
+-----------------------+
```

```sql
select GROUP_CONCAT(value, " ") from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```

```sql
select GROUP_CONCAT(value, NULL) from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```
