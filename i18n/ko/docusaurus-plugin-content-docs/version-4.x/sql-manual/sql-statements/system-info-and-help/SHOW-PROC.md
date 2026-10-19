---
{
    "title": "SHOW PROC",
    "language": "ko",
    "description": "Proc 시스템은 Doris의 고유한 기능입니다. Linux를 사용해 본 분이라면 이 개념을 더 쉽게 이해할 수 있습니다. Linux 시스템에서는,"
}
---

## 설명 {#description}

Proc 시스템은 Doris의 고유한 기능입니다. Linux를 사용해 본 분이라면 이 개념을 더 쉽게 이해할 수 있습니다. Linux 시스템에서 proc은 일반적으로 /proc 디렉터리에 마운트되는 가상 파일 시스템입니다. 사용자는 이 파일 시스템을 통해 시스템 내부 데이터 구조를 확인할 수 있습니다. 예를 들어 /proc/pid를 통해 특정 pid에 해당하는 프로세스의 세부 정보를 확인할 수 있습니다.

Linux의 proc 시스템과 마찬가지로, Doris의 proc 시스템도 디렉터리와 유사한 구조로 구성됩니다. 사용자가 지정한 "디렉터리 경로(proc 경로)"에 따라 다양한 시스템 정보를 확인할 수 있습니다.

proc 시스템은 주로 시스템 관리자가 시스템 내부의 실행 상태를 편리하게 확인할 수 있도록 설계되었습니다. 테이블의 tablet 상태, 클러스터 균형 상태, 각종 작업의 상태 등을 확인할 수 있어 매우 유용한 기능입니다.

Doris에서 proc 시스템을 확인하는 방법은 두 가지입니다.

1. Doris에서 제공하는 WEB UI를 통해 확인합니다. 접속 주소: `http://FE_IP:FE_HTTP_PORT`
2. 명령을 통해 확인합니다.

Doris PROC에서 지원하는 모든 명령은 ` SHOW PROC "/";`를 통해 확인할 수 있습니다.

MySQL 클라이언트로 Doris에 연결한 후 SHOW PROC 문을 실행하면 지정한 proc 디렉터리의 정보를 확인할 수 있습니다. proc 디렉터리는 "/"로 시작하는 절대 경로입니다.

show proc 문의 결과는 이차원 테이블로 표시됩니다. 일반적으로 결과 테이블의 첫 번째 열은 proc의 바로 아래 하위 디렉터리를 나타냅니다.

```none
mysql> show proc "/";
+---------------------------+
| name                      |
+---------------------------+
| auth                      |
| backends                  |
| bdbje                     |
| brokers                   |
| catalogs                  |
| cluster_balance           |
| cluster_health            |
| colocation_group          |
| current_backend_instances |
| current_queries           |
| current_query_stmts       |
| dbs                       |
| diagnose                  |
| frontends                 |
| jobs                      |
| load_error_hub            |
| monitor                   |
| resources                 |
| routine_loads             |
| statistic                 |
| stream_loads              |
| tasks                     |
| transactions              |
| trash                     |
+---------------------------+
23 rows in set (0.00 sec)
```

각 항목에 대한 설명:

1. auth: 사용자 이름과 해당 권한 정보입니다.
2. backends: 클러스터의 BE 노드 목록을 표시합니다. [SHOW BACKENDS](../cluster-management/instance-management/SHOW-BACKENDS)와 같습니다.
3. bdbje: bdbje 데이터베이스 목록을 확인하려면 `fe.conf` 파일에 `enable_bdbje_debug_mode=true`를 추가한 다음, `FE`를 `sh start_fe.sh --daemon`으로 시작하여 `debug` 모드로 진입해야 합니다. `debug` 모드에 진입하면 `http server`와 `MySQLServer`만 시작되고 `BDBJE` 인스턴스가 열리며, 메타데이터 로딩과 이후 시작 절차는 진행되지 않습니다.
4. binlog: binlog 레코드 수, 바이트 단위의 binlog 크기, binlog 시간 범위 등 binlog 관련 정보를 확인합니다.
5. brokers : 클러스터의 broker 노드 정보를 확인합니다. [SHOW BROKER](../cluster-management/instance-management/SHOW-BROKER)와 같습니다.
6. catalogs : 현재 생성된 데이터 Catalog를 확인합니다. [SHOW CATALOGS](../catalog/SHOW-CATALOG.md)와 같습니다.
7. cluster_balance : 클러스터의 균형 상태를 확인합니다. [데이터 복제본 관리](../../../admin-manual/maint-monitor/tablet-repair-and-balance.md)를 참조하세요.
8. cluster_health: <code>SHOW PROC '/cluster_health/tablet_health';</code> 문을 실행하여 전체 클러스터의 복제본 상태를 확인합니다.
9. colocation_group : 이 명령으로 클러스터에 존재하는 Group 정보를 확인할 수 있습니다. 자세한 내용은 [Colocation Join](../../../query-acceleration/colocation-join) 장을 참조하세요.
10. current_backend_instances : 현재 작업을 실행 중인 be 노드 목록을 표시합니다.
11. current_queries : 실행 중인 쿼리 목록과 함께 태스크 진행 상황 및 리소스 지표(scan/cpu/memory/shuffle/spill/cache)를 포함한 런타임 통계를 확인합니다. 4.1.1부터는 `current_query_stmts`와 동일한 확장 통계 뷰를 제공합니다.
12. current_query_stmts: 현재 실행 중인 쿼리를 반환합니다. `current_queries`와 동일한 통계 뷰를 통해 태스크 수준의 진행 상황과 리소스 지표를 제공합니다.
13. dbs: 주로 Doris 클러스터의 각 데이터베이스와 테이블의 메타데이터 정보를 확인하는 데 사용합니다. 이 정보에는 테이블 구조, 파티션, 구체화된 뷰, 데이터 샤드, 복제본 등이 포함됩니다. 이 디렉터리와 하위 디렉터리를 통해 클러스터의 테이블 메타데이터를 명확하게 확인하고, 데이터 편향이나 복제본 장애 등의 문제를 파악할 수 있습니다.
14. diagnose: 복제본 균형 및 마이그레이션, 트랜잭션 예외 등 클러스터의 일반적인 관리 및 제어 문제를 보고하고 진단합니다.
15. frontends: IP 주소, 역할, 상태, master 여부 등 클러스터의 모든 FE 노드 정보를 표시합니다. [SHOW FRONTENDS](../cluster-management/instance-management/SHOW-FRONTENDS)와 같습니다.
16. jobs: 모든 종류의 작업에 대한 통계를 표시합니다. 특정 `dbId`를 지정하면 해당 데이터베이스의 통계 데이터를 반환합니다. `dbId`가 -1이면 모든 데이터베이스의 전체 통계 데이터를 반환합니다.
17. load_error_hub: Doris는 데이터 적재 작업에서 생성된 오류 정보를 오류 허브에 중앙 집중식으로 저장하는 기능을 지원합니다. 이후 <code>SHOW LOAD WARNINGS;</code> 문을 통해 오류 메시지를 직접 확인할 수 있습니다. 여기에는 오류 허브의 구성 정보가 표시됩니다.
18. monitor : FE JVM의 리소스 사용량을 표시합니다.
19. resources : 시스템 리소스를 확인합니다. 일반 계정은 USAGE_PRIV 사용 권한이 있는 리소스만 볼 수 있습니다. root와 admin 계정만 모든 리소스를 볼 수 있습니다. [SHOW RESOURCES](../cluster-management/compute-management/SHOW-RESOURCES)와 같습니다.
20. routine_loads: 작업 이름, 상태 등 모든 Routine Load 작업 정보를 표시합니다.
21. statistics: 주로 Doris 클러스터의 데이터베이스, 테이블, 파티션, 샤드, 복제본 수와 비정상 복제본 수를 집계하고 확인하는 데 사용합니다. 이 정보를 통해 클러스터 메타데이터의 전체 규모를 파악할 수 있습니다. 또한 클러스터의 샤드 구성을 전반적으로 살펴보고 샤드의 상태를 빠르게 점검하여, 문제가 있는 데이터 샤드를 찾아낼 수 있습니다.
22. stream_loads: 실행 중인 Stream Load 태스크를 반환합니다.
23. tasks : 각종 작업의 전체 태스크 수와 실패 수를 표시합니다.
24. transactions : 지정한 트랜잭션 id의 세부 정보를 확인하는 데 사용합니다. [SHOW TRANSACTION](../transaction/SHOW-TRANSACTION)과 같습니다.
25. trash: 이 문은 backend에서 가비지 데이터가 차지하는 공간을 확인하는 데 사용합니다. [SHOW TRASH](../table-and-view/data-and-status-management/SHOW-TRASH)와 같습니다.


##   상세 설명 {#detailed-description}
1. /binlog

Binlog는 Doris의 데이터 변경 사항을 기록합니다. 관리자는 이 명령을 통해 Binlog 상태를 모니터링하고, 정상 작동 여부를 확인하며, 스토리지 공간을 적절하게 계획할 수 있습니다.

| 필드 이름 | 데이터 타입 | 설명 |
|------------|-----------|-------------|
| Name | String | 데이터베이스 또는 테이블 이름입니다. |
| Type | String | 데이터 객체의 유형으로, 값은 "db"(데이터베이스) 또는 "table"(테이블)입니다. |
| Id | Number | 데이터베이스 ID 또는 테이블 ID입니다. |
| Dropped | Boolean | 데이터베이스 또는 테이블의 삭제 여부입니다. 값이 "true"이면 객체가 Doris에서 제거되었지만 Binlog 기록은 여전히 보관되어 있음을 나타냅니다. 값이 "false"이면 객체가 시스템에 여전히 존재함을 나타냅니다. 데이터베이스나 테이블이 삭제되더라도 시스템은 TTL이 만료되거나 수동으로 정리될 때까지 일정 기간 Binlog 기록을 보관합니다. |
| BinlogLength | Number | 해당 데이터베이스 또는 테이블의 바이너리 로그 항목 총수입니다. |
| BinlogSize | Number | 바이너리 로그의 전체 크기(바이트)입니다. |
| FirstBinlogCommittedTime | Number | 첫 번째 바이너리 로그 커밋의 타임스탬프(Unix 타임스탬프, 밀리초)입니다. |
| ReadableFirstBinlogCommittedTime | String | 첫 번째 바이너리 로그의 커밋 시간(읽기 쉬운 형식)입니다. |
| LastBinlogCommittedTime | Number | 마지막 바이너리 로그 커밋의 타임스탬프(Unix 타임스탬프, 밀리초)입니다. |
| ReadableLastBinlogCommittedTime | String | 마지막 바이너리 로그의 커밋 시간(읽기 쉬운 형식)입니다. |
| BinlogTtlSeconds | Number | 바이너리 로그의 유지 시간(초)입니다. 이 시간을 초과한 로그는 정리될 수 있습니다. |
| BinlogMaxBytes | Number | 바이너리 로그의 최대 크기(바이트)입니다. 이 크기를 초과하면 정리가 트리거될 수 있습니다. |
| BinlogMaxHistoryNums | Number | 보관할 바이너리 로그 이력 레코드의 최대 개수입니다. 이 개수를 초과하면 정리가 트리거될 수 있습니다. |

참고:
- 바이너리 로깅이 활성화된 데이터베이스와 테이블만 이 명령의 출력에 표시됩니다.
- 데이터베이스 수준에서 바이너리 로깅이 활성화되어 있으면 해당 데이터베이스의 바이너리 로그 정보가 표시됩니다. 그렇지 않으면 해당 데이터베이스에서 바이너리 로깅이 활성화된 개별 테이블의 정보가 표시됩니다.

## 예시 {#example}

1. 예를 들어 "/dbs"는 모든 데이터베이스를 표시하고, "/dbs/10002"는 id가 10002인 데이터베이스의 모든 테이블을 표시합니다.

   ```sql
   mysql> show proc "/dbs/10002";
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | TableId | TableName            | IndexNum | PartitionColumnName | PartitionNum | State  | Type | LastConsistencyCheckTime | ReplicaCount |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | 10065   | dwd_product_live     | 1        | dt                  | 9            | NORMAL | OLAP | NULL                     | 18           |
   | 10109   | ODS_MR_BILL_COSTS_DO | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10119   | test                 | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10124   | test_parquet_import  | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   4 rows in set (0.00 sec)
   ```

2. 클러스터의 모든 데이터베이스에 대한 테이블 수 정보를 표시합니다.

   ```sql
   mysql> show proc '/statistic';
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   | DbId  | DbName               | TableNum | PartitionNum | IndexNum | TabletNum | ReplicaNum |
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   | 10002 | default_cluster:test | 4        | 12           | 12       | 21        | 21         |
   | Total | 1                    | 4        | 12           | 12       | 21        | 21         |
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   2 rows in set (0.00 sec)
   ```

3. 다음 명령으로 클러스터에 존재하는 Group 정보를 확인할 수 있습니다.

   ```
   SHOW PROC '/colocation_group';
   
   +-------------+--------------+--------------+------------+-------------------+----------+----------+----------+
   | GroupId     | GroupName    | TableIds     | BucketsNum | ReplicaAllocation | DistCols | IsStable | ErrorMsg |
   +-------------+--------------+--------------+------------+-------------------+----------+----------+----------+
   | 10005.10008 | 10005_group1 | 10007, 10040 | 10         | tag.location.default: 3 | int(11)  | true     |          |
   +-------------+--------------+--------------+------------+-------------------+----------+----------+----------+
   ```

   - GroupId: 클러스터 전체에서 고유한 그룹 식별자입니다. 앞부분은 데이터베이스 id이고 뒷부분은 그룹 id입니다.
   - GroupName: Group의 전체 이름입니다.
   - TableIds: 이 Group에 포함된 테이블의 id 목록입니다.
   - BucketsNum: 버킷 수입니다.
   - ReplicaAllocation: 복제본 할당 정책입니다.
   - DistCols: 분산 열, 즉 버킷 열의 타입입니다.
   - IsStable: Group의 안정 상태 여부입니다. 안정 상태의 정의는 `Colocation replica balance and repair` 섹션을 참조하세요.
   - ErrorMsg: Group의 현재 오류 메시지입니다. 정상 상태이면 비어 있습니다.

   :::caution 동작 변경 (4.0.8)

   4.0.8 버전부터 컴퓨팅과 스토리지가 분리된 모드에서는 `ReplicaAllocation` 열에 `null`이 표시됩니다. 분리형 아키텍처에서는 스토리지 계층이 복제본을 관리하므로 통합 모드의 복제본 할당 의미가 적용되지 않으며, 이전에 표시되던 값은 오해를 불러일으킬 수 있었습니다.

   :::

4. 다음 명령으로 Group의 데이터 분포를 더 자세히 확인할 수 있습니다.

   ```sql
   SHOW PROC '/colocation_group/10005.10008';
   
   +-------------+---------------------+
   | BucketIndex | BackendIds          |
   +-------------+---------------------+
   | 0           | 10004, 10002, 10001 |
   | 1           | 10003, 10002, 10004 |
   | 2           | 10002, 10004, 10001 |
   | 3           | 10003, 10002, 10004 |
   | 4           | 10002, 10004, 10003 |
   | 5           | 10003, 10002, 10001 |
   | 6           | 10003, 10004, 10001 |
   | 7           | 10003, 10004, 10002 |
   +-------------+---------------------+
   ```

   - BucketIndex: 버킷 시퀀스의 인덱스입니다.
   - BackendIds: 버킷 내 데이터 샤드가 위치한 BE 노드의 ID 목록입니다.

   `BucketIndex` 이외의 열 이름은 배포 모드에 따라 달라집니다. 스토리지와 컴퓨팅이 통합된 모드에서는 리소스 태그마다 하나의 열이 표시되고, 컴퓨팅과 스토리지가 분리된 모드에서는 컴퓨팅 그룹마다 하나의 열이 표시됩니다. 이러한 구분이 없으면 단일 `BackendIds` 열이 사용됩니다.

5. 각종 작업의 전체 태스크 수와 실패 수를 표시합니다.

   ```sql
   mysql> show proc '/tasks';
   +-------------------------+-----------+----------+
   | TaskType                | FailedNum | TotalNum |
   +-------------------------+-----------+----------+
   | CREATE                  | 0         | 0        |
   | DROP                    | 0         | 0        |
   | PUSH                    | 0         | 0        |
   | CLONE                   | 0         | 0        |
   | STORAGE_MEDIUM_MIGRATE  | 0         | 0        |
   | ROLLUP                  | 0         | 0        |
   | SCHEMA_CHANGE           | 0         | 0        |
   | CANCEL_DELETE           | 0         | 0        |
   | MAKE_SNAPSHOT           | 0         | 0        |
   | RELEASE_SNAPSHOT        | 0         | 0        |
   | CHECK_CONSISTENCY       | 0         | 0        |
   | UPLOAD                  | 0         | 0        |
   | DOWNLOAD                | 0         | 0        |
   | CLEAR_REMOTE_FILE       | 0         | 0        |
   | MOVE                    | 0         | 0        |
   | REALTIME_PUSH           | 0         | 0        |
   | PUBLISH_VERSION         | 0         | 0        |
   | CLEAR_ALTER_TASK        | 0         | 0        |
   | CLEAR_TRANSACTION_TASK  | 0         | 0        |
   | RECOVER_TABLET          | 0         | 0        |
   | STREAM_LOAD             | 0         | 0        |
   | UPDATE_TABLET_META_INFO | 0         | 0        |
   | ALTER                   | 0         | 0        |
   | INSTALL_PLUGIN          | 0         | 0        |
   | UNINSTALL_PLUGIN        | 0         | 0        |
   | Total                   | 0         | 0        |
   +-------------------------+-----------+----------+
   26 rows in set (0.01 sec)
   ```

5. 전체 클러스터의 복제본 상태를 표시합니다.
   ```sql
   mysql> show proc '/cluster_health/tablet_health';
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   | DbId     | DbName                    | TabletNum | HealthyNum | ReplicaMissingNum | VersionIncompleteNum | ReplicaRelocatingNum | RedundantNum | ReplicaMissingInClusterNum | ReplicaMissingForTagNum | ForceRedundantNum | ColocateMismatchNum | ColocateRedundantNum | NeedFurtherRepairNum | UnrecoverableNum | ReplicaCompactionTooSlowNum | InconsistentNum | OversizeNum | CloningNum |
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   | 25852112 | default_cluster:bowen     | 1920      | 1920       | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
   | 25342914 | default_cluster:bw        | 128       | 128        | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
   | 2575532  | default_cluster:cps       | 1440      | 1440       | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 16          | 0          |
   | 26150325 | default_cluster:db        | 38374     | 38374      | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 453         | 0          |
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   4 rows in set (0.01 sec)
   ```

   특정 데이터베이스의 복제본 상태를 확인합니다. 예를 들어 DbId가 25852112인 데이터베이스는 다음과 같이 확인합니다.

   ```sql
   mysql> show proc '/cluster_health/tablet_health/25852112';
   ```

   :::caution 동작 변경 (4.0.8)

   4.0.8 버전부터 컴퓨팅과 스토리지가 분리된 모드에서는 모든 tablet이 `HEALTHY`로 집계되며, `UnrecoverableNum` 등의 카운터에 더 이상 영이 아닌 값이 표시되지 않습니다.

   분리 모드에서는 스토리지 계층이 복제본 상태를 관리합니다. 이전 상태 검사는 통합 모드의 로직을 따라 정상 tablet을 `UNRECOVERABLE`로 잘못 분류했으며, 이로 인해 `SHOW PROC '/diagnose'`가 실제로 존재하지 않는 `Tablet Health` 문제를 보고했습니다. 스토리지와 컴퓨팅이 통합된 모드의 통계는 변경되지 않습니다.

   :::

7. 클러스터 관리 문제 보고 및 진단

	```
	MySQL > show proc "/diagnose";
	+-----------------+----------+------------+
	| Item            | ErrorNum | WarningNum |
	+-----------------+----------+------------+
	| cluster_balance | 2        | 0          |
	| Total           | 2        | 0          |
	+-----------------+----------+------------+

	2 rows in set
	```


	복제본 균형 및 마이그레이션 문제 확인

	```sql
	MySQL > show proc "/diagnose/cluster_balance";
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+
	| Item                  | Status | Content                                                                                                     | Detail Cmd                                                          | Suggestion |
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+
	| Tablet Health         | ERROR  | healthy tablet num 691 < total tablet num 1014                                                              | show 	proc "/cluster_health/tablet_health";                          | <null>     |
	| BeLoad Balance        | ERROR  | backend load not balance for tag {"location" : "default"}, low load backends [], high load backends 	[10009] | show proc "/cluster_balance/cluster_load_stat/location_default/HDD" | <null>     |
	| Disk Balance          | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	| Colocate Group Stable | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	| History Tablet Sched  | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+

	5 rows in set
	```

## 키워드 {#keywords}

    SHOW, PROC

## 모범 사례 {#best-practice}
