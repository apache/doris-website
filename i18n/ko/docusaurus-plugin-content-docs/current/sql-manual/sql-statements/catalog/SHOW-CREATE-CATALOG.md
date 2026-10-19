---
{
    "title": "SHOW CREATE CATALOG",
    "language": "ko",
    "description": "이 구문은 Doris Catalog의 생성 구문을 표시합니다."
}
---

## 설명 {#description}

이 구문은 Doris Catalog의 생성 구문을 표시합니다.

## 구문 {#syntax}

```sql
SHOW CREATE CATALOG <catalog_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**

생성 구문을 확인할 Catalog의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한                                                                                    | 객체  | 비고                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | 위 권한 중 하나가 필요합니다. |


## 예제 {#example}

1. Doris에서 oracle Catalog의 생성 구문 확인

```sql
   SHOW CREATE CATALOG oracle;
   ```
   ```sql
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | Catalog | CreateCatalog                                                                                                        |
    +---------+----------------------------------------------------------------------------------------------------------------------+
    | oracle  |
    CREATE CATALOG `oracle` PROPERTIES (
    "user" = "XXX",
    "type" = "jdbc",
    "password" = "*XXX",
    "jdbc_url" = "XXX",
    "driver_url" = "XXX",
    "driver_class" = "oracle.jdbc.driver.OracleDriver",
    "checksum" = "XXX"
    ); |
    +---------+----------------------------------------------------------------------------------------------------------------------+
   ```
