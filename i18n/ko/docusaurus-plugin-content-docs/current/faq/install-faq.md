---
{
    "title": "일반 운영 FAQ",
    "language": "ko",
    "description": "Apache Doris 운영 FAQ 및 문제 해결 가이드입니다. FE/BE 노드 관리, 로그 분석, 설정 최적화, 버전 업그레이드, 스토리지 매체 설정, 로드 밸런싱 등 실제 운영 상황에서 자주 묻는 질문에 답하여 Doris 클러스터의 운영 문제를 빠르게 파악하고 해결할 수 있도록 돕습니다."
}
---

이 문서는 Doris를 사용하면서 자주 발생하는 운영 문제를 정리한 문서입니다. 수시로 업데이트됩니다.

**이 문서에서 언급하는 BE 바이너리 파일 이름 `doris_be`는 이전 버전에서 `palo_be`였습니다.**

### Q1. DECOMMISSION으로 BE 노드의 사용 중지를 진행할 때 일부 tablet이 항상 남는 이유는 무엇인가요? {#q1-why-are-there-always-some-tablets-remaining-when-decommissioning-a-be-node-through-decommission}

사용 중지 과정에서 해당 노드의 `tabletNum`을 `show backends`로 확인하면 `tabletNum` 값이 줄어드는 것을 볼 수 있습니다. 이는 데이터 샤드가 이 노드에서 다른 노드로 마이그레이션되고 있음을 의미합니다. 이 값이 0이 되면 시스템이 해당 노드를 자동으로 삭제합니다. 하지만 일부 상황에서는 `tabletNum`이 특정 값까지 줄어든 뒤 더 이상 변하지 않습니다. 일반적으로 다음 두 가지 원인이 있을 수 있습니다.

1.  해당 tablet이 방금 삭제된 테이블, 파티션 또는 구체화된 뷰에 속해 있습니다. 최근에 삭제된 객체는 휴지통에 보관됩니다. 사용 중지 로직은 이러한 샤드를 처리하지 않습니다. FE 설정 매개변수 `catalog_trash_expire_second`를 수정하여 휴지통의 객체 보관 기간을 변경할 수 있습니다. 휴지통에서 객체가 삭제되면 해당 tablet도 처리됩니다.

2.  해당 tablet의 마이그레이션 작업에 문제가 발생했습니다. 이 경우 `show proc "/cluster_balance"`로 구체적인 작업 오류를 확인해야 합니다.

위와 같은 상황에서는 먼저 `show proc "/cluster_health/tablet_health";`로 클러스터에 비정상 샤드가 있는지 확인할 수 있습니다. 비정상 샤드 수가 0이면 `drop backend` 문으로 이 BE를 바로 삭제할 수 있습니다. 그렇지 않으면 비정상 샤드의 복제본 상태를 구체적으로 확인해야 합니다.

### Q2. priority_networks는 어떻게 설정해야 하나요? {#q2-how-should-priority_networks-be-configured}

`priority_networks`는 FE와 BE 모두에 적용되는 설정 매개변수입니다. 이 매개변수는 주로 시스템이 올바른 네트워크 카드의 IP를 자신의 IP로 선택하도록 돕는 데 사용됩니다. 나중에 머신에 네트워크 카드를 추가했을 때 잘못된 IP가 선택되는 문제를 방지하려면, 항상 이 매개변수를 명시적으로 설정하는 것이 좋습니다.

`priority_networks`의 값은 CIDR 형식으로 표현됩니다. 두 부분으로 나뉘며, 첫 번째 부분은 점으로 구분된 십진수 표기의 IP 주소이고 두 번째 부분은 접두사 길이입니다. 예를 들어 `10.168.1.0/8`은 모든 `10.xx.xx.xx` IP 주소와 일치하고, `10.168.1.0/16`은 모든 `10.168.xx.xx` IP 주소와 일치합니다.

특정 IP를 직접 지정하지 않고 CIDR 형식을 사용하는 이유는 모든 노드에서 동일한 설정값을 사용할 수 있도록 하기 위해서입니다. 예를 들어 두 노드가 `10.168.10.1`과 `10.168.10.2`라면 `10.168.10.0/24`를 `priority_networks`의 값으로 사용할 수 있습니다.

### Q3. FE의 Master, Follower, Observer는 무엇인가요? {#q3-what-are-master-follower-and-observer-in-fe}

먼저 FE에는 Follower와 Observer라는 두 가지 역할만 있다는 점을 알아야 합니다. Master는 Follower 노드 그룹에서 선택된 FE일 뿐입니다. Master는 특별한 형태의 Follower라고 볼 수 있습니다. 따라서 클러스터에 FE가 몇 개 있고 각각 어떤 역할인지 묻는다면, 전체 FE 노드 수와 함께 Follower 역할 및 Observer 역할을 가진 노드 수를 답하는 것이 정확합니다.

Follower 역할을 가진 모든 FE 노드는 선출 가능한 그룹을 구성하며, 이는 Paxos 합의 프로토콜의 그룹 개념과 유사합니다. 이 그룹 안에서 Follower 하나가 Master로 선출됩니다. Master에 장애가 발생하면 새로운 Follower가 자동으로 Master로 선출됩니다. Observer는 선거에 참여하지 않으므로 Master가 되지 않습니다.

메타데이터 로그는 과반수의 Follower 노드에 성공적으로 기록되어야 쓰기가 성공한 것으로 간주됩니다. 예를 들어 FE가 3개라면 2개에 쓰기가 성공해야 합니다. 이것이 Follower 역할을 가진 노드 수를 홀수로 설정해야 하는 이유이기도 합니다.

Observer 역할은 이름에서 알 수 있듯이 관찰자 역할만 수행합니다. 성공적으로 기록된 메타데이터 로그를 동기화하고 메타데이터 읽기 서비스를 제공합니다. 과반수 쓰기 로직에는 참여하지 않습니다.

일반적으로 1개의 Follower + 2개의 Observer 또는 3개의 Follower + N개의 Observer를 배포할 수 있습니다. 전자는 운영과 유지보수가 더 간단하고, Follower 간의 일관성 프로토콜로 인해 발생하는 복잡한 오류를 거의 겪지 않습니다(대부분의 기업이 이 방식을 사용합니다). 후자는 메타데이터 쓰기의 고가용성을 보장할 수 있습니다. 동시 쿼리가 많은 환경이라면 Observer 수를 적절히 늘릴 수 있습니다.

### Q4. 노드에 새 디스크를 추가해도 데이터가 새 디스크로 분산되지 않는 이유는 무엇인가요? {#q4-why-doesnt-data-balance-to-new-disks-when-new-disks-are-added-to-nodes}

현재 Doris의 균형 조정 전략은 노드 단위로 작동합니다. 즉, 노드 전체의 부하 지표(샤드 수와 전체 디스크 사용률)를 기준으로 클러스터 부하를 판단하고, 부하가 높은 노드에서 낮은 노드로 데이터 샤드를 마이그레이션합니다. 각 노드에 디스크를 추가해도 노드 전체 관점에서는 부하가 달라지지 않으므로 균형 조정 로직이 실행되지 않습니다.

또한 현재 Doris는 단일 노드 내의 디스크 간 균형 조정을 지원하지 않습니다. 따라서 새 디스크를 추가해도 데이터가 새 디스크로 분산되지 않습니다.

하지만 노드 간에 데이터를 마이그레이션할 때는 Doris가 디스크 요소를 고려합니다. 예를 들어 샤드를 노드 A에서 노드 B로 마이그레이션할 때는 노드 B에서 디스크 공간 사용률이 낮은 디스크를 우선 선택합니다.

이 문제를 해결하는 방법은 다음 3가지입니다.

1.  새 테이블 생성

    `create table like` 문으로 새 테이블을 만든 다음, `insert into select`로 기존 테이블의 데이터를 새 테이블에 동기화합니다. 새 테이블을 만들 때 해당 테이블의 데이터 샤드가 새 디스크에도 분산되므로 데이터도 새 디스크에 기록됩니다. 이 방법은 데이터양이 적은 경우(수십 GB 이내)에 적합합니다.

2.  Decommission 명령 사용

    `decommission` 명령은 BE 노드의 사용을 안전하게 중지하는 데 사용됩니다. 이 명령은 먼저 해당 노드의 데이터 샤드를 다른 노드로 마이그레이션한 다음 노드를 삭제합니다. 앞서 설명했듯이 데이터 마이그레이션 시 디스크 사용률이 낮은 디스크가 우선 선택되므로, 이 방법으로 데이터를 다른 노드의 디스크로 "강제" 마이그레이션할 수 있습니다. 데이터 마이그레이션이 완료되면 `cancel`로 이 `decommission` 작업을 취소하여 데이터가 다시 이 노드로 분산되도록 합니다. 모든 BE 노드에서 위 단계를 실행하면 모든 노드의 모든 디스크에 데이터가 고르게 분산됩니다.

    `decommission` 명령을 실행하기 전에 다음 명령을 먼저 실행하여 사용 중지가 완료된 뒤 노드가 삭제되지 않도록 해야 합니다.

    `admin set frontend config("drop_backend_after_decommission" = "false");`

3.  API로 데이터 수동 마이그레이션

    Doris는 한 디스크의 데이터 샤드를 다른 디스크로 마이그레이션하도록 수동으로 지정할 수 있는 [HTTP API](https://doris.apache.org/docs/dev/admin-manual/be/tablet-migration)를 제공합니다.

### Q5. FE/BE 로그는 어떻게 올바르게 읽을 수 있나요? {#q5-how-to-correctly-read-febe-logs}

많은 경우 로그를 통해 문제를 해결해야 합니다. 여기서는 FE/BE 로그의 형식과 확인 방법을 설명합니다.

1.  FE

    주요 FE 로그는 다음과 같습니다.

    -   `fe.log`: 주 로그입니다. `fe.out`을 제외한 모든 내용을 포함합니다.

    -   `fe.warn.log`: 주 로그의 일부로, WARN 및 ERROR 수준의 로그만 기록합니다.

    -   `fe.out`: 표준 출력 및 표준 오류 출력 로그(stdout 및 stderr)입니다.

    -   `fe.audit.log`: 감사 로그로, 이 FE가 수신한 모든 SQL 요청을 기록합니다.

    일반적인 FE 로그 항목은 다음과 같습니다.

    ```text
    2021-09-16 23:13:22,502 INFO (tablet scheduler|43) [BeLoadRebalancer.selectAlternativeTabletsForCluster():85] cluster is balance: default_cluster with medium: HDD. skip
    ```

    -   `2021-09-16 23:13:22,502`: 로그 타임스탬프입니다.

    -   `INFO`: 로그 수준입니다. 기본값은 INFO입니다.

    -   `(tablet scheduler|43)`: 스레드 이름과 스레드 ID입니다. 스레드 ID로 해당 스레드의 문맥 정보를 확인할 수 있어, 스레드에서 어떤 일이 발생했는지 파악하는 데 유용합니다.

    -   `BeLoadRebalancer.selectAlternativeTabletsForCluster():85`: 클래스 이름, 메서드 이름, 코드 줄 번호입니다.

    -   `cluster is balance xxx`: 로그 내용입니다.

    일반적으로는 주로 `fe.log` 로그를 확인합니다. 특수한 경우 일부 로그가 `fe.out`에 출력될 수 있습니다.

2.  BE

    주요 BE 로그는 다음과 같습니다.

    -   `be.INFO`: 주 로그입니다. 실제로는 최신 `be.INFO.xxxx`를 가리키는 심볼릭 링크입니다.

    -   `be.WARNING`: 주 로그의 일부로, WARN 및 FATAL 수준의 로그만 기록합니다. 실제로는 최신 `be.WARN.xxxx`를 가리키는 심볼릭 링크입니다.

    -   `be.out`: 표준 출력 및 표준 오류 출력 로그(stdout 및 stderr)입니다.

    일반적인 BE 로그 항목은 다음과 같습니다.

    ```text
    I0916 23:21:22.038795 28087 task_worker_pool.cpp:1594] finish report TASK. master host: 10.10.10.10, port: 9222
    ```

    -   `I0916 23:21:22.038795`: 로그 수준과 날짜 및 시간입니다. 대문자 I는 INFO, W는 WARN, F는 FATAL을 나타냅니다.

    -   `28087`: 스레드 ID입니다. 스레드 ID로 해당 스레드의 문맥 정보를 확인할 수 있어, 스레드에서 어떤 일이 발생했는지 파악하는 데 유용합니다.

    -   `task_worker_pool.cpp:1594`: 코드 파일과 줄 번호입니다.

    -   `finish report TASK xxx`: 로그 내용입니다.

    일반적으로는 주로 `be.INFO` 로그를 확인합니다. BE가 비정상 종료되는 등의 특수한 경우에는 `be.out`을 확인해야 합니다.

### Q6. FE/BE 노드가 다운되면 어떻게 문제를 해결하나요? {#q6-how-to-troubleshoot-when-febe-nodes-go-down}

1.  BE

    BE 프로세스는 C/C++ 프로세스이며, 프로그램 버그(메모리 범위 초과, 잘못된 주소 접근 등)나 Out Of Memory (OOM)로 인해 비정상 종료될 수 있습니다. 이 경우 다음 단계로 오류 원인을 확인할 수 있습니다.

    1.  `be.out` 확인

        BE 프로세스는 비정상적인 상황으로 프로그램이 종료될 때 현재 오류 스택을 `be.out`에 출력하도록 구현되어 있습니다(출력 대상은 `be.out`이며, `be.INFO`나 `be.WARNING`가 아니라는 점에 유의하세요). 오류 스택을 통해 대체로 프로그램에서 문제가 발생한 위치를 파악할 수 있습니다.

        `be.out`에 오류 스택이 나타나면 일반적으로 프로그램 버그가 원인이며, 일반 사용자가 직접 해결하기 어려울 수 있습니다. WeChat 그룹, GitHub Discussion 또는 dev 메일링 리스트에 도움을 요청하고, 빠르게 문제를 파악할 수 있도록 해당 오류 스택을 함께 올려 주세요.

    2.  dmesg

        `be.out`에 스택 정보가 없다면 OOM으로 인해 시스템이 프로세스를 강제로 종료했을 가능성이 높습니다. 이 경우 `dmesg -T` 명령으로 Linux 시스템 로그를 확인할 수 있습니다. 마지막 부분에 `Memory cgroup out of memory: Kill process 7187 (doris_be) score 1007 or sacrifice child`와 유사한 로그가 있다면 OOM이 원인이라는 뜻입니다.

        메모리 문제는 대규모 쿼리, 데이터 적재, compaction 등 여러 요인으로 발생할 수 있습니다. Doris도 메모리 사용을 지속적으로 최적화하고 있습니다. WeChat 그룹, GitHub Discussion 또는 dev 메일링 리스트에 도움을 요청하세요.

    3.  `be.INFO`에 F로 시작하는 로그가 있는지 확인

        F로 시작하는 로그는 Fatal 로그입니다. 예를 들어 `F0916`은 구월 16일의 Fatal 로그를 나타냅니다. Fatal 로그는 일반적으로 프로그램의 assertion 오류를 의미하며, assertion 오류는 프로세스를 즉시 종료시킵니다(프로그램에 버그가 있음을 의미합니다). WeChat 그룹, GitHub Discussion 또는 dev 메일링 리스트에 도움을 요청하세요.

2.  FE

    FE는 Java 프로세스이며 C/C++ 프로그램보다 안정성이 높습니다. 일반적으로 FE가 비정상 종료되는 원인은 OOM (Out-of-Memory) 또는 메타데이터 쓰기 실패일 수 있습니다. 이러한 오류는 보통 `fe.log`나 `fe.out`에 오류 스택이 남습니다. 오류 스택 정보를 바탕으로 추가적인 문제 분석이 필요합니다.

### Q7. 데이터 디렉터리를 SSD 및 HDD로 설정한 경우, 테이블 생성 시 `Failed to find enough host with storage medium and tag` 오류가 발생할 수 있습니다 {#q7-regarding-the-configuration-of-data-directories-ssd-and-hdd-sometimes-you-may-encounter-the-error-failed-to-find-enough-host-with-storage-medium-and-tag-when-creating-tables}

Doris는 BE 노드에 여러 스토리지 경로를 설정할 수 있습니다. 일반적으로 디스크마다 스토리지 경로를 하나씩 설정하면 충분합니다. 또한 Doris는 경로에 SSD 또는 HDD와 같은 스토리지 매체 속성을 지정할 수 있습니다. SSD는 고속 스토리지 장치를, HDD는 저속 스토리지 장치를 나타냅니다.

클러스터가 모두 HDD 또는 모두 SSD인 것처럼 한 종류의 매체만 사용한다면, `be.conf`에 매체 속성을 명시적으로 지정하지 않는 것이 좋습니다. 위의 `Failed to find enough host with storage medium and tag` 오류가 발생한다면 일반적으로 `be.conf`에는 SSD 매체만 설정되어 있는데 테이블 생성 시 `properties {"storage_medium" = "hdd"}`를 명시적으로 지정했기 때문입니다. 마찬가지로 `be.conf`에는 HDD 매체만 설정되어 있는데 테이블 생성 시 `properties {"storage_medium" = "ssd"}`를 명시적으로 지정해도 같은 오류가 발생합니다. 해결 방법은 테이블 생성 시 사용하는 `properties` 매개변수를 설정에 맞게 수정하거나, `be.conf`에서 SSD/HDD의 명시적 설정을 제거하는 것입니다.

경로의 스토리지 매체 속성을 지정하면 Doris의 핫 데이터 및 콜드 데이터 파티션 저장 기능을 사용할 수 있습니다. 이 기능은 파티션 단위로 핫 데이터를 SSD에 저장하고, 콜드 데이터는 HDD로 자동 이동합니다.

Doris는 스토리지 경로가 위치한 디스크의 실제 스토리지 매체 유형을 자동으로 감지하지 않는다는 점에 유의해야 합니다. 사용자가 경로 설정에서 이 유형을 명시적으로 지정해야 합니다. 예를 들어 `/path/to/data1.SSD` 경로는 이 경로가 SSD 스토리지 매체임을 나타냅니다. 여기서 `data1.SSD`는 실제 디렉터리 이름입니다. Doris는 실제 스토리지 매체 유형이 아니라 디렉터리 이름 뒤의 `.SSD` 접미사로 스토리지 매체 유형을 판단합니다. 즉, 사용자는 어떤 경로든 SSD 스토리지 매체로 지정할 수 있으며, Doris는 디렉터리 접미사만 인식하고 실제 스토리지 매체와 일치하는지는 판단하지 않습니다. 접미사를 작성하지 않으면 기본값은 HDD입니다.

다시 말해 `.HDD`와 `.SSD`는 스토리지 디렉터리의 "상대적인" "저속"과 "고속" 구분을 나타내는 데만 사용되며, 실제 스토리지 매체 유형을 식별하지 않습니다. 따라서 BE 노드의 스토리지 경로 간에 매체 차이가 없다면 접미사를 지정할 필요가 없습니다.

### Q8. 여러 FE에서 Nginx로 Web UI 로드 밸런싱을 구현할 때 로그인이 되지 않는 경우 {#q8-when-using-nginx-to-implement-web-ui-load-balancing-with-multiple-fes-unable-to-log-in}

Doris는 여러 FE를 배포할 수 있습니다. Web UI에 접근할 때 Nginx를 로드 밸런싱에 사용하면 Session 문제로 인해 다시 로그인하라는 메시지가 계속 나타날 수 있습니다. 이는 실제로 Session 공유 문제입니다. Nginx는 중앙 집중식 Session 공유 솔루션을 제공합니다. 여기서는 Nginx의 `ip_hash` 기술을 사용합니다. `ip_hash`는 특정 IP의 요청을 동일한 backend로 전달하여, 해당 IP의 특정 클라이언트가 특정 backend와 안정적인 Session을 유지하도록 합니다. `ip_hash`는 `upstream` 설정에 정의됩니다.

```text
upstream  doris.com {
   server    172.22.197.238:8030 weight=3;
   server    172.22.197.239:8030 weight=4;
   server    172.22.197.240:8030 weight=4;
   ip_hash;
}
```

전체 Nginx 설정 예시는 다음과 같습니다.

```text
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
    #include /etc/nginx/custom/*.conf;
    upstream  doris.com {
      server    172.22.197.238:8030 weight=3;
      server    172.22.197.239:8030 weight=4;
      server    172.22.197.240:8030 weight=4;
      ip_hash;
    }

    server {
        listen       80;
        server_name  gaia-pro-bigdata-fe02;
        if ($request_uri ~ _load) {
           return 307 http://$host$request_uri ;
        }

        location / {
            proxy_pass http://doris.com;
            proxy_redirect default;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
 }
```

### Q9. FE 시작에 실패하고 fe.log에 "wait catalog to be ready. FE type UNKNOWN"이 계속 출력되는 경우 {#q9-fe-startup-fails-felog-keeps-scrolling-wait-catalog-to-be-ready-fe-type-unknown}

이 문제에는 일반적으로 두 가지 원인이 있습니다.

1.  이번 FE 시작 시 얻은 로컬 IP가 이전 시작 시의 IP와 일치하지 않습니다. 보통 `priority_network`가 올바르게 설정되지 않아 FE 시작 시 잘못된 IP 주소가 선택되기 때문입니다. `priority_network`를 수정하고 FE를 다시 시작해야 합니다.

2.  클러스터의 Follower FE 노드 대부분이 시작되지 않았습니다. 예를 들어 Follower가 3개인데 하나만 시작된 경우입니다. 이때는 FE의 선출 가능 그룹이 Master를 선출하여 서비스를 제공할 수 있도록 FE를 적어도 하나 더 시작해야 합니다.

위 방법으로 문제가 해결되지 않으면 Doris 공식 문서의 [메타데이터 운영 문서](../admin-manual/trouble-shooting/metadata-operation.md)에 따라 복구할 수 있습니다.

### Q10. Lost connection to MySQL server at 'reading initial communication packet', system error: 0 오류 {#q10-lost-connection-to-mysql-server-at-reading-initial-communication-packet-system-error-0}

MySQL 클라이언트로 Doris에 연결할 때 위 문제가 발생한다면 일반적으로 FE 컴파일에 사용한 JDK 버전과 FE 실행에 사용한 JDK 버전이 다르기 때문입니다. Docker 빌드 이미지로 컴파일할 때 기본 JDK 버전은 OpenJDK 11이며, 명령으로 OpenJDK 8로 전환할 수 있습니다(자세한 내용은 컴파일 문서를 참조하세요).

### Q11. recoveryTracker should overlap or follow on disk last VLSN of 4,422,880 recoveryFirst= 4,422,882 UNEXPECTED_STATE_FATAL 오류 {#q11-recoverytracker-should-overlap-or-follow-on-disk-last-vlsn-of-4422880-recoveryfirst-4422882-unexpected_state_fatal}

FE를 다시 시작할 때 간혹 위 오류가 발생합니다(일반적으로 Follower가 여러 개일 때만 발생합니다). 오류에 나타나는 두 값의 차이는 2이며, 이로 인해 FE가 시작되지 않습니다.

이는 아직 해결되지 않은 BDB JE의 버그입니다. 이러한 상황에서는 [메타데이터 운영 문서](../admin-manual/trouble-shooting/metadata-operation.md)의 장애 복구 작업을 통해서만 메타데이터를 복구할 수 있습니다.

### Q12. Doris 컴파일 및 설치 시 JDK 버전 비호환 문제 {#q12-doris-compilation-and-installation-jdk-version-incompatibility-issue}

Docker로 Doris를 직접 컴파일한 뒤 설치하고 FE를 시작할 때 `java.lang.Suchmethoderror: java.nio.ByteBuffer.limit(I)Ljava/nio/ByteBuffer;` 예외 정보가 나타날 수 있습니다. 이는 Docker의 기본 환경이 JDK 11이기 때문입니다. 설치 환경에서 JDK 8을 사용한다면 Docker의 JDK 환경도 JDK 8로 전환해야 합니다. 구체적인 전환 방법은 [컴파일 문서](https://doris.apache.org/community/source-install/compilation-with-docker)를 참조하세요.

### Q13. FE를 로컬에서 시작하거나 단위 테스트를 실행할 때 Cannot find external parser table action_table.dat 오류가 발생하는 경우 {#q13-starting-fe-locally-or-starting-unit-tests-reports-error-cannot-find-external-parser-table-action_tabledat}

다음 명령을 실행하세요.

```bash
cd fe && mvn clean install -DskipTests
```

같은 오류가 계속 발생하면 다음 명령을 수동으로 실행하세요.

```bash
cp fe-core/target/generated-sources/cup/org/apache/doris/analysis/action_table.dat fe-core/target/classes/org/apache/doris/analysis
```

### Q14. 버전 1.2로 업그레이드한 후 NoClassDefFoundError 문제로 BE가 시작되지 않는 경우 {#q14-after-upgrading-to-version-12-be-fails-to-start-with-noclassdeffounderror-issue}

:::note
Doris 1.2 버전부터 지원되는 Java UDF와 관련된 종속성 오류입니다.
:::

업그레이드 후 BE를 시작할 때 다음과 같은 Java `NoClassDefFoundError` 오류가 발생하는 경우:

```text
Exception in thread "main" java.lang.NoClassDefFoundError: org/apache/doris/udf/JniUtil
Caused by: java.lang.ClassNotFoundException: org.apache.doris.udf.JniUtil
```

공식 웹사이트에서 Java UDF 함수 종속성 패키지 `apache-doris-java-udf-jar-with-dependencies-1.2.0`을 다운로드하여 BE 설치 디렉터리 아래의 `lib` 디렉터리에 넣은 다음 BE를 다시 시작해야 합니다.

### Q15. 버전 1.2로 업그레이드한 후 BE 시작 시 Failed to initialize JNI 문제가 발생하는 경우 {#q15-after-upgrading-to-version-12-be-startup-shows-failed-to-initialize-jni-issue}

:::note
Doris 1.2 버전부터 적용되는 Java 환경 문제입니다.
:::

업그레이드 후 BE를 시작할 때 다음과 같은 `Failed to initialize JNI` 오류가 발생하는 경우:

```text
Failed to initialize JNI: Failed to find the library libjvm.so.
```

시스템에 `JAVA_HOME` 환경 변수를 설정하거나, `JAVA_HOME` 변수를 `be.conf`에 설정한 다음 BE 노드를 다시 시작해야 합니다.

### Q16. Docker: backend 시작 실패 {#q16-docker-backend-fails-to-start}
CPU가 AVX2를 지원하지 않기 때문일 수 있습니다. `docker logs -f be`로 backend 로그를 확인하세요.
CPU가 AVX2를 지원하지 않으면 `apache/doris:1.2.2-be-x86_64-noavx2` 이미지를 사용해야 하며,
`apache/doris:1.2.2-be-x86_64` 이미지는 사용할 수 없습니다.
이미지 버전 번호는 시간이 지나면서 변경되므로 [Dockerhub](https://registry.hub.docker.com/r/apache/doris/tags?page=1&name=avx2)에서 최신 버전을 확인하세요.
