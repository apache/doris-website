---
{
    "title": "MinIO | 스토리지",
    "language": "ko",
    "description": "이 문서는 다음과 같은 상황에서 MinIO에 액세스하는 데 필요한 매개변수를 설명합니다:",
    "sidebar_label": "MinIO"
}
---

# MinIO {#minio}

이 문서는 다음과 같은 상황에서 MinIO에 액세스하는 데 필요한 매개변수를 설명합니다:

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

**Doris는 S3 Client를 사용하여 S3 호환 프로토콜로 MinIO에 액세스합니다.**

## 매개변수 개요 {#parameter-overview}

| 속성 이름                  | 이전 이름              | 설명                                                  | 기본값 | 필수 여부 |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| minio.endpoint                 | s3.endpoint              | MinIO 엔드포인트. MinIO에 액세스하기 위한 엔드포인트입니다.               |               | 예      |
| minio.access_key               | s3.access_key            | MinIO 액세스 키. 인증에 사용하는 MinIO 액세스 키입니다. |               | 예      |
| minio.secret_key               | s3.secret_key            | MinIO 비밀 키. 액세스 키와 함께 사용하는 비밀 키입니다. |               | 예      |
| minio.connection.maximum       | s3.connection.maximum    | S3 최대 연결 수. MinIO 서비스에 설정할 수 있는 최대 연결 수를 지정합니다. | 50            | 아니요       |
| minio.connection.request.timeout | s3.connection.request.timeout | S3 요청 제한 시간. MinIO 서비스에 연결할 때의 요청 제한 시간을 밀리초 단위로 지정합니다. | 3000          | 아니요       |
| minio.connection.timeout       | s3.connection.timeout    | S3 연결 제한 시간. MinIO 서비스와 연결을 설정할 때의 제한 시간을 밀리초 단위로 지정합니다. | 1000          | 아니요       |
| minio.use_path_style           | s3.use_path_style        | Path-style 액세스 사용 여부. MinIO 및 AWS 이외의 S3 서비스와의 호환성을 위해 true로 설정하는 것을 권장합니다. | FALSE         | 아니요       |

### Path-style 액세스 사용 {#using-path-style-access}

MinIO는 기본적으로 Host-style 액세스를 사용하지만 Path-style 액세스도 지원합니다. `minio.use_path_style` 매개변수를 설정하여 전환할 수 있습니다.

- Host-style 액세스(기본값): `https://bucket.minio.example.com`
- Path-style 액세스(활성화한 경우): `https://minio.example.com/bucket`

## 구성 예시 {#example-configuration}

```properties
"minio.access_key" = "your-access-key",
"minio.secret_key" = "your-secret-key",
"minio.endpoint" = "http://minio.example.com:9000"
```

3.1 이전 버전의 경우:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```

## 사용 권장 사항 {#usage-recommendations}

* MinIO 구성의 일관성과 명확성을 위해 구성 매개변수에 `minio.` 접두사를 사용하는 것을 권장합니다.
* 3.1 이전 버전에서는 기존 이름인 `s3.`을 접두사로 사용하세요.
* 연결을 방지하기 위해 동시성 요구 사항에 따라 연결 풀 매개변수를 조정할 수 있습니다.
