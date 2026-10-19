---
{
    "title": "SQL 오류",
    "language": "ko",
    "description": "해당 tablet에서 쿼리할 수 있는 복제본을 찾지 못할 때 발생합니다. 일반적으로 BE가 중단되었거나 복제본이 누락된 경우 등이 원인입니다."
}
---

# SQL 오류 {#sql-error}

### Q1. 쿼리 오류: Failed to get scan range, no queryable replica found in tablet: xxxx {#q1-query-error-failed-to-get-scan-range-no-queryable-replica-found-in-tablet-xxxx}

해당 tablet에서 쿼리할 수 있는 복제본을 찾지 못할 때 발생합니다. 일반적으로 BE가 중단되었거나 복제본이 누락된 경우 등이 원인입니다. 먼저 `show tablet tablet_id` 문을 실행한 다음, 이어서 표시되는 `show proc` 문을 실행하면 해당 tablet의 복제본 정보를 확인하고 복제본이 온전한지 점검할 수 있습니다. 또한 `show proc "/cluster_balance"` 정보를 통해 클러스터의 복제본 스케줄링 및 복구 진행 상황을 조회할 수 있습니다.

데이터 복제본 관리와 관련된 명령은 [데이터 복제본 관리](../admin-manual/maint-monitor/tablet-repair-and-balance.md)를 참조하세요.

### Q2. Show backends/frontends로 조회한 정보가 불완전함 {#q2-show-backendsfrontends-the-information-viewed-is-incomplete}

`show backends/frontends`와 같은 일부 문을 실행하면 결과에서 일부 열의 정보가 누락될 수 있습니다. 예를 들어 show backends 결과에서 디스크 용량 정보를 확인할 수 없는 경우가 있습니다.

이 문제는 일반적으로 클러스터에 FE가 여러 개 있을 때 발생합니다. 사용자가 Master가 아닌 FE 노드에 연결하여 이러한 문을 실행하면 불완전한 정보가 표시됩니다. 일부 정보는 Master FE 노드에만 존재하기 때문입니다. BE의 디스크 사용량 정보 등이 여기에 해당합니다. 따라서 완전한 정보를 얻으려면 Master FE에 직접 연결해야 합니다.

이러한 문을 실행하기 전에 `set forward_to_master=true;`를 실행하는 방법도 있습니다. 이 세션 변수를 true로 설정하면 이후에 실행하는 일부 정보 조회 문이 자동으로 Master FE에 전달되어 결과를 가져옵니다. 이렇게 하면 사용자가 어느 FE에 연결되어 있든 완전한 결과를 얻을 수 있습니다.

### Q3. invalid cluster id: xxxx {#q3-invalid-cluster-id-xxxx}

이 오류는 show backends 또는 show frontends 명령의 결과에 나타날 수 있습니다. 일반적으로 FE 또는 BE 노드의 오류 메시지 열에 표시됩니다. 이 오류는 Master FE가 노드에 하트비트 정보를 보낸 후, 노드가 하트비트 정보에 포함된 cluster id와 로컬에 저장된 cluster id가 다르다는 것을 확인하여 하트비트에 대한 응답을 거부했음을 의미합니다.

Doris의 Master FE 노드는 각 FE 또는 BE 노드에 주기적으로 하트비트를 보내며, 하트비트 정보에 cluster_id를 포함합니다. cluster_id는 클러스터를 초기화할 때 Master FE가 생성하는 고유한 클러스터 ID입니다. FE 또는 BE가 하트비트 정보를 처음 수신하면 cluster_id를 로컬 파일에 저장합니다. FE의 파일은 메타데이터 디렉터리의 image/ 디렉터리에 있으며, BE는 모든 데이터 디렉터리에 cluster_id 파일을 저장합니다. 이후 노드는 하트비트를 수신할 때마다 로컬 cluster_id의 내용과 하트비트에 포함된 내용을 비교합니다. 두 내용이 일치하지 않으면 하트비트에 대한 응답을 거부합니다.

이 메커니즘은 클러스터 외부의 노드가 보낸 잘못된 하트비트 메시지를 수신하지 않도록 하는 노드 인증 메커니즘입니다.

이 오류를 해결하려면 먼저 모든 노드가 올바른 클러스터에 속해 있는지 확인해야 합니다. 그런 다음 FE 노드의 경우 메타데이터 디렉터리의 image/VERSION 파일에서 cluster_id 값을 수정하고 FE를 다시 시작해 볼 수 있습니다. BE 노드의 경우 데이터 디렉터리에 있는 모든 cluster_id 파일을 삭제하고 BE를 다시 시작할 수 있습니다.

### Q4. Unique Key 모델의 쿼리 결과가 일관되지 않음 {#q4-unique-key-model-query-results-are-inconsistent}

일부 경우에는 사용자가 동일한 SQL로 Unique Key 모델의 테이블을 여러 번 쿼리하면 결과가 일관되지 않을 수 있습니다. 이때 쿼리 결과는 항상 2~3가지 결과 사이에서 바뀝니다.

이는 동일한 배치로 적재한 데이터에 키는 같지만 값이 다른 데이터가 있기 때문일 수 있습니다. 데이터를 덮어쓰는 순서가 확정되어 있지 않아 복제본마다 결과가 달라질 수 있습니다.

예를 들어 테이블이 k1, v1으로 정의되어 있고, 한 배치로 적재한 데이터가 다음과 같다고 가정합니다.

```text
1, "abc"
1, "def"
```

이 경우 복제본 1의 결과는 `1, "abc"`이고, 복제본 2의 결과는 `1, "def"`일 수 있습니다. 이로 인해 쿼리 결과가 일관되지 않게 됩니다.

서로 다른 복제본에서 데이터 순서를 하나로 확정하려면 [Sequence Column](../data-operate/update/update-of-unique-model.md) 기능을 참조하세요.

### Q5. bitmap/hll 타입 데이터를 쿼리하면 NULL이 반환되는 문제 {#q5-the-problem-of-querying-bitmaphll-type-data-returns-null}

버전 1.1.x에서 벡터화를 활성화한 상태로 데이터 테이블을 쿼리할 때 bitmap 타입 필드의 결과가 NULL로 반환되면 다음과 같이 설정합니다.

1. 먼저 `set return_object_data_as_binary=true;`를 실행합니다.
2. 벡터화를 비활성화합니다. `set enable_vectorized_engine=false;`
3. SQL 캐시를 비활성화합니다. `set [global] enable_sql_cache = false;`

이는 벡터화 실행 엔진에서 bitmap / hll 타입의 입력이 모두 NULL이면 출력 결과도 0이 아닌 NULL이 되기 때문입니다.

### Q6. 오브젝트 스토리지 접근 시 오류: curl 77: Problem with the SSL CA cert {#q6-error-when-accessing-object-storage-curl-77-problem-with-the-ssl-ca-cert}

be.INFO 로그에 `curl 77: Problem with the SSL CA cert` 오류가 나타나면 다음 방법으로 해결해 볼 수 있습니다.

1. [https://curl.se/docs/caextract.html](https://curl.se/docs/caextract.html)에서 인증서를 다운로드합니다: cacert.pem
2. 인증서를 지정된 위치에 복사합니다: `sudo cp /tmp/cacert.pem /etc/ssl/certs/ca-certificates.crt`
3. BE 노드를 다시 시작합니다.

### Q7. 데이터 적재 오류:"Message": "[INTERNAL_ERROR]single replica load is disabled on BE." {#q7-import-errormessage-internal_errorsingle-replica-load-is-disabled-on-be}

1. be.conf의 `enable_single_replica_load` 매개변수가 true로 설정되어 있는지 확인합니다.
2.  BE 노드를 다시 시작합니다.
