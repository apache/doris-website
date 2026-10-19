---
{
    "title": "Huawei OBS",
    "language": "ko",
    "description": "이 문서에서는 Huawei Cloud OBS에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 시나리오에 적용됩니다:"
}
---

이 문서에서는 Huawei Cloud OBS에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 시나리오에 적용됩니다:

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

**Doris는 S3 호환 프로토콜을 통해 S3 Client로 Huawei Cloud OBS에 접근합니다.**

## 매개변수 개요 {#parameter-overview}

| 속성 이름                | 이전 이름              | 설명                                                  | 기본값 | 필수 여부 |
| ---------------------------- | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| obs.endpoint                 | s3.endpoint              | OBS 엔드포인트. Huawei Cloud OBS의 접근 엔드포인트를 지정합니다 |               | 예      |
| obs.access_key               | s3.access_key            | 인증에 사용하는 OBS 액세스 키                     |               | 예      |
| obs.secret_key               | s3.secret_key            | 액세스 키와 함께 인증에 사용하는 OBS 비밀 키 |               | 예      |
| obs.region                   | s3.region                | OBS 리전. Huawei Cloud OBS의 리전을 지정합니다        |               | 아니요       |
| obs.use_path_style           | s3.use_path_style        | 경로 스타일 접근 사용 여부. MinIO/Ceph와 같은 AWS 이외의 S3 서비스와의 호환성을 위해 true로 설정하는 것이 좋습니다 | FALSE         | 아니요       |
| obs.connection.maximum       | s3.connection.maximum    | OBS 서비스에 대한 최대 연결 수                | 50            | 아니요       |
| obs.connection.request.timeout | s3.connection.request.timeout | OBS 서비스에 연결할 때의 요청 타임아웃(밀리초) | 3000          | 아니요       |
| obs.connection.timeout       | s3.connection.timeout    | OBS 서비스와의 연결을 설정할 때의 연결 타임아웃(밀리초) | 1000          | 아니요       |

> 버전 3.1 이전에는 기존 이름을 사용하세요

## 설정 예시 {#example-configuration}

```properties
"obs.access_key" = "your-access-key",
"obs.secret_key" = "your-secret-key",
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"obs.region" = "cn-north-4"
```

3.1 이전 버전의 경우:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"s3.region" = "cn-north-4",
```

## 사용 권장 사항 {#usage-recommendations}

* Huawei Cloud OBS와의 일관성과 명확성을 위해 설정 매개변수에 `obs.` 접두사를 사용하는 것이 좋습니다.
* 3.1 이전 버전에서는 `s3.` 접두사가 붙은 기존 이름을 사용하세요.
* `obs.region`을 설정하면 접근 정확도와 성능이 향상될 수 있으므로 설정하는 것이 좋습니다.
* 연결이 차단되지 않도록 동시성 요구 사항에 따라 연결 풀 매개변수를 조정할 수 있습니다.
