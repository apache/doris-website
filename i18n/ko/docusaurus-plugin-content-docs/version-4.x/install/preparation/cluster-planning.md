---
{
    "title": "클러스터 계획",
    "language": "ko",
    "description": "Doris를 배포하기 전에 아키텍처 모드를 선택하고 포트와 노드 수를 계획하세요."
}
---

<!-- Knowledge type: Architecture selection + Configuration reference -->
<!-- Applicable scenarios: Deployment planning / Architecture selection / Capacity planning -->

## 아키텍처 계획 {#architecture-planning}

<!-- Knowledge type: Architecture selection decision -->

비즈니스 요구 사항에 따라 아키텍처 모드를 선택하세요.

| 아키텍처 모드 | 적용 시나리오 | 의존성 |
| ----------------- | ------------------- | ---------- |
| [스토리지와 컴퓨팅 통합](../../features-architecture/system-architecture#coupled-architecture) | 매우 높은 수준의 탄력적 확장이 필요하지 않은 경우 | 공유 스토리지 불필요 |
| [스토리지와 컴퓨팅 분리](../../features-architecture/system-architecture#decoupled-architecture) | 컴퓨팅 리소스를 동적으로 확장해야 하는 경우 | 공유 스토리지 필요 |

## 포트 계획 {#port-planning}

<!-- Knowledge type: Network configuration parameters -->

Doris 인스턴스는 네트워크를 통해 통신합니다. 관리자는 환경에 맞게 포트 설정을 조정할 수 있습니다.

| 인스턴스 | 포트 이름 | 기본 포트 | 통신 방향 | 설명 |
| -------- | --------- | ------------ | ----------------------- | ----------- |
| BE | be_port | 9060 | FE → BE | Thrift Server, FE의 요청 수신 |
| BE | webserver_port | 8040 | BE ↔ BE | HTTP Server |
| BE | heartbeat_service_port | 9050 | FE → BE | 하트비트 서비스(Thrift) |
| BE | brpc_port | 8060 | FE ↔ BE, BE ↔ BE | BRPC 통신 |
| FE | http_port | 8030 | FE ↔ FE, 클라이언트 ↔ FE | HTTP Server |
| FE | rpc_port | 9020 | BE → FE, FE ↔ FE | Thrift Server, 모든 FE에서 동일해야 함 |
| FE | query_port | 9030 | 클라이언트 ↔ FE | MySQL Server |
| FE | edit_log_port | 9010 | FE ↔ FE | bdbje 통신 |

## 노드 수 계획 {#node-count-planning}

<!-- Knowledge type: Node capacity planning -->

### FE 노드 수 {#fe-node-count}

FE는 사용자 요청 수신, 쿼리 계획, 메타데이터 관리 및 노드 관리를 담당합니다.

| 노드 유형 | 역할 | 프로덕션 권장 사항 |
| --------- | ---- | ------------------------- |
| Follower | 선거에 참여하며, Master가 중단되면 역할을 인계받음 | ≥ 3 |
| Observer | 메타데이터만 동기화하며, 읽기 서비스 처리 용량을 확장 | 필요에 따라 추가 |

### BE 노드 수 {#be-node-count}

BE는 데이터 저장과 연산을 담당합니다. 프로덕션 환경에서는 신뢰성을 보장하기 위해 복제본 3개를 사용합니다.

| 권장 사항 | 설명 |
| -------------- | ----------- |
| BE ≥ 3개 | 복제본 3개를 통해 저장 신뢰성 보장(스토리지와 컴퓨팅 통합 모드에 해당. 스토리지와 컴퓨팅 분리 모드에서는 BE 수가 0개 이상일 수 있음.) |
| 수평 확장 지원 | 노드를 추가하면 쿼리 성능과 동시 처리 능력이 향상됨 |
