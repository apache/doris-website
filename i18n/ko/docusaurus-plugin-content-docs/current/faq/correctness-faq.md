---
{
    "title": "데이터 무결성 FAQ",
    "language": "ko",
    "description": "이 문서는 Doris 사용 중 발생하는 일반적인 데이터 무결성 문제를 기록하기 위한 문서입니다. 정기적으로 업데이트됩니다."
}
---

# 데이터 무결성 문제 {#data-integrity-issues}

이 문서는 Doris 사용 중 발생하는 일반적인 데이터 무결성 문제를 기록하기 위한 문서입니다. 정기적으로 업데이트됩니다.

"테이블의 중복 키 데이터"는 merge-on-write Unique 테이블에 중복 키 데이터가 나타나는 현상을 뜻합니다. merge-on-write Unique 테이블의 중복 키 문제는 [full compaction 실행](../admin-manual/trouble-shooting/repairing-data)으로 해결할 수 있지만, 다른 유형의 무결성 문제는 상황에 맞는 별도의 해결 방법이 필요할 수 있습니다. 도움이 필요하면 커뮤니티 지원에 문의하세요.

| 문제 설명 | 발생 조건 | 영향을 받는 버전 | 수정된 버전 | 영향 범위 | 수정 PR |
|---|---|---|---|---|---|
| merge-on-write Unique 테이블의 부분 컬럼 업데이트로 이전에 삭제된 데이터가 다시 나타남 | 부분 컬럼 업데이트 시 `__DORIS_DELETE_SIGN__` 컬럼을 지정하고, 기존 데이터에 `__DORIS_DELETE_SIGN__` 컬럼으로 삭제 표시된 행이 포함되어 있음 | <2.1.8, <3.0.4 | >=2.1.8, >=3.0.4 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 부분 컬럼 업데이트 | [#46194](https://github.com/apache/doris/pull/46194) |
| 테이블의 중복 키 데이터 | 컴퓨팅-스토리지 분리 모드의 merge-on-write Unique 테이블에서 데이터 적재를 동시에 실행함 | <3.0.4 | >=3.0.4 | 컴퓨팅-스토리지 분리 모드 | [#46039](https://github.com/apache/doris/pull/46039) |
| 테이블의 중복 키 데이터 | 컴퓨팅-스토리지 분리 모드의 merge-on-write Unique 테이블에서 데이터 적재 작업 간 및 데이터 적재와 compaction 간에 동시 실행이 발생함 | <3.0.4 | >=3.0.4 | 컴퓨팅-스토리지 분리 모드 | [#44975](https://github.com/apache/doris/pull/44975) |
| 자동 증가 컬럼에 대해 시스템이 생성한 값이 0이거나 중복됨 | BE와 FE 사이의 네트워크 이상 | <2.1.8, <3.0.3 | >=2.1.8, >=3.0.3 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 자동 증가 컬럼 | [#43774](https://github.com/apache/doris/pull/43774) |
| merge-on-write Unique 테이블에서 Stream Load 데이터 적재 시 `delete` 조건에 맞는 데이터가 삭제되지 않음 | `merge_type: MERGE`, `partial_columns: true`, `delete` 매개변수를 사용하는 Stream Load 데이터 적재 | <2.0.15, <2.17, <3.0.3 | >=2.0.15, >=2.17, >=3.0.3 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 부분 컬럼 업데이트 | [#40730](https://github.com/apache/doris/pull/40730) |
| 부분 컬럼 업데이트로 자동 증가 컬럼 값이 의도치 않게 변경됨 | 테이블에 Value 컬럼으로 사용되는 자동 증가 컬럼이 있으며, 부분 컬럼 업데이트 방식의 데이터 적재 시 해당 자동 증가 컬럼의 값을 지정하지 않음 | <2.1.6, <3.0.2 | >=2.1.6, >=3.0.2 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 자동 증가 컬럼 | [#39996](https://github.com/apache/doris/pull/39996) |
| 테이블의 중복 키 데이터 | 사용자가 sequence 컬럼을 지원하지 않는 merge-on-write Unique 테이블에 `ALTER TABLE tbl ENABLE FEATURE "SEQUENCE_LOAD" WITH ...`를 사용하여 sequence 컬럼 기능을 추가한 뒤 새 데이터를 적재함 | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드 | [#39958](https://github.com/apache/doris/pull/39958) |
| 테이블의 중복 키 데이터 | 컴퓨팅-스토리지 분리 모드의 merge-on-write Unique 테이블에서 데이터 적재를 동시에 실행하거나 데이터 적재와 compaction을 동시에 실행함 | <3.0.1 | >=3.0.1 | 컴퓨팅-스토리지 분리 모드 | [#39018](https://github.com/apache/doris/pull/39018) |
| 부분 컬럼 업데이트 방식의 데이터 적재로 merge-on-write Unique 테이블에서 데이터 손상이 발생함 | merge-on-write Unique 테이블에서 부분 컬럼 업데이트를 동시에 수행하고, 데이터 적재 도중 BE가 재시작됨 | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 부분 컬럼 업데이트 | [#38331](https://github.com/apache/doris/pull/38331) |
| 테이블의 중복 키 데이터 | 컴퓨팅-스토리지 분리 모드의 merge-on-write Unique 테이블에서 데이터 적재와 compaction을 동시에 실행함 | <3.0.2 | >=3.0.2 | 컴퓨팅-스토리지 분리 모드 | [#37670](https://github.com/apache/doris/pull/37670), [#41309](https://github.com/apache/doris/pull/41309), [#39791](https://github.com/apache/doris/pull/39791) |
| 테이블의 중복 키 데이터 | sequence 컬럼이 있는 merge-on-write Unique 테이블에서 한 번에 대량의 데이터를 적재하여 segment compaction이 트리거됨 | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드 | [#38369](https://github.com/apache/doris/pull/38369) |
| 테이블의 중복 키 데이터 | 컴퓨팅-스토리지 통합 모드의 merge-on-write Unique 테이블에서 full clone이 실패함 | <2.0.13, <2.1.5, <3.0.0 | >=2.0.13, >=2.1.5, >=3.0.0 | 컴퓨팅-스토리지 통합 모드 | [#37001](https://github.com/apache/doris/pull/37001) |
| 테이블의 중복 키 데이터 | 컴퓨팅-스토리지 분리 모드의 merge-on-write Unique 테이블에서 Stream Load 데이터 적재 중 내부 재시도 과정이 수행됨 | <3.0.0 | >=3.0.0 | 컴퓨팅-스토리지 분리 모드 | [#36670](https://github.com/apache/doris/pull/36670) |
| merge-on-write Unique 테이블에서 여러 복제본 간 데이터가 일치하지 않음 | merge-on-write Unique 테이블에서 `__DORIS_DELETE_SIGN__` 컬럼을 포함한 부분 컬럼 업데이트 방식으로 데이터를 적재하고, 적재 중 복제본 간 Base Compaction 진행 상태가 일치하지 않음 | <2.0.15, <2.1.5, <3.0.0 | >=2.0.15, >=2.1.5, >=3.0.0 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 부분 컬럼 업데이트 | [#36210](https://github.com/apache/doris/pull/36210) |
| 테이블의 중복 키 데이터 | merge-on-write Unique 테이블에서 부분 컬럼 업데이트를 동시에 수행하고, 데이터 적재 도중 BE가 재시작됨 | <2.0.11, <2.1.4, <3.0.0 | >=2.0.11, >=2.1.4, >=3.0.0 | 컴퓨팅-스토리지 통합 모드, 컴퓨팅-스토리지 분리 모드, 부분 컬럼 업데이트 | [#35739](https://github.com/apache/doris/pull/35739) |
