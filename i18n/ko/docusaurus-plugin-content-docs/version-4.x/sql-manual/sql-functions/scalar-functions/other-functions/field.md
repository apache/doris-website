---
{
    "title": "FIELD",
    "language": "ko",
    "description": "<expr>이 값 목록 <param> [, ...]에서 처음 나타나는 위치를 반환합니다. <expr>을 찾을 수 없으면 함수는 0을 반환합니다."
}
---

## 설명 {#description}

`<expr>`이 값 목록 `<param> [, ...]`에서 처음 나타나는 위치를 반환합니다.  
`<expr>`을 찾을 수 없으면 함수는 `0`을 반환합니다. 이 함수는 사용자 지정 정렬을 구현하기 위해 `ORDER BY`에서 자주 사용됩니다.

## 구문 {#syntax}

```sql
FIELD(<expr>, <param> [, ...])
```

## 매개변수 {#parameters}

| 매개변수   | 설명                                                    |
|------------|---------------------------------------------------------|
| `<expr>`   | 매개변수 목록에서 찾을 값입니다.                         |
| `<param>`  | `<expr>`과 비교할 값의 나열입니다.                       |

## 반환 값 {#return-value}

- `<expr>`이 `<param>` 값 목록에서 차지하는 위치(1부터 시작하는 인덱스)를 반환합니다.  
- `<expr>`을 찾을 수 없으면 `0`을 반환합니다.  
- `<expr>`이 `NULL`이면 `0`을 반환합니다.

## 예제 {#examples}

```sql
-- setup
CREATE TABLE baseall (k1 INT, k7 VARCHAR(64))
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO baseall VALUES
    (1, 'wangjing04'),
    (2, 'wangyu14'),
    (3, 'yuanyuan06');

CREATE TABLE class_test (class_name VARCHAR(64))
DISTRIBUTED BY HASH(class_name) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO class_test VALUES
    ('Suzi'), ('Suzi'),
    ('Ben'), ('Ben'),
    ('Henry'), ('Henry'),
    (NULL);
```

```sql
SELECT FIELD(2, 3, 1, 2, 5);
```

```text
+----------------------+
| FIELD(2, 3, 1, 2, 5) |
+----------------------+
|                    3 |
+----------------------+
```

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1, 2, 1, 3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

문자열을 사용자 지정 순서로 정렬합니다. `FIELD`는 목록에 없는 값에 대해 `0`을 반환하며, 여기에는 `NULL`도 포함됩니다. 따라서 기본 오름차순 정렬에서는 `NULL` 행이 맨 위에 표시됩니다:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```

내림차순에서는 `NULL`(FIELD = 0)이 맨 마지막에 표시됩니다:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') DESC;
```

```text
+------------+
| class_name |
+------------+
| Henry      |
| Henry      |
| Ben        |
| Ben        |
| Suzi       |
| Suzi       |
| NULL       |
+------------+
```

또한 `NULLS FIRST` / `NULLS LAST`를 사용하면 정렬 방향과 관계없이 `NULL`의 위치를 제어할 수 있습니다:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') NULLS FIRST;
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```
