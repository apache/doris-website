---
{
    "title": "Tablet 로컬 디버깅",
    "language": "ko",
    "description": "Doris 운영 중에는 여러 원인으로 다양한 버그가 발생할 수 있습니다. 예를 들어 복제본이 일치하지 않는 경우,"
}
---

# Tablet 로컬 디버깅 {#tablet-local-debug}

Doris 운영 중에는 여러 원인으로 다양한 버그가 발생할 수 있습니다. 예를 들어 복제본 간 불일치나 버전 간 데이터 차이 등이 발생할 수 있습니다.

이러한 경우 운영 환경에 있는 tablet의 복제본 데이터를 로컬 환경으로 복사하여 문제를 재현한 다음 원인을 찾아야 합니다.

## 1. tablet 정보 확인 {#1-get-information-about-the-tablet}

BE 로그에서 tablet id를 확인한 다음, 아래 명령으로 정보를 조회할 수 있습니다(tablet id가 10020이라고 가정).

tablet이 속한 DbId/TableId/PartitionId 등의 정보를 조회합니다.

```
mysql> show tablet 10020\G
*************************** 1. row ***************************
       DbName: default_cluster:db1
    TableName: tbl1
PartitionName: tbl1
    IndexName: tbl1
         DbId: 10004
      TableId: 10016
  PartitionId: 10015
      IndexId: 10017
       IsSync: true
        Order: 1
    DetailCmd: SHOW PROC '/dbs/10004/10016/partitions/10015/10017/10020';
```

이전 단계의 `DetailCmd`를 실행하여 BackendId/SchemaHash 등의 정보를 조회합니다.

```
mysql>  SHOW PROC '/dbs/10004/10016/partitions/10015/10017/10020'\G
*************************** 1. row ***************************
        ReplicaId: 10021
        BackendId: 10003
          Version: 3
LstSuccessVersion: 3
 LstFailedVersion: -1
    LstFailedTime: NULL
       SchemaHash: 785778507
    LocalDataSize: 780
   RemoteDataSize: 0
         RowCount: 2
            State: NORMAL
            IsBad: false
     VersionCount: 3
         PathHash: 7390150550643804973
          MetaUrl: http://192.168.10.1:8040/api/meta/header/10020
 CompactionStatus: http://192.168.10.1:8040/api/compaction/show?tablet_id=10020
```

tablet 스냅샷을 생성하고 테이블 생성문을 확인합니다.

```
mysql> admin copy tablet 10020 properties("backend_id" = "10003", "version" = "2")\G
*************************** 1. row ***************************
         TabletId: 10020
        BackendId: 10003
               Ip: 192.168.10.1
             Path: /path/to/be/storage/snapshot/20220830101353.2.3600
ExpirationMinutes: 60
  CreateTableStmt: CREATE TABLE `tbl1` (
  `k1` int(11) NULL,
  `k2` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`, `k2`)
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES (
"replication_num" = "1",
"version_info" = "2"
);
```

`admin copy tablet` 명령은 지정한 tablet에 대해 해당 복제본과 버전의 스냅샷 파일을 생성할 수 있습니다. 스냅샷 파일은 `Path` 디렉터리에 저장되며, 이 디렉터리는 `Ip` 필드가 가리키는 BE 노드에 있습니다.

이 디렉터리 아래에는 tablet id를 이름으로 하는 디렉터리가 있습니다. 나중에 사용할 수 있도록 이 디렉터리 전체를 압축합니다. (이 디렉터리는 최대 60분 동안 유지되며, 이후 자동으로 삭제됩니다.)

```
cd /path/to/be/storage/snapshot/20220830101353.2.3600
tar czf 10020.tar.gz 10020/
```

이 명령은 tablet에 해당하는 테이블 생성문도 함께 생성합니다. 이 테이블 생성문은 원래 테이블 생성문과 다르며, 버킷 수와 복제본 수가 모두 1이고 `versionInfo` 필드가 지정되어 있다는 점에 유의하세요. 이 테이블 생성문은 나중에 tablet 데이터를 로컬 환경에 적재할 때 사용합니다.

이제 필요한 정보를 모두 확보했습니다. 목록은 다음과 같습니다.

1. 10020.tar.gz와 같은 tablet 데이터 압축 파일.
2. 테이블 생성문.

## 2. 로컬 환경에서 Tablet 데이터 적재 {#2-load-tablet-locally}

1. 로컬 디버깅 환경 구축

     로컬에 단일 노드 Doris 클러스터(1FE, 1BE)를 배포합니다. 배포 버전은 운영 클러스터와 동일해야 합니다. 운영 환경의 배포 버전이 DORIS-1.1.1이면 로컬 환경에도 DORIS-1.1.1 버전을 배포합니다.

2. 테이블 생성

     이전 단계에서 얻은 테이블 생성문을 사용하여 로컬 환경에 테이블을 생성합니다.

3. 새로 생성한 테이블의 tablet 정보 확인

     새로 생성한 테이블의 버킷 수와 복제본 수는 모두 1이므로, 복제본 하나를 가진 tablet 하나만 존재합니다:
    
    ```
    mysql> show tablets from tbl1\G
    *************************** 1. row ***************************
                   TabletId: 10017
                  ReplicaId: 10018
                  BackendId: 10003
                 SchemaHash: 44622287
                    Version: 1
          LstSuccessVersion: 1
           LstFailedVersion: -1
              LstFailedTime: NULL
              LocalDataSize: 0
             RemoteDataSize: 0
                   RowCount: 0
                      State: NORMAL
    LstConsistencyCheckTime: NULL
               CheckVersion: -1
               VersionCount: -1
                   PathHash: 7390150550643804973
                    MetaUrl: http://192.168.10.1:8040/api/meta/header/10017
           CompactionStatus: http://192.168.10.1:8040/api/compaction/show?tablet_id=10017
    ```
    
    ```
    mysql> show tablet 10017\G
    *************************** 1. row ***************************
           DbName: default_cluster:db1
        TableName: tbl1
    PartitionName: tbl1
        IndexName: tbl1
             DbId: 10004
          TableId: 10015
      PartitionId: 10014
          IndexId: 10016
           IsSync: true
            Order: 0
        DetailCmd: SHOW PROC '/dbs/10004/10015/partitions/10014/10016/10017';
    ```
    
    여기서 다음 정보를 기록해 둡니다:
    
    * TableId
    * PartitionId
    * TabletId
    * SchemaHash

    또한 디버깅 환경의 BE 노드에 있는 데이터 디렉터리로 이동하여 새 tablet이 위치한 shard id를 확인해야 합니다:
    
    ```
    cd /path/to/storage/data/*/10017 && pwd
    ```
    
    이 명령은 tablet 10017이 있는 디렉터리로 이동하고 경로를 표시합니다. 다음과 비슷한 경로가 표시됩니다:
    
    ```
    /path/to/storage/data/0/10017
    ```
    
    여기서 `0`은 shard id입니다.
        
4. Tablet 데이터 수정

    첫 번째 단계에서 얻은 tablet 데이터 압축 파일을 풉니다. 편집기로 10017.hdr.json 파일을 열고 다음 필드를 이전 단계에서 얻은 정보로 수정합니다:
    
    ```
    "table_id":10015
    "partition_id":10014
    "tablet_id":10017
    "schema_hash":44622287
    "shard_id":0
    ```

5. tablet 데이터 적재

     먼저 디버깅 환경의 BE 프로세스를 중지합니다(./bin/stop_be.sh). 그런 다음 10017.hdr.json 파일과 같은 디렉터리에 있는 모든 .dat 파일을 `/path/to/storage/data/0/10017/44622287` 디렉터리로 복사합니다. 이 디렉터리는 3단계에서 확인한 디버깅 환경의 tablet이 있는 디렉터리입니다. `10017/44622287`은 각각 tablet id와 schema hash입니다.
    
     기존 tablet 메타데이터를 `meta_tool` 도구로 삭제합니다. 이 도구는 `be/lib` 디렉터리에 있습니다.
    
    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=delete_meta --tablet_id=10017 --schema_hash=44622287
    ```
    
    여기서 `/path/to/storage`는 BE의 데이터 루트 디렉터리입니다. 삭제에 성공하면 delete successfully 로그가 표시됩니다.
    
    `meta_tool` 도구로 새 tablet 메타데이터를 적재합니다.
        
    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=load_meta --json_meta_path=/path/to/10017.hdr.json
    ```
    
    적재에 성공하면 load successfully 로그가 표시됩니다.
    
6. 검증

     디버깅 환경의 BE 프로세스를 다시 시작합니다(./bin/start_be.sh). 테이블을 쿼리하여 정상적으로 처리되었는지 확인합니다. 정상적으로 처리되었다면 적재한 tablet의 데이터를 쿼리하거나 운영 환경의 문제를 재현할 수 있습니다.
