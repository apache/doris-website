---
{
    "title": "ALTER CATALOG",
    "language": "ko",
    "description": "이 문은 지정한 Catalog의 속성을 설정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정한 Catalog의 속성을 설정하는 데 사용됩니다.


## 구문 {#syntax}
1) Catalog 이름 변경

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```

2) Catalog 속성 수정 / 추가

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]);  
    ```

3) Catalog 주석 수정

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**

수정할 Catalog의 이름

**2. `<new_catalog_name>`**

변경 후의 새 Catalog 이름

**3. `'<key>' = '<value>'`**

수정 / 추가할 Catalog 속성의 키와 값

**4. `<new catalog comment>`**

수정된 Catalog 주석


## 접근 제어 요구 사항 {#access-control-requirements}
| 권한  | 객체  | 참고 사항                                     |
|:-----------|:--------|:------------------------------------------|
| ALTER_PRIV | Catalog | 해당 Catalog의 ALTER_PRIV 권한이 필요합니다 |

## 사용 시 참고 사항 {#usage-notes}

1) Catalog 이름 변경
- 기본 제공 Catalog인 `internal`의 이름은 변경할 수 없습니다
- Alter 이상의 권한이 있는 사용자만 Catalog의 이름을 변경할 수 있습니다
- Catalog 이름을 변경한 후 REVOKE 및 GRANT 명령을 사용하여 해당 사용자 권한을 수정해야 합니다

2) Catalog 속성 수정 / 추가

- `type` 속성은 수정할 수 없습니다.
- 기본 제공 Catalog인 `internal`의 속성은 수정할 수 없습니다.
- 지정한 키의 값을 업데이트합니다. Catalog 속성에 해당 키가 없으면 추가됩니다.

3) Catalog 주석 수정

- 기본 제공 Catalog인 `internal`은 수정할 수 없습니다

## 예제 {#example}

1. Catalog ctlg_hive의 이름을 hive로 변경

      ```sql
      ALTER CATALOG ctlg_hive RENAME hive;
      ```

2. Catalog hive의 `hive.metastore.uris` 속성 수정

      ```sql
      ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
      ```

3. Catalog hive의 주석 수정
      ```sql
      ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
      ```
