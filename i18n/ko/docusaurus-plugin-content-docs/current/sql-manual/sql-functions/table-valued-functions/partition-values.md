---
{
    "title": "PARTITION_VALUES",
    "language": "ko",
    "description": "파티션 값으로 구성된 임시 테이블을 생성하는 테이블 함수로, 특정 테이블의 파티션 값 목록을 확인할 수 있습니다."
}
---

## 설명 {#description}

파티션 값으로 구성된 임시 테이블을 생성하는 테이블 함수로, 특정 테이블의 파티션 값 목록을 확인할 수 있습니다.

이 함수는 FROM 절에서 사용하며 hive 테이블만 지원합니다.

## 구문 {#syntax}

```sql
PARTITION_VALUES(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## 필수 매개변수 {#required-parameters}
| 필드               | 설명                                       |
|------------------|------------------------------------------|
| `<catalog>`  | 쿼리할 클러스터의 Catalog 이름을 지정합니다.                     |
| `<database>` | 쿼리할 클러스터의 데이터베이스 이름을 지정합니다.                           |
| `<table>`    | 쿼리할 클러스터의 테이블 이름을 지정합니다.                             |

## 반환 값 {#return-value}

반환 테이블에는 쿼리 대상 테이블의 파티션 필드 수만큼 열이 포함됩니다.

## 예제 {#example}

multi_catalog 아래 hive3 CATALOG에 있는 `text_partitioned_columns` 테이블의 생성문은 다음과 같습니다.

```sql
CREATE TABLE `text_partitioned_columns`(
  `t_timestamp` timestamp)
PARTITIONED BY (
 `t_int` int,
 `t_float` float,
 `t_string` string)
```

데이터는 다음과 같습니다.

```text
mysql> select * from text_partitioned_columns;
+----------------------------+-------+---------+----------+
| t_timestamp                | t_int | t_float | t_string |
+----------------------------+-------+---------+----------+
| 2023-01-01 00:00:00.000000 |  NULL |     0.1 | test1    |
| 2023-01-02 00:00:00.000000 |  NULL |     0.2 | test2    |
| 2023-01-03 00:00:00.000000 |   100 |     0.3 | test3    |
+----------------------------+-------+---------+----------+
```

multi_catalog 아래 hive3 CATALOG에 있는 `text_partitioned_columns` 테이블의 파티션 값 목록을 확인합니다.

```sql
select * from partition_values("catalog"="hive3", "database" = "multi_catalog","table" = "text_partitioned_columns");
```
```text
+-------+---------+----------+
| t_int | t_float | t_string |
+-------+---------+----------+
|   100 |     0.3 | test3    |
|  NULL |     0.2 | test2    |
|  NULL |     0.1 | test1    |
+-------+---------+----------+
```
