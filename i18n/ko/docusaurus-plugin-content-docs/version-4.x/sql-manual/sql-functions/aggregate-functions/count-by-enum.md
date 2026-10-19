---
{
    "title": "COUNT_BY_ENUM",
    "language": "ko",
    "description": "컬럼의 데이터를 열거 값으로 취급하여 각 열거 값의 개수를 계산합니다."
}
---

## 설명 {#description}

컬럼의 데이터를 열거 값으로 취급하여 각 열거 값의 개수를 계산합니다. 각 컬럼의 열거 값별 개수와 NULL이 아닌 값의 개수, NULL 값의 개수를 반환합니다.

## 구문 {#syntax}

```sql
COUNT_BY_ENUM(<expr1>, <expr2>, ... , <exprN>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | 입력이 최소 하나 필요하며, 최대 1024개의 입력을 지원합니다. 지원되는 타입은 String입니다. |

## 반환 값 {#return-value}

결과를 JSONArray 형식으로 반환합니다.
반환 타입은 String입니다.

예를 들면 다음과 같습니다.
```json
[{
  "cbe": {
    "F": 100,
    "M": 99
  },
  "notnull": 199,
  "null": 1,
  "all": 200
}, {
  "cbe": {
    "20": 10,
    "30": 5,
    "35": 1
  },
  "notnull": 16,
  "null": 184,
  "all": 200
}, {
  "cbe": {
    "China": 10,
    "United States": 9,
    "England": 20,
    "Germany": 30
  },
  "notnull": 69,
  "null": 131,
  "all": 200
}]
```
설명: 반환 값은 JSON 배열 문자열이며, 내부 객체의 순서는 입력 매개변수의 순서를 따릅니다.
* cbe: 열거 값별로 집계한 NULL이 아닌 값의 통계 결과
* notnull: NULL이 아닌 값의 개수
* null: NULL 값의 개수
* all: NULL 값과 NULL이 아닌 값을 모두 포함한 전체 개수.


## 예제 {#example}

결과에서 JSON 객체의 순서는 일정하지 않으므로, 결과는 다음과 같을 수 있습니다.

```sql
CREATE TABLE count_by_enum_test(
                                   `id` varchar(1024) NULL,
                                   `f1` text REPLACE_IF_NOT_NULL NULL,
                                   `f2` text REPLACE_IF_NOT_NULL NULL,
                                   `f3` text REPLACE_IF_NOT_NULL NULL
)
AGGREGATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 3 
PROPERTIES ( 
    "replication_num" = "1"
);
```

```sql
INSERT into count_by_enum_test (id, f1, f2, f3) values
                                                    (1, "F", "10", "China"),
                                                    (2, "F", "20", "China"),
                                                    (3, "M", NULL, "United States"),
                                                    (4, "M", NULL, "United States"),
                                                    (5, "M", NULL, "England");
```


```sql
SELECT * from count_by_enum_test;
```

```text
+------+------+------+---------------+
| id   | f1   | f2   | f3            |
+------+------+------+---------------+
| 1    | F    | 10   | China         |
| 2    | F    | 20   | China         |
| 3    | M    | NULL | United States |
| 4    | M    | NULL | United States |
| 5    | M    | NULL | England       |
+------+------+------+---------------+
```

```sql
select count_by_enum(f1) from count_by_enum_test;
```

```text
+------------------------------------------------------+
| count_by_enum(`f1`)                                  |
+------------------------------------------------------+
| [{"cbe":{"M":3,"F":2},"notnull":5,"null":0,"all":5}] |
+------------------------------------------------------+
```

```sql
select count_by_enum(f2) from count_by_enum_test;
```

```text
+--------------------------------------------------------+
| count_by_enum(`f2`)                                    |
+--------------------------------------------------------+
| [{"cbe":{"10":1,"20":1},"notnull":2,"null":3,"all":5}] |
+--------------------------------------------------------+
```

```sql
select count_by_enum(f1,f2,f3) from count_by_enum_test;
```

```text
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| count_by_enum(`f1`, `f2`, `f3`)                                                                                                                                                          |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"cbe":{"M":3,"F":2},"notnull":5,"null":0,"all":5},{"cbe":{"20":1,"10":1},"notnull":2,"null":3,"all":5},{"cbe":{"England":1,"United States":2,"China":2},"notnull":5,"null":0,"all":5}] |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
