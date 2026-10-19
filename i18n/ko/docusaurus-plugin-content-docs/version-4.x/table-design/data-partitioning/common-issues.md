---
{
    "title": "테이블 생성 시 자주 발생하는 문제",
    "language": "ko",
    "description": "Apache Doris 테이블 생성 문제 해결 가이드: 구문 오류, Failed to create partition 시간 초과, Too many open files, 명령 실행 후 응답이 없는 현상 등 여러 상황의 원인과 해결 방법을 안내합니다.",
    "keywords": [
        "Doris 테이블 생성 실패",
        "Failed to create partition",
        "Too many open files",
        "tablet_create_timeout_second",
        "테이블 생성 시간 초과",
        "테이블 생성 구문 오류"
    ]
}
---

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Table creation failure troubleshooting / Timeout tuning -->

이 문서는 테이블 생성 중 발생할 수 있는 대표적인 상황별로 원인을 분석하고 해결 방법을 안내합니다.

## 시나리오 1: CREATE TABLE 문의 구문 오류 {#scenario-1-syntax-errors-in-the-create-table-statement}

긴 CREATE TABLE 문에서 구문 오류가 발생하면 오류 메시지가 불완전할 수 있습니다. 일반적인 원인은 다음과 같습니다.

| 원인 | 확인 및 수정 방법 |
| --- | --- |
| 구문 구조 오류 | `HELP CREATE TABLE;`을 자세히 읽고 해당 구문 구조가 올바른지 확인하세요 |
| 예약어 사용 | 사용자 지정 이름이 예약어와 충돌하면 해당 이름을 백틱 `` ` ``으로 감싸세요. 모든 사용자 지정 이름을 백틱으로 감싸는 것이 좋습니다 |
| 중국어 문자 또는 전각 문자 | utf-8로 인코딩되지 않은 중국어 문자나 숨겨진 전각 문자(예: 전각 공백 또는 전각 문장 부호)는 구문 오류를 일으킬 수 있습니다. "보이지 않는 문자 표시" 기능이 있는 텍스트 편집기로 확인하세요 |

## 시나리오 2: 테이블 생성 시 `Failed to create partition [xxx]. Timeout` 오류 발생 {#scenario-2-table-creation-reports-failed-to-create-partition-xxx-timeout}

Doris는 Partition을 하나씩 생성하여 테이블을 만듭니다. Partition 생성에 실패하면 위 오류가 보고됩니다.

CREATE TABLE 문에 Partition을 명시적으로 정의하지 않아도 Doris는 테이블에 변경할 수 없는 기본 Partition을 생성합니다. 따라서 테이블 생성 중 문제가 발생하면 이 경우에도 `Failed to create partition` 오류가 보고됩니다.

이 오류는 일반적으로 BE에서 데이터 샤드(Tablet)를 생성하는 중 문제가 발생할 때 나타납니다.

### 확인 절차 {#investigation-steps}

1. **실패한 Backend와 Tablet 확인**

    `fe.log`에서 해당 시점의 `Failed to create partition` 로그를 검색하세요. 로그에는 `{10001-10010}`과 같은 숫자 쌍이 나열되어 있습니다.

    - 첫 번째 숫자(`10001`): Backend ID
    - 두 번째 숫자(`10010`): Tablet ID

    위 예시는 Tablet ID `10010` 생성이 ID가 `10001`인 Backend에서 실패했음을 나타냅니다.

2. **BE 로그에서 오류 메시지 확인**

    해당 Backend의 `be.INFO` 로그에서 해당 시간대의 Tablet ID 관련 로그를 검색하여 구체적인 오류 메시지를 찾으세요.

3. **일반적인 오류 유형에 따라 문제 해결**

### Tablet 생성 실패의 일반적인 원인 {#common-causes-of-tablet-creation-failure}

| 오류 증상 | 가능한 원인 | 권장 조치 |
| --- | --- | --- |
| BE가 관련 작업을 수신하지 못함(`be.INFO`에서 Tablet ID 관련 로그를 찾을 수 없음) 또는 BE가 Tablet을 성공적으로 생성했지만 보고하지 못함 | FE와 BE 간 연결 문제 | [설치 및 배포](../../install/deploy-manually/integrated-storage-compute-deploy-manually)를 참고하여 FE와 BE 간 네트워크 연결을 확인하세요 |
| 메모리 사전 할당 실패 | 테이블의 단일 행 바이트 길이가 100 KB를 초과함 | 테이블 스키마를 조정하여 단일 행 데이터의 길이를 줄이세요 |
| `Too many open files` | 열린 파일 핸들 수가 Linux 시스템 제한을 초과함 | Linux 시스템의 파일 핸들 제한을 수정하세요 |

### 테이블 생성 제한 시간 조정 {#adjust-the-table-creation-timeout}

데이터 샤드 생성 시 시간 초과만 발생하는 경우, `fe.conf`의 다음 두 매개변수를 통해 제한 시간을 늘릴 수 있습니다.

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `tablet_create_timeout_second` | 1초 | 단일 Tablet 생성 제한 시간 |
| `max_create_table_timeout_second` | 60초 | 전체 테이블 생성 작업의 최대 제한 시간 |

전체 제한 시간은 다음과 같이 계산됩니다.

```text
min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)
```

매개변수에 대한 자세한 설명은 [FE 설정](../../admin-manual/config/fe-config)을 참고하세요.

## 시나리오 3: CREATE TABLE 명령이 오랫동안 반환되지 않음 {#scenario-3-the-create-table-command-does-not-return-for-a-long-time}

Doris의 CREATE TABLE 명령은 동기식입니다. 현재 제한 시간은 비교적 단순한 방식으로 설정됩니다.

```text
timeout = tablet num * replication num (seconds)
```

관련 증상과 권장 사항은 다음과 같습니다.

- 데이터 샤드를 많이 생성하고 그중 일부가 실패하면 긴 제한 시간이 지난 후에야 오류가 반환될 수 있습니다.
- 정상적인 상황에서는 CREATE TABLE 문이 몇 초에서 수십 초 이내에 반환됩니다.
- 일 분이 지나도 반환되지 않으면 작업을 바로 취소하고 FE 또는 BE 로그에서 관련 오류를 확인하세요.

## 추가 도움말 {#further-help}

데이터 파티셔닝에 대한 자세한 내용은 다음을 참고하세요.

- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 명령 매뉴얼 참고
