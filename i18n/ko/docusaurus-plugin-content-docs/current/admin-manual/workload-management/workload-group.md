---
{
    "title": "Workload Group: Doris 프로세스 내부 리소스 격리 가이드",
    "sidebar_label": "Workload Group",
    "language": "ko",
    "description": "Workload Group을 사용해 Doris BE 프로세스 내부의 CPU, 메모리, IO 리소스를 세밀하게 격리하여 부하가 높은 쿼리가 온라인 서비스에 영향을 미치지 않도록 하는 방법을 알아봅니다.",
    "keywords": ["Workload Group", "리소스 격리", "CPU 제한", "메모리 제한", "IO 제한", "CGroup", "쿼리 대기열 처리", "워크로드 관리", "Workload Group 구성", "Doris 리소스 관리"]
}
---

<!-- Knowledge type: Architecture decision -->

Workload Group은 Doris 프로세스 내부의 논리적 리소스 격리 메커니즘입니다. BE 프로세스 내부의 CPU, 메모리, IO 리소스를 세밀하게 분할하여 서로 다른 업무 워크로드가 서로 간섭하지 않도록 합니다.

![workload_group](/images/workload_group_arch.png)

현재 다음 세 가지 유형의 리소스 격리를 지원합니다.

- **CPU 리소스**: CPU 소프트 제한(최소 보장량)과 CPU 하드 제한(최대 상한)을 지원합니다.
- **메모리 리소스**: 메모리 소프트 제한과 메모리 하드 제한을 지원합니다.
- **IO 리소스**: 로컬 파일과 원격 파일을 읽을 때 발생하는 IO 대역폭 제한을 지원합니다.

:::tip 프로세스 내부 격리와 프로세스 간 격리

Workload Group은 프로세스 내부 리소스 격리를 제공하며, 이는 Resource Group 및 Compute Group과 같은 프로세스 간 격리 방식과 근본적으로 다릅니다.

1. **프로세스 내부 격리**에는 격리할 수 없는 공유 컴포넌트(공유 캐시, RPC 스레드 풀 등)가 있습니다. 부하가 높은 작업이 부하가 낮은 작업의 지연 시간에 여전히 영향을 미칠 수 있지만, 아무런 제어가 없을 때보다는 그 영향이 크게 줄어듭니다.
2. **선택 기준**: 어느 정도의 지연 시간을 허용할 수 있고 비용 절감이 중요하다면 Workload Group을 선택합니다. 완전한 격리가 필요하고 더 높은 비용을 감수할 수 있다면 Resource Group 또는 Compute Group을 선택합니다. 이 경우 우선순위가 높은 워크로드에 전용 BE 노드를 할당합니다.

:::

## 버전별 참고 사항 {#version-notes}

<!-- Knowledge type: Configuration parameters -->

| 버전 | 설명 |
|---------|-------------|
| Doris 2.0 | Workload Group 기능이 도입되었으며, CGroup에 의존하지 않습니다. |
| Doris 2.1 | Workload Group에 CGroup이 필요하며, 시스템이 삭제할 수 없는 `normal` 그룹을 자동으로 생성합니다. |
| Doris 4.0 | CPU 소프트 제한/하드 제한 개념이 `min_cpu_percent` / `max_cpu_percent`로 통합되고, 메모리 소프트 제한/하드 제한 개념이 `min_memory_percent` / `max_memory_percent`로 통합됩니다. |

**업그레이드 참고 사항**:

- **1.2 → 2.0**: 전체 클러스터 업그레이드를 완료한 후에 Workload Group 기능을 활성화하는 것이 좋습니다. 일부 follower FE 노드만 업그레이드하면 아직 업그레이드하지 않은 노드에 메타데이터가 없어 쿼리가 실패할 수 있습니다.
- **2.0 → 2.1**: 먼저 CGroup 환경을 구성한 다음 버전 2.1로 업그레이드합니다.

## 주요 속성 {#core-properties}

<!-- Knowledge type: Configuration parameters -->

### CPU 리소스 매개변수 {#cpu-resource-parameters}

| 매개변수 | 값 범위 | 설명 |
|-----------|-------------|-------------|
| `MIN_CPU_PERCENT` | [0%, 100%] | 이 Workload Group에 예약된 최소 CPU 대역폭입니다. CPU 경합이 발생하면 다른 그룹이 이 대역폭을 선점할 수 없습니다. 리소스에 여유가 있으면 이 값을 초과하여 사용할 수 있습니다. |
| `MAX_CPU_PERCENT` | [0%, 100%] | 이 Workload Group의 CPU 대역폭 상한입니다. 현재 CPU 사용률과 관계없이 이 그룹의 CPU 사용량은 이 값을 초과하지 않습니다. |

제약 조건: 모든 Workload Group의 `MIN_CPU_PERCENT` 합계는 100%를 초과할 수 없으며, `MIN_CPU_PERCENT`는 `MAX_CPU_PERCENT`보다 클 수 없습니다.

**시나리오 예시**: 한 회사의 영업 부서(CPU 집약적, 높은 우선순위)와 마케팅 부서(CPU 집약적, 낮은 우선순위)가 동일한 Doris 인스턴스를 공유한다고 가정합니다. 영업 부서의 Workload Group에 40%의 `min_cpu_percent`를 할당하고 마케팅 부서의 Workload Group에 30%의 `max_cpu_percent`를 설정하면, 영업 업무에 안정적인 CPU 리소스를 보장할 수 있습니다.

### 메모리 리소스 매개변수 {#memory-resource-parameters}

| 매개변수 | 값 범위 | 설명 |
|-----------|-------------|-------------|
| `MIN_MEMORY_PERCENT` | [0%, 100%] | 이 Workload Group에 예약된 최소 메모리양입니다. 메모리가 부족하면 시스템은 이 값에 따라 메모리를 할당합니다. 필요한 경우 일부 쿼리를 종료하여 메모리를 확보함으로써 다른 그룹에서도 충분한 메모리를 사용할 수 있도록 합니다. |
| `MAX_MEMORY_PERCENT` | [0%, 100%] | 이 Workload Group의 메모리 상한입니다. 쿼리의 메모리 사용량이 이 값을 초과하면 디스크 spill이 실행되거나 쿼리가 종료됩니다. |

제약 조건: 모든 Workload Group의 `MIN_MEMORY_PERCENT` 합계는 100%를 초과할 수 없으며, `MIN_MEMORY_PERCENT`는 `MAX_MEMORY_PERCENT`보다 클 수 없습니다.

### 기타 속성 {#other-properties}

| 속성 이름 | 데이터 타입 | 기본값 | 값 범위 | 설명 |
|---------------|-----------|---------------|-------------|-------------|
| `max_concurrency` | Integer | 2147483647 | [0, 2147483647] | 최대 쿼리 동시 실행 수이며, 기본적으로 제한이 없습니다. 실행 중인 쿼리 수가 상한에 도달하면 새 쿼리는 대기열 처리 로직으로 진입합니다. |
| `max_queue_size` | Integer | 0 | [0, 2147483647] | 쿼리 대기열의 길이입니다. 기본값은 0으로, 대기열을 사용하지 않습니다. 대기열이 가득 차면 새 쿼리는 즉시 실패합니다. |
| `queue_timeout` | Integer | 0 | [0, 2147483647] | 쿼리가 대기열에서 기다릴 수 있는 최대 시간(밀리초)입니다. 기본값은 0으로, 대기열에서 기다리지 않으며 쿼리가 대기열에 진입하는 즉시 실패를 반환합니다. |
| `scan_thread_num` | Integer | -1 | [1, 2147483647] | 현재 Workload Group이 스캔에 사용하는 스레드 수입니다. -1로 설정하면 BE 구성의 `doris_scanner_thread_pool_thread_num` 값을 사용합니다. |
| `max_remote_scan_thread_num` | Integer | -1 | [1, 2147483647] | 외부 데이터 소스를 읽는 스캔 스레드 풀의 최대 스레드 수입니다. -1로 설정하면 BE가 자체적으로 결정합니다(일반적으로 코어 수와 관련됨). |
| `min_remote_scan_thread_num` | Integer | -1 | [1, 2147483647] | 외부 데이터 소스를 읽는 스캔 스레드 풀의 최소 스레드 수입니다. -1로 설정하면 BE가 자체적으로 결정합니다(일반적으로 코어 수와 관련됨). |
| `read_bytes_per_second` | Integer | -1 | [1, 9223372036854775807] | Doris 내부 테이블을 읽을 때의 최대 IO 처리량(바이트/초)입니다. 기본값은 -1로, 제한이 없습니다. 이 값은 디스크가 아닌 폴더에 적용되며, spill 파일 디렉터리에도 이 제약이 적용됩니다. |
| `remote_read_bytes_per_second` | Integer | -1 | [1, 9223372036854775807] | Doris 외부 테이블을 읽을 때의 최대 IO 처리량(바이트/초)입니다. 기본값은 -1로, 제한이 없습니다. |

## Workload Group 구성 {#configure-workload-group}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

### 1단계: CGroup 환경 구성 {#step-1-configure-the-cgroup-environment}

Workload Group의 CPU 관리는 CGroup 컴포넌트에 의존합니다. 메모리와 IO 리소스만 관리한다면 이 단계를 건너뛸 수 있습니다.

**1. CGroup 버전 확인**

```shell
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```

출력에서 `cgroup`은 CGroup V1이 설치되어 있음을 나타내고, `cgroup2`는 CGroup V2가 설치되어 있음을 나타냅니다.

**2. 현재 적용 중인 버전 확인**

```shell
# If this path exists, the currently effective version is CGroup V1
/sys/fs/cgroup/cpu/

# If this path exists, the currently effective version is CGroup V2
/sys/fs/cgroup/cgroup.controllers
```

**3. CGroup 경로 아래에 doris 디렉터리 생성**

```shell
# CGroup V1: create under the cpu directory
mkdir /sys/fs/cgroup/cpu/doris

# CGroup V2: create under the cgroup directory
mkdir /sys/fs/cgroup/doris
```

**4. BE 프로세스에 읽기/쓰기/실행 권한 부여**

```shell
# CGroup V1
chmod 770 /sys/fs/cgroup/cpu/doris
chown -R doris:doris /sys/fs/cgroup/cpu/doris

# CGroup V2
chmod 770 /sys/fs/cgroup/doris
chown -R doris:doris /sys/fs/cgroup/doris
```

**5. CGroup V2의 추가 작업(V1은 건너뛰기)**

CGroup 디렉터리 사이에서 프로세스를 이동할 수 있도록 루트 디렉터리의 `cgroup.procs` 파일 권한을 수정합니다.

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```

doris 디렉터리에서 cpu 컨트롤러가 활성화되어 있는지 확인합니다. `doris/cgroup.controllers`에 `cpu`가 없다면 다음 명령을 실행하여 활성화합니다.

```shell
# After successful execution, a cpu.max file appears under the doris directory, and the output of cgroup.controllers includes cpu
# If it fails, the parent directory has not enabled the cpu controller either; enable it for the parent directory first
echo +cpu > ../cgroup.subtree_control
```

**6. BE 구성을 수정하여 CGroup 경로 지정**

```shell
# CGroup V1
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

# CGroup V2
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```

**7. BE 다시 시작**

다시 시작한 후 `add thread xxx to group` 메시지가 `be.INFO` 로그에 나타나면 구성이 성공한 것입니다.

:::tip CGroup 사용 시 참고 사항

1. 머신마다 BE 인스턴스를 하나만 배포하는 것이 좋습니다. 현재 Workload Group 기능은 단일 머신에 여러 BE를 배포하는 구성을 지원하지 않습니다.
2. 머신을 재부팅하면 CGroup 경로 아래의 구성이 초기화됩니다. 구성을 유지하려면 systemd를 사용하여 생성 및 권한 부여 작업을 시스템 서비스로 설정하고, 재부팅할 때마다 자동으로 실행되도록 합니다.
3. 컨테이너 내부에서 CGroup을 사용할 때는 컨테이너에 호스트를 조작할 수 있는 권한이 있어야 합니다.

:::

#### 컨테이너에서 Workload Group 사용 {#using-workload-group-in-containers}

<!-- Knowledge type: Operational steps -->

Workload Group의 CPU 관리는 CGroup을 기반으로 구현됩니다. 컨테이너에서 사용할 때는 Doris 프로세스가 호스트의 CGroup 파일을 읽고 쓸 수 있도록 컨테이너를 특권 모드로 시작합니다.

컨테이너 내부의 CPU 리소스는 컨테이너에 할당된 리소스를 기준으로 추가 분할됩니다. 예를 들어 호스트에 64코어가 있고 컨테이너에 8코어가 할당되어 있으며 Workload Group의 CPU 하드 제한이 50%로 설정되어 있다면, 실제로 사용할 수 있는 코어 수는 4개(8코어 × 50%)입니다.

Workload Group의 메모리 관리와 IO 관리는 Doris 내부에서 구현되며 외부 컴포넌트에 의존하지 않습니다. 컨테이너에서 사용하든 물리 머신에서 사용하든 차이가 없습니다. Kubernetes에서 Doris를 사용하려면 하위 계층의 권한 세부 사항을 추상화하는 Doris Operator로 배포하는 것이 좋습니다.

### 2단계: Workload Group 생성 {#step-2-create-a-workload-group}

<!-- Knowledge type: Operational steps -->

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS g1
PROPERTIES (
    "min_cpu_percent" = "10%"
);
```

이 예제는 최소 CPU 리소스 비율을 10%로 설정합니다. 버전 2.1부터 시스템은 삭제할 수 없는 `normal` 그룹을 자동으로 생성합니다.

:::caution 클라우드 모드에서는 Compute Group을 명시해야 함
이 문서의 모든 CREATE / ALTER / DROP WORKLOAD GROUP 예제는 `FOR <compute_group>` 절을 생략하며, **비클라우드(스토리지와 컴퓨팅이 결합된) 모드**에서만 그대로 사용할 수 있습니다. 이 모드에서는 기본 리소스 그룹에 적용됩니다.

**클라우드(스토리지와 컴퓨팅이 분리된) 모드에서는 `FOR <compute_group>` 절을 반드시 명시해야 합니다**. 그렇지 않으면 다음 오류와 함께 구문이 실패합니다. `Must specify compute group via 'FOR <compute_group>' in cloud mode.` 자세한 내용은 [Workload Group을 Compute Group에 바인딩](./workload-group-bind-compute-group)을 참조하세요.
:::

전체 구문은 [CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP)을 참조하세요.

### 3단계: 사용자에게 권한 부여 및 Workload Group 바인딩 {#step-3-grant-permissions-to-a-user-and-bind-the-workload-group}

<!-- Knowledge type: Operational steps -->

**사용자 권한 확인**

`information_schema.workload_groups` 시스템 테이블을 쿼리하면 현재 사용자가 사용할 수 있는 Workload Group을 확인할 수 있습니다.

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```

**권한 부여**

사용자에게 대상 Workload Group이 표시되지 않으면 관리자 계정으로 GRANT 문을 실행합니다.

```sql
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
```

그 밖의 권한 부여 작업은 [GRANT-TO](../../sql-manual/sql-statements/account-management/GRANT-TO)를 참조하세요.

**바인딩 방법**

두 가지 바인딩 방법을 지원합니다. 세션 변수가 사용자 속성보다 우선합니다.

| 바인딩 방법 | 명령 | 설명 |
|----------------|---------|-------------|
| 사용자 속성(영구) | `SET PROPERTY 'default_workload_group' = 'g1';` | 사용자가 사용할 기본 Workload Group이며, 비워 둘 수 없습니다. |
| 세션 변수(임시) | `SET workload_group = 'g1';` | 현재 세션에서만 적용되며, 기본값은 비어 있습니다. |

## Workload Group 관리 {#manage-workload-group}

<!-- Knowledge type: Operational steps -->

### Workload Group 조회 {#view-workload-group}

**방법 1: SHOW 문**

```sql
SHOW WORKLOAD GROUPS;
```

참고: [SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)

**방법 2: 시스템 테이블 쿼리**

```sql
SELECT name, min_cpu_percent FROM information_schema.workload_groups WHERE name = 'g1';
+------+-----------------+
| name | min_cpu_percent |
+------+-----------------+
| g1   | 10%             |
+------+-----------------+
```

### Workload Group 수정 {#modify-workload-group}

```sql
ALTER WORKLOAD GROUP g1 PROPERTIES('min_cpu_percent' = '20%');

SELECT min_cpu_percent FROM information_schema.workload_groups WHERE name = 'g1';
+-----------------+
| min_cpu_percent |
+-----------------+
| 20%             |
+-----------------+
```

참고: [ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)

### Workload Group 삭제 {#drop-workload-group}

```sql
DROP WORKLOAD GROUP g1;
```

참고: [DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)

## 효과 검증 {#effect-verification}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

다음 테스트는 모두 ClickBench 데이터셋을 사용하여 1 FE + 1 BE(96코어, 메모리 375 GB) 환경에서 수행했습니다.

### 메모리 하드 제한 효과 검증 {#verify-the-memory-hard-limit-effect}

Adhoc 쿼리는 입력과 메모리 사용량을 예측하기 어려워 일부 쿼리만으로도 메모리가 가득 찰 위험이 있습니다. 이러한 워크로드를 별도 그룹에 할당하고 메모리 하드 제한을 설정하면 갑작스러운 대형 쿼리로 인해 OOM이 발생하거나 다른 쿼리가 사용할 메모리가 부족해지는 상황을 방지할 수 있습니다. 이 Workload Group의 메모리 사용량이 하드 제한을 초과하면 쿼리를 종료하여 메모리를 해제합니다.

**메모리 하드 제한을 활성화하지 않은 경우**

jmeter로 동시 실행 수를 3으로 설정하여 q29를 실행합니다. ps 명령으로 확인한 프로세스 메모리 사용량은 약 7.7 GB입니다.

```sql
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7896792
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7929692
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 8101232
```

시스템 테이블을 쿼리하면 Workload Group의 메모리 사용량이 약 5.8 GB임을 확인할 수 있습니다. (메타데이터, Cache 등은 Workload Group 통계에 포함되지 않으므로 프로세스 메모리 사용량은 일반적으로 단일 Workload Group의 사용량보다 훨씬 큽니다.)

```sql
SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5797.524360656738 |
+-------------------+
1 row in set (0.01 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5840.246627807617 |
+-------------------+
1 row in set (0.02 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5878.394917488098 |
+-------------------+
1 row in set (0.02 sec)
```

**메모리 하드 제한을 활성화한 경우**

1. 메모리 제한을 1%로 설정합니다.

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('memory_limit' = '1%');
    ```

2. 동일한 테스트를 실행합니다. 시스템 테이블에서 메모리 사용량이 약 1.5 GB로 감소한 것을 확인할 수 있습니다.

    ```sql
    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 1575.3877239227295 |
    +--------------------+
    1 row in set (0.02 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +------------------+
    | wg_mem_used_mb   |
    +------------------+
    | 1668.77405834198 |
    +------------------+
    1 row in set (0.01 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 499.96760272979736 |
    +--------------------+
    1 row in set (0.01 sec)
    ```

3. ps 명령으로 확인한 프로세스 메모리 사용량은 약 3.8 GB로 감소합니다.

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4071364
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4059012
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4057068
    ```

4. 클라이언트에서 메모리 부족으로 인한 쿼리 실패를 확인할 수 있습니다.

    ```text
    1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",concurrency 1-3,text,false,,444,0,3,3,null,0,0,0
    ```

:::tip 사용 권장 사항

메모리 하드 제한은 쿼리를 종료하여 메모리를 해제하므로, 극단적인 경우 모든 쿼리가 실패할 수 있습니다. 운영 환경에서는 메모리 사용량을 제어하면서 쿼리 성공률도 보장할 수 있도록 메모리 하드 제한과 쿼리 대기열 기능을 함께 사용하는 것이 좋습니다.

:::

### CPU 하드 제한 효과 검증 {#verify-the-cpu-hard-limit-effect}

Doris의 일반적인 워크로드는 세 가지 범주로 나뉘며, 권장 구성 전략은 다음과 같습니다.

| 워크로드 유형 | 특성 | 권장 구성 |
|---------------|-----------------|---------------------------|
| 핵심 보고서 쿼리 | CPU 집약적이며 높은 가용성 요구 | CPU 소프트 제한을 사용하고 우선순위를 높게 설정 |
| Adhoc 쿼리 | 무작위 SQL, 리소스 사용량 예측 불가 | CPU 하드 제한을 사용하고 낮은 값으로 설정 |
| ETL 쿼리 | 고정 SQL, 간헐적인 리소스 사용량 급증 | CPU 하드 제한을 사용하여 온라인 서비스에 미치는 영향 방지 |

BE의 CPU가 포화 상태에 이르면 전체 클러스터의 가용성이 눈에 띄게 저하됩니다(RPC 컴포넌트 등 내부 컴포넌트에서 사용할 수 있는 CPU도 감소). 따라서 **운영 환경에서는 소프트 제한보다 CPU 하드 제한을 권장합니다**.

**테스트 환경**: 1 FE, 1 BE, 96코어 머신. 데이터셋은 ClickBench이며, 테스트 SQL은 q29입니다.

1. jmeter로 쿼리 3개를 동시에 실행하여 BE 프로세스의 CPU 사용량을 높입니다. (top 명령으로 확인한 CPU 사용량은 7600%, 즉 약 76코어입니다.)

    ![Workload Group CPU 사용량](/images/workload-management/use_wg_cpu_1.png)

2. Workload Group의 CPU 하드 제한을 10%로 변경합니다.

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('max_cpu_percent' = '10%');
    ```

3. 부하 테스트를 다시 실행합니다. 프로세스는 전체 코어 수의 10%에 해당하는 약 9~10코어만 사용할 수 있습니다.

    ![Workload Group CPU 사용량](/images/workload-management/use_wg_cpu_2.png)

4. 시스템 테이블에서 CPU 사용량이 약 10%로 제어되는지 확인합니다.

    ```sql
    SELECT CPU_USAGE_PERCENT FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```

:::tip 참고 사항

1. 낮은 지연 시간이 필요한 환경에서 가용성을 보장하려면 다른 컴포넌트가 사용할 여유를 남겨 두도록 모든 Workload Group의 CPU 설정값 합계를 정확히 100%로 설정하지 않는 것이 좋습니다. 지연 시간이 중요하지 않고 리소스 활용률을 극대화하려면 합계를 100%로 설정할 수 있습니다.
2. FE가 Workload Group 메타데이터를 BE에 동기화하는 주기는 30초입니다. 변경 사항이 적용되는 데 최대 30초가 걸릴 수 있습니다.

:::

:::tip 고처리량 데이터 적재 시 참고 사항

CPU 하드 제한은 쿼리 워크로드로 테스트해야 더 정확한 결과를 얻을 수 있습니다. 처리량이 높은 데이터 적재는 Compaction을 유발하여 관측값이 Workload Group 설정값을 초과할 수 있습니다. 현재 Compaction 워크로드는 Workload Group에서 관리하지 않기 때문입니다.

:::

### 로컬 IO 하드 제한 효과 검증 {#verify-the-local-io-hard-limit-effect}

OLAP 시스템에서 ETL이나 대형 Adhoc 쿼리를 실행할 때 여러 스레드로 여러 디스크 파일을 병렬 스캔하면 디스크 IO가 크게 증가하여 다른 온라인 쿼리에 영향을 줍니다. 오프라인 ETL 작업에 IO 대역폭 상한을 설정하면 온라인 보고서와 분석에 미치는 영향을 줄일 수 있습니다.

**테스트 환경**: 1 FE, 1 BE, 96코어 머신. 데이터셋은 ClickBench입니다.

**IO 하드 제한을 활성화하지 않은 경우**

1. 캐시를 비활성화합니다.

    ```sql
    -- Clear the operating system cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- Disable the BE page cache
    disable_storage_page_cache = true
    ```

2. ClickBench 테이블에 대해 전체 테이블 스캔을 수행합니다(단일 동시 실행).

    ```sql
    SET dry_run_query = true;
    SELECT * FROM hits.hits;
    ```

3. 시스템 테이블을 쿼리하면 최대 처리량이 약 3 GB/s임을 확인할 수 있습니다.

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 1146.6208400726318 |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 3496.2762966156006 |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 2192.7690029144287 |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. pidstat 명령으로 프로세스 IO를 확인합니다(첫 번째 열은 프로세스 ID, 두 번째 열은 KB/s 단위의 읽기 IO 처리량). 제한이 없으면 최대 처리량은 약 2 GB/s입니다.

    ![Workload Group IO 사용량](/images/workload-management/use_wg_io_1.png)

**IO 하드 제한을 활성화한 경우**

1. 캐시를 비활성화합니다.

    ```sql
    -- Clear the operating system cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- Disable the BE page cache
    disable_storage_page_cache = true
    ```

2. 최대 읽기 처리량을 100 MB/s로 제한합니다.

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('read_bytes_per_second' = '104857600');
    ```

3. 시스템 테이블에서 최대 IO 처리량이 약 98 MB/s로 제어되는 것을 확인할 수 있습니다.

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 97.94296646118164  |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.37584781646729  |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.06641292572021  |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. pidstat 도구로 확인한 프로세스의 최대 IO 처리량은 약 131 MB/s입니다.

    ![Workload Group IO 사용량](/images/workload-management/use_wg_io_2.png)

:::tip 참고 사항

1. 시스템 테이블의 `LOCAL_SCAN_BYTES_PER_SECOND`는 프로세스 수준의 집계값입니다. 파일 경로가 12개 구성되어 있으면 이 값은 12개 경로의 IO 중 최댓값입니다. 각 파일 경로의 IO 처리량을 자세히 확인하려면 Grafana 모니터링을 확인하세요.
2. 운영 체제와 Doris Page Cache의 영향으로 Linux IO 모니터링 스크립트에서 관측한 IO는 일반적으로 시스템 테이블의 값보다 작습니다.

:::

### 원격 IO 하드 제한 효과 검증 {#verify-the-remote-io-hard-limit-effect}

BrokerLoad와 S3Load는 대량 데이터 적재에 흔히 사용하는 방법입니다. Doris가 여러 스레드를 사용하여 HDFS/S3에서 데이터를 병렬로 가져오면 외부 스토리지에 큰 부하를 주어 다른 작업의 안정성에 영향을 미칩니다. 원격 IO 대역폭 상한을 설정하면 데이터 적재가 다른 업무에 미치는 영향을 줄일 수 있습니다.

**테스트 환경**: 동일한 머신에 배포된 1 FE + 1 BE, 16코어, 메모리 64 GB. 테스트 데이터는 S3에 업로드한 ClickBench 데이터셋의 10백만 행입니다.

Schema 정보를 확인합니다.

```sql
DESC FUNCTION s3 (
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style" = "true"
);
```

**원격 읽기 IO를 제한하지 않은 경우**

1. 단일 동시 실행으로 전체 테이블 스캔을 수행합니다.

    ```sql
    -- Set to scan data only, do not return results
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

2. 시스템 테이블에서 원격 IO 처리량이 약 837 MB/s임을 확인할 수 있습니다. (실제 처리량은 BE와 외부 스토리지 간의 대역폭에 영향을 받습니다.)

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     837 |
    +---------+
    1 row in set (0.104 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.070 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.186 sec)
    ```

3. `sar -n DEV 1 3600`으로 머신의 네트워크 대역폭을 확인합니다(첫 번째 열은 초당 수신한 바이트 수이며, 단위는 KB/s). 머신 수준의 최대 네트워크 대역폭은 약 1033 MB/s입니다.

    ![Workload Group 원격 IO 사용량](/images/workload-management/use_wg_rio_1.png)

**원격 읽기 IO를 제한한 후**

1. 원격 읽기 IO 처리량을 100 MB/s로 제한합니다.

    ```sql
    ALTER WORKLOAD GROUP normal PROPERTIES('remote_read_bytes_per_second' = '104857600');
    ```

2. 단일 동시 실행으로 전체 테이블 스캔을 수행합니다.

    ```sql
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

3. 시스템 테이블에서 원격 읽기 IO 처리량이 약 100 MB/s로 제어되는 것을 확인할 수 있습니다. (알고리즘 설계상 변동이 발생하며, 일시적으로 값이 치솟는 것은 정상입니다.)

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |      56 |
    +---------+
    1 row in set (0.010 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     131 |
    +---------+
    1 row in set (0.009 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     111 |
    +---------+
    1 row in set (0.009 sec)
    ```

4. `sar -n DEV 1 3600`으로 NIC 수신 트래픽을 확인합니다(첫 번째 열은 초당 수신한 데이터양). 최댓값이 약 207 MB/s로 바뀌어 IO 제한이 적용되었음을 확인할 수 있습니다. (sar 명령은 머신 수준의 트래픽을 표시하므로 일반적으로 Doris 통계값보다 큽니다.)

    ![Workload Group 원격 IO 사용량](/images/workload-management/use_wg_rio_2.png)

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### 질문: CPU 하드 제한을 설정했지만 적용되지 않음 {#q-the-cpu-hard-limit-is-configured-but-does-not-take-effect}

1. **환경 초기화 실패**: CGroup V1 경로 아래의 `/sys/fs/cgroup/cpu/doris/query/1/tasks` 파일에 해당 Workload Group의 스레드 ID가 있는지 확인합니다(`top -H -b -n 1 -p pid`로 확인). 또한 `cpu.cfs_quota_us` 값이 -1인지 확인합니다(-1은 하드 제한이 적용되지 않았음을 의미).
2. **BE 프로세스의 CPU 사용량이 설정값을 초과함**: Workload Group은 쿼리 스레드와 데이터 적재의 memtable flush 스레드를 관리합니다. BE 내부의 다른 컴포넌트(Compaction 등)도 CPU를 사용하므로 프로세스 CPU 사용량은 일반적으로 Workload Group 설정값보다 높습니다. 테스트용 Workload Group을 생성하고 `information_schema.workload_group_resource_usage`에서 해당 Workload Group 자체의 CPU 사용량을 확인할 수 있습니다(버전 2.1.6부터 지원).
3. **`cpu_resource_limit` 매개변수가 설정되어 있음**: `SHOW PROPERTY FOR jack LIKE 'cpu_resource_limit'` 및 `SHOW VARIABLES LIKE 'cpu_resource_limit'`를 실행하여 이 매개변수가 설정되어 있는지 확인합니다(기본값 -1은 설정되지 않았음을 의미). 이 매개변수가 설정되어 있으면 쿼리는 독립적인 스레드 풀을 사용하며 Workload Group에서 관리하지 않습니다. 마이그레이션 권장 방법: 사용자들을 여러 묶음으로 나누어 사용자의 `num_scanner_threads`를 1로 설정하고 Workload Group을 지정한 다음, `cpu_resource_limit`를 -1로 변경합니다. 안정화될 때까지 관찰한 후 마이그레이션을 계속 진행합니다.

### 질문: 기본 Workload Group 수가 15개로 제한됨 {#q-the-default-workload-group-count-is-limited-to-15}

Workload Group은 단일 머신의 리소스를 분할합니다. 그룹이 너무 많으면 각 그룹에 할당되는 리소스가 지나치게 적어집니다. 업무상 더 많은 그룹이 필요하다면 클러스터를 여러 BE 집합으로 나누고 각 집합에 서로 다른 Workload Group을 생성하는 방안을 고려하세요. FE 구성의 `workload_group_max_num`을 수정하여 이 제한을 일시적으로 우회할 수도 있습니다.

### 질문: Workload Group을 많이 구성한 후 "리소스를 일시적으로 사용할 수 없음" 오류가 발생함 {#q-after-configuring-many-workload-groups-the-error-resource-temporarily-unavailable-appears}

각 Workload Group은 독립적인 스레드 풀 집합입니다. 너무 많이 생성하면 BE 프로세스가 시작하려는 스레드 수가 운영 체제에서 허용하는 상한을 초과할 수 있습니다. 해결 방법: BE 프로세스가 더 많은 스레드를 생성할 수 있도록 운영 체제 구성을 수정합니다.
