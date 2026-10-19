---
{
    "title": "복잡한 네트워크 환경에서의 Stream Load 활용",
    "language": "ko",
    "description": "퍼블릭 클라우드, 프라이빗 클라우드, Kubernetes 클러스터 간 통신 등 복잡한 네트워크 환경에서 Doris Stream Load를 어떻게 사용할 수 있을까요? 다중 엔드포인트 구성과 Group Commit 스케줄링 솔루션을 소개합니다.",
    "keywords": [
        "Stream Load",
        "Group Commit",
        "복잡한 네트워크",
        "퍼블릭 클라우드 데이터 적재",
        "Kubernetes 데이터 적재",
        "VPC 클러스터 간 통신",
        "로드 밸런서",
        "public_endpoint",
        "private_endpoint",
        "redirect-policy"
    ]
}
---

<!-- Knowledge type: architecture decision + operational steps -->
<!-- Applicable scenarios: data ingestion configuration in public cloud / private cloud / Kubernetes cross-cluster environments -->

퍼블릭 클라우드, 프라이빗 클라우드, Kubernetes 클러스터 간 배포 등 복잡한 네트워크 환경에서는 데이터 적재 시 특유의 과제에 직면합니다. 로드 밸런서(LB)와 네트워크 격리(VPC 내부 및 외부 액세스)는 요청 라우팅의 유연성과 배치 처리의 효율성 모두에 영향을 줍니다.

Apache Doris는 다음 두 가지 기능으로 이러한 과제를 해결합니다.

- **Stream Load의 다중 엔드포인트 지원**: BE 노드에 여러 네트워크 엔드포인트를 유연하게 구성할 수 있습니다.
- **Group Commit LB 스케줄링 최적화**: 요청이 로드 밸런서를 통과한 후에도 효율적으로 배치 처리되도록 합니다.

> 버전 요구 사항: Doris 3.1.0 이상이 필요합니다.

## 배경 {#background}

### Stream Load {#stream-load}

Stream Load는 JSON, CSV 등의 형식을 지원하는 HTTP 기반 데이터 적재 방식입니다. 푸시 방식이므로 클라이언트는 MySQL 프로토콜을 거치지 않고 HTTP 요청으로 BE 노드에 직접 데이터를 전송합니다. 이러한 설계는 높은 동시성, 짧은 지연 시간, 높은 처리량을 지원하므로 소량의 데이터를 자주 쓰는 시나리오에 적합합니다.

### Group Commit {#group-commit}

Group Commit은 서버 측에서 여러 소규모 요청을 대규모 배치 작업으로 병합하여 디스크 I/O, 잠금 경합, Compaction 오버헤드를 줄이고 처리량을 최적화합니다. 최상의 효율을 얻으려면 동일한 테이블에 대한 요청이 동일한 BE 노드로 라우팅되어야 합니다.

### 복잡한 네트워크 환경의 핵심 과제 {#core-challenges-in-complex-network-environments}

클라우드 환경에서 로드 밸런서는 요청을 BE 노드에 무작위로 분산하므로 Group Commit이 의존하는 "노드 선호도"가 깨집니다. 그 결과 동일한 테이블에 대한 요청이 서로 다른 노드로 분산됩니다. 테스트 결과, 이로 인해 동시성이 높은 시나리오에서는 처리량이 20-50% 감소할 수 있습니다.

## Stream Load의 다중 엔드포인트 지원 {#multi-endpoint-support-for-stream-load}

<!-- Knowledge type: configuration parameters -->

### BE 주소의 세 가지 유형 {#three-types-of-be-addresses}

Doris BE 노드는 다양한 네트워크 액세스 시나리오에 대응하기 위해 세 가지 유형의 주소를 지원합니다.

| 주소 유형         | 용도                                                | 예시               |
| -------------------- | ------------------------------------------------------ | --------------------- |
| `be_host`            | 클러스터 내부 통신                         | `192.168.1.1:9050`    |
| `public_endpoint`    | 외부 공용 네트워크 액세스(LB 또는 공인 IP 경유)   | `11.10.20.12:8010`    |
| `private_endpoint`   | VPC 내부 또는 Kubernetes Service IP를 통한 액세스              | `10.10.10.9:8020`     |

### BE 엔드포인트 구성 {#configuring-be-endpoints}

SQL 문을 사용하여 BE 노드의 엔드포인트 정보를 추가하거나 수정합니다.

```sql
-- Add a BE node and configure its endpoints
ALTER SYSTEM ADD BACKEND '192.168.1.1:9050' PROPERTIES(
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);

-- Modify the endpoints of an existing BE node
ALTER SYSTEM MODIFY BACKEND '192.168.1.1:9050' SET (
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);
```

### 리디렉션 정책(redirect-policy) {#redirect-policy-redirect-policy}

Stream Load 요청에 `redirect-policy` HTTP 헤더를 설정하여 요청을 라우팅할 엔드포인트를 제어할 수 있습니다.

| 정책        | 동작                              | 적용 시나리오                              |
| ------------- | ------------------------------------- | ------------------------------------------------- |
| `direct`      | `be_host`로 라우팅                   | 지연 시간이 짧아야 하는 내부 통신, Pod 간 통신   |
| `public`      | `public_endpoint`로 라우팅           | 외부 공용 네트워크 액세스                    |
| `private`     | `private_endpoint`로 라우팅          | VPC 내부 또는 클러스터 간 액세스                 |
| 기본값(비어 있음) | 호스트 이름을 기준으로 엔드포인트를 자동 선택 | 일반적인 시나리오 |

`redirect-policy`를 명시적으로 설정하지 않으면 FE는 다음 순서로 엔드포인트를 자동 선택합니다.

1. 요청의 호스트 이름이 `public_endpoint`의 호스트 이름과 일치하면 `public_endpoint`로 라우팅합니다.
2. 그렇지 않고 `private_endpoint`가 구성되어 있으면 `private_endpoint`로 라우팅합니다.
3. 그 외에는 `be_host`를 사용합니다.

### 요청 예시 {#request-example}

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### 작동 방식 {#how-it-works}

1. 클라이언트가 FE에 Stream Load 요청을 전송합니다. 필요에 따라 `redirect-policy` 헤더를 포함할 수 있습니다.
2. FE는 정책에 따라 BE 주소 풀에서 대상 주소를 선택합니다.
3. FE는 선택한 엔드포인트를 가리키는 HTTP 리디렉션 응답을 반환합니다.

## Group Commit LB 스케줄링 최적화 {#group-commit-lb-scheduling-optimization}

<!-- Knowledge type: architecture mechanism -->

### 두 단계 전달 메커니즘 {#two-stage-forwarding-mechanism}

로드 밸런서를 거친 후에도 Group Commit의 효율성을 유지하기 위해 Doris는 두 단계 전달 메커니즘을 구현합니다.

**1단계: FE 리디렉션**

- FE는 `redirect-policy`에 따라 적절한 엔드포인트를 선택합니다.
- FE는 대상 테이블을 처리할 BE 노드를 결정합니다.
- 요청은 LB를 통해 리디렉션되며, LB는 요청을 BE 노드에 무작위로 분산합니다.

**2단계: BE 전달**

- 요청을 수신한 BE(BE1)가 해당 테이블의 지정 노드가 아닌 경우입니다.
- BE1은 내부적으로 `be_host`를 통해 올바른 BE(BE2)로 요청을 전달합니다.
- 이를 통해 동일한 테이블에 대한 모든 요청이 동일한 노드에 도달하도록 합니다.

### Group Commit을 활성화한 요청 예시 {#request-example-with-group-commit-enabled}

해당 Group Commit 모드를 활성화하려면 요청 헤더에 `group_commit` 매개변수를 추가하면 됩니다.

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### 성능 {#performance}

두 단계 전달로 발생하는 오버헤드는 밀리초 수준으로 매우 작으며, Group Commit의 배치 최적화는 동시성이 높은 시나리오에서 처리량을 20-50% 향상할 수 있습니다.

## 대표적인 사용 사례 {#typical-use-cases}

<!-- Applicable scenarios: endpoint and Group Commit combinations for different business forms -->

| 시나리오                | 구성                                       | 이점                              |
| ----------------------- | --------------------------------------------------- | ------------------------------------- |
| 실시간 로그 적재 | Group Commit + 다중 엔드포인트                       | 높은 처리량 + 유연한 라우팅    |
| 클라우드 네이티브 BI         | `public_endpoint`를 통한 외부 액세스               | 외부 사용자의 안전한 액세스      |
| Kubernetes 클러스터 간 통신 | `private_endpoint`와 Pod / Service IP 함께 사용   | 효율적인 클러스터 간 통신 |

## 참고 사항 {#notes}

- **구성 계획**: 엔드포인트 주소가 올바르게 구성되었는지 확인하세요. 특히 Kubernetes 환경에서는 Service / Pod IP 계획과 일치해야 합니다.
- **모니터링**: 모니터링 도구로 전달 비율과 성능 지표를 추적하고, 두 단계 전달이 발생하는 비율에 주의를 기울이세요.
- **버전 요구 사항**: Doris 3.1.0 이상이 필요합니다.

## 자주 묻는 질문 {#faq}

**Q1: `public_endpoint`와 `private_endpoint`는 언제 구성해야 하나요?**

클라이언트와 BE 노드 사이에 네트워크 격리가 존재하는 경우(예: VPC 내부와 외부, Kubernetes 클러스터 내부와 외부), 서로 다른 네트워크 위치의 클라이언트가 BE에 올바르게 액세스할 수 있도록 `public_endpoint`(공용/외부 액세스용)와 `private_endpoint`(내부/VPC 액세스용)를 각각 구성해야 합니다.

**Q2: 로드 밸런서를 거쳐도 Group Commit이 작동하나요?**

예. Doris는 두 단계 전달 메커니즘을 통해 LB가 요청을 무작위로 분산하더라도 BE가 동일한 테이블에 대한 요청을 동일한 노드로 전달하도록 하여 Group Commit의 배치 처리 이점을 유지합니다.

**Q3: `redirect-policy`를 설정하지 않으면 어떻게 되나요?**

FE는 요청의 호스트 이름을 기준으로 엔드포인트를 자동 선택합니다. 먼저 `public_endpoint`와 일치하는지 확인하고, 다음으로 `private_endpoint`를 확인하며, 마지막으로 `be_host`를 사용합니다.

**Q4: 두 단계 전달로 지연 시간이 크게 증가하나요?**

아니요. BE 간 내부 전달에는 밀리초 수준의 오버헤드만 발생합니다. 이는 동시성이 높은 환경에서 Group Commit이 제공하는 20-50%의 처리량 향상에 비하면 무시할 수 있는 수준입니다.

## 문제 해결 {#troubleshooting}

| 증상                                                | 가능한 원인                                                            | 해결 방법                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 리디렉션 후 클라이언트가 BE 주소에 액세스할 수 없음     | `public_endpoint` / `private_endpoint`가 실제 네트워크와 일치하지 않음  | `ALTER SYSTEM MODIFY BACKEND`로 엔드포인트 구성을 수정                                 |
| 동시성이 높은 환경에서 Stream Load 처리량이 기대에 못 미침 | Group Commit이 활성화되지 않았거나 요청이 두 단계 전달을 거치지 않음 | 요청 헤더에 `group_commit: async_mode`를 추가하고 BE 간 네트워크 연결을 확인    |
| Kubernetes 클러스터 간 데이터 적재 실패               | `private_endpoint`가 없거나 `redirect-policy`가 지정되지 않음       | `private_endpoint`를 Pod / Service IP로 구성하고 `redirect-policy: private`를 설정               |
| 기본 리디렉션이 잘못된 엔드포인트로 라우팅됨          | 호스트 이름 일치 규칙이 예상대로 적용되지 않음                      | `redirect-policy: public` 또는 `private`를 명시적으로 지정                                             |
