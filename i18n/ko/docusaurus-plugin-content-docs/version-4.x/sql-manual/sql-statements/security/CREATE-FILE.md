---
{
    "title": "CREATE FILE",
    "language": "ko",
    "description": "이 구문은 파일을 생성하고 Doris 클러스터에 업로드하는 데 사용됩니다."
}
---

## 설명 {#description}

이 구문은 파일을 생성하고 Doris 클러스터에 업로드하는 데 사용됩니다.
이 기능은 일반적으로 인증서, 공개 키, 개인 키 등 다른 명령에서 사용하는 파일을 관리하는 데 사용됩니다.

## 구문 {#syntax}

```sql
CREATE FILE <file_name>
        [ { FROM | IN } <database_name>] PROPERTIES ("<key>"="<value>" [ , ... ]);
```

## 필수 매개변수 {#required-parameters}

**1. `<file_name>`**

> 사용자 지정 파일 이름입니다.

**2. `<key>`**

> 파일 속성 키입니다.
> - **url**: 필수입니다. 인증이 필요하지 않은 HTTP 다운로드 URL을 지정합니다. 실행에 성공하면 파일이 Doris에 저장되며, 이 URL은 더 이상 필요하지 않습니다.
> - **catalog**: 필수입니다. 파일 분류에 사용할 카테고리 이름입니다(사용자 정의). 특정 명령에서 파일을 찾는 데 사용됩니다(예: 정기 데이터 적재 시 Kafka가 데이터 소스인 경우 'kafka' catalog에서 파일을 검색합니다).
> - **md5**: 선택 사항입니다. 파일의 MD5 체크섬입니다. 지정하면 다운로드 후 검증을 수행합니다.

**3. `<value>`**

> 파일 속성 값입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<database_name>`**

> 파일이 속한 데이터베이스를 지정합니다. 지정하지 않으면 현재 세션의 데이터베이스를 사용합니다.

## 액세스 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한    | 대상      | 설명                                                                           |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | 사용자 / 역할 | 이 작업을 실행하려면 사용자 또는 역할에 `ADMIN_PRIV` 권한이 있어야 합니다 |

## 사용 시 참고 사항 {#usage-notes}

- 파일 액세스 규칙

> 각 파일은 특정 데이터베이스(Database)에 속합니다. 해당 데이터베이스에 대한 액세스 권한이 있는 사용자는
> 데이터베이스 내의 모든 파일에 액세스할 수 있습니다.

- 파일 크기 및 개수 제한

> 이 기능은 주로 인증서와 같은 작은 파일을 관리하도록 설계되었습니다.  
> **크기 제한**: 개별 파일의 크기는 1MB로 제한됩니다  
> **개수 제한**: Doris 클러스터에는 최대 100개의 파일을 업로드할 수 있습니다

## 예제 {#example}

- ca.pem 파일을 생성하고 kafka로 분류

   ```sql
   CREATE FILE "ca.pem"
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/ca.pem",
       "catalog" = "kafka"
   );
   ```

- client.key 파일을 생성하고 my_catalog로 분류

   ```sql
   CREATE FILE "client.key"
   IN my_database
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/client.key",
       "catalog" = "my_catalog",
       "md5" = "b5bb901bf10f99205b39a46ac3557dd9"
   );
   ```

- client_1.key 파일을 생성하고 my_catalog로 분류

  ```sql
    CREATE FILE "client_1.key"
    FROM my_database
    PROPERTIES
    (
       "url" = "https://test.bj.bcebos.com/kafka-key/client.key",
       "catalog" = "my_catalog",
       "md5" = "b5bb901bf10f99205b39a46ac3557dd9"
    );
    ```
