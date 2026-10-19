---
{
    "title": "FRONTENDS_DISKS",
    "language": "ko",
    "description": "frontendsdisks 테이블 함수는 현재 Doris 클러스터에 있는 FE 노드의 디스크 정보를 조회할 수 있는 임시 테이블을 생성합니다."
}
---

## 설명 {#description}

`frontends_disks` 테이블 함수는 현재 Doris 클러스터에 있는 FE 노드의 디스크 정보를 조회할 수 있는 임시 테이블을 생성합니다. 결과는 기본적으로 `show frontends disks` 문에 표시되는 정보와 같지만, `frontends_disks()`의 필드 타입이 더 명확하며 TVF가 생성한 테이블에서 필터링, 조인 등의 연산을 수행할 수 있습니다.

이 함수는 `FROM` 절에서 사용할 수 있습니다.


## 구문 {#syntax}
```sql
FRONTENDS_DISKS()
```

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한  | 객체 | 설명 |
| :--------- |:-------|:------|
| SELECT_PRIV | internal.information_schema | 모든 사용자는 기본적으로 이 데이터베이스에 대한 권한을 가집니다 |


## 반환값 {#return-value}

frontends_disks() 함수가 반환하는 필드를 확인합니다.

```sql
desc function frontends_disks();
```
```text
+------------+------+------+-------+---------+-------+
| Field      | Type | Null | Key   | Default | Extra |
+------------+------+------+-------+---------+-------+
| Name       | text | No   | false | NULL    | NONE  |
| Host       | text | No   | false | NULL    | NONE  |
| DirType    | text | No   | false | NULL    | NONE  |
| Dir        | text | No   | false | NULL    | NONE  |
| Filesystem | text | No   | false | NULL    | NONE  |
| Capacity   | text | No   | false | NULL    | NONE  |
| Used       | text | No   | false | NULL    | NONE  |
| Available  | text | No   | false | NULL    | NONE  |
| UseRate    | text | No   | false | NULL    | NONE  |
| MountOn    | text | No   | false | NULL    | NONE  |
+------------+------+------+-------+---------+-------+
```

각 필드의 의미는 다음과 같습니다.

| 필드        | 타입    | 설명                                                                                 |
|--------------|---------|---------------------------------------------------------------------------------------------|
| `Name`       | TEXT    | 프런트엔드 노드(FE)의 고유 식별자입니다.                                            |
| `Host`       | TEXT    | 프런트엔드 노드의 IP 주소 또는 호스트 이름입니다.                                            |
| `DirType`    | TEXT    | 디렉터리 유형입니다(예: `meta`, `log`, `audit-log`, `temp`, `deploy`).                  |
| `Dir`        | TEXT    | 지정된 디렉터리 유형에 해당하는 디스크상의 디렉터리 경로입니다.                      |
| `Filesystem` | TEXT    | 파일 시스템 유형입니다.                                           |
| `Capacity`   | TEXT    | 디스크의 총 저장 용량입니다.                                                      |
| `Used`       | TEXT    | 사용 중인 디스크 공간의 크기입니다.                                                 |
| `Available`  | TEXT    | 사용 가능한 디스크 공간의 크기입니다.                                          |
| `UseRate`    | TEXT    | 사용 중인 디스크 공간의 비율입니다.                                                  |
| `MountOn`    | TEXT    | 파일 시스템에서 디스크가 마운트된 지점입니다.                                              |


## 예제 {#example}
```sql
select * from frontends_disks();
```
```text
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| Name                                    | Host       | DirType   | Dir                                                       | Filesystem   | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | meta      | /mnt/disk2/doris/fe/doris-meta | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | log       | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | audit-log | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | temp      | /mnt/disk2/doris/fe/temp_dir   | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | deploy    | /mnt/disk2/doris/fe            | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
```
