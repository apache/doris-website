---
{
    "title": "クラスターのアップグレード",
    "language": "ja",
    "description": "Apache Doris クラスターのローリングアップグレードガイド。バージョン互換性のルール、メタデータ互換性テスト、BE/FE ノードのアップグレード手順、よくある問題への対処方法を説明します。",
    "keywords": [
        "Doris のアップグレード",
        "Doris のローリングアップグレード",
        "Doris クラスターのアップグレード",
        "FE のアップグレード",
        "BE のアップグレード",
        "メタデータ互換性テスト",
        "metadata_failure_recovery",
        "disable_balance",
        "レプリカの修復とバランシング",
        "Doris のバージョン番号",
        "バージョンをまたぐアップグレード",
        "カナリアアップグレード"
    ]
}
---

Apache Doris では、FE ノードと BE ノードのバイナリを段階的に入れ替えるローリングアップグレードを利用できます。これにより、ダウンタイムを最小限に抑え、アップグレード中もクラスターを利用できます。このドキュメントはクラスター管理者向けに、バージョン互換性のルール、メタデータ互換性テストの手順、具体的なアップグレード手順を説明します。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Cluster upgrade / Version iteration / Rolling upgrade -->

## 適用シナリオ

| シナリオ | 対応可否 | 備考 |
| --- | --- | --- |
| 同じマイナーバージョン内でのパッチバージョンのアップグレード（例：2.1.3 から 2.1.7） | 対応 | ローリングアップグレードを直接実行できます |
| マイナーバージョンをまたぐアップグレード（例：3.0 から 3.3） | 段階的に対応 | 3.0 から 3.1、3.1 から 3.2、3.2 から 3.3 の順にアップグレードします |
| メジャーバージョンのアップグレード（例：2.x から 3.x） | 段階的に対応 | メジャーバージョンを直接またぐアップグレードは推奨しません。マイナーバージョンごとに順番にアップグレードします |
| FE が単一のクラスターのアップグレード | 互換性テスト後に対応 | 先に FE を 3 台の高可用性構成に増やすか、アップグレード前にメタデータ互換性テストを実行します |
| メタデータに互換性がない可能性のあるバージョン間のアップグレード | 互換性テスト後に対応 | アップグレード前にメタデータの互換性を確認する必要があります |

## 前提条件

アップグレード前に、次の事項を確認してください。

- 対象バージョンのリリースノートを読み、バージョン間の動作変更と互換性を理解していること。
- アップグレードの失敗によるデータ損失を防ぐため、データを 3 レプリカで保存していること。
- クライアント側のタスクにリトライ処理が実装されていること（後述の「アップグレード時の注意事項」を参照）。
- メタデータ互換性テストに使用できる開発用マシンまたは BE ノードがあること。
- 対象バージョンのインストールパッケージをダウンロードして展開済みであること（以下の手順では、`${DORIS_NEW_HOME}` は新バージョンのルートディレクトリ、`${DORIS_OLD_HOME}` は本番環境で稼働中の旧バージョンのルートディレクトリを指します）。

## バージョン互換性

Doris のバージョン番号は三桁で構成されます。最初の桁はメジャーマイルストーンバージョン、二番目の桁は機能バージョン、三番目の桁はバグ修正バージョンです。三番目の桁だけが変わるバージョンでは新機能はリリースされません。Doris 2.1.3 を例に説明します。

| 桁 | 値の例 | 意味 |
| --- | --- | --- |
| 最初の桁 | 2 | 2 番目のマイルストーンバージョン |
| 二番目の桁 | 1 | そのマイルストーン内の機能バージョン |
| 三番目の桁 | 3 | その機能バージョン内の 3 番目のバグ修正バージョン |

アップグレード時には、次のルールに従ってください。

| アップグレードの種類 | バージョンをまたぐアップグレード | 推奨される経路 |
| --- | --- | --- |
| 三番目の桁のバージョン（二番目の桁が同じ） | 対応 | 例えば 2.1.3 から 2.1.7 へ直接アップグレードします |
| 二番目の桁のバージョン | 飛び越しは非推奨 | 例えば 3.0 から 3.1、3.2、3.3 へと、二番目の桁のバージョンごとに順番にアップグレードします |
| 最初の桁のバージョン | 飛び越しは非推奨 | まず同じ最初の桁の最新の二番目の桁のバージョンにアップグレードし、その後メジャーバージョンをまたいでアップグレードします |

バージョンの詳細については、[バージョン番号のルール](https://doris.apache.org/community/release-and-verify/release-versioning)を参照してください。

## アップグレード時の注意事項

<!-- Knowledge type: Pre-operation check -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード前に、次の三点に注意してください。

| 注意事項 | 対応方法 |
| --- | --- |
| バージョン間の動作変更 | アップグレード前に対象バージョンのリリースノートを読み、互換性のない動作変更がないか確認します |
| クライアント側のタスクのリトライ | アップグレード中はノードを順番に再起動するため、Stream Load とクエリのタスクにはリトライ処理が必要です。Routine Load、Flink Doris Connector、Spark Doris Connector にはリトライ処理が組み込まれているため、追加の対応は不要です |
| レプリカの修復とバランシング | アップグレード前にレプリカの修復とバランシングを無効にする必要があります。アップグレードの成否にかかわらず、完了後に再度有効にする必要があります |

:::caution 注意

Doris のアップグレードでは、FE ディレクトリ配下の `/bin` と `/lib`、および BE ディレクトリ配下の `/bin` と `/lib` を入れ替えるだけで済みます。

バージョン 2.0.2 以降では、FE と BE のデプロイ先に `custom_lib/` ディレクトリが追加されています（存在しない場合は手動で作成してください）。これは、ユーザー定義のサードパーティー製 jar ファイル（`hadoop-lzo-*.jar` や `orai18n.jar` など）を格納するためのディレクトリです。アップグレード時にこのディレクトリを入れ替える必要はありません。

:::

## メタデータ互換性テスト

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade verification / Metadata compatibility -->

メタデータ互換性テストでは、新バージョンが既存のメタデータを正しく読み込めるか、アップグレード前に確認します。これにより、アップグレード失敗に伴うデータ損失を防ぎます。アップグレードのたびにこのテストを実行することを推奨します。

:::caution 注意

本番環境では、FE ノードを 3 台以上にした高可用性構成を推奨します。FE ノードが 1 台だけの場合、アップグレード前にメタデータ互換性テストを必ず実行してください。メタデータの互換性は重要です。互換性の問題によってアップグレードに失敗すると、データが失われる可能性があります。

次の点にも注意してください。

- メタデータ互換性テストは開発用マシンまたは BE ノードで実行し、FE ノードでの実行を避けることを推奨します。
- FE ノードでしかテストを実行できない場合は、Master 以外のノードを選び、先にそのノードの元の FE プロセスを停止してください。

:::

### 1. メタデータをバックアップする

アップグレードを始める前に、Master FE ノードのメタデータをバックアップします。

Master FE ノードは `IsMaster` 列（`show frontends` の出力）で確認できます。FE のメタデータは FE プロセスを停止せずにバックアップできます。FE のメタデータはデフォルトで `fe/doris-meta` ディレクトリに保存されます。`meta_dir` パラメータ（`fe.conf` 内）でもメタデータディレクトリを確認できます。

### 2. テスト用の FE 設定ファイルを変更する

テスト環境の `fe.conf` を編集します。

```shell
vi ${DORIS_NEW_HOME}/conf/fe.conf
```

すべてのポートを本番環境とは異なる値に設定し、`clusterId` パラメータも変更します。

```text
...
## modify port
http_port = 18030
rpc_port = 19020
query_port = 19030
arrow_flight_sql_port = 19040
edit_log_port = 19010

## modify clusterIP
clusterId=<a_new_clusterID, such as 123456>
...
```

テスト環境のポート設定例を以下に示します。

| パラメータ | 設定例 | 説明 |
| --- | --- | --- |
| `http_port` | 18030 | FE の HTTP サービスポート |
| `rpc_port` | 19020 | FE の Thrift Server ポート |
| `query_port` | 19030 | FE の MySQL プロトコル用クエリポート |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL ポート |
| `edit_log_port` | 19010 | FE の BDBJE 通信ポート |
| `clusterId` | 123456 | テストクラスターの ID。本番環境とは異なる値にする必要があります |

### 3. Master FE のメタデータをコピーする

バックアップした Master FE のメタデータを、新しい互換性テスト環境にコピーします。

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. メタデータの VERSION ファイル内の cluster\_id を変更する

コピーしたメタデータディレクトリで、`cluster_id`（`VERSION` ファイル内）を新しいクラスター ID に変更します。上記の例では 123456 です。

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. テスト環境で FE プロセスを起動する

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

2.0.2 より前のバージョンでは、まず `metadata_failure_recovery=true` を `fe.conf` に追加してから FE プロセスを起動します。

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. FE が正常に起動したことを確認する

上記の例の `query_port` 19030 を指定し、MySQL クライアントからテスト用 FE に接続します。

```shell
mysql -uroot -P19030 -h127.0.0.1
```

接続に成功すれば、新バージョンは現在のメタデータを正しく読み込めており、メタデータ互換性テストは合格です。

## アップグレード全体の流れ

アップグレード全体の流れは次のとおりです。必ずこの順番で実行してください。

1. レプリカの修復とバランシングを無効にする。
2. BE ノードをアップグレードする（複数レプリカのクラスターではカナリアアップグレードが可能）。
3. FE ノードをアップグレードする（Observer/Follower ノードを先に、Master ノードを最後にアップグレードする）。
4. レプリカの修復とバランシングを再度有効にする。

基本原則は、**先に BE、その後に FE をアップグレードする**ことです。FE のアップグレードでは、**Observer FE と Follower FE ノードを先に、Master FE ノードを最後にアップグレードします**。

## アップグレード手順

### ステップ 1：レプリカの修復とバランシングを無効にする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード中はノードを再起動するため、不要なクラスターのバランシングやレプリカの修復が発生することがあります。まず、次の三つの設定を無効にします。

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

対象の設定は次のとおりです。

| 設定 | アップグレード前の値 | 効果 |
| --- | --- | --- |
| `disable_balance` | `true` | レプリカのバランシングを無効にし、ノードの再起動によるレプリカの移動を防ぎます |
| `disable_colocate_balance` | `true` | Colocate Join テーブルのレプリカのバランシングを無効にします |
| `disable_tablet_scheduler` | `true` | タブレットのスケジューリングを無効にし、レプリカの修復を防ぎます |

### ステップ 2：BE ノードをアップグレードする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: BE rolling upgrade -->

:::info 注意

データの安全性を確保するため、データを 3 レプリカで保存し、アップグレード時の操作ミスや失敗によるデータ損失を防いでください。

:::

複数レプリカのクラスターでは、BE ノードを一台選んでカナリアアップグレードできます。検証後に、残りのノードを一台ずつアップグレードします。

#### 2.1 対象の BE ノードを停止する

```shell
sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
```

#### 2.2 既存の `/bin` と `/lib` ディレクトリをバックアップする

```shell
mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
```

#### 2.3 新バージョンの `/bin` と `/lib` ディレクトリをコピーする

```shell
cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
```

#### 2.4 BE ノードを起動する

```shell
sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
```

#### 2.5 アップグレードを確認する

クラスターに接続し、ノード情報を確認します。

```sql
show backends\G
```

BE ノードの `Alive` が `true` で、`Version` が新バージョンであれば、そのノードのアップグレードは成功です。確認後、残りの BE ノードも同じ方法で一台ずつアップグレードします。

### ステップ 3：FE ノードをアップグレードする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: FE rolling upgrade -->

FE ノードが複数ある場合は、Master 以外のノード（Observer または Follower）を先にアップグレードし、ほかのすべてのノードが完了してから Master ノードを最後にアップグレードします。

#### 3.1 対象の FE ノードを停止する

```shell
sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
```

#### 3.2 既存のディレクトリをバックアップする

`/bin`、`/lib`、`/mysql_ssl_default_certificate` の三つのディレクトリをバックアップします。

```shell
mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
```

#### 3.3 新バージョンのディレクトリをコピーする

```shell
cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
```

#### 3.4 FE ノードを起動する

```shell
sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
```

#### 3.5 アップグレードを確認する

クラスターに接続し、ノード情報を確認します。

```sql
show frontends\G
```

FE ノードの `Alive` が `true` で、`Version` が新バージョンであれば、そのノードのアップグレードは成功です。

#### 3.6 残りの FE ノードを一台ずつアップグレードする

Master 以外の FE ノードを同じ方法で一台ずつアップグレードし、**Master FE ノードを最後にアップグレードします**。

### ステップ 4：レプリカの修復とバランシングを再度有効にする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Post-upgrade cleanup -->

アップグレードが完了し、すべての BE ノードの `Alive` が true に戻ったら、クラスターのレプリカの修復とバランシングを再度有効にします。

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## バージョン別のアップグレード時の注意事項

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Cross-version upgrade / Confirming post-upgrade behavior changes -->

このセクションでは、特定のバージョンへアップグレードする際に特に注意が必要な動作変更を説明します。変更内容の全体については、このセクションに加えて、必ず対象バージョンのリリースノートを確認してください。

### 3.x から 4.0 へのアップグレード時のセッション変数の移行

FE は、内部変数 `variable_version` を使ってセッション変数のデフォルト値の移行状況を追跡します。3.x から 4.0 にアップグレードするとき（`variable_version` が 400 未満の場合）、FE は次の変数の**グローバルデフォルト値**を自動的に調整します。

| 変数 | 移行後のデフォルト値 | 説明 |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | 3.x のクエリ構成の動作を維持し、アップグレード後にセマンティクスが変わらないようにします |
| `enable_new_type_coercion_behavior` | `false` | 3.x の型強制変換の動作を維持します |
| `enable_sql_cache` | `true` | SQL Cache を有効にします |
| `enable_nereids_distribute_planner` | `true` | **バージョン 4.0.8 で追加された移行項目**です。以下を参照してください |

この移行は、`variable_version` が 400 未満から 400 に上がるときに一度だけ実行されます。その後ユーザーが明示的に設定した値が上書きされることはありません。

### 4.0.8 へのアップグレード

:::caution Nereids 分散プランナーが有効になります

バージョン 4.0.8 以降では、3.x から 4.0 にアップグレードすると、Nereids 分散プランナー（`enable_nereids_distribute_planner`）が有効になります。

4.0.8 より前は、クラスターのメタデータイメージに `enable_nereids_distribute_planner=false` が保存されていた場合、アップグレード後もその値がそのまま復元され、従来の分散プランナーが使われ続けていました。バージョン 4.0.8 では、この変数が `variable_version=400` の移行対象に追加され、アップグレード後は一貫して新しい分散プランナーが有効になります。

クエリプランの分散がアップグレード前と異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

4.0.8 へのアップグレード時には、次の変更にも注意してください。

| 変更内容 | 影響を受ける範囲 | 対応方法 |
| --- | --- | --- |
| メモリ使用量が高いときに Compaction が一時停止されなくなります（BE 設定 `enable_compaction_pause_on_high_memory` のデフォルト値が `true` → `false` に変更） | すべてのデプロイ形態 | 従来の動作を維持するには `true` に戻します。[BE の設定](../config/be-config)を参照してください |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成したテーブル | 新しく作成されるパーティションのみが影響を受けます。[データのバケット分割](../../table-design/data-partitioning/data-bucketing)を参照してください |
| BE の `_stream_load_forward` エンドポイントでは、設定による有効化とリクエストの認証が必要になります | 分離モードで Group Commit の BE 転送を利用している環境 | `enable_group_commit_streamload_be_forward=true` をすべての `be.conf` に設定し、ロード用アカウントにグローバルな `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |
| ノード管理 API でグローバルな `ADMIN` 権限が必要になります | `/rest/v2/manager/node/{action}/{be\|fe\|broker}` を呼び出す自動化処理 | 呼び出し元に `ADMIN` アカウントによる認証を追加します。[Node Action](../open-api/fe-http/node-action)を参照してください |
| Stream Load で、実際にリクエストを処理するコンピュートグループへのアカウントのアクセス権が検証されます | 分離モードの Stream Load | ロード用アカウントに、該当するコンピュートグループへのアクセス権を付与します。[Stream Load](../../data-operate/import/import-way/stream-load-manual)を参照してください |
| 分離モードでデータサイズが一貫してリモートサイズとして報告されます | `SHOW TABLETS` または `information_schema.partitions` から容量を計算するスクリプト | 代わりに `REMOTE_DATA_SIZE` を使用します。[partitions](../system-tables/information_schema/partitions)を参照してください |
| Routine Load ジョブの機密性の高い Kafka プロパティが、クエリ結果で `******` としてマスクされます | `SHOW ROUTINE LOAD` から認証情報を読み取るスクリプト | 元の値は構成管理システムから取得します。[SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD)を参照してください |
| ウォームアップのタイムスタンプ形式が `HH:mm:ss` から `yyyy-MM-dd HH:mm:ss` に変わります | ウォームアップジョブの状態を解析するスクリプト | 時刻の解析形式を調整します。[読み書き分離](../../compute-storage-decoupled/rw/read-write-separation)を参照してください |
| スキャンエラーに `failed to initialize storage reader` というプレフィックスが付かなくなります | このプレフィックスに一致させる監視ルール | 代わりにエラーコードと `tablet=` / `backend=` の情報を使用します |

### 4.1.4 へのアップグレード

:::caution Nereids 分散プランナーが有効になります

バージョン 4.1.4 以降では、**3.x から 4.1.4 への**アップグレード時に、セッション変数 `enable_nereids_distribute_planner` のグローバルデフォルト値が `true` に更新されます。4.0 系列では 4.0.8 以降、同じ動作になっています。

この更新は、クラスターの `variable_version` が `400` 未満の場合にのみ行われます。そのため、すでに 4.0.x または 4.1.x で稼働しているクラスターでは、この変数の保存済みの値が維持されます。

クエリプランの分散がアップグレード前と異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

:::caution 浮動小数点値の文字列表現が変わります

バージョン 4.1.4 以降では、FLOAT / DOUBLE 値を文字列に変換すると、固定桁数の有効数字ではなく、**同じ値に再変換できる最短の文字列**が生成されます。保存されている値は変わりませんが、テキスト表現は 4.1.3 と異なる場合があります（例えば `246.9120025634766` は `246.91200256347656` に、`0.0000123456` は `1.23456e-05` になります）。

この変更は、MySQL プロトコルのクエリ結果、`CAST(... AS STRING)`、複合型 / JSON / VARIANT の表示、`SELECT INTO OUTFILE`、EXPORT、および外部テーブルの浮動小数点列に影響します。下流のシステムで浮動小数点値の文字列表現を完全一致で比較している場合は、アップグレード後に調整してください。[浮動小数点型](../../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)を参照してください。

:::

4.1.4 へのアップグレード時には、次の変更にも注意してください。

**削除されたインターフェースと構文**

| 変更内容 | 影響を受ける範囲 | 対応方法 |
| --- | --- | --- |
| `iceberg_meta()` テーブル関数が削除されます | このテーブル関数で Iceberg のメタデータを読み取る SQL | 代わりに Iceberg システムテーブル `<table>$<system_table_name>` を使用します。[ICEBERG_META](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta)を参照してください |
| FE の `/api/<ns>/<db>/<tbl>/upload` エンドポイントと、FE 設定 `http_load_submitter_max_worker_threads` が削除されます | これらのエンドポイント経由でロード用の小さなファイルをアップロードするスクリプト | 代わりに Stream Load または S3 / HDFS / LOCAL TVF を使用します。[Upload Action](../open-api/fe-http/upload-action)を参照してください |
| `PLAN REPLAYER PLAY '<file>'` ステートメントが削除されます | minidump を再生するデバッグ処理 | `PLAN REPLAYER DUMP` のみが残ります |
| ワークロードポリシーの `set_session_variable` アクションが削除されます | このアクションを使うワークロードポリシー | 代わりに `cancel_query` / `move_query_to_group` を使用します |
| BE 設定 `get_stack_trace_tool` が削除され、BE のスレッドスタック HTTP 出力のフィールドが変わります | BE のスレッドスタックを収集するスクリプト | 新しい出力フィールドを解析します |
| 分離モードの BE 設定 `s3_client_retry_slow_down` が削除されます | この設定で S3 のスロットリング時のリトライを制御している環境 | 設定は不要です。BE は S3 の 429 / 503 に対して常にリトライし、Recycler はリトライしません |
| クエリプロファイルから `HdfsIO` タイマーとその七つのカウンターが削除されます | プロファイルを解析する自動化処理 | 代わりに、ほかの IO 関連カウンターを使用します |

**デフォルト値と動作の変更**

| 変更内容 | 影響を受ける範囲 | 対応方法 |
| --- | --- | --- |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成したテーブル | 新しく作成されるパーティションのみが影響を受けます。[データのバケット分割](../../table-design/data-partitioning/data-bucketing)を参照してください |
| セッション変数 `max_scanners_concurrency` のデフォルト値が 4 から 8 に変わります | すべてのクエリ | 従来の動作を維持するには、値を 4 に戻します |
| FE 設定 `default_get_version_from_ms_timeout_second` のデフォルト値が 3 から 30 に変わります | 分離モード | 対応は不要です。Meta Service のジッターによるクエリ失敗が減ります |
| BE 設定 `enable_cache_read_from_peer` のデフォルト値が `true` から `false` に変わり、`cache_read_from_peer_expired_seconds` が削除されます | コンピュートグループ間でのピアキャッシュ読み取りを利用している環境 | 従来の動作を維持するには、`enable_cache_read_from_peer=true` を `be.conf` で明示的に設定します |
| セッション変数 `eager_aggregation_on_join` が削除され、`eager_aggregation_on_broadcast_join`（デフォルト値 `true`）と `eager_agg_broadcast_row_count`（デフォルト値 250000）が追加されます | `eager_aggregation_on_join` を設定するセッション / スクリプト | この変数への代入を削除します |
| `jobs()` テーブル関数で、ストリーミングジョブの `Lag` 列が `LagBytes` に改名され、単位が秒からバイトに変わります。また、`LastSourceEventTimestamp` 列が追加されます | `jobs()` の出力を解析するスクリプト、`streaming_job_per_job_lag` メトリクスを使う監視 | `LagBytes` 列と `streaming_job_per_job_lag_bytes` メトリクスを使用します。[Continuous Load](../../data-operate/import/import-way/streaming-job/continuous-load-overview)を参照してください |
| Arrow Flight SQL では、`DATETIME` / `DATETIMEV2` が**タイムゾーンなし**の Arrow Timestamp として返されます（`TIMESTAMPTZ` には引き続きタイムゾーンが付きます） | Arrow Flight SQL 経由で時刻の列を読み取るクライアント | タイムゾーンのない値として解釈します |
| 引数に別の集約関数を含む集約関数が、`aggregate function cannot contain aggregate parameters` を報告するようになります | `group_concat(x ORDER BY sum(k))` などの既存の SQL | 先に集約し、その結果を参照するように SQL を書き換えます |
| `default.replication_num` または `default.replication_allocation` を変更すると、競合する古いプロパティが削除されます | 両方のプロパティがまだメタデータに残っている古いテーブル | 対応は不要です。`SHOW CREATE TABLE` と実際のレプリカ割り当てが一致するようになります。**ローリングアップグレード中は**、すべての FE のアップグレードが完了するまで、両プロパティを変更しないでください。変更すると、新旧の FE が異なるレプリカ設定を適用する可能性があります |
| Paimon の `paimon.table-option.*` カタログプロパティが、七つのキーの許可リストに制限されます | それ以外の `paimon.table-option.*` キーを使うカタログ | 許可リストにないキーを削除します。[Paimon Catalog](../../lakehouse/catalogs/paimon-catalog)を参照してください |
| ストレージプロパティに予約済みキー `doris.fs.cache.key` が追加され、暗黙的なデフォルト値 `fs.<schema>.impl.disable.cache=true` が適用されなくなります | 外部ストレージを使うカタログ / TVF | **FE ノードより先に BE ノードをアップグレードします** |
| 分離モードでは、`ADMIN SET FRONTEND CONFIG` の実行が `root` ユーザーに制限されます | root 以外のアカウントで実行時に FE 設定を変更するスクリプト | root アカウントを使用するか、代わりに `fe.conf` で設定します |
| FE 設定 `s3_load_endpoint_white_list`、`jdbc_driver_url_white_list`、`force_sqlserver_jdbc_encrypt_false` が実行時に変更できなくなります | `ADMIN SET FRONTEND CONFIG` でこれらの設定を変更するスクリプト | `fe.conf` で設定し、FE を再起動します |
| Routine Load の機密性の高い Kafka プロパティと、`IV` / `CIPHER` 列（`information_schema` の暗号化キー）が、クエリ結果で `******` としてマスクされます | これらの結果から認証情報を読み取るスクリプト | 元の値は構成管理システムから取得します |

**デプロイと設定ファイルの変更**

| 変更内容 | 影響を受ける範囲 | 対応方法 |
| --- | --- | --- |
| JDK 17 の `JAVA_OPTS` では、`--add-opens=java.base/java.nio=ALL-UNNAMED` を `--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED` に変更する必要があります | `JAVA_OPTS_FOR_JDK_17` を `fe.conf` / `be.conf` でカスタマイズしている環境 | 新リリースのパッケージに同梱された `fe.conf` / `be.conf` の設定に合わせます。そうしないと、Arrow Flight SQL などの Arrow ベースの機能が起動または実行に失敗する場合があります |
| be-java-extensions の `paimon-scanner` モジュールが `paimon-connector` に改名されます | `be/lib/java_extensions/paimon-scanner` を参照する独自のデプロイスクリプト | パスを `paimon-connector` に変更します |
| BE の `_stream_load_forward` エンドポイントでは、設定による有効化とリクエストの認証が必要になります | 分離モードで Group Commit の BE 転送を利用している環境 | `enable_group_commit_streamload_be_forward=true` をすべての `be.conf` に設定し、ロード用アカウントにグローバルな `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Upgrade failure / Exception handling -->

### Q：アップグレード後、BE / FE ノードの `Alive` が `false` で、`Version` が旧バージョンのままです。どうすればよいですか？

プロセスが起動していないか、新バージョンの起動に失敗しています。`be.log` / `fe.log` のエラーログを確認し、`/bin` と `/lib` が正しく入れ替えられていることを確認してください。

### Q：アップグレード後、メタデータの非互換エラーで FE が起動しません。どうすればよいですか？

バージョンを大きく飛び越えたか、メタデータ互換性テストを実行していなかった可能性があります。旧バージョンにロールバックし、このドキュメントの「メタデータ互換性テスト」の手順に従ってテストを実行してください。必要に応じて段階的にアップグレードしてください。

### Q：アップグレード後、`custom_lib/` 内の jar ファイルがなくなりました。何が起きたのでしょうか？

誤って `custom_lib/` を上書きしたためです。入れ替えるのは `/bin` と `/lib` だけで、`custom_lib/` は入れ替えないでください。

### Q：アップグレード中に Stream Load のタスクが失敗するのはなぜですか？

ノードの再起動によってクライアント接続が切断されるためです。クライアント側にリトライ処理を追加してください。Routine Load と Flink/Spark Doris Connector にはリトライ処理が組み込まれています。

### Q：アップグレード後、レプリカ数が異常になったり、レプリカの移動が頻繁に起きたりします。原因は何ですか？

`disable_balance` / `disable_tablet_scheduler` の設定によってレプリカの修復とバランシングを無効にしていなかったか、アップグレード後に再度有効にしていなかった可能性があります。アップグレード前に無効にし、完了後に再度有効にする手順を確認してください。

### Q：マイナーバージョンをまたぐアップグレードが失敗しました。なぜですか？

順番にアップグレードしていなかったためです。ロールバックして、`3.0 to 3.1 to 3.2 to 3.3` のように段階的にアップグレードしてください。

### Q：FE が単一のクラスターでアップグレードに失敗し、メタデータが失われました。どうすればよいですか？

メタデータ互換性テストを実行していなかったためです。アップグレード前に、FE を 3 台の高可用性構成に増やすか、開発用マシンまたは BE ノードでメタデータ互換性テストを実行してください。
