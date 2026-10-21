---
{
    "title": "REFRESH",
    "language": "ko",
    "description": "지정된 Catalog/데이터베이스/테이블의 메타데이터를 새로 고치는 문입니다."
}
---

## 설명 {#description}

지정된 Catalog/데이터베이스/테이블의 메타데이터를 새로 고치는 문입니다.

## 구문 {#syntax}

```sql
REFRESH CATALOG <catalog_name>
    [PROPERTIES ("invalid_cache" = "true" | "false")];
REFRESH DATABASE [<catalog_name>.]<database_name>;
REFRESH TABLE [[<catalog_name>.]<database_name>.]<table_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**

새로 고칠 Catalog의 이름입니다.

**2. `[<catalog_name>.]<database_name>`**

새로 고칠 Catalog 내 데이터베이스의 이름입니다.

**3. `[[<catalog_name>.]<database_name>.]<table_name>`**

새로 고칠 Catalog 내 테이블의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한                                                                                         | 객체    | 참고                                      |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | 위 권한 중 하나가 필요합니다. |


## 사용 시 참고 사항 {#usage-notes}
Catalog를 새로 고치면 객체 관련 캐시가 강제로 무효화됩니다. 여기에는 파티션 캐시, 스키마 캐시, 파일 캐시 등이 포함됩니다.

`invalid_cache`는 `REFRESH CATALOG` 실행 시 하위 수준의 메타데이터 캐시를 무효화할지 여부를 제어합니다.

- `true`: Catalog 객체 캐시와 파티션, 스키마, 파일 캐시 등의 하위 수준 캐시를 무효화합니다. 기본 동작입니다.
- `false`: Catalog 수준의 객체 및 이름 메타데이터만 새로 고치고 하위 수준 캐시는 유지합니다.

`invalid_cache`는 현재 `REFRESH CATALOG`에 적용됩니다.

## 예제 {#example}

1. hive Catalog 새로 고치기

    ```sql
    REFRESH CATALOG hive;
    ```

2. 하위 수준 캐시를 무효화하지 않고 hive Catalog 새로 고치기

    ```sql
    REFRESH CATALOG hive PROPERTIES("invalid_cache" = "false");
    ```

3. database1 새로 고치기

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

4. table1 새로 고치기

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```
