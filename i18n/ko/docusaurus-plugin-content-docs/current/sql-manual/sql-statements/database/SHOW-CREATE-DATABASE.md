---
{
    "title": "SHOW CREATE DATABASE",
    "language": "ko",
    "description": "이 문은 doris 내장 데이터베이스 또는 Catalog 데이터베이스의 생성 정보를 확인합니다."
}
---

## 설명 {#description}

이 문은 doris 내장 데이터베이스 또는 Catalog 데이터베이스의 생성 정보를 확인합니다.

## 구문 {#syntax}

```sql
SHOW CREATE DATABASE [<catalog>.]<db_name>;
```

## 필수 매개변수 {#required-parameters}

** 1. `<db_name>`**
>  데이터베이스 이름

## 선택적 매개변수 {#optional-parameters}

** 1. `<catalog>`**
>  테이블이 내부 테이블인지 외부 테이블인지를 나타냅니다.

## 반환 값 {#return-value}

| 열 | 설명 |
|:---------|:-----------|
| Database | 데이터베이스 이름 |
| Create Database | 해당 데이터베이스의 생성 문 |

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한         | 대상    | 비고             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 해당 데이터베이스 | 해당 데이터베이스에 대한 읽기 권한이 필요합니다. |

## 예시 {#example}

- doris에서 test 데이터베이스의 생성 정보를 확인합니다.

   ```sql
   SHOW CREATE DATABASE test;
   ```

   ```text
   +----------+------------------------+
   | Database | Create Database        |
   +----------+------------------------+
   | test     | CREATE DATABASE `test` |
   +----------+------------------------+
   ```

- hive Catalog에 있는 hdfs_text 데이터베이스의 생성 정보를 확인합니다.

   ```sql
   SHOW CREATE DATABASE hdfs_text;
   ```

   ```text
   +-----------+------------------------------------------------------------------------------------+                         
   | Database  | Create Database                                                                    |                         
   +-----------+------------------------------------------------------------------------------------+                         
   | hdfs_text | CREATE DATABASE `hdfs_text` LOCATION 'hdfs://HDFS1009138/hive/warehouse/hdfs_text' |                         
   +-----------+------------------------------------------------------------------------------------+  
   ```
