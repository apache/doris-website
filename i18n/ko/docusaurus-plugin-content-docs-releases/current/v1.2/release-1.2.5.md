---
{
    "title": "릴리스 1.2.5",
    "language": "ko",
    "description": "1.2.5 버전에서 Doris 팀은 1.2.4 버전 출시 이후 약 210건의 문제를 수정하거나 성능을 개선했습니다. 이와 함께,"
}
---

1.2.5 버전에서 Doris 팀은 1.2.4 버전 출시 이후 약 210건의 문제를 수정하거나 성능을 개선했습니다. 1.2.5는 1.2.4를 개선한 버전으로, 안정성도 높아졌습니다. 모든 사용자에게 이 버전으로 업그레이드할 것을 권장합니다.

# 동작 변경 사항 {#behavior-changed}

- `start_be.sh` 스크립트는 시스템에서 열 수 있는 파일 핸들의 최대 개수가 65536 이상인지 확인합니다. 이 조건을 충족하지 않으면 시작에 실패합니다.

- BE 설정 항목 `enable_quick_compaction`의 기본값이 true로 설정되어 Quick Compaction이 기본적으로 활성화됩니다. 이 기능은 대량 배치 가져오기 시 발생하는 작은 파일 문제를 완화합니다.

- 테이블의 동적 파티션 속성을 변경해도 즉시 적용되지 않습니다. 일부 교착 상태 문제를 방지하기 위해 동적 파티션 테이블의 다음 작업 스케줄링 시 적용됩니다.

# 개선 사항 {#improvement}

- 쿼리 처리 중 RPC가 차단되는 문제를 줄이도록 bthread와 pthread의 사용 방식을 최적화했습니다.

- FE 웹 UI의 Profile 페이지에 Profile 다운로드 버튼을 추가했습니다.

- 특정 장애 상황에서 쿼리 시 문제가 있는 복제본을 건너뛰도록 하는 FE 설정 `recover_with_skip_missing_version`을 추가했습니다.

- 행 수준 권한 기능이 외부 Catalog를 지원합니다.

- Hive Catalog가 수동 갱신 없이 BE 측에서 Kerberos 티켓을 자동으로 갱신하도록 지원합니다.

- JDBC Catalog가 MySQL/ClickHouse 시스템 데이터베이스(`information_schema`)의 테이블을 지원합니다.

# 버그 수정 {#bug-fixes}

- 카디널리티가 낮은 열에 대한 최적화로 인해 쿼리 결과가 잘못되는 문제를 수정했습니다.

- HDFS에 접근할 때 발생하는 여러 인증 및 호환성 문제를 수정했습니다.

- float/double 및 decimal 유형과 관련된 여러 문제를 수정했습니다.

- date/datetimev2 유형과 관련된 여러 문제를 수정했습니다.

- 쿼리 실행 및 계획과 관련된 여러 문제를 수정했습니다.

- JDBC Catalog와 관련된 여러 문제를 수정했습니다.

- Hive Catalog의 쿼리 관련 문제와 Hive Metastore 메타데이터 동기화 문제를 여러 건 수정했습니다.

- `SHOW LOAD PROFILE` 문의 결과가 잘못되는 문제를 수정했습니다.

- 메모리와 관련된 여러 문제를 수정했습니다.

- `CREATE TABLE AS SELECT` 기능과 관련된 여러 문제를 수정했습니다.

- avx2를 지원하지 않는 CPU에서 jsonb 유형으로 인해 BE가 비정상 종료되는 문제를 수정했습니다.

- 동적 파티션과 관련된 여러 문제를 수정했습니다.

- TOPN 쿼리 최적화와 관련된 여러 문제를 수정했습니다.

- Unique Key Merge-on-Write 테이블 모델과 관련된 여러 문제를 수정했습니다.

# 감사의 말씀 {#big-thanks}

1.2.5의 개선과 출시에 참여한 기여자 58분의 노고와 헌신에 감사드립니다.

@adonis0147

@airborne12

@AshinGau

@BePPPower

@BiteTheDDDDt

@caiconghui

@CalvinKirs

@cambyzju

@caoliang-web

@dataroaring

@Doris-Extras

@dujl

@dutyu

@fsilent

@Gabriel39

@gitccl

@gnehil

@GoGoWen

@gongzexin

@HappenLee

@herry2038

@jacktengg

@Jibing-Li

@kaka11chen

@Kikyou1997

@LemonLiTree

@liaoxin01

@LiBinfeng-01

@luwei16

@Moonm3n

@morningman

@mrhhsg

@Mryange

@nextdreamblue

@nsnhuang

@qidaye

@Shoothzj

@sohardforaname

@stalary

@starocean999

@SWJTU-ZhangLei

@wsjz

@xiaokang

@xinyiZzz

@yangzhg

@yiguolei

@yixiutt

@yujun777

@Yulei-Yang

@yuxuan-luo

@zclllyybb

@zddr

@zenoyang

@zhangstar333

@zhannngchen

@zxealous

@zy-kkk

@zzzzzzzs
