---
{
    "title": "ALTER RESOURCE",
    "language": "ko",
    "description": "이 문은 기존 리소스를 수정하는 데 사용합니다. root 또는 admin 사용자만 리소스를 수정할 수 있습니다."
}
---

## 설명 {#description}

이 문은 기존 리소스를 수정하는 데 사용합니다. root 또는 admin 사용자만 리소스를 수정할 수 있습니다.

4.1.5부터 root가 생성한 것으로 표시된 신규 AI Resource는 root만 수정하거나 삭제할 수 있으며, 다른 `ADMIN` 사용자는 이러한 작업을 수행할 수 없습니다. 업그레이드 전에 생성되어 이 표시가 없는 리소스에는 해당 제한이 소급 적용되지 않습니다. [AI Resource 권한](../../../sql-functions/ai-functions/overview.md)을 참조하세요.

## 구문 {#syntax}

```sql
ALTER RESOURCE '<resource_name>'
PROPERTIES (
  `<property>`, 
  [ , ... ]
);
```

## 매개변수 {#parameters}

1.`<property>`

`<property>`의 형식은 `<key>` = `<value>`이며, `<value>`의 수정은 해당 `<key>`가 'type'인 경우 지원되지 않습니다.

수정 가능한 속성 매개변수는 [CREATE-RESOURCE](./CREATE-RESOURCE.md) 섹션을 참조하세요.


## 예제 {#examples}

1. spark0이라는 Spark 리소스의 작업 디렉터리 수정:

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```

2. remote_s3라는 S3 리소스의 최대 연결 수 수정:

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```

3. 콜드 데이터와 핫 데이터 분리에 사용되는 S3 리소스 관련 정보 수정

- 지원되는 항목
  - `s3.access_key`  s3 ak
  - `s3.secret_key`  s3 sk
  - `s3.session_token` s3 token
  - `s3.connection.maximum` 기본값 50
  - `s3.connection.timeout` 기본값 1000ms
  - `s3.connection.request.timeout` 기본값 3000ms
- 지원되지 않는 항목
  - `s3.region`
  - `s3.bucket"`
  - `s3.root.path`
  - `s3.endpoint`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("s3.connection.maximum" = "1111");
```
