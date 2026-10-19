---
{
    "title": "SHOW COLUMNS",
    "language": "ko",
    "description": "이 문은 테이블의 열 정보를 확인하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 테이블의 열 정보를 확인하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW [ FULL ] COLUMNS FROM <tbl>;
```

## 필수 매개변수 {#required-parameters}
**1. `<tbl>`**

열 정보를 조회할 테이블의 이름을 지정해야 합니다.

## 선택적 매개변수 {#optional-parameters}
**1. `FULL`**

`FULL` 키워드를 지정하면 열의 집계 유형, 권한, 주석 등을 포함한 상세 정보가 반환됩니다.

## 반환 값 {#return-value}
| 열         | 데이터 타입 | 설명                    |
|------------|----------|-------------------------|
| Field      | varchar  | 열 이름                 |
| Type       | varchar  | 열 데이터 타입          |
| Collation  | varchar  | 열 정렬 규칙            |
| Null       | varchar  | NULL 허용 여부          |
| Key        | varchar  | 테이블의 기본 키        |
| Default    | varchar  | 기본값                  |
| Extra      | varchar  | 추가 정보               |
| Privileges | varchar  | 열 권한                 |
| Comment    | varchar  | 열 주석                 |

## 접근 제어 요구 사항 {#access-control-requirements}
조회할 테이블에 대한 `SHOW` 권한이 필요합니다.

## 예제 {#examples}

1. 지정한 테이블의 상세 열 정보 조회

```sql
SHOW FULL COLUMNS FROM t_agg;
```
```text
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| Field | Type            | Collation | Null | Key  | Default | Extra   | Privileges | Comment |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| k1    | tinyint         |           | YES  | YES  | NULL    |         |            |         |
| k2    | decimalv3(10,2) |           | YES  | YES  | 10.5    |         |            |         |
| v1    | char(10)        |           | YES  | NO   | NULL    | REPLACE |            |         |
| v2    | int             |           | YES  | NO   | NULL    | SUM     |            |         |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
```

2. 지정한 테이블의 기본 열 정보 조회

```sql
SHOW COLUMNS FROM t_agg;
```
```text
+-------+-----------------+------+------+---------+---------+
| Field | Type            | Null | Key  | Default | Extra   |
+-------+-----------------+------+------+---------+---------+
| k1    | tinyint         | YES  | YES  | NULL    |         |
| k2    | decimalv3(10,2) | YES  | YES  | 10.5    |         |
| v1    | char(10)        | YES  | NO   | NULL    | REPLACE |
| v2    | int             | YES  | NO   | NULL    | SUM     |
+-------+-----------------+------+------+---------+---------+
```
