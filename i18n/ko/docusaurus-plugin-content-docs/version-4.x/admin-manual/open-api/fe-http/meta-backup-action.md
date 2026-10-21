---
{
    "title": "메타데이터 백업 작업",
    "language": "ko",
    "description": "컴퓨팅-스토리지 분리 모드에서 FE 메타데이터를 백업하는 HTTP API입니다. 메타데이터 동기화 지점을 생성하고 이미지와 BDBJE 로그를 내보냅니다.",
    "keywords": [
        "Doris metadata backup",
        "compute-storage decoupled metadata",
        "sync_cloud_meta",
        "export_meta",
        "meta sync point",
        "BDBJE backup",
        "FE image export",
        "FDB backup",
        "cloud meta backup"
    ]
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Decoupled metadata backup / Disaster recovery drill / Consistent FE and FDB snapshot -->

컴퓨팅-스토리지 분리 모드에서 클러스터 메타데이터는 두 곳에 저장됩니다. FE 측에는 이미지와 BDBJE 편집 로그가, Meta Service 측에는 FoundationDB(FDB)가 저장됩니다. 이를 각각 독립적으로 백업하면 백업 시점이 서로 달라져 복원 시 정합성이 맞지 않을 수 있습니다.

이 API는 먼저 FE와 FDB 사이에 **메타데이터 동기화 지점**을 생성한 다음, 해당 동기화 지점을 기준으로 FE 메타데이터를 내보내는 방식으로 이 문제를 해결합니다. 따라서 두 백업의 시점을 동일하게 맞출 수 있습니다.

:::info 버전 참고

이 기능은 4.0.8 버전부터 지원되며 **컴퓨팅-스토리지 분리 모드에서만 사용할 수 있습니다**. 스토리지-컴퓨팅 통합 모드에서 호출하면 오류가 반환됩니다.

:::

## API 개요 {#api-overview}

| API | 메서드 | 용도 |
| --- | --- | --- |
| `/rest/v2/manager/backup/sync_cloud_meta` | POST | FE와 FDB 사이에 메타데이터 동기화 지점을 생성하고 해당 동기화 지점의 저널 ID, 커밋 버전, versionstamp를 반환합니다 |
| `/rest/v2/manager/backup/export_meta` | POST | FE 이미지, 메타 파일, BDBJE 로그를 지정한 디렉터리로 내보냅니다 |

## 사전 요구 사항 {#prerequisites}

- 클러스터가 컴퓨팅-스토리지 분리 모드로 실행 중이어야 합니다(FE 설정 `deploy_mode = cloud`).
- 호출 계정에 `ADMIN` 권한이 있어야 합니다.
- 두 API 모두 **Master FE**에서 실행해야 합니다. Master가 아닌 FE에서 호출하면 기본적으로 응답에 Master 주소가 반환됩니다. 자동으로 리디렉션하려면 URL에 `allow_redirect=true`를 추가하세요.
- `export_meta`를 사용하려면 FE 설정이 `edit_log_type = bdb`여야 합니다(기본값).

## 메타데이터 동기화 지점 생성 {#create-a-meta-sync-point}

<!-- Knowledge Type: Operational Steps -->

**목적**: FE와 FDB 백업의 시점을 맞추는 기준으로 사용할 동기화 지점을 Meta Service에 기록하고 FE 편집 로그에도 기록합니다.

```shell
curl -u <user>:<passwd> -X POST \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/sync_cloud_meta"
```

**응답 예시:**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "journal_id": 1024,
        "committed_version": 20250811000000,
        "versionstamp": "0000000000000001"
    },
    "count": 0
}
```

**응답 필드:**

| 필드 | 설명 |
| --- | --- |
| `journal_id` | FE 편집 로그에 기록된 해당 동기화 지점의 저널 ID |
| `committed_version` | Meta Service가 반환한 커밋 버전 |
| `versionstamp` | FDB 백업과 시점을 맞추는 데 사용하는 해당 FDB versionstamp |

## FE 메타데이터 내보내기 {#export-fe-metadata}

<!-- Knowledge Type: Operational Steps -->

**목적**: 현재 FE 이미지와 BDBJE 로그를 로컬 디렉터리로 내보내 복원 가능한 FE 메타데이터 백업을 생성합니다.

```shell
curl -u <user>:<passwd> -X POST \
    -H "Content-Type: application/json" \
    -d '{"target_dir": "/path/to/backup/dir"}' \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/export_meta"
```

**요청 본문 매개변수:**

| 매개변수 | 유형 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `target_dir` | String | 예 | 내보낼 대상 디렉터리의 절대 경로입니다. 디렉터리가 없으면 생성합니다. **이미 존재하는 경우에는 먼저 디렉터리의 모든 내용을 삭제합니다** |

**응답 예시:**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "target_dir": "/path/to/backup/dir",
        "bdb_dir": "/path/to/backup/dir/bdb",
        "bdb_file_count": 12,
        "image_file": "image.1024",
        "image_version": 1024,
        "image_exported": true,
        "journal_upper_bound": 2048
    },
    "count": 0
}
```

**응답 필드:**

| 필드 | 설명 |
| --- | --- |
| `target_dir` | 내보내기에 실제로 사용된 디렉터리의 절대 경로 |
| `bdb_dir` | 내보낸 BDBJE 로그 파일이 저장된 하위 디렉터리 |
| `bdb_file_count` | 내보낸 BDBJE 로그 파일 수 |
| `image_file` | 내보낸 이미지 파일의 이름. 이미지가 없으면 `null` |
| `image_version` | 내보낸 이미지의 버전 |
| `image_exported` | 이미지 파일을 성공적으로 내보냈는지 여부 |
| `journal_upper_bound` | 내보내기 시점에 BDBJE에 존재하는 가장 큰 저널 ID |

**내보내기 디렉터리 구조:**

```text
<target_dir>/
├── image/
│   ├── image.<version>     # The latest image file
│   ├── MODE                # Deployment mode file
│   ├── ROLE                # FE role file
│   └── VERSION             # Cluster version file
└── bdb/
    └── *.jdb               # BDBJE log files
```

내보내는 동안 FE는 체크포인트 읽기 잠금을 유지하므로 이미지를 복사하는 도중에 이미지가 교체되지 않습니다. 이미지와 메타 파일은 가능한 경우 하드 링크로 내보내며, 하드 링크를 사용할 수 없으면 파일 복사 방식으로 처리합니다.

## 전체 백업 절차 {#full-backup-procedure}

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Scheduled metadata backup / Disaster recovery drill -->

1. `sync_cloud_meta`를 호출하고 반환된 `versionstamp`와 `committed_version`을 기록합니다.
2. 해당 `versionstamp`를 기준으로 FDB 측 메타데이터를 백업합니다.
3. `export_meta`를 호출하여 FE 메타데이터를 백업 디렉터리로 내보냅니다.
4. 복원 시 두 백업이 동일한 시점의 백업인지 확인할 수 있도록 `versionstamp`, `committed_version`, 내보내기 디렉터리를 함께 보관합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge Type: Troubleshooting -->

| 증상 | 원인 | 해결 방법 |
| --- | --- | --- |
| `only works on the cloud mode` 반환 | 클러스터가 컴퓨팅-스토리지 분리 모드가 아닙니다 | 이 API는 컴퓨팅-스토리지 분리 모드에서만 사용할 수 있습니다 |
| `current fe is not master, master is <host>:<port>` 반환 | 요청이 Master가 아닌 FE로 전송되었습니다 | Master FE로 요청을 보내거나 URL에 `allow_redirect=true`를 추가하세요 |
| `target_dir is required` 반환 | 요청 본문에 `target_dir`이 없습니다 | JSON 요청 본문에 `target_dir`을 지정하세요 |
| `only bdb edit_log_type supports bdbje export` 반환 | FE의 `edit_log_type`이 `bdb`가 아닙니다 | 이 API는 BDBJE 편집 로그만 지원합니다 |
| `export failed: bdb min journal id ... is greater than image_version + 1` 반환 | BDBJE의 가장 오래된 저널이 이미지가 포함하는 범위보다 뒤에 있어 내보낸 백업의 로그를 연속적으로 재생할 수 없습니다 | 체크포인트를 실행해 더 최신 이미지를 생성한 뒤 다시 내보내세요 |
| `target_dir exists but is not a directory` 반환 | `target_dir`이 파일을 가리킵니다 | 디렉터리 경로를 사용하세요 |
