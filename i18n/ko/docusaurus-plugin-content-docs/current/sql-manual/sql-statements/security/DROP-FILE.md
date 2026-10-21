---
{
    "title": "DROP FILE",
    "language": "ko",
    "description": "이 문은 업로드된 파일을 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 업로드된 파일을 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
DROP FILE "<file_name>" [ { FROM | IN } <database>] PROPERTIES ("<key>"="<value>" [ , ... ])
```

## 필수 매개변수 {#required-parameters}

**1. `<file_name>`**

> 사용자 지정 파일 이름입니다.

**2. `<key>`**

> 파일 속성 키입니다.
> - **catalog**: 필수 항목입니다. 파일의 분류 범주입니다.

**3. `<value>`**

> 파일 속성 값입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<database>`**

> 파일이 속한 데이터베이스를 지정합니다. 지정하지 않으면 현재 세션의 데이터베이스를 사용합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한         | 객체        | 참고                                                                            |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | 사용자 / 역할 | 이 작업을 실행하려면 사용자 또는 역할에 `ADMIN_PRIV` 권한이 있어야 합니다 |

## 예제 {#example}

- ca.pem 파일 삭제

    ```sql
    DROP FILE "ca.pem" properties("catalog" = "kafka");
    ```
- `client.key` 파일 삭제(분류: `my_catalog`)

  ```sql
  DROP FILE "client.key"
  IN my_database
  ```

- `client_1.key` 파일 삭제(분류: `my_catalog`)

  ```sql
  DROP FILE "client_1.key"
  FROM my_database
  ```
