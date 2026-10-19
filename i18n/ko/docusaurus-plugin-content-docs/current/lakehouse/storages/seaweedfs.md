---
{
    "title": "SeaweedFS | 스토리지",
    "language": "ko",
    "description": "이 문서는 SeaweedFS에 액세스하는 데 필요한 매개변수를 설명하며, 다음 시나리오에 적용됩니다:",
    "sidebar_label": "SeaweedFS"
}
---

# SeaweedFS {#seaweedfs}

이 문서는 [SeaweedFS](https://seaweedfs.com/)에 액세스하는 데 필요한 매개변수를 설명하며, 다음 시나리오에 적용됩니다:

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

**Doris는 S3 Client를 사용하여 S3 호환 프로토콜로 SeaweedFS에 액세스합니다.** 이 페이지에서는 SeaweedFS S3의 일반 버킷을 다룹니다. SeaweedFS S3 Table Buckets(동일한 `weed` 프로세스에서 제공하는 REST Catalog + S3)에 저장된 Iceberg 테이블에 대해서는 [SeaweedFS와의 통합](../best-practices/doris-seaweedfs.md)을 참조하세요.

## `weed mini`로 빠르게 시작하기 {#quick-start-with-weed-mini}

`weed mini`는 환경 변수를 바탕으로 자격 증명을 설정하고 버킷을 미리 생성하면서, 단일 프로세스에서 SeaweedFS S3 엔드포인트를 실행합니다:

```bash
AWS_ACCESS_KEY_ID=admin \
AWS_SECRET_ACCESS_KEY=secret \
S3_BUCKET=my-bucket \
weed mini -dir=/data
```

이제 `http://localhost:8333`에서 S3 엔드포인트에 접속할 수 있으며, `my-bucket`이 이미 생성되어 있고 `admin` / `secret`을 유효한 자격 증명으로 사용할 수 있습니다. Docker, 사용자 지정 포트, 여러 버킷, 리버스 프록시 옵션에 대해서는 [`weed mini`로 빠르게 시작하기](https://github.com/seaweedfs/seaweedfs/wiki/Quick-Start-with-weed-mini)를 참조하세요.

## 매개변수 개요 {#parameter-overview}

SeaweedFS는 S3 호환 프로토콜을 통해 액세스하므로 AWS S3와 동일한 `s3.*` 속성을 사용합니다.

| 속성 이름                   | 설명                                                                                          | 기본값 | 필수 여부 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | -------- |
| s3.endpoint                     | SeaweedFS S3 게이트웨이 엔드포인트. 예: `http://seaweedfs.example.com:8333`                        |         | 예      |
| s3.access_key                   | SeaweedFS S3 IAM 구성에 설정된 액세스 키                                                  |         | 예      |
| s3.secret_key                   | `s3.access_key`와 쌍을 이루는 비밀 키                                                                |         | 예      |
| s3.region                       | 리전. SeaweedFS는 이 값을 검증하지 않지만 AWS S3 SDK에서 필수로 요구합니다. 예: `us-east-1`       |         | 예      |
| s3.use_path_style               | `true`로 설정합니다. SeaweedFS는 `http://<endpoint>/<bucket>/<key>` 경로로 객체를 제공합니다                       | FALSE   | 아니요       |
| s3.connection.maximum           | SeaweedFS S3 게이트웨이에 대한 최대 연결 수                                              | 50      | 아니요       |
| s3.connection.request.timeout   | 요청 시간 초과(밀리초)                                                                        | 3000    | 아니요       |
| s3.connection.timeout           | 연결 설정 시간 초과(밀리초)                                                       | 1000    | 아니요       |

### 경로 스타일 액세스 사용 {#using-path-style-access}

SeaweedFS는 경로 스타일 주소 지정 방식(`http://<endpoint>/<bucket>/<key>`)을 사용하며 버킷별 DNS 하위 도메인을 제공하지 않으므로, 모든 연결에 `s3.use_path_style = true`를 설정하세요.

## 구성 예시 {#example-configuration}

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://seaweedfs.example.com:8333",
"s3.region" = "us-east-1",
"s3.use_path_style" = "true"
```

## 사용 권장 사항 {#usage-recommendations}

* `s3.use_path_style = true`를 설정하세요. SeaweedFS는 버킷별 DNS 하위 도메인을 사용하지 않습니다.
* `s3.region`은 AWS S3 SDK에서 필수로 요구하지만 SeaweedFS에서는 무시합니다. 비어 있지 않은 값이면 모두 사용할 수 있습니다.
* HTTPS를 사용하려면 리버스 프록시에서 TLS를 종료하고 `weed`를 `-s3.externalUrl=https://<proxy>` 옵션으로 시작하여 S3 서명 검증이 작동하도록 하세요.
* SeaweedFS S3 Table Buckets의 Iceberg 테이블에 대해서는 [SeaweedFS와의 통합](../best-practices/doris-seaweedfs.md)을 참조하세요.
