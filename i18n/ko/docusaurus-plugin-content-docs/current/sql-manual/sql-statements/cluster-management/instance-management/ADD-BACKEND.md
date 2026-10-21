---
{
    "title": "ADD BACKEND",
    "language": "ko",
    "description": "ADD BACKEND는 Doris 클러스터에 하나 이상의 BE 노드를 추가하는 데 사용됩니다."
}
---

## 설명 {#description}

ADD BACKEND는 Doris 클러스터에 하나 이상의 BE 노드를 추가하는 데 사용됩니다. 이 명령을 사용하면 관리자는 새 BE 노드의 호스트와 포트를 지정하고, 선택적 속성을 통해 노드의 동작을 구성할 수 있습니다.

## 구문 {#syntax}

```sql
ALTER SYSTEM ADD BACKEND "<host>:<heartbeat_port>"[,"<host>:<heartbeat_port>" [, ...]] [PROPERTIES ("<key>"="<value>" [, ...] )]
```

## 필수 매개변수 {#required-parameters}

**1. <host>**

> BE 노드의 호스트 이름 또는 IP 주소를 지정할 수 있습니다.

**2. <heartbeat_port>**

> BE 노드의 하트비트 포트이며, 기본값은 9050입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `PROPERTIES ("<key>"="<value>" [, ... ] )`**

> BE 노드의 추가 속성을 정의하는 키-값 쌍의 집합입니다. 이러한 속성을 사용하여 추가할 BE의 구성을 사용자 지정할 수 있습니다. 사용 가능한 속성은 다음과 같습니다.
> - `tag.location`: 스토리지와 컴퓨팅이 통합된 모드에서 BE 노드가 속하는 Resource Group을 지정하는 데 사용됩니다.
> - `tag.compute_group_name`: 스토리지와 컴퓨팅이 분리된 모드에서 BE 노드가 속하는 컴퓨트 그룹을 지정하는 데 사용됩니다.
> - `tag.public_endpoint`: 외부 액세스에 사용할 BE 노드의 퍼블릭 엔드포인트(예: `11.10.20.12:8010`)를 지정하는 데 사용됩니다. 일반적으로 외부 사용자가 액세스할 수 있는 로드 밸런서 도메인 이름이나 공인 IP입니다.
> - `tag.private_endpoint`: 사설 네트워크 액세스에 사용할 BE 노드의 프라이빗 엔드포인트(예: `10.10.10.9:8020`)를 지정하는 데 사용됩니다. 일반적으로 VPC 내부 액세스나 클러스터 내 Kubernetes Service IP에 사용됩니다.

## 액세스 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 참고 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 사용 시 참고 사항 {#usage-notes}

1. 새 BE 노드를 추가하기 전에 노드가 올바르게 구성되어 실행 중인지 확인하세요.
2. [Resource Group](../../../../admin-manual/workload-management/resource-group.md)을 사용하면 클러스터의 BE 노드를 더 효과적으로 관리하고 구성할 수 있습니다.
3. 여러 BE 노드를 추가할 때는 하나의 명령에 함께 지정하여 효율을 높일 수 있습니다.
4. BE 노드를 추가한 후에는 [`SHOW BACKENDS`](./SHOW-BACKENDS.md)를 사용하여 노드가 성공적으로 추가되었고 정상 상태인지 확인하세요.
5. 클러스터의 가용성과 내결함성을 높이려면 서로 다른 물리적 위치나 랙에 BE 노드를 추가하는 것을 고려하세요.
6. 새로 추가한 BE 노드가 적절히 활용되도록 클러스터의 부하를 정기적으로 확인하고 균형을 조정하세요.

## 예제 {#examples}

1. 추가 속성 없이 BE 노드 추가
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.1:9050,192.168.0.2:9050";
   ```
   이 명령은 클러스터에 다음 두 BE 노드를 추가합니다.
   * 192.168.0.1, 포트 9050
   * 192.168.0.2, 포트 9050
   추가 속성을 지정하지 않았으므로 기본 설정이 적용됩니다.

2. 스토리지와 컴퓨팅이 통합된 모드에서 지정된 Resource Group에 BE 노드 추가
   ```sql
   ALTER SYSTEM ADD BACKEND "doris-be01:9050" PROPERTIES ("tag.location" = "groupb");
   ```
   이 명령은 BE 노드 하나(호스트 이름 doris-be01, 포트 9050)를 클러스터의 Resource Group `groupb`에 추가합니다.

3. 스토리지와 컴퓨팅이 분리된 모드에서 지정된 컴퓨트 그룹에 BE 노드 추가
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.3:9050" PROPERTIES ("tag.compute_group_name" = "cloud_groupc");
   ```
   이 명령은 BE 노드 하나(IP 192.168.0.3, 포트 9050)를 클러스터의 컴퓨트 그룹 `cloud_groupc`에 추가합니다.

4. 복잡한 네트워크 환경에 맞게 퍼블릭 및 프라이빗 엔드포인트를 구성하여 BE 노드 추가
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.1.1:9050" PROPERTIES (
       "tag.public_endpoint" = "11.10.20.12:8010",
       "tag.private_endpoint" = "10.10.10.9:8020"
   );
   ```
   이 명령은 여러 네트워크 엔드포인트가 구성된 BE 노드를 추가합니다.
   * `192.168.1.1:9050`: 클러스터 통신에 사용하는 내부 주소(be_host)
   * `11.10.20.12:8010`: 외부 사용자가 로드 밸런서를 통해 액세스하는 데 사용하는 퍼블릭 엔드포인트
   * `10.10.10.9:8020`: VPC 내부 또는 Kubernetes 클러스터 간 액세스에 사용하는 프라이빗 엔드포인트

   이 구성은 서로 다른 네트워크 환경에서 BE 노드에 액세스해야 하는 클라우드 환경이나 Kubernetes 클러스터에서 유용합니다. 자세한 내용은 [복잡한 네트워크 환경에서의 Stream Load](../../../../data-operate/import/load-best-practices/stream-load-in-complex-network.md)를 참조하세요.
