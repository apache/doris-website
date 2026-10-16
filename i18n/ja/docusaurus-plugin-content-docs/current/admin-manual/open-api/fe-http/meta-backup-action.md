---
{
    "title": "メタデータバックアップ操作",
    "language": "ja",
    "description": "ストレージ・コンピュート分離モードで FE メタデータをバックアップする HTTP API。メタデータ同期ポイントを作成し、イメージと BDBJE ログをエクスポートします。",
    "keywords": [
        "Doris メタデータのバックアップ",
        "ストレージ・コンピュート分離型のメタデータ",
        "sync_cloud_meta",
        "export_meta",
        "メタデータ同期ポイント",
        "BDBJE バックアップ",
        "FE イメージのエクスポート",
        "FDB バックアップ",
        "クラウドメタデータのバックアップ"
    ]
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Decoupled metadata backup / Disaster recovery drill / Consistent FE and FDB snapshot -->

ストレージ・コンピュート分離モードでは、クラスターのメタデータは二か所にあります。FE 側のイメージと BDBJE 編集ログ、および Meta Service 側の FoundationDB（FDB）です。これらを個別にバックアップすると、バックアップ時点が一致せず、復元時に整合しない可能性があります。

この問題に対処するため、まず FE と FDB の間に**メタデータ同期ポイント**を作成し、その同期ポイントに基づいて FE メタデータをエクスポートします。これにより、両方のバックアップを同じ時点に合わせられます。

:::info バージョンに関する注記

この機能はバージョン 4.0.8 以降でサポートされ、**ストレージ・コンピュート分離モードでのみ使用できます**。ストレージ・コンピュート一体型モードで呼び出すとエラーが返されます。

:::

## API の概要

| API | メソッド | 用途 |
| --- | --- | --- |
| `/rest/v2/manager/backup/sync_cloud_meta` | POST | FE と FDB の間にメタデータ同期ポイントを作成し、その同期ポイントのジャーナル ID、コミット済みバージョン、バージョンスタンプを返します |
| `/rest/v2/manager/backup/export_meta` | POST | FE のイメージ、メタデータファイル、BDBJE ログを指定したディレクトリにエクスポートします |

## 前提条件

- クラスターがストレージ・コンピュート分離モードで稼働していること（FE 設定 `deploy_mode = cloud`）。
- 呼び出し元のアカウントに `ADMIN` 権限があること。
- 両方の API を **Master FE** で実行すること。Master 以外の FE で呼び出すと、デフォルトではレスポンスに Master のアドレスが返されます。自動的にリダイレクトするには、URL に `allow_redirect=true` を追加します。
- `export_meta` を使用するには、FE の設定 `edit_log_type = bdb`（デフォルト）が必要です。

## メタデータ同期ポイントの作成

<!-- Knowledge Type: Operational Steps -->

**目的**：Meta Service に同期ポイントを記録し、FE 編集ログに書き込みます。これが FE と FDB のバックアップを対応付ける基準になります。

```shell
curl -u <user>:<passwd> -X POST \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/sync_cloud_meta"
```

**レスポンス例：**

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

**レスポンスフィールド：**

| フィールド | 説明 |
| --- | --- |
| `journal_id` | FE 編集ログにおける、この同期ポイントのジャーナル ID |
| `committed_version` | Meta Service が返したコミット済みバージョン |
| `versionstamp` | 対応する FDB のバージョンスタンプ。FDB バックアップとの対応付けに使用します |

## FE メタデータのエクスポート

<!-- Knowledge Type: Operational Steps -->

**目的**：現在の FE イメージと BDBJE ログをローカルディレクトリにエクスポートし、復元可能な FE メタデータのバックアップを作成します。

```shell
curl -u <user>:<passwd> -X POST \
    -H "Content-Type: application/json" \
    -d '{"target_dir": "/path/to/backup/dir"}' \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/export_meta"
```

**リクエストボディのパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `target_dir` | String | はい | エクスポート先ディレクトリの絶対パス。存在しない場合は作成されます。**すでに存在する場合は、最初にその中のすべての内容が削除されます** |

**レスポンス例：**

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

**レスポンスフィールド：**

| フィールド | 説明 |
| --- | --- |
| `target_dir` | 実際に使用したエクスポート先ディレクトリの絶対パス |
| `bdb_dir` | エクスポートした BDBJE ログファイルを格納するサブディレクトリ |
| `bdb_file_count` | エクスポートした BDBJE ログファイルの数 |
| `image_file` | エクスポートしたイメージファイルの名前。イメージが存在しない場合は `null` |
| `image_version` | エクスポートしたイメージのバージョン |
| `image_exported` | イメージファイルのエクスポートに成功したかどうか |
| `journal_upper_bound` | エクスポート時点で BDBJE に存在する最大のジャーナル ID |

**エクスポート先ディレクトリの構成：**

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

エクスポート中、FE はチェックポイントの読み取りロックを保持するため、コピー中にイメージが置き換えられることはありません。イメージとメタデータファイルは、可能であればハードリンクを作成します。ハードリンクを使用できない場合は、ファイルをコピーします。

## バックアップの全手順

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Scheduled metadata backup / Disaster recovery drill -->

1. `sync_cloud_meta` を呼び出し、返された `versionstamp` と `committed_version` を記録します。
2. その `versionstamp` に基づいて FDB 側のメタデータをバックアップします。
3. `export_meta` を呼び出し、FE メタデータをバックアップディレクトリにエクスポートします。
4. 復元時に両方のバックアップが同じ時点のものであることを確認できるよう、`versionstamp`、`committed_version`、エクスポート先ディレクトリをまとめて保管します。

## FAQ

<!-- Knowledge Type: Troubleshooting -->

| 症状 | 原因 | 対処方法 |
| --- | --- | --- |
| `only works on the cloud mode` が返される | クラスターがストレージ・コンピュート分離モードではない | これらの API はストレージ・コンピュート分離モードでのみ使用できます |
| `current fe is not master, master is <host>:<port>` が返される | Master 以外の FE にリクエストが送信された | Master FE にリクエストを送信するか、URL に `allow_redirect=true` を追加します |
| `target_dir is required` が返される | リクエストボディに `target_dir` がない | JSON リクエストボディに `target_dir` を指定します |
| `only bdb edit_log_type supports bdbje export` が返される | FE の `edit_log_type` が `bdb` ではない | この API は BDBJE 編集ログのみをサポートします |
| `export failed: bdb min journal id ... is greater than image_version + 1` が返される | BDBJE の最も古いジャーナル ID がイメージの対応範囲を超えており、エクスポートしたバックアップを連続して再生できない | チェックポイントを実行して新しいイメージを作成し、再度エクスポートします |
| `target_dir exists but is not a directory` が返される | `target_dir` がファイルを指している | ディレクトリのパスを指定します |
