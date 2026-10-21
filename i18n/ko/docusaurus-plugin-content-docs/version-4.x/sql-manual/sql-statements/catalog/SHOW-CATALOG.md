---
{
    "title": "SHOW CATALOG",
    "language": "ko",
    "description": "지정한 Catalog의 속성을 표시합니다"
}
---

## 설명 {#description}

지정한 Catalog의 속성을 표시합니다

## 구문 {#syntax}

```sql
SHOW CATALOG <catalog_name>
```


## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**

표시할 Catalog의 이름입니다.

## 반환 값 {#return-value}

| 열 이름 | 설명                   |
|-------------|-------------------------------|
| Key         | 설정 속성 이름입니다.  |
| Value       | 설정 속성 값입니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한                                                                                    | 객체  | 참고 사항                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | 위 권한 중 하나가 필요합니다. |

## 예제 {#examples}

1. 특정 Catalog의 설정 세부 정보 조회

   ```sql
   show catalog test_mysql;
   ```
   ```sql
      +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   | Key            | Value                                                                                                                                               |
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   | checksum       | fdf55dcef04b09f2eaf42b75e61ccc9a                                                                                                                    |
   | create_time    | 2025-02-17 17:21:13.099                                                                                                                             |
   | driver_class   | com.mysql.cj.jdbc.Driver                                                                                                                            |
   | driver_url     | mysql-connector-j-8.3.0.jar                                                                                                                         |
   | jdbc_url       | jdbc:mysql://127.0.0.1:3306/db                                                                                                                      |
   | password       | *XXX                                                                                                                                                |
   | type           | jdbc                                                                                                                                                |
   | use_meta_cache | true                                                                                                                                                |
   | user           | root                                                                                                                                                |
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+ 
   ```
