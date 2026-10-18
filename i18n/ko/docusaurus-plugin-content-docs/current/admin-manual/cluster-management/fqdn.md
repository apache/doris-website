---
{
    "title": "FQDN",
    "language": "ko",
    "description": "이 문서는 Apache Doris에서 FQDN (Fully Qualified Domain Name) 모드를 활성화하는 방법을 설명하며, 새 클러스터 구성, 기존 클러스터 마이그레이션, Kubernetes 배포 및 서버 IP 변경을 다룹니다."
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenarios: Cluster deployment / Node changes / Kubernetes deployment -->

이 문서는 Apache Doris 클러스터에서 FQDN (Fully Qualified Domain Name)을 활성화하는 방법을 설명합니다. FQDN은 인터넷상의 특정 컴퓨터나 호스트를 나타내는 완전한 도메인 이름입니다.

FQDN을 활성화하면 Doris 노드 간의 모든 통신이 FQDN을 기반으로 이루어집니다. 노드를 추가할 때는 FQDN을 직접 지정합니다. 예를 들어 BE 노드를 추가하는 명령은 다음과 같습니다.

```sql
ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port";
```

FQDN 모드에서는 `be_host`를 IP 주소가 아닌 BE 노드의 FQDN으로 설정해야 합니다.

## 적용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: Architecture decision -->

| 시나리오 | 설명 | 관련 절차 |
| --- | --- | --- |
| 새로 배포하는 클러스터 | 새 클러스터를 구축할 때 FQDN을 바로 활성화하여 나중에 마이그레이션할 필요가 없도록 합니다 | [새 클러스터에서 FQDN 활성화](#enable-fqdn-on-a-new-cluster) |
| Kubernetes 배포 | Pod가 다시 시작되면 IP는 변경될 수 있지만 도메인 이름은 변경되지 않습니다. FQDN은 서비스 연속성을 보장합니다. | [K8s에 Doris 배포](#deploy-doris-on-k8s) |
| 서버 IP 변경 | 네트워크 인터페이스를 전환하거나 머신을 교체할 때 Doris 메타데이터를 수정할 필요가 없습니다 | [서버 IP 변경](#server-ip-change) |
| 기존 클러스터 마이그레이션 | 이미 IP를 기반으로 실행 중인 클러스터를 FQDN 모드로 전환합니다 | [기존 클러스터에서 FQDN 활성화](#enable-fqdn-on-an-existing-cluster) |

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Pre-deployment checks -->

FQDN을 활성화하기 전에 다음 조건을 충족해야 합니다.

- `enable_fqdn_mode = true`를 `fe.conf`에 설정합니다.
- 클러스터의 모든 머신에 호스트 이름이 설정되어 있어야 합니다.
- 클러스터의 각 머신에 있는 `/etc/hosts` 파일에 다른 모든 머신의 IP와 FQDN 간 매핑이 포함되어 있어야 합니다.
- `/etc/hosts` 파일에 중복된 IP 주소가 있어서는 안 됩니다.

## 새 클러스터에서 FQDN 활성화 {#enable-fqdn-on-a-new-cluster}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New cluster deployment -->

3 FE + 3 BE 클러스터 배포를 예로 들면, 절차는 다음과 같습니다.

1. **머신 준비**: 클러스터 규모에 맞는 수의 머신을 준비합니다(이 예에서는 6대).

2. **호스트 이름의 고유성 확인**: 각 머신에서 `host` 명령을 실행하고 반환되는 결과가 서로 다른지 확인합니다. 6대의 머신에 설정된 호스트 이름이 각각 `fe1`, `fe2`, `fe3`, `be1`, `be2`, `be3`이라고 가정합니다.

3. **`/etc/hosts` 설정**: 6대의 모든 머신에서 6개 FQDN 모두의 실제 IP 주소를 `/etc/hosts`에 설정합니다.

    ```text
    172.22.0.1 fe1
    172.22.0.2 fe2
    172.22.0.3 fe3
    172.22.0.4 be1
    172.22.0.5 be2
    172.22.0.6 be3
    ```

4. **네트워크 확인**: 임의의 노드(예: `fe1`)에서 `ping fe2`를 실행합니다. 올바른 IP로 해석되고 해당 노드에 연결할 수 있으면 네트워크 환경이 준비된 것입니다.

5. **FQDN 설정 활성화**: 각 FE 노드의 `fe.conf`에 다음을 설정합니다.

    ```text
    enable_fqdn_mode = true
    ```

6. **클러스터 배포**: [수동 배포](../../install/deploy-manually/integrated-storage-compute-deploy-manually)에 따라 FE / BE 배포를 완료합니다.

7. **필요에 따라 Broker 추가**: 선택한 머신에 Broker를 배포하고 다음 명령을 실행합니다.

    ```sql
    ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;
    ```

## K8s에 Doris 배포 {#deploy-doris-on-k8s}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Kubernetes deployment -->

Kubernetes 환경에서는 Pod가 예기치 않게 다시 시작된 후에도 IP가 동일하게 유지된다는 보장이 없지만, 도메인 이름은 유지됩니다. Doris에서 FQDN을 활성화하면 이 특성을 활용하여 Pod가 다시 시작된 후에도 서비스에 계속 접근할 수 있습니다.

K8s에 Doris를 배포하는 전체 절차는 [K8s에 Doris 배포](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster)를 참조하세요.

## 서버 IP 변경 {#server-ip-change}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Node IP change / Network interface switch / Machine replacement -->

"새 클러스터에서 FQDN 활성화"에 설명된 대로 배포를 완료한 후 머신의 IP를 변경해야 하는 경우(예: 네트워크 인터페이스 전환 또는 머신 교체), 모든 머신의 `/etc/hosts` 파일만 업데이트하면 됩니다. Doris 클러스터 메타데이터를 수정할 필요는 없습니다.

## 기존 클러스터에서 FQDN 활성화 {#enable-fqdn-on-an-existing-cluster}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Migration of existing cluster -->

**버전 요구 사항**: 현재 Doris 버전이 다음 구문을 지원해야 합니다.

```sql
ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
```

현재 버전이 이 구문을 지원하지 않으면 먼저 지원하는 버전으로 업그레이드하세요.

:::caution
다음 작업을 수행하려면 클러스터에 최소 3개의 Follower 노드가 있어야 합니다. 그렇지 않으면 클러스터가 정상적으로 시작되지 않습니다.
:::

### FE 노드에서 FQDN 활성화 {#enable-fqdn-on-fe-nodes}

Follower 및 Observer 노드에서 다음 작업을 한 번에 하나씩 수행하고, **Master 노드는 마지막에 작업합니다**.

1. **노드 중지**: 현재 FE 프로세스를 중지합니다.

2. **노드 상태 확인**: MySQL 클라이언트로 `SHOW FRONTENDS`를 실행하여 해당 FE 노드의 `Alive` 상태가 `false`로 변경되었는지 확인합니다.

3. **FQDN 설정**: 다음 SQL을 실행합니다(Master 노드가 중지되면 새 Master가 자동으로 선출됩니다. 이 구문은 새 Master에서 실행합니다).

    ```sql
    ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
    ```

4. **노드 설정 수정**: 중지한 노드의 FE 루트 디렉터리에서 `conf/fe.conf`를 편집하여 다음을 추가합니다.

    ```text
    enable_fqdn_mode = true
    ```

    이 설정을 추가한 후에도 노드가 정상적으로 시작되지 않으면, `enable_fqdn_mode = true`를 `fe.conf`에 추가하는 작업을 **모든** FE에서 수행한 다음 방금 중지한 FE 노드를 시작합니다.

5. **노드 시작**: FE 프로세스를 시작하여 노드가 클러스터에 다시 참여하도록 합니다.

### BE 노드에서 FQDN 활성화 {#enable-fqdn-on-be-nodes}

BE 노드에서 FQDN을 활성화할 때는 다시 시작할 필요가 없습니다. MySQL을 통해 다음 명령을 실행합니다.

```sql
ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>";
```

`HeartbeatPort`의 포트 번호를 모르면 `SHOW BACKENDS` 명령으로 확인합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

### 질문: `enable_fqdn_mode` 설정 항목을 임의로 변경할 수 있나요? {#q-can-the-enable_fqdn_mode-configuration-item-be-changed-at-will}

아니요, 임의로 변경할 수 없습니다. 이미 IP를 기반으로 실행 중인 클러스터를 FQDN 모드로 전환하려면 [기존 클러스터에서 FQDN 활성화](#enable-fqdn-on-an-existing-cluster)의 절차를 따르세요.

### 질문: Follower 노드가 3개 미만이어도 FQDN을 활성화할 수 있나요? {#q-can-fqdn-be-enabled-when-there-are-fewer-than-3-follower-nodes}

아니요. 기존 클러스터의 마이그레이션 절차를 수행하려면 클러스터에 최소 3개의 Follower 노드가 있어야 합니다. 그렇지 않으면 클러스터가 정상적으로 시작되지 않습니다.

### 질문: 서버 IP가 변경되면 Doris 메타데이터를 수정해야 하나요? {#q-does-doris-metadata-need-to-be-modified-after-a-server-ip-change}

아니요. 모든 머신의 `/etc/hosts`에서 IP와 FQDN 간 매핑만 업데이트하면 됩니다.

### 질문: 노드를 추가할 때 `be_host`를 무엇으로 설정해야 하나요? {#q-what-should-be_host-be-set-to-when-adding-a-node}

FQDN을 활성화한 후에는 `be_host`를 IP 주소가 아닌 BE 노드의 FQDN으로 설정해야 합니다.
