---
{
    "title": "SHOW TABLES",
    "language": "ko",
    "description": "현재 데이터베이스에 속한 모든 테이블과 뷰를 표시하는 문입니다."
}
---

## 설명 {#description}

현재 데이터베이스에 속한 모든 테이블과 뷰를 표시하는 문입니다.

## 구문 {#syntax}

```sql
SHOW [ FULL ] TABLES [ FROM [ <catalog_name>.]<db_name> ][ LIKE <like_condition> ]
```

## 선택적 매개변수 {#optional-parameters}

**1. `FULL`**
> 이 매개변수를 문에 추가하면 반환 결과에 Table_type(테이블 유형), Storage_format(저장 형식), Inverted_index_storage_format(역색인 저장 형식)이라는 세 개의 열이 추가됩니다.

**2. `FROM [ <catalog_name>.]<db_name>`**
> FROM 절에서 쿼리할 Catalog 이름과 데이터베이스 이름을 지정할 수 있습니다.

**2. `LIKE <like_condition>`**
> LIKE 절에서 테이블 이름을 기준으로 패턴 일치 쿼리를 수행할 수 있습니다.

## 반환 값 {#return-value}

| 열 이름(열) | 유형(데이터 유형) | 설명(설명) |
|:--------------------|:-------------|:----------------------------|
| Tables_in_<db_name> | String | `<db_name>`에 해당하는 데이터베이스에 속한 모든 테이블과 뷰입니다. |
| Table_type | String | 테이블과 뷰의 유형입니다. |
| Storage_format | String | 테이블과 뷰의 저장 형식입니다. |
| Inverted_index_storage_format | String | 테이블과 뷰의 역색인 저장 형식입니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한(권한) | 객체(객체) | 설명(설명) |
|:--------------|:-----------|:------------------|
| SELECT_PRIV | 테이블(테이블), 뷰(뷰) | 쿼리 권한이 있는 테이블과 뷰만 표시할 수 있습니다. |

## 사용 시 참고 사항 {#usage-notes}

- 문에 FROM 절을 지정하지 않은 경우, 해당 데이터베이스를 선택한 상태에서 실행해야 합니다.

## 예제 {#examples}

- DB에 속한 모든 테이블 조회

     ```sql
     SHOW TABLES;
     ```

     ```text
     +---------------------------------+
     | Tables_in_demo                  |
     +---------------------------------+
     | ads_client_biz_aggr_di_20220419 |
     | cmy1                            |
     | cmy2                            |
     | intern_theme                    |
     | left_table                      |
     +---------------------------------+
     ```

- 테이블 이름을 기준으로 패턴 일치 쿼리 수행

     ```sql
     SHOW TABLES LIKE '%cm%'
     ```

     ```text
     +----------------+
     | Tables_in_demo |
     +----------------+
     | cmy1           |
     | cmy2           |
     +----------------+
     ```

- FULL을 사용하여 데이터베이스에 속한 테이블과 뷰 조회

     ```sql
     SHOW FULL TABLES
     ```

     ```text
     +----------------+------------+----------------+-------------------------------+
     | Tables_in_demo | Table_type | Storage_format | Inverted_index_storage_format |
     +----------------+------------+----------------+-------------------------------+
     | test_table     | BASE TABLE | V2             | V1                            |
     | test_view      | VIEW       | NONE           | NONE                          |
     +----------------+------------+----------------+-------------------------------+
     ```
