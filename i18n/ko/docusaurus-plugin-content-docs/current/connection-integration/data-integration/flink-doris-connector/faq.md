---
{
    "title": "자주 묻는 질문",
    "language": "ko",
    "description": "Flink Doris Connector 사용 시 발생하는 레이블 중복, 트랜잭션 만료, 실행 중인 트랜잭션 수 초과, 더티 데이터, 307 리디렉션 등의 일반적인 오류와 질문을 다룹니다."
}
---

# 자주 묻는 질문 {#faq}

쓰기 측에서 발생하는 오류는 대부분 쓰기 모드 및 2단계 커밋과 관련이 있습니다. 먼저 [쓰기 모드](./write.md#write-modes)를 참조하세요.

**1. errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

Exactly-Once 시나리오에서는 Flink Job을 다시 시작할 때 반드시 최신 Checkpoint/Savepoint에서 시작해야 합니다. 그렇지 않으면 위 오류가 발생합니다. Exactly-Once가 필요하지 않다면 2PC 커밋을 비활성화하거나(`sink.enable-2pc=false`) 다른 `sink.label-prefix`를 사용하여 해결할 수도 있습니다.

**2. errCode = 2, detailMessage = transaction [19650] not found**

이 오류는 Commit 단계에서 발생합니다. Checkpoint에 기록된 트랜잭션 ID가 FE 측에서 만료된 상태입니다. 이 상태에서 다시 커밋하면 위 오류가 발생합니다. 이 경우 해당 Checkpoint에서 시작할 수 없습니다. `streaming_label_keep_max_second` 설정을 `fe.conf`에서 변경하면 만료 시간을 늘릴 수 있습니다(기본값 12시간). Doris 2.0 이후에는 `label_num_threshold` 설정도 `fe.conf`에서 적용되어 제한을 받습니다(기본값 2000). 이 값은 늘리거나 -1로 설정할 수 있습니다(-1은 시간 제한만 적용된다는 의미입니다).

**3. errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

동일한 데이터베이스에 대한 동시 데이터 적재 수가 100을 초과하면 이 오류가 발생합니다. `max_running_txn_num_per_db` 매개변수를 `fe.conf`에서 조정하여 해결할 수 있습니다. 자세한 내용은 [max_running_txn_num_per_db](../../../admin-manual/config/fe-config.md#max_running_txn_num_per_db)를 참조하세요. 또한 레이블을 자주 변경하면서 작업을 다시 시작해도 이 오류가 발생할 수 있습니다. 2pc 시나리오(Duplicate/Aggregate 모델)에서는 각 작업의 레이블이 고유해야 합니다. Flink 작업은 Checkpoint에서 다시 시작할 때만 사전 커밋에 성공했지만 아직 커밋되지 않은 이전 트랜잭션을 명시적으로 중단합니다. 레이블을 자주 변경하면서 다시 시작하면 사전 커밋에 성공한 트랜잭션이 다수 중단되지 못한 채 트랜잭션 한도를 차지하게 됩니다. Unique 모델에서는 2pc를 비활성화해도 멱등성 쓰기를 구현할 수 있습니다.

**4. tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

이 오류는 주로 Connector 1.1.0 이전 버전에서 발생하며, 쓰기가 너무 빈번하여 버전이 과도하게 많아지는 것이 원인입니다. `sink.batch.size`와 `sink.batch.interval` 매개변수를 설정하여 Stream Load 빈도를 줄일 수 있습니다. Connector 1.1.0 이후에는 기본 쓰기 시점이 Checkpoint에 의해 제어되므로, Checkpoint 간격을 늘려 쓰기 빈도를 줄일 수 있습니다.

**5. Flink로 데이터를 적재할 때 더티 데이터를 건너뛰려면 어떻게 해야 하나요?**

Flink로 데이터를 적재할 때 필드 형식이나 길이 문제 등의 더티 데이터가 있으면 Stream Load가 오류를 보고하고 Flink는 계속 재시도합니다. 이러한 데이터를 건너뛰려면 Stream Load의 엄격 모드를 비활성화하거나(`strict_mode=false`, `max_filter_ratio=1`), Sink 연산자 전에 데이터를 필터링하면 됩니다.

**6. Flink 머신과 BE 머신 간 네트워크가 연결되지 않습니다. 어떻게 설정해야 하나요?**

Flink가 Doris에 쓰기를 요청하면 Doris는 쓰기 작업을 BE로 리디렉션합니다. 이때 반환되는 주소는 BE의 내부 IP입니다(즉, `show backends`로 확인되는 IP). Flink와 Doris가 통신할 수 없으면 오류가 발생합니다. 이 경우 `benodes`에 BE의 외부 IP를 설정할 수 있습니다.

**7. Stream Load 오류: HTTP/1.1 307 Temporary Redirect**

Flink는 먼저 FE에 요청을 보냅니다. 307을 받으면 리디렉션된 BE로 요청을 보냅니다. FE가 FullGC 상태이거나, 부하가 높거나, 네트워크 지연이 발생하는 경우 HttpClient는 기본적으로 일정 시간(3초)이 지나면 응답을 받지 못한 상태에서도 데이터를 전송합니다. 요청 본문은 기본적으로 InputStream이므로, 307 응답을 받았을 때 데이터를 다시 전송할 수 없어 즉시 오류가 발생합니다. 다음 세 가지 방법으로 해결할 수 있습니다.

1. 기본 대기 시간이 늘어난 Connector 25.1.0 이상으로 업그레이드합니다.
2. `auto-redirect=false`를 설정하여 요청을 BE로 직접 보냅니다(일부 클라우드 시나리오에는 적용할 수 없음).
3. 기본 키 모델에서는 배치 모드를 활성화할 수 있습니다.
