---
{
    "title": "COUNT_BY_ENUM",
    "language": "en",
    "description": "Treat the data in the column as enumeration values and count the number of each enumeration value."
}
---

## Description

Treat the data in the column as enumeration values and count the number of each enumeration value. Returns the number of enumeration values for each column, as well as the number of non-NULL values and the number of NULL values.

## Syntax

```sql
COUNT_BY_ENUM(<expr1>, <expr2>, ... , <exprN>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | At least one input is required, supports up to 1024 inputs. Supported type is String. |

## Return Value

Returns results in JSONArray format.
Return type is String.

For example:
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
Description: The return value is a JSON array string, and the order of internal objects follows the order of input parameters.
* cbe: Statistical results of non-NULL values based on enumeration values
* notnull: Count of non-NULL values
* null: Count of NULL values
* all: Total count, including both NULL and non-NULL values.


## Example

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
