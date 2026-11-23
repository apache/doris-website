---
{
    "title": "SHOW CREATE CATALOG",
    "language": "ko",
    "description": "이 문은 Doris Catalog의 생성문을 표시합니다."
}
---

## 설명 {#description}

이 문은 Doris Catalog의 생성문을 표시합니다.

## 속성 마스킹 {#property-masking}

공통 마스킹 정책은 Doris 4.2.0과 5.0 및 그 이후 릴리스에 적용될 예정입니다. 민감한 속성은 `*XXX`로 표시되며, 일부 내부 속성은 표시되지 않습니다. 명시적인 JDBC 연결 문자열은 전체가 숨겨지고, 일반 URI는 값에 따라 정제됩니다. 자세한 내용은 [Catalog 속성 마스킹 규칙](../../../lakehouse/catalog-property-masking.md)을 참조하세요. 아래 예시는 이 정책을 따르며, 4.0, 4.1 또는 3.x의 동작을 설명하지 않습니다. 예시에서 `*XXX`는 마스킹 표시이며, 다른 `XXX` 값은 설명을 위한 자리 표시자입니다.

## 구문 {#syntax}

```sql
SHOW CREATE CATALOG <catalog_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**

생성문을 확인할 Catalog의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한                                                                                          | 객체    | 설명                              |
|:---------------------------------------------------------------------------------------------|:--------|:----------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | 위 권한 중 하나가 필요합니다.      |


## 예시 {#example}

1. Doris에서 oracle Catalog의 생성문을 확인합니다.

```sql
   SHOW CREATE CATALOG oracle;
   ```
   ```text
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | Catalog | CreateCatalog                                                                                                        |
    +---------+----------------------------------------------------------------------------------------------------------------------+
    | oracle  |
    CREATE CATALOG `oracle` PROPERTIES (
    "user" = "XXX",
    "type" = "jdbc",
    "password" = "*XXX",
    "jdbc_url" = "*XXX",
    "driver_url" = "XXX",
    "driver_class" = "oracle.jdbc.driver.OracleDriver",
    "checksum" = "XXX"
    ); |
    +---------+----------------------------------------------------------------------------------------------------------------------+
   ```
