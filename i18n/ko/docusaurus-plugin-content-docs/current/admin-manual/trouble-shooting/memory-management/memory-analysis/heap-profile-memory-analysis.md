---
{
    "title": "Heap Profile 메모리 분석",
    "language": "ko",
    "description": "Heap Profile을 사용하면 프로세스의 메모리 사용량과 호출 스택을 실시간으로 확인할 수 있으므로, 일반적으로 코드를 어느 정도 이해하고 있어야 합니다."
}
---

Heap Profile을 사용하면 프로세스의 메모리 사용량과 호출 스택을 실시간으로 확인할 수 있으므로, 일반적으로 코드를 어느 정도 이해하고 있어야 합니다. Heap Profile은 가상 메모리를 기록한다는 점에 유의하세요. 설정을 수정하고 Doris BE 프로세스를 재시작한 후 분석하려는 현상을 재현해야 합니다.

Doris는 Jemalloc을 기본 Allocator로 사용합니다. Heap Profile을 사용하려면 다음 절차를 따르세요.

1. `prof_active:false` 설정을 `JEMALLOC_CONF`가 정의된 `be.conf`에서 `prof_active:true`로 변경한 후 Doris BE를 재시작합니다.

2. `curl http://be_host:8040/jeheap/dump`를 실행하면 생성된 `profile` 파일을 `${DORIS_HOME}/log` 디렉터리에서 확인할 수 있습니다.

3. `jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file`을 실행한 후 터미널에 출력된 텍스트를 [온라인 dot 그래프 작성 사이트](http://www.webgraphviz.com/)에 붙여 넣으면 메모리 할당 그래프를 생성할 수 있습니다.

위 절차는 Doris 2.1.8 및 3.0.4 이상 버전을 기준으로 하며, 실시간 메모리 분석에 사용됩니다. 메모리를 장시간 관찰하거나 메모리 할당의 누적값을 확인해야 한다면 [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1)에서 Jemalloc Heap Profile 사용법에 대한 자세한 내용을 확인하세요.

Heap Profile에서 메모리 점유율이 높은 호출 스택에 `Segment`, `TabletSchema`, `ColumnReader` 필드가 나타난다면 메타데이터가 많은 메모리를 차지하고 있다는 뜻입니다.

클러스터를 일정 시간 실행한 뒤 유휴 상태가 되어도 BE 메모리가 줄어들지 않는다면, Heap Profile에서 메모리 점유율이 높은 호출 스택에 `Agg`, `Join`, `Filter`, `Sort`, `Scan` 등의 필드가 나타나는지 확인할 수 있습니다. 해당 시간대의 BE 프로세스 메모리 모니터링 결과가 지속적인 증가 추세를 보인다면 메모리 누수를 의심할 근거가 있습니다. 호출 스택을 바탕으로 코드를 계속 분석하세요.

클러스터에서 작업을 실행하는 동안 Heap Profile에서 메모리 점유율이 높은 호출 스택에 `Agg`, `Join`, `Filter`, `Sort`, `Scan` 등의 필드가 나타나고, 작업이 완료된 후 메모리가 정상적으로 해제된다면 대부분의 메모리가 실행 중인 작업에 사용되고 있으며 누수는 없다는 뜻입니다. `Label=query, Type=overview` Memory Tracker의 값이 전체 메모리에서 차지하는 비율이 Heap Profile에서 위 필드를 포함한 메모리 호출 스택이 차지하는 비율보다 작다면, `Label=query, Type=overview` Memory Tracker의 통계가 부정확하다는 뜻이며 커뮤니티에 신속히 피드백을 제공할 수 있습니다.
