---
{
    "title": "COMPACT TABLE",
    "language": "ko",
    "description": "테이블 파티션(ADMIN COMPACT TABLE) 또는 단일 tablet(ADMIN COMPACT TABLET)에 대해 compaction을 수동으로 실행합니다."
}
---

## 설명 {#description}

compaction을 수동으로 실행합니다. Doris는 다음 두 가지 실행 단위를 제공합니다.

- `ADMIN COMPACT TABLE`: 지정한 테이블 파티션에 속한 모든 복제본에 대해 compaction을 실행합니다. 스토리지와 컴퓨팅이 결합된 모드에서만 지원됩니다.
- `ADMIN COMPACT TABLET`: 지정한 tablet의 모든 복제본에 대해 compaction을 실행합니다. 버전 4.1.4부터 지원되며, 스토리지와 컴퓨팅이 결합된 모드와 분리된 모드 모두에서 사용할 수 있습니다.

## 구문 {#syntax}

```sql
ADMIN COMPACT TABLE <table_name>
PARTITION <partition_name>
WHERE TYPE={ BASE | CUMULATIVE }
```

```sql
ADMIN COMPACT TABLET <tablet_id>
WHERE TYPE={ BASE | CUMULATIVE | FULL }
```

## 필수 매개변수 {#required-parameters}

**ADMIN COMPACT TABLE**

<table_name>

> compaction을 실행할 테이블의 이름입니다.

<partition_name>

> compaction을 실행할 파티션의 이름입니다.

TYPE={ BASE | CUMULATIVE }

> BASE는 base compaction 실행을, CUMULATIVE는 cumulative compaction 실행을 의미합니다. 자세한 내용은 COMPACTION 절을 참조하세요.

**ADMIN COMPACT TABLET**

<tablet_id>

> compaction을 실행할 tablet의 ID입니다. 내부(OLAP) 테이블의 tablet이어야 합니다. `SHOW TABLETS FROM <table_name>`을 사용하여 ID를 확인할 수 있습니다.

TYPE={ BASE | CUMULATIVE | FULL }

> BASE와 CUMULATIVE 외에, FULL은 full compaction 실행을 의미합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

**ADMIN COMPACT TABLE**

이 SQL 명령을 성공적으로 실행하려면 ADMIN_PRIV 권한이 필요합니다. 권한 문서를 참조하세요.

| 권한       | 대상                                 | 참고 사항                       |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | 전체 클러스터 관리 권한               | NODE_PRIV를 제외한 모든 권한     |

**ADMIN COMPACT TABLET**

이 SQL 명령을 성공적으로 실행하려면 전역 ADMIN_PRIV 권한 또는 tablet이 속한 테이블의 ALTER_PRIV 권한이 필요합니다. 둘 중 하나만 있으면 됩니다.

| 권한       | 대상                                 | 참고 사항                                                          |
| :--------- | :----------------------------------- | :----------------------------------------------------------------- |
| ADMIN_PRIV | 전체 클러스터 관리 권한               | NODE_PRIV를 제외한 모든 권한                                        |
| ALTER_PRIV | 테이블                               | tablet이 속한 테이블의 ALTER 권한만 있으면 됨                       |

## 예제 {#example}

1. 테이블 tbl의 파티션 par01에 대해 cumulative compaction을 실행합니다.

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

2. tablet 10086에 대해 full compaction을 실행합니다.

  ```sql
  ADMIN COMPACT TABLET 10086 WHERE TYPE='FULL';
  ```

3. tablet 10086에 대해 base compaction을 실행합니다.

  ```sql
  ADMIN COMPACT TABLET 10086 WHERE TYPE='BASE';
  ```

## 사용 시 참고 사항 {#usage-note}

1. `ADMIN COMPACT TABLE`은 스토리지와 컴퓨팅이 분리된 모드에서 지원되지 않습니다. 이 모드에서 실행하면 오류가 발생합니다. 예를 들어 다음과 같습니다.

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

  오류 메시지는 다음과 같습니다.

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```

  이 경우에는 `ADMIN COMPACT TABLET`을 사용하세요.

2. `ADMIN COMPACT TABLET`은 내부(OLAP) 테이블의 tablet만 지원합니다. tablet ID가 존재하지 않거나, 해당 tablet이 속한 데이터베이스 또는 테이블이 삭제되었거나, 해당 tablet이 속한 인덱스가 표시 가능한 상태가 아니면 명령문이 즉시 실패합니다. 예를 들어 다음과 같습니다.

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unknown tablet: 10086
  ```

3. 두 명령문은 모두 BE에 compaction 작업을 제출하기만 합니다. 성공 응답이 반환되어도 compaction이 완료되었다는 의미는 아닙니다. [SHOW TABLET](./SHOW-TABLET)을 사용하여 tablet 버전 수의 변화를 확인하거나, BE의 [compaction-status](../../../../admin-manual/open-api/be-http/compaction-status) API를 사용하여 진행 상황을 확인하세요.
