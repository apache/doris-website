---
{
    "title": "데이터 작업 오류",
    "language": "ko",
    "description": "이 문서는 Doris 사용 중 데이터 작업에서 흔히 발생하는 문제를 정리하기 위한 문서이며, 수시로 업데이트됩니다."
}
---

# 데이터 작업 오류 {#data-operation-error}

이 문서는 Doris 사용 중 데이터 작업에서 흔히 발생하는 문제를 정리하기 위한 문서이며, 수시로 업데이트됩니다.

### Q1. Stream Load로 FE의 공인 네트워크 주소에 접근하여 데이터를 적재하는데 내부 IP로 리디렉션되는 이유는 무엇인가요? {#q1-use-stream-load-to-access-fes-public-network-address-to-import-data-but-is-redirected-to-the-intranet-ip}

Stream Load의 연결 대상이 FE의 http 포트이면 FE는 BE 노드 하나를 무작위로 선택하여 http 307 리디렉션만 수행합니다. 따라서 사용자의 요청은 실제로 FE가 지정한 BE로 전송됩니다. 리디렉션 응답에는 BE의 IP, 즉 내부 IP가 반환됩니다. 따라서 FE의 공인 IP로 요청을 보내면 내부 네트워크 주소로 리디렉션되어 연결하지 못할 가능성이 높습니다.

일반적인 해결 방법은 내부 IP 주소에 접근할 수 있도록 하거나, 모든 BE 노드 앞에 로드 밸런서를 배치하는 것입니다. 후자의 경우 Stream Load 요청을 로드 밸런서로 직접 보내면 로드 밸런서가 요청을 BE 노드로 투명하게 전달합니다.

### Q2. Doris는 컬럼 이름 변경을 지원하나요? {#q2-does-doris-support-changing-column-names}

1.2.0 버전 이후에는 `"light_schema_change"="true"` 옵션을 활성화하면 컬럼 이름을 변경할 수 있습니다.

1.2.0 버전 이전이거나 `"light_schema_change"="true"` 옵션을 활성화하지 않은 경우에는 컬럼 이름 변경을 지원하지 않습니다. 그 이유는 다음과 같습니다.

Doris는 데이터베이스 이름, 테이블 이름, 파티션 이름, 구체화된 뷰(Rollup) 이름뿐 아니라 컬럼의 타입, 주석, 기본값 등의 변경을 지원합니다. 하지만 현재 컬럼 이름 변경은 지원하지 않습니다.

과거의 설계상 이유로 현재 컬럼 이름은 데이터 파일에 직접 기록됩니다. Doris가 쿼리를 실행할 때도 클래스 이름으로 해당 컬럼을 찾습니다. 따라서 컬럼 이름 변경은 단순한 메타데이터 수정에 그치지 않고 데이터를 다시 쓰는 작업까지 수반하므로 비용이 매우 큰 작업입니다.

향후 호환성을 유지하는 방식으로 경량 컬럼 이름 변경 작업을 지원할 가능성도 있습니다.

### Q3. Unique Key 모델의 테이블은 구체화된 뷰 생성을 지원하나요? {#q3-does-the-table-of-the-unique-key-model-support-creating-a-materialized-view}

지원하지 않습니다.

Unique Key 모델의 테이블은 업무용으로 사용하기 편리한 테이블입니다. 기본 키를 기준으로 중복을 제거하는 고유한 기능 덕분에 데이터가 자주 변경되는 업무 데이터베이스를 손쉽게 동기화할 수 있습니다. 따라서 많은 사용자가 Doris에 데이터를 적재할 때 Unique Key 모델 사용을 먼저 고려합니다.

하지만 Unique Key 모델의 테이블에는 구체화된 뷰를 생성할 수 없습니다. 구체화된 뷰는 본질적으로 데이터를 미리 계산해 두고 쿼리 시 계산된 데이터를 바로 반환하여 쿼리 속도를 높이는 방식이기 때문입니다. 구체화된 뷰에서 미리 계산한 데이터는 보통 sum, count와 같은 집계 지표입니다. 이때 데이터가 업데이트되거나 삭제되는 등 변경이 발생하면, 미리 계산한 데이터에는 상세 정보가 남아 있지 않아 함께 갱신할 수 없습니다. 예를 들어 합계 값이 5이면 1+4로 계산되었을 수도 있고 2+3으로 계산되었을 수도 있습니다. 상세 정보가 사라졌기 때문에 이 합계 값이 어떻게 계산되었는지 구분할 수 없으므로 업데이트 요구 사항을 충족할 수 없습니다.

### Q4. tablet writer write failed, tablet_id=27306172, txn_id=28573520, err=-235 또는 -238 {#q4-tablet-writer-write-failed-tablet_id27306172-txn_id28573520-err-235-or--238}

이 오류는 보통 데이터 적재 작업 중 발생합니다. 오류 코드는 -235입니다. 이 오류는 해당 tablet의 데이터 버전 수가 최대 한도(기본값 500, BE 매개변수 `max_tablet_version_num`으로 제어)를 초과하여 이후 쓰기 요청이 거부된다는 의미입니다. 예를 들어 질문에 나온 오류는 tablet 27306172의 데이터 버전 수가 한도를 초과했음을 의미합니다.

이 오류는 보통 데이터 적재 빈도가 너무 높아 백엔드 데이터의 compaction 속도를 초과하면서 버전이 쌓이고, 결국 한도를 넘어서 발생합니다. 이때는 먼저 show tablet 27306172 문을 실행한 다음, 결과에 있는 show proc 문을 실행하여 tablet의 각 복제본 상태를 확인할 수 있습니다. 결과의 versionCount는 버전 수를 나타냅니다. 특정 복제본의 버전 수가 너무 많다면 데이터 적재 빈도를 줄이거나 적재를 중단하고 버전 수가 줄어드는지 관찰해야 합니다. 적재를 중단한 뒤에도 버전 수가 줄지 않으면 해당 BE 노드에서 be.INFO 로그를 확인하고, tablet id와 compaction 키워드를 검색하여 compaction이 정상적으로 실행되는지 살펴봐야 합니다. compaction 튜닝은 ApacheDoris 공식 계정의 글을 참조하세요. [Doris 모범 사례 - Compaction 튜닝 (3)](https://mp.weixin.qq.com/s/cZmXEsNPeRMLHp379kc2aA)

-238 오류는 보통 한 번에 적재하는 데이터가 너무 많아 tablet의 Segment 파일 수가 지나치게 많아질 때 발생합니다(기본값 200, BE 매개변수 `max_segment_num_per_rowset`으로 제어). 이 경우 한 번에 적재하는 데이터양을 줄이거나 BE 설정 매개변숫값을 적절히 높여 문제를 해결하는 것이 좋습니다. 2.0 버전부터는 BE 설정에 `enable_segcompaction=true`를 지정하여 segment compaction 기능을 활성화하면 segment 파일 수를 줄일 수 있습니다.

### Q5. tablet 110309738 has few replicas: 1, alive backends: [10003] {#q5-tablet-110309738-has-few-replicas-1-alive-backends-10003}

이 오류는 쿼리 또는 데이터 적재 작업 중 발생할 수 있습니다. 보통 해당 tablet의 복제본에 문제가 있음을 의미합니다.

이때는 먼저 show backends 명령으로 BE 노드가 중단되었는지 확인할 수 있습니다. 예를 들어 isAlive 필드가 false이거나 LastStartTime이 최근 시각일 수 있습니다(최근에 재시작되었음을 의미합니다). BE가 중단되었다면 해당 BE 노드에서 be.out 로그를 확인해야 합니다. BE가 비정상적인 이유로 중단된 경우에는 보통 be.out에 예외 스택이 출력되므로 문제 해결에 도움이 됩니다. be.out에 오류 스택이 없다면 linux 명령 dmesg -T로 OOM 때문에 시스템이 프로세스를 종료했는지 확인할 수 있습니다.

중단된 BE 노드가 없다면 show tablet 110309738 문을 실행한 다음, 결과에 있는 show proc 문을 실행하여 각 tablet 복제본의 상태를 확인하고 추가로 조사해야 합니다.

### Q6. disk xxxxx on backend xxx exceed limit usage {#q6-disk-xxxxx-on-backend-xxx-exceed-limit-usage}

보통 데이터 적재, Alter 등의 작업 중 발생합니다. 이 오류는 해당 BE의 디스크 사용률이 임곗값(기본값 95%)을 초과했음을 의미합니다. 이 경우 먼저 show backends 명령을 실행할 수 있습니다. MaxDiskUsedPct는 해당 BE에서 사용률이 가장 높은 디스크의 사용률을 나타냅니다. 이 값이 95%를 초과하면 이 오류가 발생합니다.

이때는 해당 BE 노드에서 데이터 디렉터리의 사용량을 확인해야 합니다. trash 디렉터리와 snapshot 디렉터리는 수동으로 정리하여 공간을 확보할 수 있습니다. 데이터 디렉터리가 차지하는 공간이 크다면 일부 데이터를 삭제하여 공간을 확보하는 방안을 고려해야 합니다. 자세한 내용은 [디스크 공간 관리](../admin-manual/maint-monitor/disk-capacity.md)를 참조하세요.

### Q7. Java 프로그램에서 Stream Load를 호출하여 데이터를 적재할 때 배치 데이터양이 많으면 Broken Pipe 오류가 발생할 수 있습니다. {#q7-calling-stream-load-to-import-data-through-a-java-program-may-result-in-a-broken-pipe-error-when-a-batch-of-data-is-large}

Broken Pipe 외에도 다른 예상치 못한 오류가 발생할 수 있습니다.

이 상황은 보통 httpv2를 활성화한 뒤 발생합니다. httpv2는 spring boot를 사용하여 구현한 http 서비스이며, 기본 내장 컨테이너로 tomcat을 사용합니다. 그러나 tomcat의 307 전달 처리에 문제가 있는 것으로 보여 이후 내장 컨테이너를 jetty로 변경했습니다. 또한 java 프로그램에서 사용하는 apache http client는 4.5.13 이후 버전이어야 합니다. 이전 버전에서도 전달 처리에 문제가 있었습니다.

따라서 이 문제는 다음 두 가지 방법으로 해결할 수 있습니다.

1. httpv2 비활성화

   fe.conf에 enable_http_server_v2=false를 추가한 뒤 FE를 재시작합니다. 다만 이 경우 새 버전의 UI와 httpv2 기반의 일부 새 인터페이스를 사용할 수 없습니다. (일반적인 데이터 적재와 쿼리에는 영향을 주지 않습니다.)

2. 업그레이드

   이 문제가 해결된 Doris 0.15 이상 버전으로 업그레이드합니다.

### Q8. 데이터 적재 및 쿼리 시 -214 오류 발생 {#q8-error--214-is-reported-when-importing-and-querying}

데이터 적재, 쿼리 등의 작업을 수행할 때 다음과 같은 오류가 발생할 수 있습니다.

```text
failed to initialize storage reader. tablet=63416.1050661139.aa4d304e7a7aff9c-f0fa7579928c85a0, res=-214, backend=192.168.100.10
```

-214 오류는 해당 tablet의 데이터 버전이 누락되었음을 의미합니다. 예를 들어 위 오류는 BE 192.168.100.10에 있는 tablet 63416 복제본의 데이터 버전이 누락되었음을 나타냅니다. (다른 유사한 오류 코드도 있을 수 있으며, 아래 방법으로 확인하고 복구할 수 있습니다.)

:::info 버전 참고 사항 (4.0.8)

4.0.8 버전부터는 스캔 단계 오류에 `failed to initialize storage reader` 접두사를 일괄적으로 붙이지 않습니다. 실제 원인에 해당하는 오류 메시지를 유지하고 뒤에 `. tablet=... backend=...`만 추가합니다.

Reader 초기화 시에는 첫 번째 행을 미리 읽으면서 푸시다운된 표현식을 평가하므로, 데이터 오류와 표현식 오류도 이 경로로 전달됩니다. 기존 접두사는 이런 오류도 스토리지 계층의 장애처럼 보이게 했습니다. -214를 진단할 때는 접두사 텍스트의 일치 여부보다 오류 코드와 `tablet=` / `backend=` 정보를 기준으로 판단하세요.

:::

일반적으로 데이터에 복제본이 여러 개 있으면 시스템이 문제가 있는 복제본을 자동으로 복구합니다. 다음 절차로 문제를 진단할 수 있습니다.

먼저 `show tablet 63416` 문을 실행한 다음 결과에 있는 `show proc xxx` 문을 실행하여 해당 tablet의 각 복제본 상태를 확인합니다. 일반적으로 `Version` 열의 데이터에 주목해야 합니다.

정상적인 상태에서는 tablet의 여러 복제본이 가진 Version이 모두 같아야 하며, 해당 파티션의 VisibleVersion과도 같아야 합니다.

`show partitions from tblx`로 해당 파티션의 버전을 확인할 수 있습니다(tablet이 속한 파티션은 `show tablet` 문으로 확인할 수 있습니다).

또한 `show proc` 문의 CompactionStatus 열에 있는 URL을 방문하면(브라우저에서 열기만 하면 됩니다) 더 구체적인 버전 정보를 확인하고 어떤 버전이 누락되었는지 살펴볼 수 있습니다.

오랫동안 자동 복구가 이루어지지 않으면 `show proc "/cluster_balance"` 문으로 시스템에서 현재 실행 중인 tablet 복구 및 스케줄링 작업을 확인해야 합니다. 스케줄링을 기다리는 tablet이 많아 복구 시간이 길어질 수 있습니다. `pending_tablets`와 `running_tablets`의 기록을 확인할 수 있습니다.

또한 `admin repair` 문으로 먼저 복구할 테이블이나 파티션을 지정할 수 있습니다. 자세한 내용은 `help admin repair`를 참조하세요.

그래도 복구되지 않고 복제본이 여러 개 있다면 `admin set replica status` 명령으로 문제가 있는 복제본을 강제로 오프라인 상태로 전환합니다. 자세한 내용은 `help admin set replica status`에서 복제본 상태를 bad로 설정하는 예제를 참조하세요. (bad로 설정한 복제본에는 더 이상 접근하지 않으며, 이후 자동으로 복구됩니다. 단, 실행 전에 다른 복제본이 정상인지 확인해야 합니다.)

### Q9. Not connected to 192.168.100.1:8060 yet, server_id=384 {#q9-not-connected-to-19216810018060-yet-server_id384}

데이터 적재 또는 쿼리 시 이 오류가 발생할 수 있습니다. 해당 BE 로그에서도 유사한 오류를 확인할 수 있습니다.

이는 RPC 오류이며, 보통 두 가지 가능성이 있습니다. 1. 해당 BE 노드가 중단된 경우. 2. rpc 혼잡이나 다른 오류가 발생한 경우.

BE 노드가 중단되었다면 구체적인 중단 원인을 확인해야 합니다. 여기서는 rpc 혼잡 문제만 설명합니다.

한 가지 경우는 OVERCROWDED로, rpc 송신 측에 전송되지 않은 데이터가 많이 쌓여 임곗값을 초과했음을 의미합니다. BE에는 이와 관련된 매개변수가 두 개 있습니다.

1. `brpc_socket_max_unwritten_bytes`: 기본값은 1GB입니다. 전송되지 않은 데이터가 이 값을 초과하면 오류가 발생합니다. 이 값을 적절히 변경하여 OVERCROWDED 오류를 방지할 수 있습니다. (단, 이는 증상만 완화하는 방법이며 근본적인 혼잡은 여전히 남아 있습니다.)
2. `tablet_writer_ignore_eovercrowded`: 기본값은 false입니다. true로 설정하면 Doris는 데이터 적재 중 OVERCROWDED 오류를 무시합니다. 이 매개변수는 주로 데이터 적재 실패를 방지하고 적재 안정성을 높이기 위한 것입니다.

두 번째 경우는 rpc 패킷 크기가 max_body_size를 초과하는 상황입니다. 쿼리에 매우 큰 String 타입이나 bitmap 타입이 있으면 이 문제가 발생할 수 있습니다. 다음 BE 매개변수를 변경하여 우회할 수 있습니다.

```
brpc_max_body_size：default 3GB.
```

### Q10. [ Broker load ] org.apache.thrift.transport.TTransportException: java.net.SocketException: Broken pipe {#q10--broker-load--orgapachethrifttransportttransportexception-javanetsocketexception-broken-pipe}

`org.apache.thrift.transport.TTransportException: java.net.SocketException: Broken pipe` 오류가 데이터 적재 중 발생합니다.

이 문제는 외부 스토리지(예: HDFS)에서 데이터를 적재할 때 디렉터리의 파일 수가 너무 많아 파일 목록을 조회하는 데 시간이 오래 걸려 발생할 수 있습니다. Broker RPC Timeout의 기본값은 10초이므로 상황에 맞게 타임아웃 시간을 조정해야 합니다.

`fe.conf` 설정 파일을 수정하여 다음 매개변수를 추가합니다.

```
broker_timeout_ms = 10000
##The default here is 10 seconds, you need to increase this parameter appropriately
```

여기에 매개변수를 추가한 뒤에는 FE 서비스를 재시작해야 합니다.

### Q11. [ Routine load ] ReasonOfStateChanged: ErrorReason{code=errCode = 104, msg='be 10004 abort task with reason: fetch failed due to requested offset not available on the broker: Broker: Offset out of range'} {#q11--routine-load--reasonofstatechanged-errorreasoncodeerrcode--104-msgbe-10004-abort-task-with-reason-fetch-failed-due-to-requested-offset-not-available-on-the-broker-broker-offset-out-of-range}

이 문제는 Kafka의 정리 정책 기본값이 7일이기 때문에 발생합니다. 어떤 이유로 Routine Load 작업이 일시 중지된 후 오랫동안 복구되지 않으면, 작업을 재개할 때 Routine Load에 기록된 소비 오프셋에 해당하는 데이터가 Kafka에서 이미 정리되어 이 문제가 발생할 수 있습니다.

따라서 alter routine load로 이 문제를 해결할 수 있습니다.

Kafka의 최소 오프셋을 확인하고 ALTER ROUTINE LOAD 명령으로 오프셋을 변경한 다음 작업을 재개합니다.

```sql
ALTER ROUTINE LOAD FOR db.tb
FROM kafka
(
 "kafka_partitions" = "0",
 "kafka_offsets" = "xxx",
 "property.group.id" = "xxx"
);
```

### Q12. ERROR 1105 (HY000): errCode = 2, detailMessage = (192.168.90.91)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations:  CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none {#q12-error-1105-hy000-errcode--2-detailmessage--1921689091cancelledinternal_errorerror-setting-certificate-verify-locations--cafile-etcsslcertsca-certificatescrt-capath-none}

```
yum install -y ca-certificates
ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
```

### Q13. create partition failed. partition numbers will exceed limit variable max_auto_partition_num {#q13-create-partition-failed-partition-numbers-will-exceed-limit-variable-max_auto_partition_num}

자동 파티션 테이블에 데이터를 적재할 때 실수로 너무 많은 파티션이 생성되는 것을 방지하기 위해 FE 설정 항목 `max_auto_partition_num`을 사용하여 이러한 테이블에 자동으로 생성할 수 있는 최대 파티션 수를 제어합니다. 더 많은 파티션을 생성해야 한다면 FE Master 노드의 이 설정 항목을 변경하세요.
