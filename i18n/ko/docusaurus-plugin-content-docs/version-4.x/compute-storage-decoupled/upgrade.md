---
{
    "title": "컴퓨팅-스토리지 분리형 클러스터 업그레이드 가이드(롤링 업그레이드)",
    "sidebar_label": "롤링 업그레이드 가이드",
    "language": "ko",
    "description": "Doris 컴퓨팅-스토리지 분리형 클러스터의 롤링 업그레이드 방법을 설명합니다. MetaService, Recycler, BE, FE의 업그레이드 순서와 단계를 다룹니다.",
    "keywords": ["Doris 업그레이드", "컴퓨팅-스토리지 분리형 업그레이드", "롤링 업그레이드", "MetaService 업그레이드", "BE 업그레이드", "FE 업그레이드"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster upgrade / Version migration -->

Doris 컴퓨팅-스토리지 분리형 클러스터는 **롤링 업그레이드**를 지원하므로, 전체 서비스를 중단하지 않고 업그레이드하면서 업스트림 애플리케이션에 미치는 영향을 최소화할 수 있습니다. 이 문서에서는 업그레이드 전 점검, 구성 요소별 업그레이드 단계, 자주 묻는 질문을 포함하여 컴퓨팅-스토리지 분리형 모드의 전체 업그레이드 절차를 설명합니다.

컴퓨팅-스토리지 통합형 클러스터를 업그레이드하려면 [클러스터 업그레이드](../admin-manual/cluster-management/upgrade)를 참조하세요.

## 버전 번호 체계 {#version-numbering}

<!-- Knowledge type: Configuration parameters -->

Doris는 세 부분으로 구성된 버전 번호(예: `3.0.3`)를 사용합니다. 다음 SQL을 실행하여 현재 버전을 확인하세요.

```sql
MySQL [(none)]> select @@version_comment;
+----------------------------------------------------------+
| @@version_comment                                        |
+----------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode)  |
+----------------------------------------------------------+
```

버전 번호의 각 필드는 다음과 같습니다.

| 위치 | 의미 | 예시 |
|------|------|------|
| 첫 번째 | 메이저 버전 | `3` |
| 두 번째 | 마이너 버전 | `0` |
| 세 번째 | 패치 버전 | `3` |
| 네 번째(선택 사항) | 패치 버전의 심각한 결함을 수정하는 긴급 버그 수정 릴리스 | `2.0.2.1` |

버전 문자열의 `Cloud Mode` 접미사는 클러스터가 컴퓨팅-스토리지 분리형 모드로 실행 중임을 나타냅니다. 컴퓨팅-스토리지 통합형 모드로 실행 중인 클러스터에는 이 접미사가 없습니다.

**모드 전환 제한:** 컴퓨팅-스토리지 분리형 모드와 컴퓨팅-스토리지 통합형 모드 간 전환은 **지원되지 않습니다**.

**다운그레이드 제한:** 낮은 버전에서 높은 버전으로 업그레이드할 수 있으며, 패치 버전 간 다운그레이드도 지원됩니다. **마이너 버전 및 메이저 버전 간 다운그레이드는 지원되지 않습니다.**

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Environment validation -->

업그레이드하기 전에 다음 조건이 모두 충족되는지 확인하세요.

1. **배포 모드 확인:** 클러스터가 컴퓨팅-스토리지 분리형 모드로 실행 중인지 확인하세요(버전 문자열에 `Cloud Mode` 접미사가 포함되어 있어야 합니다).
2. **데이터 적재 재시도 설정:** 업그레이드 중 노드 재시작으로 인해 작업이 실패하지 않도록 데이터 적재 작업에 재시도 메커니즘이 설정되어 있는지 확인하세요.
3. **구성 요소 상태 확인:** MetaService, Recycler, FE, BE가 모두 정상적으로 실행 중이며 오류 로그가 없는지 확인하세요.
4. **FE 메타데이터 백업:** Master FE의 메타데이터 디렉터리를 백업하세요(기본값: FE 디렉터리 아래의 `doris-meta` 디렉터리). 해당 디렉터리가 비어 있으면 `meta_dir` 설정 항목을 `conf/fe.conf`에서 확인하여 실제 경로를 찾으세요.
5. **설치 패키지 다운로드:** [Doris 공식 웹사이트](https://doris.apache.org/download)에서 대상 버전의 설치 패키지를 다운로드하고 SHA-512 체크섬을 검증하여 패키지 무결성을 확인하세요.

## 업그레이드 절차 개요 {#upgrade-process-overview}

<!-- Knowledge type: Operational steps -->

각 구성 요소를 다음 순서로 업그레이드하세요.

1. MetaService 업그레이드
2. Recycler 업그레이드(별도로 배포된 경우에만)
3. BE 업그레이드
4. FE 업그레이드
    1. 먼저 Observer FE 노드 업그레이드
    2. 다음으로 나머지 non-Master FE 노드 업그레이드
    3. 마지막으로 Master FE 노드 업그레이드

## 업그레이드 단계 {#upgrade-steps}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster upgrade / Version migration -->

### 1단계: MetaService 업그레이드 {#step-1-upgrade-metaservice}

각 MetaService 인스턴스에서 다음 작업을 수행하세요. 이 단계에서 사용하는 환경 변수는 다음과 같습니다.

| 변수 | 의미 |
|------|------|
| `${MS_HOME}` | MetaService의 작업 디렉터리 |
| `${MS_PACKAGE_DIR}` | 새 MetaService 설치 패키지가 있는 디렉터리 |

**1. 현재 MetaService 중지**

```shell
cd ${MS_HOME}
sh bin/stop.sh
```

**2. 기존 바이너리 백업**

```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 새 설치 패키지 배포**

```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

**4. 새 MetaService 시작**

```shell
sh ${MS_HOME}/bin/start.sh --daemon
```

**5. 업그레이드 확인**

MetaService 프로세스가 정상적으로 실행 중이며 `${MS_HOME}/log/doris_cloud.out`에 새 버전 번호가 표시되는지 확인하세요.

---

### 2단계: Recycler 업그레이드(해당하는 경우) {#step-2-upgrade-recycler-if-applicable}

:::caution
Recycler 구성 요소가 별도로 배포되어 있지 않으면 이 단계를 건너뛰세요.
:::

각 Recycler 인스턴스에서 다음 작업을 수행하세요. MetaService와 Recycler는 동일한 설치 패키지를 사용합니다. 이 단계에서 사용하는 환경 변수는 다음과 같습니다.

| 변수 | 의미 |
|------|------|
| `${RECYCLER_HOME}` | Recycler의 작업 디렉터리 |
| `${MS_PACKAGE_DIR}` | 새 설치 패키지가 있는 디렉터리(MetaService와 공유) |

**1. 현재 Recycler 중지**

```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```

**2. 기존 바이너리 백업**

```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 새 설치 패키지 배포**

```shell
cp ${MS_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

**4. 새 Recycler 시작**

```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```

**5. 업그레이드 확인**

Recycler 프로세스가 정상적으로 실행 중이며 `${RECYCLER_HOME}/log/doris_cloud.out`에 새 버전 번호가 표시되는지 확인하세요.

---

### 3단계: BE 업그레이드 {#step-3-upgrade-be}

:::tip
BE를 업그레이드하기 전에 모든 MetaService 및 Recycler(해당하는 경우) 인스턴스의 업그레이드가 완료되었는지 확인하세요.
:::

각 BE 인스턴스에서 다음 작업을 수행하세요. 이 단계에서 사용하는 환경 변수는 다음과 같습니다.

| 변수 | 의미 |
|------|------|
| `${BE_HOME}` | BE의 작업 디렉터리 |
| `${BE_PACKAGE_DIR}` | 새 BE 설치 패키지가 있는 디렉터리 |

**1. 현재 BE 중지**

```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

**2. 기존 바이너리 백업**

```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 새 설치 패키지 배포**

```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

**4. 새 BE 시작**

```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

**5. 업그레이드 확인**

다음 SQL을 실행하여 BE 버전과 상태를 확인하세요.

```sql
show backends;
```

---

### 4단계: FE 업그레이드 {#step-4-upgrade-fe}

:::tip
FE를 업그레이드하기 전에 모든 BE 인스턴스의 업그레이드가 완료되었는지 확인하세요.
:::

FE 노드는 **Observer -> non-Master -> Master** 순서로 한 번에 하나씩 업그레이드해야 합니다.

각 FE 인스턴스에서 다음 작업을 수행하세요. 이 단계에서 사용하는 환경 변수는 다음과 같습니다.

| 변수 | 의미 |
|------|------|
| `${FE_HOME}` | FE의 작업 디렉터리 |
| `${FE_PACKAGE_DIR}` | 새 FE 설치 패키지가 있는 디렉터리 |

**1. 현재 FE 중지**

```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

**2. 기존 바이너리 백업**

```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 새 설치 패키지 배포**

```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

**4. 새 FE 시작**

```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

**5. 업그레이드 확인**

다음 SQL을 실행하여 FE 버전과 상태를 확인하세요.

```sql
show frontends;
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Troubleshooting -->

**Q1: 컴퓨팅-스토리지 통합형 클러스터를 업그레이드할 때는 업그레이드 전에 복제본 리밸런싱을 비활성화해야 합니다. 컴퓨팅-스토리지 분리형 모드에서도 이 작업이 필요한가요?**

아니요. 컴퓨팅-스토리지 분리형 모드에서는 Doris가 HDFS 또는 오브젝트 스토리지(S3)에 데이터를 저장하므로 복제본 리밸런싱이 필요하지 않습니다. 이 작업은 수행하지 않아도 됩니다.

**Q2: MetaService가 전용 메타데이터 서비스를 제공하는데도 FE 메타데이터를 백업해야 하는 이유는 무엇인가요?**

현재 메타데이터는 MetaService와 FE가 서로 다른 부분을 담당하며 공동으로 관리합니다. 안전한 업그레이드를 위해 업그레이드 전에 FE 메타데이터 디렉터리를 백업하세요.
