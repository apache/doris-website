---
{
    "title": "SHOW FRONTENDS DISKS",
    "language": "ko",
    "description": "이 문은 메타데이터, 로그, 감사 로그 등 FE 노드의 주요 디렉터리에 대한 디스크 정보를 확인하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 메타데이터, 로그, 감사 로그, 임시 디렉터리 등 FE 노드의 주요 디렉터리에 대한 디스크 정보를 확인하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW FRONTENDS DISKS;
```

## 반환 값 {#return-value}

| 열                 | 설명                                              |
|--------------------|-------------------------------------------------|
| Name               | bdbje에 등록된 FE 노드의 이름                            |
| Host               | FE 노드의 IP 주소                                     |
| DirType        | 표시할 디렉터리 유형으로, 다음 네 가지 범주가 포함됩니다: meta, log, audit-log, temp, deploy. |
| Dir           | 표시할 디렉터리 유형에 해당하는 디렉터리                                     |
| FileSystem          | 표시할 디렉터리 유형이 위치한 Linux 시스템의 파일 시스템                      |
| Capacity            | 파일 시스템의 용량                                         |
| Used | 파일 시스템의 사용된 용량                                        |
| Available               | 파일 시스템의 남은 용량                                       |
| UseRate           | 파일 시스템 용량의 사용 비율                                      |
| MountOn          | 파일 시스템의 마운트 디렉터리                                        |

## 액세스 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한               | 객체 | 비고 |
|-------------------------|----|----|
| ADMIN_PRIV 또는 NODE_PRIV |    |    |

## 사용 시 참고 사항 {#usage-notes}

쿼리 결과를 추가로 필터링해야 하는 경우 테이블 반환 함수 [frontends_disks()](../../../sql-functions/table-valued-functions/frontends_disks.md)를 사용할 수 있습니다. SHOW BACKENDS는 다음 문과 동일합니다.

```sql
SELECT * FROM FRONTENDS_DISKS();
```

## 예제 {#examples}

```sql
SHOW FRONTENDS DISKS; 
```

```text
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| Name                                    | Host        | DirType   | Dir                             | Filesystem | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | meta      | /home/disk/output/fe/doris-meta | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | log       | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | audit-log | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | temp      | /home/disk/output/fe/temp_dir   | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | deploy    | /home/disk/output/fe            | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
```
