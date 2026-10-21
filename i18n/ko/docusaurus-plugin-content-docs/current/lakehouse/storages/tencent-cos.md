---
{
    "title": "Tencent COS",
    "language": "ko",
    "description": "이 문서는 Tencent Cloud COS에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 시나리오에 적용됩니다:"
}
---

이 문서는 Tencent Cloud COS에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 시나리오에 적용됩니다:

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

**Doris는 S3 Client를 사용하여 S3 호환 프로토콜로 Tencent Cloud COS에 접근합니다.**

## 매개변수 개요 {#parameter-overview}

| 속성 이름                  | 기존 이름              | 설명                                                  | 기본값 | 필수 여부 |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| cos.endpoint                   | s3.endpoint              | COS 엔드포인트. Tencent Cloud COS에 접근할 엔드포인트를 지정합니다 |               | 예      |
| cos.access_key                 | s3.access_key            | COS 액세스 키. COS에 접근하기 위한 인증에 사용합니다       |               | 예      |
| cos.secret_key                 | s3.secret_key            | COS 시크릿 키. 액세스 키와 함께 인증에 사용합니다 |               | 예      |
| cos.region                     | s3.region                | COS 리전. Tencent Cloud COS의 리전을 지정합니다       |               | 아니요       |
| cos.connection.maximum         | s3.connection.maximum    | S3 최대 연결 수. COS 서비스에 대한 최대 연결 수를 지정합니다 | 50            | 아니요       |
| cos.connection.request.timeout | s3.connection.request.timeout | S3 요청 제한 시간(밀리초). COS 서비스에 연결할 때의 요청 제한 시간을 지정합니다 | 3000          | 아니요       |
| cos.connection.timeout         | s3.connection.timeout    | S3 연결 제한 시간(밀리초). COS 서비스에 연결을 설정할 때의 제한 시간을 지정합니다 | 1000          | 아니요       |

> 3.1 이전 버전에서는 기존 이름을 사용하세요

## 구성 예시 {#configuration-examples}

```properties
"cos.access_key" = "your-access-key",
"cos.secret_key" = "your-secret-key",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```

3.1 이전 버전의 경우:

```properties
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "cos.ap-beijing.myqcloud.com",
"s3.region" = "ap-beijing"
```

## 사용 권장 사항 {#usage-recommendations}

* Tencent Cloud COS와의 일관성을 유지하고 의미를 명확히 하기 위해 구성 매개변수에 `cos.` 접두사를 사용하는 것이 좋습니다.
* 3.1 이전 버전에서는 기존 `s3.` 접두사를 사용하세요.
* `cos.region`을 구성하면 접근 정확도와 성능을 높일 수 있으므로 설정하는 것이 좋습니다.
* 연결이 차단되는 상황을 방지하기 위해 동시성 요구 사항에 따라 연결 풀 매개변수를 조정할 수 있습니다.
