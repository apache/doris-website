---
{
    "title": "Apache Ozone",
    "language": "ko",
    "description": "Doris는 버전 4.0.4부터 S3 Gateway를 통한 Apache Ozone 접근을 지원합니다.",
    "sidebar_label": "Apache Ozone"
}
---

# Apache Ozone {#apache-ozone}

Doris는 버전 4.0.4부터 S3 Gateway를 통한 Apache Ozone 접근을 지원합니다.

이 문서는 Apache Ozone에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 항목에 적용됩니다:

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

**Ozone을 전용 스토리지 유형으로 사용하려면 `"fs.ozone.support" = "true"`를 명시적으로 설정하세요.**

## 매개변수 개요 {#parameter-overview}

| 속성 이름 | 기존 이름 | 설명 | 기본값 | 필수 여부 |
| --- | --- | --- | --- | --- |
| ozone.endpoint | s3.endpoint | Ozone S3 Gateway 엔드포인트, 예: `http://ozone-s3g:9878` | 없음 | 예 |
| ozone.region | s3.region | Ozone S3 Gateway의 리전 | `us-east-1` | 아니요 |
| ozone.access_key | s3.access_key, s3.access-key-id | 인증에 사용하는 액세스 키 | 없음 | 아니요* |
| ozone.secret_key | s3.secret_key, s3.secret-access-key | 인증에 사용하는 시크릿 키 | 없음 | 아니요* |
| ozone.session_token | s3.session_token, s3.session-token | 세션 토큰 | 없음 | 아니요 |
| ozone.connection.maximum | s3.connection.maximum | 최대 연결 수 | `100` | 아니요 |
| ozone.connection.request.timeout | s3.connection.request.timeout | 요청 시간 초과(밀리초) | `10000` | 아니요 |
| ozone.connection.timeout | s3.connection.timeout | 연결 시간 초과(밀리초) | `10000` | 아니요 |
| ozone.use_path_style | use_path_style, s3.path-style-access | 경로 스타일 접근 사용 여부 | `true` | 아니요 |
| ozone.force_parsing_by_standard_uri | force_parsing_by_standard_uri | 표준 URI 파싱 강제 적용 여부 | `false` | 아니요 |
| fs.ozone.support |  | Ozone을 스토리지 유형으로 활성화할지 여부 | `false` | 예 |

참고:

- `ozone.access_key`와 `ozone.secret_key`는 함께 설정해야 합니다.
- Ozone 속성은 `fs.s3a.*` 키를 직접 파싱하지 않습니다. `ozone.*` 또는 호환되는 `s3.*` 키를 사용하세요.
- Ozone은 `s3://`, `s3a://`, `s3n://` URI 스킴을 지원합니다.
- `ozone.endpoint`(또는 `s3.endpoint`)만 설정하면 Ozone이 활성화되지 않습니다. 반드시 `fs.ozone.support=true`를 설정해야 합니다.

## 구성 예시 {#example-configuration}

`ozone.*` 키 사용:

```properties
"fs.ozone.support" = "true",
"ozone.endpoint" = "http://ozone-s3g:9878",
"ozone.access_key" = "hadoop",
"ozone.secret_key" = "hadoop",
"ozone.region" = "us-east-1",
"ozone.use_path_style" = "true"
```

호환되는 `s3.*` 별칭 사용:

```properties
"fs.ozone.support" = "true",
"s3.endpoint" = "http://ozone-s3g:9878",
"s3.access_key" = "hadoop",
"s3.secret_key" = "hadoop",
"s3.region" = "us-east-1",
"s3.path-style-access" = "true"
```
