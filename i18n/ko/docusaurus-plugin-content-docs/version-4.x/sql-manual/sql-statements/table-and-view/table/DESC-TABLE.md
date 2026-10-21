---
{
    "title": "DESCRIBE",
    "language": "ko",
    "description": "이 문은 지정된 테이블의 스키마 정보를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 테이블의 스키마 정보를 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
DESC[RIBE] [<ctl_name>.][<db_name>.]<table_name> [ALL];
```
## 필수 매개변수 {#required-parameters}

**1.`<table_name>`**

> 테이블의 식별자(이름)를 지정합니다. 이 식별자는 해당 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 영문자(Unicode 이름 지원이 활성화된 경우에는 모든 언어의 문자)로 시작해야 하며, 식별자 문자열 전체를 백틱으로 감싼 경우(예: `My Object`)를 제외하면 공백이나 특수 문자를 포함할 수 없습니다.
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

## 선택적 매개변수 {#optional-parameters}

**1.`<ctl_name>.<db_name>`**

> 데이터 Catalog와 데이터베이스의 식별자(이름)를 지정합니다.
>
> 식별자는 영문자(Unicode 이름 지원이 활성화된 경우에는 모든 언어의 문자)로 시작해야 하며, 식별자 문자열 전체를 백틱으로 감싼 경우(예: `My Database`)를 제외하면 공백이나 특수 문자를 포함할 수 없습니다.
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

**2.`ALL`**

> 내부 테이블에만 유효합니다. 내부 테이블의 모든 인덱스 정보를 반환합니다.

## 반환값 {#return-value}

`ALL`을 지정하지 않으면 반환값은 다음과 같습니다.

| 열 | 설명 |
| -- |--------------|
| Field | 열 이름 |
| Type | 데이터 타입 |
| Null | NULL 값 허용 여부 |
| Key | 키 열 여부 |
| Default | 기본값 |
| Extra | 추가 정보 표시 |

버전 3.0.7에서 새로운 세션 변수 `show_column_comment_in_describe`가 추가되었습니다. 이 변수를 `true`로 설정하면 열의 주석 정보를 표시하는 `Comment` 열이 추가됩니다.

`ALL`을 지정하면 내부 테이블의 반환값은 다음과 같습니다.

| 열 | 설명 |
| -- |--------------|
| IndexName | 테이블 이름 |
| IndexKeysType | 테이블 모델 |
| Field | 열 이름 |
| Type | 데이터 타입 |
| Null | NULL 값 허용 여부 |
| Key | 키 열 여부 |
| Default | 기본값 |
| Extra | 추가 정보 표시 |
| Visible | 표시 여부 |
| DefineExpr | 정의 표현식 |
| WhereClause | 필터 조건 관련 정의 |

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한(Privilege) | 객체 | 참고 |
|:--------------| :------------- |:---------------------------------------------|
| SELECT_PRIV   | 테이블    | DESC를 실행하려면 쿼리 대상 테이블에 대한 SELECT_PRIV 권한이 필요합니다 |


## 예제 {#examples}

준비: 아래 예제에서 사용할 `test_table`을 생성합니다.

```sql
CREATE TABLE test_table (
  user_id BIGINT NOT NULL COMMENT 'Key1',
  name    VARCHAR(20)     COMMENT 'username',
  age     INT             COMMENT 'user_age'
) ENGINE=OLAP
UNIQUE KEY (user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

1. 기본 테이블 스키마 표시

```sql
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+
| Field   | Type        | Null | Key   | Default | Extra |
+---------+-------------+------+-------+---------+-------+
| user_id | bigint      | No   | true  | NULL    |       |
| name    | varchar(20) | Yes  | false | NULL    | NONE  |
| age     | int         | Yes  | false | NULL    | NONE  |
+---------+-------------+------+-------+---------+-------+
```

`show_column_comment_in_describe = true`(3.0.7에서 도입)를 설정하면 출력에 `Comment` 열이 추가됩니다.

```sql
SET show_column_comment_in_describe=true;
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+----------+
| Field   | Type        | Null | Key   | Default | Extra | Comment  |
+---------+-------------+------+-------+---------+-------+----------+
| user_id | bigint      | No   | true  | NULL    |       | Key1     |
| name    | varchar(20) | Yes  | false | NULL    | NONE  | username |
| age     | int         | Yes  | false | NULL    | NONE  | user_age |
+---------+-------------+------+-------+---------+-------+----------+
```

2. 테이블의 모든 인덱스 스키마 표시

```sql
DESC test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | UNIQUE_KEYS   | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```
