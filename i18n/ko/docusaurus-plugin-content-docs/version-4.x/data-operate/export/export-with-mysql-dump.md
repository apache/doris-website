---
{
    "title": "MySQL 덤프",
    "language": "ko",
    "description": "mysqldump 도구를 사용하여 Apache Doris에서 테이블 스키마와 데이터를 내보냅니다. 개발, 테스트 및 소규모 마이그레이션 시나리오에 적합합니다.",
    "keywords": [
        "mysqldump",
        "Doris 내보내기",
        "스키마 내보내기",
        "데이터 내보내기",
        "no-tablespaces",
        "source로 가져오기"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Development and testing / Small-scale export and import / Schema backup -->

`mysqldump`는 MySQL에서 제공하는 공식 논리적 내보내기 도구입니다. Apache Doris는 **버전 0.15**부터 `mysqldump`와 호환됩니다. 이 도구를 사용하여 테이블 스키마(DDL) 또는 데이터(DML)를 내보낸 다음, `source` 명령으로 Doris에 다시 가져올 수 있습니다.

### 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 여부 | 참고 사항 |
| --- | --- | --- |
| 개발 및 테스트 환경의 데이터 마이그레이션 | 권장 | 사용법이 간단하고 도구를 쉽게 구할 수 있음 |
| 스키마 백업 및 마이그레이션 | 권장 | `--no-data`를 사용하여 DDL만 내보내기 |
| 소규모 데이터 내보내기 | 권장 | 수 MB에서 수백 MB 규모 |
| 운영 환경의 대규모 데이터 내보내기 | **권장하지 않음** | 성능과 안정성에 한계가 있음. 대신 `EXPORT` 또는 `OUTFILE` 사용 |

## 사전 요구 사항 {#prerequisites}

- Doris 버전 >= 0.15
- 클라이언트 환경에 `mysqldump`가 설치되어 있어야 합니다.
- 대상 데이터베이스와 테이블에 대한 읽기 권한이 있어야 합니다(기본 FE MySQL 프로토콜 포트는 `9030`입니다).

## 사용 예제 {#usage-examples}

### 데이터 또는 스키마 내보내기 {#export-data-or-schema}

다음 예제는 모두 `127.0.0.1:9030`의 FE에 `root` 계정으로 연결하며, `--no-tablespaces` 매개변수를 반드시 포함해야 합니다(이유는 아래 "주의 사항" 참조).

1. **지정한 테이블의 스키마와 데이터 내보내기**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1
    ```

2. **지정한 테이블의 스키마만 내보내기(데이터 제외)**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1 --no-data
    ```

3. **여러 데이터베이스에 속한 모든 테이블 내보내기**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test1 test2
    ```

4. **모든 데이터베이스와 모든 테이블 내보내기**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --all-databases
    ```

추가 매개변수는 [MySQL mysqldump 공식 매뉴얼](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)을 참조하세요.

### 내보낸 결과를 Doris로 가져오기 {#import-the-exported-result-into-doris}

`mysqldump`의 출력을 `.sql` 파일로 리디렉션한 다음, Doris 클라이언트에서 `source` 명령으로 가져올 수 있습니다.

```shell
# 1. Export to a file
mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
    --databases test --tables table1 > table1.sql

# 2. Log in to Doris and run source to import
mysql -h127.0.0.1 -P9030 -uroot
```

```sql
source table1.sql;
```

## 주의 사항 {#notes}

1. **`--no-tablespaces` 매개변수는 필수입니다**: Doris는 MySQL의 테이블스페이스 개념을 지원하지 않습니다. 이 매개변수를 지정하지 않으면 내보내기에 실패합니다.
2. **개발, 테스트 또는 소규모 시나리오에만 적합합니다**: `mysqldump`는 단일 스레드로 동작하는 논리적 내보내기 도구입니다. 대용량 데이터를 처리할 때는 성능과 안정성이 충분하지 않습니다. **운영 환경에서 대규모 데이터를 처리하는 용도로 사용하지 마세요.** 운영 환경에서 데이터를 내보낼 때는 다음 방법 중 하나를 사용하세요.
    - [`EXPORT` 문](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md): 객체 스토리지 또는 HDFS로 비동기 내보내기
    - [`SELECT INTO OUTFILE`](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md): 쿼리 결과를 파일로 동기 내보내기
