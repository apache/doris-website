---
{
    "title": "QUERY",
    "language": "ko",
    "description": "Query 테이블 함수(table-valued-function, tvf)를 사용하면 쿼리 문을 Catalog에 직접 전달하여 데이터를 조회할 수 있습니다."
}
---

## 설명 {#description}

Query 테이블 함수(table-valued-function, tvf)를 사용하면 쿼리 문을 Catalog에 직접 전달하여 데이터를 조회할 수 있습니다.

Doris 2.1.3 버전부터 지원되며, 현재는 JDBC Catalog에 쿼리를 직접 전달하는 기능만 지원합니다.
먼저 Doris에서 해당 Catalog를 생성해야 합니다.


## 구문 {#syntax}

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```

## 필수 매개변수 {#required-parameters}
쿼리 테이블 함수 tvf의 각 매개변수는 `"key"="value"` 쌍입니다.

| 필드       | 설명                                       |
|------------|--------------------------------------------|
| `catalog`  | Catalog 이름입니다. 사용할 Catalog의 이름을 입력해야 합니다. |
| `query`    | 실행할 쿼리 문입니다.                     |


## 예제 {#examples}

`desc function`과 함께 사용할 수 있습니다.

```sql
desc function query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | int  | Yes  | true  | NULL    |       |
| name  | text | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

JDBC Catalog 데이터 소스의 테이블에 쿼리를 직접 전달하여 조회합니다.

```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+------+---------+
| id   | name    |
+------+---------+
| 1    | alice   |
| 2    | bob     |
| 3    | jack    |
+------+---------+
```
```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.score");
```
```text
+------+---------+
| id   | score   |
+------+---------+
| 1    | 100     |
| 2    | 90      |
| 3    | 80      |
+------+---------+
```

JDBC Catalog 데이터 소스의 테이블에 조인 쿼리를 직접 전달하여 조회합니다.

```sql
select * from query("catalog" = "jdbc", "query" = "select a.id, a.name, b.score from test.student a join test.score b on a.id = b.id");
```
```
+------+---------+---------+
| id   | name    | score   |
+------+---------+---------+
| 1    | alice   | 100     |
| 2    | bob     | 90      |
| 3    | jack    | 80      |
+------+---------+---------+
```
