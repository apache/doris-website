---
{
    "title": "SHOW CATALOGS",
    "language": "ko",
    "description": "이 문은 생성된 Catalog를 조회하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 생성된 Catalog를 조회하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW CATALOGS [LIKE <catalog_name>]
```

설명:

1. LIKE: Catalog 이름을 기준으로 패턴 일치 쿼리를 수행할 수 있습니다.


## 선택적 매개변수 {#optional-parameters}

**1. `<catalog_name>`**

표시할 Catalog의 이름입니다.

## 반환 값 {#return-value}

| 열 이름    | 설명 |
|---|---|
| CatalogId      | 데이터 Catalog의 고유 ID |
| CatalogName    | 데이터 Catalog의 이름입니다. 기본 내장 Catalog의 이름은 "internal"이며 변경할 수 없습니다. |
| Type           | 데이터 Catalog의 유형 |
| IsCurrent      | 현재 활성화된 데이터 Catalog인지 여부 |
| CreateTime     | 생성 시간  |
| LastUpdateTime | 마지막 업데이트 시간 |
| Comment        | Catalog에 대한 설명 |

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한                                                                                    | 객체  | 참고                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | 위 권한 중 하나가 필요합니다. |


## 예제 {#examples}

1. 현재 생성되어 있는 데이터 Catalog 조회

   ```sql
   SHOW CATALOGS;
   ```
   ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    |         0 | internal    | internal | yes       | UNRECORDED              | NULL                | Doris internal catalog |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    ```

2. Catalog 이름을 기준으로 패턴 일치 쿼리 수행

   ```sql
   SHOW CATALOGS LIKE 'hi%';
   ```
    ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
   ```
