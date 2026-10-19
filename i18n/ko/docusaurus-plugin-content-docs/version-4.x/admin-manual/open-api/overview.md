---
{
    "title": "개요 | Open Api",
    "language": "ko",
    "description": "Apache Doris의 운영 및 유지 관리를 보완하는 수단으로,",
    "sidebar_label": "개요"
}
---

# 개요 {#overview}

OPEN API는 Apache Doris의 운영 및 유지 관리를 보완하는 수단으로, 주로 데이터베이스 관리자가 일부 관리 작업을 수행할 때 사용합니다.

:::note
OPEN API는 현재 안정적이지 않으며, 개발자가 테스트하고 사용하는 용도로만 권장됩니다. 이후 버전에서 인터페이스 동작이 변경될 수 있습니다.
프로덕션 환경에서는 SQL 명령으로 작업을 수행하는 것이 좋습니다.
:::

## 보안 인증 {#security-certification}

다음 설정을 통해 FE 및 BE API의 보안 인증을 활성화할 수 있습니다.

| 설정 | 설정 파일 | 기본값 | 설명 |
| --- | ---| --- | --- |
| `enable_all_http_auth` | `be.conf` | `false` | BE HTTP 포트(기본값 8040)의 인증을 활성화합니다. 활성화하면 BE의 HTTP API에 접근하려면 ADMIN 사용자로 로그인해야 합니다. |
| `enable_brpc_builtin_services` | `be.conf` | true | brpc 내장 서비스를 외부에 공개할지 여부를 설정합니다(기본 포트는 8060). 비활성화하면 HTTP 포트 8060에 접근할 수 없습니다. (버전 2.1.7부터 지원) |
| `enable_all_http_auth` | `fe.conf` | `false` | FE HTTP 포트(기본값 8030)의 인증을 활성화합니다. 활성화하면 FE HTTP API에 접근하려면 해당 사용자 권한이 필요합니다. |

:::info 참고
FE 및 BE의 HTTP API에 필요한 권한은 버전마다 다릅니다. 자세한 내용은 해당 API 문서를 참조하세요.
:::
