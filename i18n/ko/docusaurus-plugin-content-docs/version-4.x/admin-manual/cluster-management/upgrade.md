---
{
    "title": "클러스터 업그레이드",
    "language": "ko",
    "description": "Apache Doris 클러스터 롤링 업그레이드 가이드: 버전 호환성 규칙, 메타데이터 호환성 테스트, BE/FE 노드 업그레이드 단계 및 일반적인 문제 해결 방법.",
    "keywords": [
        "Doris 업그레이드",
        "Doris 롤링 업그레이드",
        "Doris 클러스터 업그레이드",
        "FE 업그레이드",
        "BE 업그레이드",
        "메타데이터 호환성 테스트",
        "metadata_failure_recovery",
        "disable_balance",
        "복제본 복구 및 밸런싱",
        "Doris 버전 번호 체계",
        "버전을 건너뛰는 업그레이드",
        "카나리 업그레이드"
    ]
}
---

Apache Doris는 FE 및 BE 노드의 바이너리를 순차적으로 교체하는 롤링 업그레이드를 지원합니다. 이를 통해 다운타임을 최소화하고 업그레이드 중에도 클러스터의 가용성을 유지할 수 있습니다. 이 문서는 클러스터 관리자를 대상으로 하며, 버전 호환성 규칙, 메타데이터 호환성 테스트 절차 및 상세한 업그레이드 단계를 설명합니다.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Cluster upgrade / Version iteration / Rolling upgrade -->

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 적용 가능 여부 | 참고 사항 |
| --- | --- | --- |
| 동일한 마이너 버전 내 패치 버전 업그레이드(예: 2.1.3에서 2.1.7로) | 가능 | 롤링 업그레이드를 바로 적용할 수 있음 |
| 마이너 버전 간 업그레이드(예: 3.0에서 3.3으로) | 단계적으로 가능 | 3.0에서 3.1로, 3.1에서 3.2로, 3.2에서 3.3으로 순서대로 업그레이드 |
| 메이저 버전 업그레이드(예: 2.x에서 3.x로) | 단계적으로 가능 | 메이저 버전을 바로 건너뛰어 업그레이드하는 것은 권장하지 않음. 마이너 버전별로 순차 업그레이드 |
| 단일 FE 클러스터 업그레이드 | 호환성 테스트 후 가능 | 먼저 3-FE 고가용성 구성으로 확장하거나, 업그레이드 전에 메타데이터 호환성 테스트 실행 |
| 메타데이터가 호환되지 않을 수 있는 버전 간 업그레이드 | 호환성 테스트 후 가능 | 업그레이드 전에 메타데이터 호환성을 확인해야 함 |

## 사전 요구 사항 {#prerequisites}

업그레이드를 수행하기 전에 다음 사항을 확인하세요.

- 대상 버전의 릴리스 노트를 읽고 버전 간 동작 변경 사항과 호환성을 이해해야 합니다.
- 업그레이드 실패로 인한 데이터 손실을 방지할 수 있도록 데이터를 복제본 3개로 저장해야 합니다.
- 클라이언트 작업에 재시도 로직이 구현되어 있어야 합니다(아래의 "업그레이드 고려 사항" 참조).
- 메타데이터 호환성 테스트에 사용할 개발용 머신이나 BE 노드가 있어야 합니다.
- 대상 버전의 설치 패키지를 다운로드하고 압축을 해제해야 합니다(아래 단계에서 `${DORIS_NEW_HOME}`은 새 버전의 루트 디렉터리를, `${DORIS_OLD_HOME}`은 프로덕션에서 실행 중인 이전 버전의 루트 디렉터리를 의미합니다).

## 버전 호환성 {#version-compatibility}

Doris 버전 번호는 세 자리로 구성됩니다. 첫 번째 자리는 메이저 마일스톤 버전, 두 번째 자리는 기능 버전, 세 번째 자리는 버그 수정 버전입니다. 세 번째 자리 버전에서는 새로운 기능이 릴리스되지 않습니다. Doris 2.1.3을 예로 들면 다음과 같습니다.

| 위치 | 예시 값 | 의미 |
| --- | --- | --- |
| 첫 번째 자리 | 2 | 2번째 마일스톤 버전 |
| 두 번째 자리 | 1 | 해당 마일스톤의 기능 버전 |
| 세 번째 자리 | 3 | 해당 기능 버전의 3번째 버그 수정 버전 |

업그레이드할 때는 다음 규칙을 따르세요.

| 업그레이드 유형 | 버전을 건너뛰는 업그레이드 지원 여부 | 권장 경로 |
| --- | --- | --- |
| 세 번째 자리 버전(두 번째 자리 버전이 같음) | 지원 | 바로 업그레이드. 예: 2.1.3에서 2.1.7로 |
| 두 번째 자리 버전 | 버전을 건너뛰는 업그레이드 비권장 | 두 번째 자리 버전별로 순차 업그레이드. 예: 3.0에서 3.1, 3.2, 3.3 순서로 |
| 첫 번째 자리 버전 | 버전을 건너뛰는 업그레이드 비권장 | 먼저 동일한 첫 번째 자리 버전 내에서 최신 두 번째 자리 버전으로 업그레이드한 다음 메이저 버전 업그레이드 |

자세한 버전 정보는 [버전 관리 규칙](https://doris.apache.org/community/release-and-verify/release-versioning)을 참조하세요.

## 업그레이드 고려 사항 {#upgrade-considerations}

<!-- Knowledge type: Pre-operation check -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

업그레이드 전에 다음 세 가지 사항에 유의하세요.

| 고려 사항 | 처리 방법 |
| --- | --- |
| 버전 간 동작 변경 사항 | 업그레이드 전에 대상 버전의 릴리스 노트를 읽고 호환되지 않는 동작 변경 사항이 있는지 확인 |
| 클라이언트 작업 재시도 | 업그레이드 중에는 노드가 순차적으로 재시작되므로 Stream Load 및 쿼리 작업에 재시도 로직을 추가해야 함. Routine Load, Flink Doris Connector 및 Spark Doris Connector에는 재시도 기능이 내장되어 있어 추가 처리가 필요하지 않음 |
| 복제본 복구 및 밸런싱 | 업그레이드 전에 복제본 복구 및 밸런싱을 비활성화해야 함. 업그레이드 성공 여부와 관계없이 업그레이드가 끝나면 다시 활성화해야 함 |

:::caution 참고

Doris 업그레이드 시 FE 디렉터리 아래의 `/bin` 및 `/lib` 디렉터리와 BE 디렉터리 아래의 `/bin` 및 `/lib` 디렉터리만 교체하면 됩니다.

2.0.2 이상 버전에서는 FE 및 BE 배포 경로 아래에 `custom_lib/` 디렉터리가 추가되었습니다(없으면 수동으로 생성). 이 디렉터리는 사용자 정의 서드파티 jar 파일(예: `hadoop-lzo-*.jar` 및 `orai18n.jar`)을 저장하는 데 사용됩니다. 업그레이드 시 이 디렉터리는 교체할 필요가 없습니다.

:::

## 메타데이터 호환성 테스트 {#metadata-compatibility-test}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade verification / Metadata compatibility -->

메타데이터 호환성 테스트는 새 버전이 기존 메타데이터를 올바르게 읽어 들일 수 있는지 업그레이드 전에 확인하여, 업그레이드 실패로 인한 데이터 손실을 방지합니다. 업그레이드할 때마다 이 테스트를 실행하는 것이 좋습니다.

:::caution 참고

프로덕션에서는 FE 노드를 3개 이상 유지하는 고가용성 구성을 권장합니다. FE 노드가 1개뿐이라면 업그레이드 전에 반드시 메타데이터 호환성 테스트를 실행해야 합니다. 메타데이터 호환성은 매우 중요합니다. 메타데이터 비호환으로 업그레이드에 실패하면 데이터가 손실될 수 있습니다.

다음 사항에도 유의하세요.

- 메타데이터 호환성 테스트는 개발용 머신이나 BE 노드에서 실행하고, FE 노드에서는 실행하지 않는 것이 좋습니다.
- FE 노드에서만 테스트를 실행할 수 있다면 Master가 아닌 노드를 선택하고 기존 FE 프로세스를 먼저 중지하세요.

:::

### 1. 메타데이터 백업 {#1-back-up-metadata}

업그레이드를 시작하기 전에 Master FE 노드의 메타데이터를 백업하세요.

Master FE 노드는 `IsMaster` 열을 `show frontends`에서 확인하여 식별할 수 있습니다. FE 메타데이터는 FE 프로세스를 중지하지 않고 온라인으로 백업할 수 있습니다. 기본적으로 FE 메타데이터는 `fe/doris-meta` 디렉터리에 저장됩니다. 메타데이터 디렉터리는 `meta_dir` 매개변수를 `fe.conf`에서 확인하여 알아볼 수도 있습니다.

### 2. 테스트용 FE 설정 파일 수정 {#2-modify-the-fe-configuration-file-for-testing}

테스트 환경에서 `fe.conf`를 편집하세요.

```shell
vi ${DORIS_NEW_HOME}/conf/fe.conf
```

모든 포트를 프로덕션과 다른 값으로 설정하고 `clusterId` 매개변수도 수정하세요.

```text
...
## modify port
http_port = 18030
rpc_port = 19020
query_port = 19030
arrow_flight_sql_port = 19040
edit_log_port = 19010

## modify clusterIP
clusterId=<a_new_clusterID, such as 123456>
...
```

테스트 환경의 포트 예시는 다음과 같습니다.

| 매개변수 | 예시 값 | 설명 |
| --- | --- | --- |
| `http_port` | 18030 | FE HTTP 서비스 포트 |
| `rpc_port` | 19020 | FE Thrift Server 포트 |
| `query_port` | 19030 | FE MySQL 프로토콜 쿼리 포트 |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL 포트 |
| `edit_log_port` | 19010 | FE BDBJE 통신 포트 |
| `clusterId` | 123456 | 테스트 클러스터 ID. 프로덕션과 달라야 함 |

### 3. Master FE 메타데이터 복사 {#3-copy-the-master-fe-metadata}

백업한 Master FE 메타데이터를 새 호환성 테스트 환경에 복사하세요.

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. 메타데이터 VERSION 파일의 cluster\_id 수정 {#4-modify-the-cluster_id-in-the-metadata-version-file}

복사한 메타데이터 디렉터리 아래의 `cluster_id` 값을 `VERSION` 파일에서 새 클러스터 ID로 수정하세요. 예를 들어 위 예시와 같이 123456으로 설정합니다.

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. 테스트 환경에서 FE 프로세스 시작 {#5-start-the-fe-process-in-the-test-environment}

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

2.0.2 이전 버전에서는 `metadata_failure_recovery=true`를 `fe.conf`에 먼저 추가한 다음 FE 프로세스를 시작하세요.

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. FE가 정상적으로 시작되었는지 확인 {#6-verify-that-the-fe-started-successfully}

MySQL 클라이언트를 통해 테스트 FE에 연결하세요. 위 예시의 `query_port` 값인 19030을 사용합니다.

```shell
mysql -uroot -P19030 -h127.0.0.1
```

연결에 성공하면 새 버전이 현재 메타데이터를 올바르게 읽어 들일 수 있다는 뜻이며, 메타데이터 호환성 테스트를 통과한 것입니다.

## 업그레이드 흐름 개요 {#upgrade-flow-overview}

전체 업그레이드 흐름은 다음과 같으며, 반드시 순서대로 실행해야 합니다.

1. 복제본 복구 및 밸런싱을 비활성화합니다.
2. BE 노드를 업그레이드합니다(복제본이 여러 개인 클러스터에서는 카나리 업그레이드를 사용할 수 있음).
3. FE 노드를 업그레이드합니다(Observer/Follower 노드를 먼저 업그레이드하고 Master는 마지막에 업그레이드).
4. 복제본 복구 및 밸런싱을 다시 활성화합니다.

전체 원칙은 **BE를 먼저 업그레이드한 다음 FE를 업그레이드하는 것**입니다. FE를 업그레이드할 때는 **Observer FE 및 Follower FE 노드를 먼저 업그레이드하고 Master FE 노드는 마지막에 업그레이드하세요**.

## 업그레이드 단계 {#upgrade-steps}

### 1단계: 복제본 복구 및 밸런싱 비활성화 {#step-1-disable-replica-repair-and-balance}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

업그레이드 중에는 노드가 재시작되므로 불필요한 클러스터 밸런싱과 복제본 복구가 발생할 수 있습니다. 먼저 다음 세 가지 설정을 비활성화하세요.

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

관련 설정은 다음과 같습니다.

| 설정 | 업그레이드 전 값 | 효과 |
| --- | --- | --- |
| `disable_balance` | `true` | 복제본 밸런싱을 비활성화하여 노드 재시작으로 인한 복제본 마이그레이션 방지 |
| `disable_colocate_balance` | `true` | Colocate Join 테이블의 복제본 밸런싱 비활성화 |
| `disable_tablet_scheduler` | `true` | tablet 스케줄링을 비활성화하여 복제본 복구 방지 |

### 2단계: BE 노드 업그레이드 {#step-2-upgrade-be-nodes}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: BE rolling upgrade -->

:::info 참고

데이터 안전성을 확보하려면 데이터를 복제본 3개로 저장하여 업그레이드 중 잘못된 조작이나 실패로 인한 데이터 손실을 방지하세요.

:::

복제본이 여러 개인 클러스터에서는 BE 노드 하나를 선택하여 카나리 업그레이드를 수행할 수 있습니다. 검증이 끝나면 나머지 노드를 하나씩 업그레이드하세요.

#### 2.1 업그레이드할 BE 노드 중지 {#21-stop-the-be-node-to-be-upgraded}

```shell
sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
```

#### 2.2 기존 `/bin` 및 `/lib` 디렉터리 백업 {#22-back-up-the-existing-bin-and-lib-directories}

```shell
mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
```

#### 2.3 새 버전의 `/bin` 및 `/lib` 디렉터리 복사 {#23-copy-the-new-versions-bin-and-lib-directories}

```shell
cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
```

#### 2.4 BE 노드 시작 {#24-start-the-be-node}

```shell
sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
```

#### 2.5 업그레이드 확인 {#25-verify-the-upgrade}

클러스터에 연결하여 노드 정보를 확인하세요.

```sql
show backends\G
```

BE 노드의 `Alive` 상태가 `true`이고 `Version` 값이 새 버전이면 해당 노드가 정상적으로 업그레이드된 것입니다. 확인한 후 같은 방법으로 나머지 BE 노드를 하나씩 업그레이드하세요.

### 3단계: FE 노드 업그레이드 {#step-3-upgrade-fe-nodes}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: FE rolling upgrade -->

FE 노드가 여러 개라면 Master가 아닌 노드(Observer 또는 Follower)를 먼저 업그레이드하고, 나머지 노드의 업그레이드가 모두 끝난 후 Master 노드를 마지막으로 업그레이드하세요.

#### 3.1 업그레이드할 FE 노드 중지 {#31-stop-the-fe-node-to-be-upgraded}

```shell
sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
```

#### 3.2 기존 디렉터리 백업 {#32-back-up-the-existing-directories}

세 디렉터리 `/bin`, `/lib`, `/mysql_ssl_default_certificate`를 백업하세요.

```shell
mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
```

#### 3.3 새 버전의 디렉터리 복사 {#33-copy-the-new-versions-directories}

```shell
cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
```

#### 3.4 FE 노드 시작 {#34-start-the-fe-node}

```shell
sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
```

#### 3.5 업그레이드 확인 {#35-verify-the-upgrade}

클러스터에 연결하여 노드 정보를 확인하세요.

```sql
show frontends\G
```

FE 노드의 `Alive` 상태가 `true`이고 `Version` 값이 새 버전이면 해당 노드가 정상적으로 업그레이드된 것입니다.

#### 3.6 나머지 FE 노드를 하나씩 업그레이드 {#36-upgrade-the-remaining-fe-nodes-one-by-one}

같은 방법으로 Master가 아닌 나머지 FE 노드를 하나씩 업그레이드하고, **Master FE 노드는 마지막에 업그레이드하세요**.

### 4단계: 복제본 복구 및 밸런싱 다시 활성화 {#step-4-re-enable-replica-repair-and-balance}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Post-upgrade cleanup -->

업그레이드가 끝나고 모든 BE 노드의 `Alive` 상태가 true로 돌아오면 클러스터의 복제본 복구 및 밸런싱을 다시 활성화하세요.

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## 버전별 업그레이드 참고 사항 {#per-version-upgrade-notes}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Cross-version upgrade / Confirming post-upgrade behavior changes -->

이 섹션에서는 특정 버전으로 업그레이드할 때 특히 주의해야 하는 동작 변경 사항을 설명합니다. 전체 변경 사항을 확인하려면 이 섹션과 함께 대상 버전의 릴리스 노트를 반드시 읽어보세요.

### 3.x에서 4.0으로 업그레이드할 때 세션 변수 마이그레이션 {#session-variable-migration-when-upgrading-from-3x-to-40}

FE는 내부 변수 `variable_version`을 통해 세션 변수 기본값의 마이그레이션 진행 상태를 추적합니다. 3.x에서 4.0으로 업그레이드할 때(`variable_version`이 400 미만인 경우) FE는 다음 변수의 **전역 기본값**을 자동으로 조정합니다.

| 변수 | 마이그레이션 후 기본값 | 설명 |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | 업그레이드 후에도 의미 체계가 바뀌지 않도록 3.x의 쿼리 구성 동작 유지 |
| `enable_new_type_coercion_behavior` | `false` | 3.x의 타입 강제 변환 동작 유지 |
| `enable_sql_cache` | `true` | SQL Cache 활성화 |
| `enable_nereids_distribute_planner` | `true` | **4.0.8 버전에서 추가된 마이그레이션 항목**. 아래 설명 참조 |

마이그레이션은 `variable_version`이 400 미만에서 400으로 올라갈 때 한 번만 실행됩니다. 이후 사용자가 명시적으로 설정한 값은 덮어쓰지 않습니다.

### 4.0.8로 업그레이드 {#upgrading-to-408}

:::caution Nereids distribute planner 활성화

4.0.8 버전부터는 3.x에서 4.0으로 업그레이드하면 Nereids distribute planner(`enable_nereids_distribute_planner`)가 활성화됩니다.

4.0.8 이전에는 클러스터의 메타데이터 이미지에 `enable_nereids_distribute_planner=false`가 저장되어 있으면 업그레이드 후에도 해당 값이 그대로 복원되어 클러스터가 기존 distribute planner를 계속 사용했습니다. 4.0.8 버전에서는 이 변수를 `variable_version=400` 마이그레이션에 추가하여 업그레이드 후 새 distribute planner가 일관되게 활성화되도록 합니다.

쿼리 계획 분산이 업그레이드 전과 다르다면 `SET GLOBAL enable_nereids_distribute_planner = false;`로 되돌리고 영향을 받는 쿼리를 보고할 수 있습니다.

:::

4.0.8로 업그레이드할 때는 다음 변경 사항에도 주의해야 합니다.

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| 메모리 사용량이 높아도 Compaction이 더 이상 일시 중지되지 않음(BE 설정 `enable_compaction_pause_on_high_memory`의 기본값이 `true` → `false`로 변경) | 모든 배포 모드 | 기존 동작을 유지하려면 `true`로 다시 설정. [BE 설정](../config/be-config) 참조 |
| 최소 자동 버킷 수가 1에서 3으로 증가(FE 설정 `autobucket_min_buckets`) | `BUCKETS AUTO`로 생성한 테이블 | 새로 생성되는 파티션에만 영향. [데이터 버킷팅](../../table-design/data-partitioning/data-bucketing) 참조 |
| BE의 `_stream_load_forward` 엔드포인트를 사용하려면 설정을 활성화하고 요청을 인증해야 함 | 분리 모드에서 Group Commit의 BE 전달 기능을 사용하는 배포 | `enable_group_commit_streamload_be_forward=true`를 모든 `be.conf`에 설정하고 데이터 적재 계정에 전역 `LOAD` 권한이 있는지 확인. [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) 참조 |
| 노드 관리 API에 전역 `ADMIN` 권한이 필요함 | `/rest/v2/manager/node/{action}/{be\|fe\|broker}`를 호출하는 자동화 | 호출 측에 `ADMIN` 계정 인증 추가. [노드 작업](../open-api/fe-http/node-action) 참조 |
| Stream Load가 실제로 요청을 처리하는 컴퓨트 그룹에 대한 계정의 접근 권한을 확인함 | 분리 모드의 Stream Load | 데이터 적재 계정에 해당 컴퓨트 그룹의 접근 권한 부여. [Stream Load](../../data-operate/import/import-way/stream-load-manual) 참조 |
| 분리 모드에서 데이터 크기를 원격 크기로 일관되게 보고함 | `SHOW TABLETS` 또는 `information_schema.partitions`로 용량을 계산하는 스크립트 | 대신 `REMOTE_DATA_SIZE` 사용. [partitions](../system-tables/information_schema/partitions) 참조 |
| Routine Load 작업의 민감한 Kafka 속성이 쿼리 결과에서 `******`로 마스킹됨 | `SHOW ROUTINE LOAD`에서 자격 증명을 읽는 스크립트 | 원래 값은 구성 관리 시스템에서 읽도록 변경. [SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) 참조 |
| 워밍업 타임스탬프가 `HH:mm:ss`에서 `yyyy-MM-dd HH:mm:ss`로 변경됨 | 워밍업 작업 상태를 파싱하는 스크립트 | 시간 파싱 형식 조정. [읽기/쓰기 분리](../../compute-storage-decoupled/rw/read-write-separation) 참조 |
| 스캔 오류에 `failed to initialize storage reader` 접두사가 더 이상 포함되지 않음 | 해당 접두사와 일치하는지 확인하는 모니터링 규칙 | 대신 오류 코드와 `tablet=` / `backend=` 정보 사용 |

### 4.1.4로 업그레이드 {#upgrading-to-414}

:::caution Nereids distribute planner 활성화

4.1.4 버전부터는 **3.x에서 4.1.4로** 업그레이드하면 세션 변수 `enable_nereids_distribute_planner`의 전역 기본값이 `true`로 갱신됩니다. 4.0 계열에서는 4.0.8부터 이와 같이 동작합니다.

이 갱신은 클러스터의 `variable_version`이 `400` 미만인 경우에만 수행되므로, 이미 4.0.x 또는 4.1.x를 실행 중인 클러스터는 이 변수에 저장된 값을 그대로 유지합니다.

쿼리 계획 분산이 업그레이드 전과 다르다면 `SET GLOBAL enable_nereids_distribute_planner = false;`로 되돌리고 영향을 받는 쿼리를 보고할 수 있습니다.

:::

:::caution 부동소수점 값의 문자열 표현 변경

4.1.4 버전부터는 FLOAT / DOUBLE 값을 문자열로 변환할 때 고정된 유효 자릿수를 사용하는 대신, **다시 변환했을 때 같은 값으로 복원되는 가장 짧은 문자열**을 생성합니다. 저장된 값은 바뀌지 않지만, 문자열 표현은 4.1.3과 다를 수 있습니다(예: `246.9120025634766`은 `246.91200256347656`으로, `0.0000123456`은 `1.23456e-05`로 변경).

이 변경은 MySQL 프로토콜 쿼리 결과, `CAST(... AS STRING)`, 복합 타입 / JSON / VARIANT의 표시, `SELECT INTO OUTFILE`, EXPORT 및 외부 테이블의 부동소수점 열에 영향을 줍니다. 다운스트림 시스템이 부동소수점 값의 문자열 표현을 정확히 비교한다면 업그레이드 후 조정하세요. [부동소수점 타입](../../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)을 참조하세요.

:::

4.1.4로 업그레이드할 때는 다음 변경 사항에도 주의해야 합니다.

**제거된 인터페이스 및 구문**

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| `iceberg_meta()` 테이블 함수 제거 | 이 테이블 함수로 Iceberg 메타데이터를 읽는 SQL | 대신 Iceberg 시스템 테이블 `<table>$<system_table_name>` 사용. [ICEBERG_META](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta) 참조 |
| FE의 `/api/<ns>/<db>/<tbl>/upload` 엔드포인트 및 FE 설정 `http_load_submitter_max_worker_threads` 제거 | 이 엔드포인트를 통해 데이터 적재용 소형 파일을 업로드하는 스크립트 | 대신 Stream Load 또는 S3 / HDFS / LOCAL TVF 사용. [업로드 작업](../open-api/fe-http/upload-action) 참조 |
| `PLAN REPLAYER PLAY '<file>'` 문 제거 | minidump를 재생하는 디버깅 흐름 | `PLAN REPLAYER DUMP`만 유지됨 |
| 워크로드 정책의 `set_session_variable` 작업 제거 | 해당 작업을 사용하는 워크로드 정책 | 대신 `cancel_query` / `move_query_to_group` 사용 |
| BE 설정 `get_stack_trace_tool` 제거 및 BE 스레드 스택 HTTP 출력 필드 변경 | BE 스레드 스택을 수집하는 스크립트 | 새 출력 필드 파싱 |
| 분리 모드에서 BE 설정 `s3_client_retry_slow_down` 제거 | 이 설정으로 S3 스로틀링 재시도를 제어하는 배포 | 별도 설정 불필요. 이제 BE는 S3 429 / 503 응답에 항상 재시도하고 Recycler는 재시도하지 않음 |
| 쿼리 프로파일에서 `HdfsIO` 타이머 및 해당 카운터 일곱 개 제거 | 프로파일을 파싱하는 자동화 | 대신 다른 IO 관련 카운터 사용 |

**기본값 및 동작 변경**

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| 최소 자동 버킷 수가 1에서 3으로 증가(FE 설정 `autobucket_min_buckets`) | `BUCKETS AUTO`로 생성한 테이블 | 새로 생성되는 파티션에만 영향. [데이터 버킷팅](../../table-design/data-partitioning/data-bucketing) 참조 |
| 세션 변수 `max_scanners_concurrency`의 기본값이 4에서 8로 변경됨 | 모든 쿼리 | 기존 동작을 유지하려면 4로 다시 설정 |
| FE 설정 `default_get_version_from_ms_timeout_second`의 기본값이 3에서 30으로 변경됨 | 분리 모드 | 별도 조치 불필요. Meta Service의 일시적인 지연으로 인한 쿼리 실패를 줄임 |
| BE 설정 `enable_cache_read_from_peer`의 기본값이 `true`에서 `false`로 변경되고 `cache_read_from_peer_expired_seconds`가 제거됨 | 컴퓨트 그룹 간 피어 캐시 읽기를 사용하는 배포 | 기존 동작을 유지하려면 `enable_cache_read_from_peer=true`를 `be.conf`에 명시적으로 설정 |
| 세션 변수 `eager_aggregation_on_join`이 제거되고 `eager_aggregation_on_broadcast_join`(기본값 `true`) 및 `eager_agg_broadcast_row_count`(기본값 250000)가 추가됨 | `eager_aggregation_on_join`을 설정하는 세션 / 스크립트 | 해당 변수에 대한 값 할당 제거 |
| `jobs()` 테이블 함수에서 스트리밍 작업 열 `Lag`의 이름이 `LagBytes`로 변경되고 단위가 초에서 바이트로 변경됨. `LastSourceEventTimestamp` 열 추가 | `jobs()` 출력을 파싱하는 스크립트, `streaming_job_per_job_lag` 메트릭 기반 모니터링 | `LagBytes` 열 및 `streaming_job_per_job_lag_bytes` 메트릭 사용. [Continuous Load](../../data-operate/import/import-way/streaming-job/continuous-load-overview) 참조 |
| Arrow Flight SQL이 `DATETIME` / `DATETIMEV2`를 **시간대가 없는** Arrow Timestamp로 반환함(`TIMESTAMPTZ`는 시간대 정보 유지) | Arrow Flight SQL로 시간 열을 읽는 클라이언트 | 시간대가 없는 값으로 해석 |
| 인수에 다른 집계 함수가 포함된 집계 함수는 이제 `aggregate function cannot contain aggregate parameters` 오류를 반환함 | `group_concat(x ORDER BY sum(k))`와 같은 기존 SQL | 먼저 집계한 다음 그 결과를 참조하도록 SQL 수정 |
| `default.replication_num` 또는 `default.replication_allocation`을 수정하면 충돌하는 기존 속성이 제거됨 | 메타데이터에 두 속성이 모두 남아 있는 이전 테이블 | 별도 조치 불필요. 이제 `SHOW CREATE TABLE`과 실제 복제본 할당이 일치함. **롤링 업그레이드 중에는** 모든 FE의 업그레이드가 끝난 후에만 이 두 속성을 변경해야 함. 그렇지 않으면 이전 FE와 새 FE가 서로 다른 복제본 설정을 적용할 수 있음 |
| Paimon의 `paimon.table-option.*` Catalog 속성이 일곱 개 키로 구성된 허용 목록으로 제한됨 | 다른 `paimon.table-option.*` 키를 사용하는 Catalog | 허용 목록에 없는 키 제거. [Paimon Catalog](../../lakehouse/catalogs/paimon-catalog) 참조 |
| 스토리지 속성에 예약 키 `doris.fs.cache.key`가 추가되고 암시적 기본값 `fs.<schema>.impl.disable.cache=true`가 더 이상 적용되지 않음 | 외부 스토리지를 사용하는 Catalog / TVF | **FE 노드보다 BE 노드를 먼저 업그레이드** |
| 분리 모드에서 `ADMIN SET FRONTEND CONFIG`가 `root` 사용자로 제한됨 | root가 아닌 계정으로 런타임에 FE 설정을 변경하는 스크립트 | root 계정을 사용하거나 `fe.conf`에 설정 |
| FE 설정 `s3_load_endpoint_white_list`, `jdbc_driver_url_white_list` 및 `force_sqlserver_jdbc_encrypt_false`를 런타임에 더 이상 수정할 수 없음 | `ADMIN SET FRONTEND CONFIG`로 이 설정들을 변경하는 스크립트 | `fe.conf`에 설정하고 FE 재시작 |
| Routine Load의 민감한 Kafka 속성과 `IV` / `CIPHER` 열(`information_schema`의 암호화 키)이 쿼리 결과에서 `******`로 마스킹됨 | 이 결과에서 자격 증명을 읽는 스크립트 | 원래 값은 구성 관리 시스템에서 읽도록 변경 |

**배포 및 설정 파일 변경**

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| JDK 17의 `JAVA_OPTS`에서 `--add-opens=java.base/java.nio=ALL-UNNAMED`를 `--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED`로 변경해야 함 | `JAVA_OPTS_FOR_JDK_17`을 `fe.conf` / `be.conf`에서 사용자 정의한 배포 | 새 릴리스 패키지에 포함된 `fe.conf` / `be.conf`에서 이 옵션을 동기화. 그렇지 않으면 Arrow Flight SQL 등 Arrow 기반 기능이 시작되거나 실행되지 않을 수 있음 |
| be-java-extensions의 `paimon-scanner` 모듈 이름이 `paimon-connector`로 변경됨 | `be/lib/java_extensions/paimon-scanner`를 참조하는 사용자 정의 배포 스크립트 | 경로를 `paimon-connector`로 변경 |
| BE의 `_stream_load_forward` 엔드포인트를 사용하려면 설정을 활성화하고 요청을 인증해야 함 | 분리 모드에서 Group Commit의 BE 전달 기능을 사용하는 배포 | `enable_group_commit_streamload_be_forward=true`를 모든 `be.conf`에 설정하고 데이터 적재 계정에 전역 `LOAD` 권한이 있는지 확인. [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) 참조 |

### 4.1.5로 업그레이드 {#upgrading-to-415}

다음은 4.1.4.1 대비 변경 사항입니다. 업그레이드 전에 V1 역색인 설정, 외부 테이블 타입 매핑 및 과거 날짜가 포함된 파일을 확인하세요.

**제거된 인터페이스 및 구문**

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| V1 역색인 생성이 금지되며 기존 V1 테이블에 역색인을 추가할 수 없음 | `CREATE TABLE`, `CREATE INDEX` 및 `ALTER TABLE ADD INDEX` | 새 테이블에는 V2 또는 V3 사용. 기존 테이블은 계속 읽을 수 있음. 새 인덱스가 필요하면 테이블을 다시 생성해야 함. `ALTER TABLE`로는 스토리지 형식을 변환할 수 없음 |
| 사용자 정의 함수가 가변 인수 `...` 시그니처를 더 이상 허용하지 않음 | Java / Python UDF, UDAF, UDTF 및 ALIAS FUNCTION | 고정된 수의 매개변수를 사용하거나 단일 `ARRAY` 매개변수로 여러 값을 받도록 변경. [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION.md) 참조 |
| `native` 파일 형식 제거 | 이 형식을 사용하는 파일 읽기 또는 내보내기 | Parquet 또는 ORC와 같은 지원 형식 사용. 업그레이드 전에 이전 Doris 버전으로 기존 파일 변환 |

**기본값 및 동작 변경**

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| Catalog의 바이너리 타입은 항상 `VARBINARY`로, 시간대 정보가 있는 타임스탬프 타입은 항상 `TIMESTAMPTZ`로 매핑됨 | Hive, Iceberg, Paimon 및 관련 JDBC 타입 매핑 | `enable.mapping.varbinary`와 `enable.mapping.timestamp_tz`는 호환성 표시자로 유지됨. `false`로 설정해도 이전 매핑을 복원할 수 없음. Master FE는 기존 Catalog의 표시자를 `true`로 저장함. 클라이언트 필드 타입, 시간대 및 명시적 형 변환 확인 |
| S3 / HDFS / LOCAL TVF가 타임스탬프의 시간대 의미를 항상 유지함 | TVF로 Parquet UTC Timestamp 또는 ORC `TIMESTAMP_INSTANT` 읽기 | `enable_mapping_timestamp_tz`는 호환성을 위해 허용되지만 `false`로 설정해도 무시됨. TVF 매개변수 `enable_mapping_varbinary`는 계속 설정할 수 있으며 기본값은 `false`임 |
| BE 설정 및 세션 변수 `enable_file_cache`의 기본값이 `false`에서 `true`로 변경됨 | 통합 모드의 원격 파일 읽기. 컴퓨트-스토리지 분리 모드의 BE에서는 이미 강제로 활성화됨 | 캐시 경로, 디스크 용량, 기존에 명시한 BE 설정 및 저장된 전역 변수 확인. [File Cache](../../compute-storage-decoupled/file-cache/file-cache.md) 참조 |
| FE의 `meta_service_rpc_rate_limit_enabled`가 기본적으로 활성화되며 새 dry-run 모드도 기본적으로 활성화됨 | 컴퓨트-스토리지 분리 모드에서 FE가 Meta Service로 보내는 RPC | 기본적으로는 속도 제한을 평가하고 기록만 함. 실제로 적용하려면 `meta_service_rpc_rate_limit_dry_run=false` 설정. 새 BE dry-run 스위치 두 개도 비활성화해야 실제 대기가 발생함. [FE 설정](../config/fe-config.md#meta_service_rpc_rate_limit_dry_run) 및 [BE 설정](../config/be-config.md#enable_ms_rpc_host_level_rate_limit_dry_run) 참조 |
| `cloud_version_syncer_interval_second`의 기본값이 `20`초에서 `60`초로, `cloud_get_version_task_batch_size`가 `2000`에서 `200`으로 변경되며 새 최대 시도 횟수는 `3`임 | 백그라운드 버전 동기화를 사용하는 컴퓨트-스토리지 분리 클러스터 | 기존 주기나 배치 크기가 필요하면 값을 명시적으로 설정. 주기 변경에는 FE 재시작이 필요함 |
| FE의 `streaming_cdc_fetch_splits_batch_size` 기본값이 `100`에서 `16`으로, BE의 `request_cdc_client_timeout_ms`가 `60000`에서 `120000`으로 변경됨 | 스트리밍 CDC 데이터 적재 | 마이그레이션 불필요. 처리량이나 타임아웃을 조정한 경우 명시적 설정 확인 |
| 기존 LDAP 인증 경로가 기본적으로 빈 비밀번호를 거부함 | LDAP의 비인증 Bind에 의존하는 로그인 | 유효한 비밀번호 사용. 호환성 스위치 `ldap_allow_empty_pass`의 기본값은 `false`이며 FE 재시작이 필요함. LDAP 인증 플러그인은 항상 빈 비밀번호를 거부함. [LDAP](../auth/authentication/ldap.md#empty-password-login) 참조 |
| 커밋된 Iceberg 스냅샷의 데이터 파일이나 삭제 파일이 누락되면 항상 오류가 발생함 | `ignore_not_found_file_in_external_table=true`를 사용하는 Iceberg 쿼리 | 누락된 파일을 복원하거나 유효한 스냅샷 사용. 이 스위치로는 커밋된 Iceberg 파일을 더 이상 건너뛸 수 없음 |
| 유효하지 않은 Iceberg `schema.name-mapping.default` 값에 대해 관대한 읽기를 허용하는 대신 오류가 발생함 | 유효하지 않은 이름 매핑 속성이 있는 테이블 | 쓰기 도구를 통해 속성을 수정하거나 제거한 다음 Doris 메타데이터 새로 고침. [Iceberg Catalog](../../lakehouse/catalogs/iceberg-catalog.mdx) 참조 |
| 딕셔너리, 워밍업, 제약 조건 및 기타 명령에 권한 검사가 추가되며 열 수준 GRANT / REVOKE가 실행자 자신의 권한을 확인함 | 관련 운영 계정 및 자동화 스크립트 | 대상 객체 및 관련 객체에 필요한 권한 부여. 해당 명령 문서 참조 |
| root가 새로 생성한 AI 리소스는 root만 변경하거나 삭제할 수 있음 | 4.1.5부터 root 표시자를 사용하여 생성한 AI 리소스 | 해당 작업에 root 사용. 업그레이드 전에 생성되어 표시자가 없는 리소스에는 영향 없음. [AI 리소스](../../sql-manual/sql-functions/ai-functions/overview.md) 참조 |

**배포 및 설정 파일 변경**

| 변경 사항 | 영향 범위 | 조치 방법 |
| --- | --- | --- |
| FE의 실제 적용 설정이 `inverted_index_storage_format=V1`이면 시작할 수 없음 | `fe.conf` 또는 `fe_custom.conf`에 V1을 설정한 클러스터 | **업그레이드 전에** `V2` 또는 `V3`로 변경하고 `fe_custom.conf`가 `fe.conf`를 덮어쓰는지 확인 |
| Parquet 내보내기의 `enable_int96_timestamps` 기본값이 `false`로 변경되어 논리 타입이 지정된 INT64 타임스탬프를 사용함 | 기존 INT96 형식에 의존하는 Outfile / Export 소비 시스템 | 논리 INT64 타임스탬프 지원 여부 확인. 기존 형식이 필요하면 `enable_int96_timestamps=true`를 명시적으로 설정. `true`와 `false`만 허용됨 |
| 기존 Doris DATE 인코딩을 사용하는 파일에서 연도가 영인 날짜에 오프셋이 발생할 수 있음 | Doris가 내보낸 ORC / Parquet 파일 중 `0000-01-01`부터 `0000-02-28`까지의 날짜가 포함된 파일 | 파일 생성 출처를 확인하고 아래 설명에 따라 마이그레이션. 읽기 프로그램만 업그레이드해서는 원래 날짜를 복원할 수 없음 |
| 번들 Thrift가 0.16.0에서 0.24.0으로, Iceberg SDK가 1.10.1에서 1.11.0으로 업그레이드됨 | Doris를 빌드하거나 서드파티 종속성 아티팩트를 재사용하는 배포 | 이 릴리스의 소스로 종속성 준비. 이전 Thrift 생성기를 재사용하거나 JAR 버전을 혼용하지 않도록 주의 |

#### 명령 권한 검사 {#command-privilege-checks}

4.1.5 버전에서는 다음 경로에 권한 검사가 추가됩니다. 운영 스크립트와 권한을 위임받은 계정에 대해 대상 객체뿐 아니라 연쇄 작업으로 수정되는 모든 객체의 권한도 확인하세요.

| 작업 | 필요한 권한 |
| --- | --- |
| `ADD CONSTRAINT` / `DROP CONSTRAINT` | 대상 테이블에 대한 `ALTER` 권한. 외래 키를 추가하려면 참조 대상 테이블에 대한 `ALTER` 권한도 필요함. 기본 키를 삭제하면서 외래 키까지 연쇄적으로 삭제하려면 연쇄 작업으로 수정되는 모든 테이블에 대한 `ALTER` 권한도 필요함 |
| `CREATE DICTIONARY` / `DROP DICTIONARY` | 생성하려면 딕셔너리에 대한 `CREATE` 및 원본 테이블에 대한 `SELECT` 권한이 필요함. 삭제하려면 딕셔너리에 대한 `DROP` 권한이 필요함 |
| `WARM UP COMPUTE GROUP` | 대상 그룹과 지정된 모든 소스 그룹에 대한 `USAGE` 권한 및 명시한 테이블에 대한 `SELECT` 권한. `ON TABLES` 규칙에는 전역 `ADMIN` 권한도 필요함 |
| 워밍업 취소, Catalog 휴지통 정리, stage 삭제 및 TDE 루트 키 관리 | 전역 `ADMIN` 권한 |
| 관리자 권한이 필요한 `/rest/v1` 엔드포인트 | Basic 및 Cookie 인증 모두 전역 `ADMIN` 또는 `NODE` 권한이 필요함. `/login`에 성공하면 사용자가 인증되지만 관리자용 엔드포인트에 대한 접근 권한이 부여되지는 않음 |

메타데이터 쿼리의 오류 허용 범위도 넓어집니다. `information_schema.view_dependency`는 정의를 파싱할 수 없거나 유효하지 않은 객체를 참조하는 뷰를 건너뛰며, 이로 인해 전체 쿼리가 실패하지 않습니다. 결과에서 뷰가 누락되었다면 해당 뷰의 정의와 FE 경고 로그를 확인하세요. 행이 없다고 해서 해당 뷰에 종속성이 없다는 뜻은 아닙니다.

#### 연도가 영인 DATE 파일 마이그레이션 {#year-zero-date-file-migration}

4.1.5 버전에서는 Arrow, Parquet 및 ORC V2에서 DATE 값을 역산 그레고리력 기준의 epoch 일수로 변환하는 방식을 수정합니다. 기존 Doris 인코딩은 `0000-01-01`부터 `0000-02-28`까지의 날짜에 대해 예상보다 하루 큰 epoch 일수를 기록했습니다. `0000-03-01` 이후 날짜에는 영향이 없으며, `0000-02-29`는 계속해서 Doris DATE의 지원 범위에 포함되지 않습니다.

기존 값과 유효한 새 인코딩을 자동으로 구분할 수는 없습니다. 파일을 생성한 쓰기 도구를 기준으로 확인하세요. **모든 DATE 필드**가 기존 Doris 인코딩을 사용하는 것으로 확인된 파일에는 이 릴리스의 소스에 포함된 [오프라인 마이그레이션 도구](https://github.com/apache/doris/tree/4.1.5-release/tools/legacy_date_migration)를 사용하세요.

```bash
python tools/legacy_date_migration/migrate_legacy_dates.py \
  --input legacy.parquet --output migrated.parquet --format parquet \
  --confirm-legacy-doris-date-encoding
```

ORC 파일은 `--format`을 `orc`로 변경하세요. 이 도구에는 Python 3.8+와 선택한 형식을 지원하는 PyArrow가 필요합니다. 새 파일을 생성하며 원본을 덮어쓰지 않습니다. 다른 쓰기 도구로 생성한 파일, 생성 출처가 혼합된 파일 또는 이미 마이그레이션한 파일에는 실행하지 마세요. 마이그레이션 후에는 `enable_file_scanner_v2=true`를 사용하고, 소비 시스템을 전환하기 전에 신뢰할 수 있는 원본과 비교하여 경계 날짜, 행 수 및 NULL 값을 검증하세요. Iceberg와 같은 테이블 형식에서는 데이터 파일을 직접 교체하지 마세요. 파티션, 통계 및 스냅샷 메타데이터가 일관되게 다시 계산되도록 해당 테이블 형식의 쓰기 도구로 테이블을 다시 생성하거나 지원되는 트랜잭션 방식으로 다시 쓰기를 수행하세요.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Upgrade failure / Exception handling -->

### 질문: 업그레이드 후 BE / FE 노드의 `Alive`가 `false`로 표시되고 `Version`도 여전히 이전 버전입니다. 어떻게 해야 하나요? {#q-after-the-upgrade-a-be--fe-node-shows-alive-as-false-and-version-is-still-the-old-version-what-should-i-do}

프로세스가 시작되지 않았거나 새 버전의 시작에 실패한 것입니다. `be.log` / `fe.log` 오류 로그를 확인하고 `/bin` 및 `/lib`가 올바르게 교체되었는지 확인하세요.

### 질문: 업그레이드 후 메타데이터 비호환 오류로 FE가 시작되지 않습니다. 어떻게 해야 하나요? {#q-after-the-upgrade-the-fe-fails-to-start-with-a-metadata-incompatibility-error-what-should-i-do}

너무 많은 버전을 건너뛰어 업그레이드했거나 메타데이터 호환성 테스트를 실행하지 않은 것입니다. 이전 버전으로 롤백하고 이 문서의 "메타데이터 호환성 테스트" 절차에 따라 테스트를 실행한 다음, 필요하면 단계적으로 업그레이드하세요.

### 질문: 업그레이드 후 `custom_lib/`의 jar 파일이 사라졌습니다. 무슨 일이 발생한 건가요? {#q-after-the-upgrade-jar-files-in-custom_lib-are-missing-what-happened}

`custom_lib/`를 실수로 덮어쓴 것입니다. `/bin` 및 `/lib`만 교체해야 하며, `custom_lib/`는 교체하면 안 됩니다.

### 질문: 업그레이드 중 Stream Load 작업이 실패합니다. 왜 그런가요? {#q-stream-load-tasks-fail-during-the-upgrade-why}

노드 재시작으로 클라이언트 연결이 끊어집니다. 클라이언트 측에 재시도 로직을 추가하세요. Routine Load 및 Flink/Spark Doris Connectors에는 재시도 기능이 내장되어 있습니다.

### 질문: 업그레이드 후 복제본 수가 비정상적이거나 복제본 마이그레이션이 자주 발생합니다. 무엇이 문제인가요? {#q-after-the-upgrade-the-replica-count-is-abnormal-or-replica-migration-happens-frequently-what-is-wrong}

`disable_balance` / `disable_tablet_scheduler`를 통한 비활성화가 누락되었거나, 업그레이드 후 복제본 복구 및 밸런싱을 다시 활성화하지 않은 것입니다. 이 설정의 활성화/비활성화 절차를 확인하세요. 업그레이드 전에 복제본 복구 및 밸런싱을 비활성화하고 업그레이드 후 다시 활성화해야 합니다.

### 질문: 마이너 버전을 건너뛰는 업그레이드가 실패했습니다. 왜 그런가요? {#q-a-cross-minor-version-upgrade-failed-why}

버전을 순서대로 업그레이드하지 않았기 때문입니다. 롤백한 다음 `3.0 to 3.1 to 3.2 to 3.3`과 같은 단계별 경로를 따르세요.

### 질문: 단일 FE 클러스터 업그레이드가 실패하고 메타데이터가 손실되었습니다. 어떻게 해야 하나요? {#q-a-single-fe-cluster-upgrade-failed-and-metadata-was-lost-what-should-i-do}

메타데이터 호환성 테스트를 실행하지 않은 것입니다. 업그레이드 전에 3-FE 고가용성 구성으로 확장하거나 개발용 머신 또는 BE 노드에서 메타데이터 호환성 테스트를 실행하세요.
