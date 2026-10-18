---
{
    "title": "TLS 프레임워크 설정",
    "language": "ko",
    "description": "고정된 TLS 설정 이름, 기본값, 컴포넌트 적용 범위, 확장 지침을 포함한 Apache Doris TLS 프레임워크 설정 규약 참조 문서입니다.",
    "keywords": [
        "Doris TLS framework",
        "enable_tls",
        "tls_verify_mode",
        "mTLS",
        "TLS configuration"
    ]
}
---

<!-- Knowledge type: Configuration parameters / Extension contract -->
<!-- Applicable scenarios: TLS module integration / Configuration compatibility -->

이 문서는 Apache Doris의 TLS 프레임워크 설정 규약을 설명합니다.

:::note
이 프레임워크는 Apache Doris 4.1.4부터 사용할 수 있습니다. 이러한 통합 TLS 설정은 4.0에서는 사용할 수 없습니다.
:::

오픈 소스 Doris 패키지에는 TLS 및 인증서 기반 인증을 위한 프레임워크, 설정 항목, 파서 지원, 확장 지점이 포함되어 있습니다. 모든 프로토콜에 대한 완전한 TLS 런타임 구현이 포함되어 있는 것은 아닙니다. 기본 오픈 소스 빌드에서 TLS 모듈이 구현되지 않은 프로토콜에 TLS를 활성화하면 TLS 모듈이 필요하다는 오류와 함께 실패합니다.

아래에 나열된 설정 이름, 기본값, 의미는 프레임워크에서 고정되어 있습니다. 자체 TLS 모듈을 구현하는 경우 호환성을 위해 이 프레임워크와 설정 항목을 사용하세요. 인증서 로딩, TLS 컨텍스트 생성, 핸드셰이크 동작, 인증서 다시 로딩, 프로토콜별 피어 검증 등의 세부 동작은 TLS 모듈에서 구현할 수 있습니다.

## 설정 참조 {#configuration-reference}

아래 옵션은 모두 선택 사항이며, 명시된 기본값을 사용합니다. FE의 `fe.conf`, BE의 `be.conf` 또는 Cloud Meta Service/Recycler 컴포넌트 설정에 지정하세요. 동적으로 변경할 수 있는 FE의 `tls_cert_based_auth_ignore_password`를 제외하고는 시작 시 적용되는 설정으로 취급하고 해당 프로세스를 다시 시작하세요. 프로토콜을 활성화하기 전에 모듈을 배포하고 검증하세요.

| 설정 | 유형 | 컴포넌트 | 기본값 | 설명 | 참고 |
| --- | --- | --- | --- | --- | --- |
| `enable_tls` | Boolean | FE, BE, Cloud | `false` | 프로세스의 통합 TLS 프레임워크를 활성화합니다. | 이 값이 `true`이면 `tls_excluded_protocols`로 제외되지 않은 프로토콜은 모듈에서 제공하는 TLS 구현을 사용해야 합니다. 관련된 모든 Doris 컴포넌트는 호환되는 TLS 설정을 사용해야 합니다. |
| `tls_verify_mode` | String | FE, BE, Cloud | `verify_peer` | 인증서 검증 동작을 제어합니다. 지원되는 값은 `verify_none`, `verify_peer`, `verify_fail_if_no_peer_cert`입니다. | [TLS 검증 모드](#tls-verification-modes)를 참조하세요. |
| `tls_certificate_path` | String | FE, BE, Cloud | 비어 있음 | 컴포넌트가 TLS 서버 또는 클라이언트로 동작할 때 사용하는 인증서의 경로입니다. | 프레임워크 규약에서는 PEM 인증서를 사용하도록 정하고 있습니다. TLS 모듈은 리프 인증서 또는 전체 인증서 체인을 포함한 PEM 파일을 지원할 수 있습니다. |
| `tls_private_key_path` | String | FE, BE, Cloud | 비어 있음 | `tls_certificate_path`와 함께 사용하는 개인 키의 경로입니다. | 프레임워크 규약에서는 PEM 개인 키를 사용하도록 정하고 있습니다. |
| `tls_private_key_password` | String | FE, BE, Cloud | 비어 있음 | 개인 키 파일의 비밀번호입니다. | Base64로 인코딩된 값이 아닌 일반 비밀번호 문자열입니다. |
| `tls_ca_certificate_path` | String | FE, BE, Cloud | 비어 있음 | 피어 인증서 검증에 사용하는 CA 인증서 또는 CA 번들의 경로입니다. | 프레임워크 규약에서는 PEM CA 인증서를 사용하도록 정하고 있습니다. 이 값이 비어 있고 사용 시나리오에서 허용되는 경우, TLS 모듈은 시스템 또는 JDK의 기본 신뢰 저장소를 사용할 수도 있습니다. |
| `tls_cert_refresh_interval_seconds` | Integer | FE, BE, Cloud | `3600` | 인증서 파일을 다시 로딩해야 하는지 확인하는 간격(초)입니다. | 프레임워크는 확인 간격을 설정 항목으로 제공합니다. 실제 인증서 다시 로딩 동작은 TLS 모듈에서 구현합니다. |
| `tls_excluded_protocols` | String | FE, BE, Cloud | 비어 있음 | TLS를 사용하지 않을 프로토콜 이름을 쉼표로 구분한 목록입니다. 대소문자를 구분하지 않고 일치 여부를 확인합니다. | 적용 가능한 프로토콜 이름은 컴포넌트와 TLS 모듈에 따라 다릅니다. 오픈 소스 프레임워크에는 `thrift`, `mysql`, `http`, `arrowflight`, `brpc`, `bdbje` 등의 선택자가 예약되어 있습니다. 구현에서 지원하는 선택자만 사용하세요. |
| `tls_peer_cert_required_san_dns` | String | FE, BE, Cloud | 비어 있음 | 특정 내부 프로토콜에 적용되는 피어 인증서의 DNS Subject Alternative Name 허용 목록입니다. | 구문: `<protocol>=<dns1>,<dns2>;...`. 프레임워크는 피어 인증서 접근 제어가 필요한 모듈 구현을 위해 이 규약을 마련해 두었습니다. |
| `tls_cert_based_auth_ignore_password` | Boolean | FE | `false` | 인증서 기반 인증에 성공한 후 비밀번호 검증을 생략할 수 있도록 합니다. | 이 설정은 FE 사용자 인증 흐름에만 영향을 줍니다. 활성화하면 비밀번호 기반 보호가 약화되므로, TLS 모듈이 필요한 인증서 인증 동작을 제공하는 배포 환경에서만 활성화해야 합니다. |

## TLS 검증 모드 {#tls-verification-modes}

| 모드 | 클라이언트 역할 | 서버 역할 | 용도 |
| --- | --- | --- | --- |
| `verify_none` | 서버 인증서를 검증하지 않습니다. | 클라이언트 인증서를 검증하지 않습니다. | 인증서 검증 없이 TLS 암호화가 필요한 배포 환경에 사용합니다. |
| `verify_peer` | 서버 인증서를 검증합니다. | 클라이언트 인증서를 요구하지 않습니다. | 단방향 TLS 검증에 사용합니다. 이 값은 mTLS를 요구하지 않습니다. |
| `verify_fail_if_no_peer_cert` | 서버 인증서를 검증합니다. | 클라이언트 인증서를 요구하고 검증합니다. | 상호 인증서 검증이 필요한 mTLS 배포 환경에 사용합니다. |

## 오픈 소스 빌드에서의 프레임워크 동작 {#framework-behavior-in-the-open-source-build}

오픈 소스 프레임워크는 설정 정의와 확장 지점을 제공하며, `enable_tls`가 `false`이면 기본 제공 구현이 기존 평문 통신 동작을 유지합니다.

`enable_tls`가 `true`이면 프로토콜 시작 또는 채널 생성이 TLS 프레임워크를 통해 처리됩니다. 해당 TLS 모듈이 제공되지 않으면 오픈 소스 기본 구현은 해당 프로토콜의 TLS 시작을 거부하고 TLS 모듈이 필요하다고 알립니다.

따라서 위 테이블은 호환성 규약이며, 기본 오픈 소스 패키지에서 TLS를 활성화하기 위한 완전한 운영 가이드는 아닙니다.

## 구현 지침 {#implementation-guidance}

사용자 정의 TLS 모듈을 구현하는 경우 다음 규칙을 따르세요.

- 이 문서의 설정 이름과 의미를 사용하세요. 동일한 TLS 동작에 대해 다른 설정 이름을 도입하지 마세요.
- 동일한 설정 항목이 있는 FE, BE, Cloud 컴포넌트에서는 설정 동작을 일관되게 유지하세요.
- 사용자가 TLS 모듈에서 처리할 프로토콜을 선택할 수 있도록 `tls_excluded_protocols`를 준수하세요.
- 서버와 클라이언트 역할 모두에서 `tls_verify_mode`를 일관되게 구현하세요.
- 인증서 다시 로딩을 지원하는 경우 `tls_cert_refresh_interval_seconds`를 다시 로딩 여부를 확인하는 간격으로 사용하세요.
- 피어 인증서의 DNS SAN 기반 접근 제어를 지원하는 경우 테이블에 설명된 `tls_peer_cert_required_san_dns` 구문을 사용하세요.
- 인증서 기반 인증을 위해 프레임워크 확장 지점을 통해 런타임 인증 구현을 제공하세요. 사용자 정의 구현이 없으면 오픈 소스 기본 서비스는 아무 작업도 수행하지 않습니다(no-op).
