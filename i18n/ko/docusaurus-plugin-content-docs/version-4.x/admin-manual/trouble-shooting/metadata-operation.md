---
{
    "title": "메타데이터 운영 및 유지 관리",
    "language": "ko",
    "description": "이 문서는 실제 운영 환경에서 Doris 메타데이터를 관리하는 방법을 다룹니다. FE 노드의 권장 배포 구성을 포함합니다."
}
---

:::warning

꼭 필요한 경우에만 metadata_failure_recovery를 사용하세요. 이 기능을 사용하면 메타데이터 잘림, 손실, 스플릿 브레인이 발생할 수 있습니다. 잘못된 작업으로 복구할 수 없는 데이터 손상이 발생하지 않도록 신중하게 사용하세요.
:::

이 문서는 실제 운영 환경에서 Doris 메타데이터를 관리하는 방법을 다룹니다. FE 노드의 권장 배포 구성, 자주 사용하는 운영 방법, 일반적인 오류 해결 방법을 설명합니다.

먼저 [Doris 메타데이터 설계 문서](/community/design/metadata-design)를 읽고 Doris 메타데이터의 작동 방식을 이해하세요.

## 중요 사항 {#important-tips}

* 현재 메타데이터 설계는 하위 호환성을 보장하지 않습니다. 즉, 새 버전에서 메타데이터 구조가 변경되면(FE 코드의 `FeMetaVersion.java` 파일에서 새로운 VERSION이 있는지 확인할 수 있습니다), 새 버전으로 업그레이드한 후 이전 버전으로 롤백하는 것은 일반적으로 불가능합니다. 따라서 FE를 업그레이드하기 전에 반드시 [업그레이드 문서](../../admin-manual/cluster-management/upgrade.md)의 절차에 따라 메타데이터 호환성을 테스트하세요.

## 메타데이터 Catalog 구조 {#metadata-catalog-structure}

fe.conf에 지정된 `meta_dir` 경로가 `path/to/doris-meta`라고 가정하겠습니다. 정상적인 Doris 클러스터의 메타데이터 디렉터리 구조는 다음과 같습니다.

```
/path/to/doris-meta/
            |-- bdb/
            |   |-- 00000000.jdb
            |   |-- je.config.csv
            |   |-- je.info.0
            |   |-- je.info.0.lck
            |   |-- je.lck
            |   `-- je.stat.csv
            `-- image/
                |-- ROLE
                |-- VERSION
                `-- image.xxxx
```

1. bdb

	메타데이터 저널을 저장하는 분산 kV 시스템으로 [bdbje](https://www.oracle.com/technetwork/database/berkeleydb/overview/index-093405.html)를 사용합니다. 이 BDB 디렉터리는 bdbje의 "데이터 디렉터리"에 해당합니다.

	`.jdb` 확장자를 가진 파일은 bdbje의 데이터 파일입니다. 메타데이터 저널이 늘어나면 이러한 데이터 파일도 증가합니다. Doris가 주기적으로 이미지 생성을 완료하면 오래된 로그가 삭제됩니다. 따라서 정상적인 경우 이 데이터 파일의 전체 크기는 수 MB에서 수 GB 사이입니다(데이터 적재 빈도 등 Doris 사용 방식에 따라 달라집니다). 데이터 파일의 전체 크기가 10GB를 넘으면 이미지 생성에 실패했는지, 또는 이미지 배포 실패로 이전 저널을 삭제하지 못했는지 확인해야 합니다.

	` je.info.0 `은 bdbje의 실행 로그입니다. 이 로그의 시간대는 UTC + 0입니다. 이 로그를 통해 bdbje의 일부 작동 방식도 확인할 수 있습니다.

2. image 디렉터리

	image 디렉터리는 Doris가 주기적으로 생성하는 메타데이터 이미지를 저장하는 데 사용됩니다. 일반적으로 `image.xxxxx` 이미지 파일이 있습니다. 여기서 `xxxxx`는 숫자이며, 이미지에 `xxxx` 이전의 모든 메타데이터 저널이 포함되어 있음을 나타냅니다. 이 파일의 생성 시각(`ls -al`로 확인)은 일반적으로 이미지가 생성된 시각입니다.

	`image.ckpt` 파일이 보일 수도 있습니다. 이 파일은 현재 생성 중인 메타데이터 이미지입니다. `du -sh` 명령으로 파일 크기가 증가하는 것을 확인할 수 있으며, 이는 이미지 내용이 파일에 기록되고 있음을 나타냅니다. 이미지 기록이 완료되면 파일 이름이 자동으로 새로운 `image.xxxxx`로 변경되고 이전 이미지 파일을 대체합니다.

	Master 역할의 FE만 주기적으로 이미지 파일을 생성합니다. 이미지가 생성될 때마다 Master가 아닌 다른 역할의 FE에 이미지를 푸시합니다. 다른 모든 FE가 이 이미지를 수신한 것이 확인되면 Master FE는 bdbje의 메타데이터 저널을 삭제합니다. 따라서 이미지 생성에 실패하거나 다른 FE로 이미지를 푸시하지 못하면 bdbje에 데이터가 누적됩니다.

	`ROLE` 파일은 FE 유형(FOLLOWER 또는 OBSERVER)을 기록하는 텍스트 파일입니다.

	`VERSION` 파일은 Doris 클러스터의 클러스터 ID와 노드 간 접근 인증에 사용되는 토큰을 기록하며, 이 파일도 텍스트 파일입니다.

	`ROLE` 파일과 `VERSION` 파일은 항상 함께 존재하거나, 최초 시작 시와 같이 둘 다 존재하지 않아야 합니다.

## 기본 작업 {#basic-operations}

### 단일 노드 FE 시작 {#start-single-node-fe}

단일 노드 FE는 가장 기본적인 배포 방식입니다. 완전한 Doris 클러스터에는 최소 하나의 FE 노드가 필요합니다. FE 노드가 하나뿐이면 노드 유형은 Follower이고 역할은 Master입니다.

1. 최초 시작

	1. fe.conf에 지정된 `meta_dir` 경로가 `path/to/doris-meta`라고 가정합니다.
	2. `path/to/doris-meta`가 이미 존재하고, 권한이 올바르며, 디렉터리가 비어 있는지 확인합니다.
	3. `bash bin/start_fe.sh --daemon`으로 바로 시작합니다.
	4. 시작 후 fe.log에서 다음 로그를 확인할 수 있어야 합니다.

		* Palo FE starting...
		* image does not exist: /path/to/doris-meta/image/image.0
		* transfer from INIT to UNKNOWN
		* transfer from UNKNOWN to MASTER
		* the very first time to open bdb, dbname is 1
		* start fencing, epoch number is 1
		* finish replay in xxx msec
		* QE service start
		* thrift server started

		위 로그가 반드시 이 순서대로 출력되는 것은 아니지만, 대체로 비슷합니다.

	5. 단일 노드 FE는 일반적으로 최초 시작 시 문제가 발생하지 않습니다. 위 로그가 보이지 않는다면 문서의 절차를 정확히 따르지 않았을 가능성이 높으므로 관련 wiki를 주의 깊게 읽어보세요.

2. 재시작

	1. 중지된 FE 노드는 `bash bin/start_fe.sh`를 사용하여 다시 시작할 수 있습니다.
	2. 재시작 후 fe.log에서 다음 로그를 확인할 수 있어야 합니다.

		* Palo FE starting...
		* finished to get cluster id: xxxx, role: FOLLOWER and node name: xxxx
		* 재시작 전에 생성된 이미지가 없다면 다음 로그가 표시됩니다.
		* image does not exist: /path/to/doris-meta/image/image.0

		* 재시작 전에 이미지가 생성되었다면 다음 로그가 표시됩니다.
		* start load image from /path/to/doris-meta/image/image.xxx. is ckpt: false
		* finished load image in xxx ms

		* transfer from INIT to UNKNOWN
		* replayed journal id is xxxx, replay to journal id is yyyy
		* transfer from UNKNOWN to MASTER
		* finish replay in xxx msec
		* master finish replay journal, can write now.
		* begin to generate new image: image.xxxx
		*  start save image to /path/to/doris-meta/image/image.ckpt. is ckpt: true
		*  finished save image /path/to/doris-meta/image/image.ckpt in xxx ms. checksum is xxxx
		*  push image.xxx to other nodes. totally xx nodes, push succeeded xx nodes
		* QE service start
		* thrift server started

		위 로그가 반드시 이 순서대로 출력되는 것은 아니지만, 대체로 비슷합니다.

3. 일반적인 문제

	단일 노드 FE 배포에서는 일반적으로 시작과 중지 시 문제가 발생하지 않습니다. 문제가 있다면 관련 Wiki를 참고하여 작업 절차를 꼼꼼히 확인하세요.

### FE 추가 {#add-fe}

FE 프로세스 추가 방법은 [확장 문서](../../admin-manual/cluster-management/elastic-expansion.md)에 자세히 설명되어 있으므로 여기서는 반복하지 않습니다. 아래에서는 주의 사항과 일반적인 문제를 설명합니다.

1. 주의 사항

	* 새 FE를 추가하기 전에 현재 Master FE가 정상적으로 작동하는지 확인하세요(연결 상태, JVM 상태, 이미지 생성 상태, bdbje 데이터 디렉터리가 지나치게 큰지 여부 등).
	* 새 FE를 처음 시작할 때는 반드시 `--helper` 매개변수를 추가하여 Master FE를 가리키도록 해야 합니다. 재시작할 때는 `--helper`를 추가할 필요가 없습니다. (`--helper`를 지정하면 FE가 helper 노드에 자신의 역할을 직접 요청합니다. 지정하지 않으면 FE는 `ROLE` 및 `VERSION` 파일을 `doris-meta/image/` 디렉터리에서 읽어 정보를 가져오려고 합니다.
	* 새 FE를 처음 시작할 때는 해당 FE의 `meta_dir`가 생성되어 있고, 권한이 올바르며, 비어 있는지 반드시 확인하세요.
	* 새 FE를 시작하는 작업과 `ALTER SYSTEM ADD FOLLOWER/OBSERVER` 구문을 실행하여 FE를 메타데이터에 추가하는 작업은 순서가 정해져 있지 않습니다. 새 FE를 먼저 시작하고 구문을 실행하지 않으면 새 FE 로그에 `current node is not added to the group. Please add it first.`가 표시됩니다. 구문을 실행하면 정상적인 절차가 진행됩니다.
	* 이전 FE가 성공적으로 추가된 후 다음 FE를 추가하세요.
	* MASTER FE에 연결하여 `ALTER SYSTEM ADD FOLLOWER/OBSERVER` 구문을 실행하세요.

2. 일반적인 문제

	1. this need is DETACHED 메시지

		추가할 FE를 처음 시작할 때 Master FE의 doris-meta/bdb 데이터가 많으면 추가할 FE의 로그에 `this node is DETACHED`라는 메시지가 표시될 수 있습니다. 이때 bdbje가 데이터를 복사하고 있으며, 추가할 FE의 `bdb/` 디렉터리 크기가 증가하는 것을 확인할 수 있습니다. 이 과정은 일반적으로 몇 분 정도 걸립니다(bdbje의 데이터 양에 따라 달라집니다). 이후 fe.log에 bdbje 관련 오류 스택 정보가 표시될 수 있습니다. 최종 로그에 `QE service start`와 `thrift server start`가 표시되면 일반적으로 시작에 성공한 것입니다. mysql-client로 이 FE에 연결해 볼 수 있습니다. 이 메시지들이 표시되지 않으면 bdbje 복제 로그의 시간 초과 문제일 수 있습니다. 이 경우 FE를 바로 재시작하면 대부분 해결됩니다.

	2. 여러 원인으로 인한 추가 실패

		* OBSERVER를 추가하는 경우, OBSERVER 유형의 FE는 메타데이터 과반수 쓰기에 참여하지 않으므로 이론적으로 언제든 시작하고 중지할 수 있습니다. 따라서 OBSERVER 추가에 실패하면 OBSERVER FE 프로세스를 바로 종료할 수 있습니다. OBSERVER의 메타데이터 디렉터리를 비운 후 프로세스를 다시 추가하세요.

		* FOLLOWER를 추가하는 경우, FOLLOWER는 메타데이터 과반수 쓰기에 참여하므로 이미 bdbje 선출 그룹에 가입했을 수 있습니다. FOLLOWER 노드가 MASTER를 포함하여 두 개뿐이면 FE 하나를 중지할 때 다른 FE도 과반수 쓰기를 수행할 수 없어 종료될 수 있습니다. 이 경우 먼저 `ALTER SYSTEM DROP FOLLOWER` 명령으로 새로 추가한 FOLLOWER 노드를 메타데이터에서 삭제한 다음, FOLLOWER 프로세스를 종료하고 메타데이터를 비운 후 프로세스를 다시 추가해야 합니다.


### FE 삭제 {#delete-fe}

`ALTER SYSTEM DROP FOLLOWER/OBSERVER` 명령으로 해당 유형의 FE를 삭제할 수 있습니다. 다음 사항에 주의하세요.

* OBSERVER 유형의 FE는 바로 DROP하면 되며 위험이 없습니다.

* FOLLOWER 유형의 FE는 삭제를 시작하기 전에 FOLLOWER가 홀수 개(세 개 이상)인지 확인해야 합니다.

	1. MASTER가 아닌 역할의 FE를 삭제하는 경우, MASTER FE에 연결하여 DROP 명령을 실행한 다음 프로세스를 종료하는 것이 좋습니다.
	2. MASTER FE를 삭제하려면 먼저 FOLLOWER FE가 홀수 개(`odd`)이고 정상 작동하는지(`and it works properly`) 확인하세요. 그런 다음 MASTER FE 프로세스를 먼저 종료합니다. 이때 다른 FE가 MASTER로 선출됩니다. 나머지 FE가 정상 작동하는지 확인한 후 새 MASTER FE에 연결하여 DROP 명령으로 이전 MASTER FE를 삭제합니다.

## 고급 작업 {#advanced-operations}

### FE 메타데이터 복구 모드 {#fe-metadata-recovery-mode}

`metadata recovery mode`를 부적절하게 사용하거나 잘못된 작업을 수행하면 운영 환경에서 복구할 수 없는 데이터 손상이 발생할 수 있습니다. 따라서 `metadata recovery mode`의 사용 방법에 관한 문서는 더 이상 제공하지 않습니다. 꼭 필요한 경우 Doris 커뮤니티 개발자에게 도움을 요청하세요.

### FE 유형 변경 {#fe-type-change}

기존 FOLLOWER/OBSERVER 유형의 FE를 OBSERVER/FOLLOWER 유형으로 변경해야 한다면 위에서 설명한 방법으로 FE를 삭제한 후 해당 유형의 FE를 추가하세요.

### FE 마이그레이션 {#fe-migration}

FE 하나를 현재 노드에서 다른 노드로 마이그레이션해야 하는 경우 다음과 같은 시나리오가 있습니다.

1. MASTER가 아닌 노드의 FOLLOWER 또는 OBSERVER 마이그레이션

	새 FOLLOWER / OBSERVER를 바로 추가한 다음 이전 FOLLOWER / OBSERVER를 삭제합니다.

2. 단일 노드 MASTER 마이그레이션

    개발자라면 `metadata recovery mode`를 사용하여 작업할 수 있습니다. 하지만 사용자에게는 `metadata recovery mode` 사용을 권장하지 않습니다. 환경을 새로 구축하고 외부 테이블을 사용하여 데이터를 이전하는 것이 좋습니다.

3. FOLLOWER 그룹을 기존 노드 그룹에서 새 노드 그룹으로 마이그레이션

	새 노드에 FE를 배포하고 FOLLOWER를 추가하는 방식으로 새 노드를 먼저 추가합니다. 이전 노드는 DROP으로 하나씩 제거할 수 있습니다. 노드를 하나씩 DROP하는 과정에서 MASTER는 새 FOLLOWER 노드에서 자동으로 선출됩니다.

### FE 포트 변경 {#replacement-of-fe-port}

FE는 현재 다음 포트를 사용합니다.

* Ed_log_port: bdbje의 통신 포트
* http_port: http 포트이며 이미지 푸시에도 사용됨
* rpc_port:  Frontend의 thrift server 포트
* query_port: Mysql 연결 포트
* arrow_flight_sql_port: Arrow Flight SQL 연결 포트

1. edit_log_port

	이 포트를 변경해야 할 때 여러 FE 노드가 배포되어 있다면 노드 관리 절차에 따라 이전 노드를 삭제하고 새 노드를 추가할 수 있습니다. 단일 노드라면 위의 "단일 노드 MASTER 마이그레이션"을 참고하여 단일 Master FE 노드를 마이그레이션할 수 있습니다.

2. http_port

	모든 FE의 http_port는 동일해야 합니다. 따라서 이 포트를 변경하려면 모든 FE를 중지한 다음 포트를 변경하고 동시에 재시작해야 합니다. 

3. rpc_port

	설정을 변경한 후 FE를 바로 재시작합니다. Master FE는 하트비트로 BE에 새 포트를 알립니다. Master FE의 이 포트만 사용되지만, 모든 FE의 포트를 동일하게 유지하는 것이 좋습니다.

4. query_port

	설정을 변경한 후 FE를 바로 재시작합니다. 이 변경은 mysql의 연결 대상에만 영향을 줍니다.

5. arrow_flight_sql_port

	설정을 변경한 후 FE를 바로 재시작합니다. 이 변경은 arrow flight sql server의 연결 대상에만 영향을 줍니다.

### BDBJE 데이터 조회(디버깅 용도) {#view-data-in-bdbje-only-used-by-debug}

FE의 메타데이터 로그는 BDBJE에 Key-Value 형식으로 저장됩니다. 일부 비정상적인 상황에서는 메타데이터 오류로 인해 FE를 시작하지 못할 수 있습니다. Doris는 이러한 문제를 해결할 수 있도록 BDBJE에 저장된 데이터를 조회하는 방법을 제공합니다.

먼저 fe.conf에 `enable_bdbje_debug_mode=true` 설정을 추가한 다음 `bash start_fe.sh --daemon`으로 FE를 시작합니다.

그러면 FE는 디버그 모드로 진입하여 http 서버와 MySQL 서버만 시작하고 BDBJE 인스턴스를 엽니다. 메타데이터를 로드하거나 이후의 시작 절차를 수행하지는 않습니다.

이 상태에서는 FE 웹 페이지에 접속하거나, MySQL 클라이언트로 Doris에 연결한 후 `show proc "/bdbje";`를 실행하여 BDBJE에 저장된 데이터를 조회할 수 있습니다.

```
mysql> show proc "/bdbje";
+----------+---------------+---------+
| DbNames  | JournalNumber | Comment |
+----------+---------------+---------+
| 110589   | 4273          |         |
| epochDB  | 4             |         |
| metricDB | 430694        |         |
+----------+---------------+---------+
```

첫 번째 디렉터리 수준에서는 BDBJE의 모든 데이터베이스 이름과 각 데이터베이스의 항목 수가 표시됩니다.

```
mysql> show proc "/bdbje/110589";
+-----------+
| JournalId |
+-----------+
| 1         |
| 2         |

...
| 114858    |
| 114859    |
| 114860    |
| 114861    |
+-----------+
4273 rows in set (0.06 sec)
```

두 번째 수준으로 들어가면 지정한 데이터베이스의 모든 항목 키가 나열됩니다.

```
mysql> show proc "/bdbje/110589/114861";
+-----------+--------------+---------------------------------------------+
| JournalId | OpType       | Data                                        |
+-----------+--------------+---------------------------------------------+
| 114861    | OP_HEARTBEAT | org.apache.doris.persist.HbPackage@6583d5fb |
+-----------+--------------+---------------------------------------------+
1 row in set (0.05 sec)
```

세 번째 수준에서는 지정한 키의 값 정보를 확인할 수 있습니다.

## 권장 사항 {#best-practices}

FE의 권장 배포 구성은 설치 및 [배포 문서](../../install/deploy-manually/integrated-storage-compute-deploy-manually.md)에 설명되어 있습니다. 아래에서는 몇 가지 사항을 보충합니다.

* 운영 환경에서는 메타데이터 쓰기의 고가용성을 유지하도록 **홀수 개의 FOLLOWER FE**를 배포하세요(일반적으로 3개: MASTER 1개 + FOLLOWER 2개). FOLLOWER는 리더 선출과 과반수 쓰기에 참여하며, Master에 장애가 발생하면 나머지 FOLLOWER가 새 Master를 선출합니다. OBSERVER는 선출에 참여하지 않고 메타데이터만 동기화하며, FE의 읽기 처리 용량을 확장하는 데 사용됩니다. 테스트 또는 개발 환경에서는 FOLLOWER 하나로도 충분합니다.

* 과반수 쓰기란 저널이 과반수의 FOLLOWER에 기록되어야만 커밋된다는 뜻입니다. FOLLOWER가 3개이면 하나의 장애를 허용할 수 있지만, FOLLOWER가 하나만 남으면 메타데이터 쓰기를 계속할 수 없습니다. 이는 예상된 동작이며 3개 FOLLOWER 배포를 피해야 할 이유가 아닙니다. FOLLOWER 간 시계를 동기화하고, FE JVM에 충분한 메모리를 할당하며, 과반수의 FOLLOWER를 동시에 중지하지 마세요.

* FE 프로세스의 JVM에는 충분한 메모리가 확보되어야 합니다. FE의 JVM 메모리는 최소 10GB를 확보하고, 32GB에서 64GB로 설정할 것을 **강력히 권장**합니다. 또한 모니터링을 배포하여 JVM 메모리 사용량을 확인하세요. FE에서 OOM이 발생하면 메타데이터 쓰기에 실패하여 **복구할 수 없는** 장애로 이어질 수 있습니다!

* FE 노드에는 메타데이터가 과도하게 늘어나 디스크 공간이 부족해지지 않도록 충분한 디스크 공간이 있어야 합니다. FE 로그도 십여 기가바이트 이상의 디스크 공간을 차지합니다.

## 기타 일반적인 문제 {#other-common-problems}

1. fe.log에 `meta out of date. current time: xxx, synchronized time: xxx, has log: xxx, fe type: xxx`가 출력됨 

	이 문제는 일반적으로 FE가 Master를 선출할 수 없어서 발생합니다. 예를 들어 FOLLOWER가 세 개 구성되어 있지만 하나만 시작된 경우 해당 FOLLOWER에서 이 문제가 발생합니다. 보통 모든 FOLLOWER를 동시에 재시작하면 됩니다. 시작 후에도 문제가 해결되지 않으면 알려지지 않은 문제가 있는지 확인해야 합니다.

2. `Clock delta: xxxx ms. between Feeder: xxxx and this Replica exceeds max permissible delta: xxxx ms.`

	Bdbje에서는 노드 간 시계 오차가 정해진 임계값을 초과해서는 안 됩니다. 이를 초과하면 노드가 비정상 종료됩니다. 기본 임계값은 5000ms이며, FE 매개변수 `max_bdbje_clock_delta_ms'로 제어하고 필요에 따라 변경할 수 있습니다. 다만 Doris 클러스터 호스트의 시계를 동기화하려면 NTP 등의 시계 동기화 방법을 사용하는 것이 좋습니다.


3. `image/` 디렉터리의 이미지 파일이 오랫동안 업데이트되지 않음

	Master FE는 기본적으로 메타데이터 저널 50,000개마다 이미지 파일을 생성합니다. 사용량이 많은 클러스터에서는 일반적으로 반나절에서 며칠마다 새 이미지 파일이 생성됩니다. 이미지 파일이 오랫동안 업데이트되지 않았다면(예: 일주일 이상) 다음 순서로 원인을 확인할 수 있습니다.

	1. Master FE의 fe.log에서 `memory is not enough to do checkpoint. Committed memory XXXX Bytes, used memory XXXX Bytes. `를 검색합니다. 이 메시지가 있으면 현재 FE의 JVM 메모리가 이미지 생성에 부족하다는 뜻입니다(일반적으로 이미지 생성을 위해 FE 메모리의 절반을 확보해야 합니다). 이 경우 JVM 메모리를 늘리고 FE를 재시작한 후 상태를 확인해야 합니다. Master FE는 재시작할 때마다 새 이미지를 바로 생성합니다. 이 재시작 방법을 사용하여 새 이미지를 수동으로 생성할 수도 있습니다. FOLLOWER가 여러 개 배포되어 있다면 현재 Master FE를 재시작할 때 다른 FOLLOWER FE가 MASTER가 되고, 이후 이미지 생성은 새 Master가 담당한다는 점에 주의하세요. 따라서 모든 FOLLOWER FE의 JVM 메모리 설정을 변경해야 할 수도 있습니다.

	2. Master FE의 fe.log에서 `begin to generate new image: image.xxxx`를 검색합니다. 이 메시지가 있으면 이미지 생성이 시작된 것입니다. 해당 스레드의 후속 로그를 확인하여 `checkpoint finished save image.xxxx`가 표시되면 이미지가 성공적으로 기록된 것입니다. `Exception when generating new image file`이 발생하면 생성에 실패한 것이므로 구체적인 오류 메시지를 확인해야 합니다.


4. `bdb/` 디렉터리의 크기가 매우 커져 수 G 이상에 도달함

	새 이미지를 생성할 수 없는 오류를 해결한 후에도 BDB 디렉터리는 한동안 큰 상태로 유지될 수 있습니다. Master FE가 이미지 푸시에 실패했기 때문일 수 있습니다. Master FE의 fe.log에서 `push image.XXXX to other nodes. totally XX nodes, push succeeded YY nodes`를 검색할 수 있습니다. YY가 xx보다 작으면 일부 FE에 이미지를 성공적으로 푸시하지 못한 것입니다. fe.log의 `Exception when pushing image file.url = xxx`에서 구체적인 오류를 확인할 수 있습니다.

	또한 FE 설정 파일에 `edit_log_roll_num = xxxx` 설정을 추가할 수 있습니다. 이 매개변수는 이미지를 한 번 생성할 때마다 누적되는 메타데이터 저널 수를 설정합니다. 기본값은 50000입니다. 이 값을 적절히 줄이면 이미지를 더 자주 생성하여 이전 저널을 더 빠르게 삭제할 수 있습니다.

5. FOLLOWER FE가 연이어 종료됨

	Doris의 메타데이터는 과반수 쓰기 전략을 사용합니다. 즉, 메타데이터 저널을 과반수의 FOLLOWER FE에 기록해야 성공으로 간주합니다(예를 들어 FOLLOWER가 세 개라면 두 개에 성공적으로 기록해야 합니다). 쓰기에 실패하면 FE 프로세스는 스스로 종료됩니다. 예를 들어 FOLLOWER가 A, B, C 세 개 있다고 가정하겠습니다. C가 먼저 중단되고 이어서 B가 중단되면 A도 중단됩니다. 이는 과반수 쓰기의 예상된 동작입니다. 운영 환경에서는 여전히 FOLLOWER를 3개 배포해야 하며, 과반수의 FOLLOWER를 동시에 중지해서는 안 됩니다. FOLLOWER가 하나만 살아 있다면 남은 하나만 시작하지 말고, 먼저 다른 FOLLOWER를 복구한 후 함께 시작하세요. 그렇지 않으면 항목 1에서 설명한 `meta out of date` 메시지가 표시될 수 있습니다.

6. fe.log에 `get exception when try to close previously opened bdb database. ignore it`가 표시됨

	뒤에 `ignore it`라는 문구가 있으면 일반적으로 별도 조치가 필요하지 않습니다. 자세히 알고 싶다면 `BDBEnvironment.java`에서 이 오류를 검색하고 주석을 확인하세요.

7. `show frontends;`에서 FE의 `Join`이 `true`로 표시되지만 실제로는 해당 FE가 비정상 상태임

	`show frontends;`로 `Join` 정보를 확인할 수 있습니다. 이 열이 `true`이면 해당 FE가 **클러스터에 가입한 적이 있다**는 뜻일 뿐입니다. 현재도 클러스터에서 정상적으로 작동하고 있다는 뜻은 아닙니다. `false`이면 해당 FE가 **클러스터에 가입한 적이 없다**는 뜻입니다.

8. FE의 `master_sync_policy`, `replica_sync_policy`, `txn_rollback_limit.` 설정

	`master_sync_policy`는 fsync () 호출 여부를 지정하는 데 사용되고, `replica_sync_policy`는 Leader FE가 메타데이터 로그를 쓸 때 호출되며, `replica_sync_policy`는 FE HA 배포에서 메타데이터를 동기화할 때 다른 Follower FE가 fsync ()를 호출할지 지정하는 데 사용됩니다. 이전 버전의 Doris에서는 이 두 매개변수의 기본값이 `WRITE_NO_SYNC`였으므로 fsync ()를 호출하지 않았습니다. 최신 버전의 Doris에서는 기본값이 `SYNC`로 변경되어 fsync ()를 호출합니다. fsync ()를 호출하면 메타데이터의 디스크 쓰기 효율이 크게 떨어집니다. 일부 환경에서는 IOPS가 수백까지 떨어지고 지연 시간이 2-3ms로 증가할 수 있습니다(그래도 Doris 메타데이터 작업에는 충분합니다). 따라서 다음 설정을 권장합니다.

	1. 단일 Follower FE 배포에서는 `master_sync_policy`를 `SYNC`로 설정하여 FE 시스템 중단으로 인한 메타데이터 손실을 방지합니다.
	2. 여러 Follower FE를 배포한 경우에는 여러 시스템이 동시에 중단될 가능성이 매우 낮다고 판단하므로 `master_sync_policy`와 `replica_sync_policy`를 `WRITE_NO_SYNC`로 설정할 수 있습니다.

	단일 Follower FE 배포에서 `master_sync_policy`를 `WRITE_NO_SYNC`로 설정하면 FE 시스템 중단 시 메타데이터가 손실될 수 있습니다. 이때 다른 Observer FE를 재시작하려고 하면 다음 오류가 발생할 수 있습니다.

    ```
    Node xxx must rollback xx total commits(numPassedDurableCommits of which were durable) to the earliest point indicated by transaction xxxx in order to rejoin the replication group, but the transaction rollback limit of xxx prohibits this.
    ```

이는 이미 영속화된 일부 트랜잭션을 롤백해야 하지만 항목 수가 상한을 초과했다는 뜻입니다. 기본 상한은 100이며, `txn_rollback_limit`를 설정하여 변경할 수 있습니다. 이 작업은 FE를 정상적으로 시작하기 위한 시도일 뿐이며, 손실된 메타데이터는 복구할 수 없습니다.
