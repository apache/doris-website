---
{
    "title": "보안 HTTP 전송",
    "language": "ko",
    "description": "Doris FE 인터페이스에 HTTPS/SSL 암호화를 활성화합니다. 인증서 경로, 비밀번호, 유형, 별칭 등의 매개변수를 구성하여 FE 통신을 보호합니다.",
    "keywords": [
        "Doris HTTPS",
        "Doris SSL",
        "FE certificate configuration",
        "enable_https",
        "key_store_path",
        "key_store_password",
        "key_store_type",
        "key_store_alias",
        "JKS keystore",
        "FE HTTPS encryption",
        "self-signed certificate",
        "CA certificate"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Enabling HTTPS encryption for the FE interface / Certificate deployment -->

이 문서에서는 Doris FE 인터페이스에 HTTPS(SSL) 암호화 전송을 활성화하는 방법을 설명합니다. SSL 키와 인증서를 구성하면 클라이언트와 FE 간 통신의 기밀성과 무결성을 보장할 수 있습니다.

:::tip

Doris는 2.0 버전부터 SSL 키와 인증서 구성을 지원합니다.

:::

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 적용 여부 |
| --- | --- |
| FE HTTP 인터페이스의 암호화가 필요한 프로덕션 환경 | 적용 가능. CA에서 발급한 인증서를 권장합니다. |
| HTTPS 통신 흐름을 검증하는 내부 테스트 또는 개발 환경 | 적용 가능. 자체 서명 인증서를 사용할 수 있습니다. |
| 외부 접근이 필요 없는 클러스터 내부 통신 | 선택 사항 |

## 사전 요구 사항 {#prerequisites}

- Doris 버전 >= 2.0
- 사용 가능한 SSL 인증서(JKS 등의 keystore 형식) 또는 자체 서명 인증서를 생성할 수 있는 환경
- 인증서를 배치하고 `conf/fe.conf`를 수정할 수 있도록 FE 노드의 파일 시스템에 대한 접근 권한

## 구성 절차 개요 {#configuration-workflow-overview}

1. SSL 인증서를 준비합니다(구매하거나 자체 서명 인증서를 생성).
2. 인증서를 FE의 지정된 경로에 복사합니다.
3. FE 구성 파일 `conf/fe.conf`를 수정하고 HTTPS를 활성화합니다.
4. FE를 재시작하여 구성을 적용합니다.

## 절차 {#procedure}

### 1단계: SSL 인증서 준비 {#step-1-prepare-the-ssl-certificate}

SSL 인증서를 구매하거나 자체 서명 SSL 인증서를 생성합니다. 프로덕션 환경에서는 클라이언트 측에 인증서를 신뢰할 수 없다는 경고가 표시되지 않도록 CA에서 발급한 인증서를 사용하는 것이 좋습니다.

### 2단계: 인증서 파일 배치 {#step-2-place-the-certificate-file}

SSL 인증서를 지정된 경로에 복사합니다. 기본 경로는 `${DORIS_HOME}/conf/ssl/`이며, 사용자 지정 경로를 사용할 수도 있습니다.

### 3단계: FE 구성 수정 {#step-3-modify-the-fe-configuration}

FE 구성 파일 `conf/fe.conf`를 수정합니다. 다음 매개변수는 구매하거나 생성한 SSL 인증서와 일치해야 합니다.

- `enable_https = true`로 설정하여 HTTPS를 활성화합니다. 기본값은 `false`입니다.
- 인증서 경로인 `key_store_path`를 설정합니다. 기본값은 `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore`입니다.
- 인증서 비밀번호인 `key_store_password`를 설정합니다. 기본값은 비어 있습니다.
- 인증서 유형인 `key_store_type`을 설정합니다. 기본값은 `JKS`입니다.
- 인증서 별칭인 `key_store_alias`를 설정합니다. 기본값은 `doris_ssl_certificate`입니다.

### 4단계: FE 재시작 {#step-4-restart-the-fe}

구성을 수정한 후 FE 노드를 재시작해야 변경 사항이 적용됩니다.

## 구성 매개변수 참조 {#configuration-parameter-reference}

<!-- Knowledge type: Configuration parameters -->

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `enable_https` | `false` | FE의 HTTPS 활성화 여부입니다. `true`로 설정하면 활성화됩니다. |
| `key_store_path` | `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore` | SSL 인증서 파일의 경로입니다. 실제 저장 위치와 일치해야 합니다. |
| `key_store_password` | 비어 있음 | SSL 인증서 비밀번호입니다. 인증서를 생성할 때 설정한 비밀번호와 일치해야 합니다. |
| `key_store_type` | `JKS` | 인증서 유형입니다. 인증서의 실제 유형과 일치해야 합니다. |
| `key_store_alias` | `doris_ssl_certificate` | 인증서 별칭입니다. 인증서에 정의된 별칭과 일치해야 합니다. |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting HTTPS enablement failures -->

### 질문: HTTPS를 활성화한 후 FE가 시작되지 않습니다. {#q-the-fe-fails-to-start-after-https-is-enabled}

`key_store_path`가 가리키는 파일이 없거나 해당 경로에 대한 권한이 부족합니다. 인증서 경로가 올바른지 확인하고 FE 프로세스에 해당 경로의 읽기 권한이 있는지 확인하세요.

### 질문: 시작 시 인증서를 불러오지 못했다는 오류가 발생합니다. {#q-startup-reports-an-error-indicating-that-the-certificate-failed-to-load}

`key_store_password`, `key_store_type` 또는 `key_store_alias`가 인증서의 실제 정보와 일치하지 않습니다. 인증서를 생성할 때 사용한 비밀번호, 유형, 별칭을 확인하고 `fe.conf`의 구성과 일치하는지 확인하세요.

### 질문: 브라우저에 인증서를 신뢰할 수 없다는 경고가 표시됩니다. {#q-the-browser-shows-a-certificate-not-trusted-warning}

자체 서명 인증서를 사용하고 있기 때문입니다. 프로덕션 환경에서는 CA에서 발급한 인증서로 교체하거나 클라이언트 측에서 이 인증서를 신뢰하도록 수동으로 설정하세요.

### 질문: 구성을 수정해도 HTTPS가 적용되지 않습니다. {#q-https-still-does-not-take-effect-after-the-configuration-is-modified}

FE를 재시작하지 않았거나 일부 FE 노드의 구성만 수정했기 때문입니다. 모든 FE 노드의 구성이 동일하고 재시작되었는지 확인하세요.
