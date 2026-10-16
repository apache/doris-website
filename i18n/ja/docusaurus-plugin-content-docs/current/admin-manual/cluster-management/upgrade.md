---
{
    "title": "クラスターのアップグレード",
    "language": "ja",
    "description": "Apache Doris クラスターのローリングアップグレードガイド。バージョン互換性のルール、メタデータ互換性テスト、BE/FE ノードのアップグレード手順、よくある問題への対処方法を説明します。",
    "keywords": [
        "Doris アップグレード",
        "Doris ローリングアップグレード",
        "Doris クラスターのアップグレード",
        "FE アップグレード",
        "BE アップグレード",
        "メタデータ互換性テスト",
        "metadata_failure_recovery",
        "disable_balance",
        "レプリカの修復とバランス調整",
        "Doris のバージョン番号",
        "バージョンをまたぐアップグレード",
        "カナリアアップグレード"
    ]
}
---

Apache Doris は、FE ノードと BE ノードのバイナリを順次置き換えるローリングアップグレードに対応しています。これにより、停止時間を最小限に抑え、アップグレード中もクラスターを利用できます。このドキュメントはクラスター管理者向けに、バージョン互換性のルール、メタデータ互換性テストの手順、詳細なアップグレード手順を説明します。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Cluster upgrade / Version iteration / Rolling upgrade -->

## 適用できるケース

| ケース | 適用可否 | 備考 |
| --- | --- | --- |
| 同じマイナーバージョン内でのパッチバージョンのアップグレード（例: 2.1.3 から 2.1.7） | 可 | ローリングアップグレードを直接実施できます |
| マイナーバージョンをまたぐアップグレード（例: 3.0 から 3.3） | 可（段階的に実施） | 3.0 から 3.1、3.1 から 3.2、3.2 から 3.3 の順にアップグレードします |
| メジャーバージョンのアップグレード（例: 2.x から 3.x） | 可（段階的に実施） | メジャーバージョンを直接またぐアップグレードは推奨しません。マイナーバージョンを一つずつ進めます |
| FE が単一ノードのクラスターのアップグレード | 可（互換性テスト後） | 先に 3 FE の高可用性構成に拡張するか、アップグレード前にメタデータ互換性テストを実施します |
| メタデータに互換性がない可能性があるバージョン間のアップグレード | 可（互換性テスト後） | アップグレード前にメタデータの互換性を確認する必要があります |

## 前提条件

アップグレード前に、以下を確認してください。

- 対象バージョンのリリースノートを読み、バージョン間の動作変更と互換性を理解していること。
- データが 3 レプリカで保存されており、アップグレードの失敗によってデータが失われないこと。
- クライアントのタスクに再試行の仕組みがあること（後述の「アップグレード時の注意事項」を参照）。
- メタデータ互換性テストに使用できる開発マシンまたは BE ノードがあること。
- 対象バージョンのインストールパッケージをダウンロードして展開済みであること（以下の手順では、`${DORIS_NEW_HOME}` は新バージョンのルートディレクトリ、`${DORIS_OLD_HOME}` は本番環境で稼働中の旧バージョンのルートディレクトリを指します）。

## バージョンの互換性

Doris のバージョン番号は三つの数字で構成されます。最初の数字はメジャーマイルストーンバージョン、二番目は機能バージョン、三番目はバグ修正バージョンです。三番目の数字が変わるバージョンでは新機能はリリースされません。Doris 2.1.3 を例に示します。

| 位置 | 値の例 | 意味 |
| --- | --- | --- |
| 最初の数字 | 2 | 2 番目のマイルストーンバージョン |
| 二番目の数字 | 1 | そのマイルストーンに属する機能バージョン |
| 三番目の数字 | 3 | その機能バージョンに属する 3 番目のバグ修正バージョン |

アップグレード時は、次のルールに従ってください。

| アップグレードの種類 | バージョンをまたぐアップグレード | 推奨される経路 |
| --- | --- | --- |
| 三番目の数字が変わるバージョン（二番目の数字は同じ） | サポート | 直接アップグレードします。例: 2.1.3 から 2.1.7 |
| 二番目の数字が変わるバージョン | 飛び越しは非推奨 | 二番目の数字を一つずつ進めます。例: 3.0 から 3.1、3.2、3.3 |
| 最初の数字が変わるバージョン | 飛び越しは非推奨 | まず同じメジャーバージョン内で最新のマイナーバージョンにアップグレードし、その後メジャーバージョンをまたいでアップグレードします |

バージョンの詳細については、[バージョン番号のルール](https://doris.apache.org/community/release-and-verify/release-versioning)を参照してください。

## アップグレード時の注意事項

<!-- Knowledge type: Pre-operation check -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード前に、次の三点に注意してください。

| 注意事項 | 対応方法 |
| --- | --- |
| バージョン間の動作変更 | アップグレード前に対象バージョンのリリースノートを読み、互換性のない動作変更がないか確認します |
| クライアントタスクの再試行 | アップグレード中はノードを順次再起動するため、Stream Load とクエリのタスクには再試行の仕組みが必要です。Routine Load、Flink Doris Connector、Spark Doris Connector には再試行機能が組み込まれているため、追加の対応は不要です |
| レプリカの修復とバランス調整 | アップグレード前にレプリカの修復とバランス調整を無効にする必要があります。アップグレードの成否にかかわらず、完了後には再び有効にする必要があります |

:::caution 注意

Doris のアップグレードでは、FE ディレクトリ内の `/bin` と `/lib`、および BE ディレクトリ内の `/bin` と `/lib` を置き換えるだけで済みます。

バージョン 2.0.2 以降では、FE と BE の両方のデプロイ先に `custom_lib/` ディレクトリが追加されています（存在しない場合は手動で作成してください）。このディレクトリには、ユーザー定義のサードパーティー製 jar ファイル（`hadoop-lzo-*.jar` や `orai18n.jar` など）を保存します。アップグレード時にこのディレクトリを置き換える必要はありません。

:::

## メタデータ互換性テスト

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade verification / Metadata compatibility -->

メタデータ互換性テストでは、新バージョンが既存のメタデータを正しく読み込めるかアップグレード前に確認します。これにより、アップグレード失敗によるデータ損失を防ぎます。毎回のアップグレード前にこのテストを実施することを推奨します。

:::caution 注意

本番環境では、3 ノード以上の FE による高可用性構成を推奨します。FE が 1 ノードのみの場合は、アップグレード前にメタデータ互換性テストを必ず実施してください。メタデータの互換性は重要です。メタデータの非互換性によってアップグレードが失敗すると、データが失われる可能性があります。

次の点にも注意してください。

- メタデータ互換性テストは開発マシンまたは BE ノードで実施し、FE ノードでの実施を避けることを推奨します。
- FE ノードでしかテストできない場合は、Master 以外のノードを選び、先にそのノードの元の FE プロセスを停止してください。

:::

### 1. メタデータをバックアップする

アップグレードを開始する前に、Master FE ノードのメタデータをバックアップします。

Master FE ノードは `IsMaster` 列を `show frontends` で確認して特定できます。FE プロセスを停止せずに、稼働中の FE メタデータをバックアップできます。デフォルトでは FE メタデータは `fe/doris-meta` ディレクトリに保存されています。メタデータディレクトリは `meta_dir` パラメータを `fe.conf` で確認することもできます。

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

テスト環境で使用するポートの例を示します。

| パラメータ | 値の例 | 説明 |
| --- | --- | --- |
| `http_port` | 18030 | FE の HTTP サービスポート |
| `rpc_port` | 19020 | FE Thrift Server のポート |
| `query_port` | 19030 | FE の MySQL プロトコル用クエリポート |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL のポート |
| `edit_log_port` | 19010 | FE の BDBJE 通信ポート |
| `clusterId` | 123456 | テストクラスターの ID。本番環境とは異なる値にします |

### 3. Master FE のメタデータをコピーする

バックアップした Master FE のメタデータを、新しい互換性テスト環境にコピーします。

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. メタデータの VERSION ファイル内の cluster\_id を変更する

`cluster_id` を、コピーしたメタデータディレクトリ内の `VERSION` ファイルで新しいクラスター ID に変更します。例えば、上記の例と同じ 123456 にします。

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. テスト環境で FE プロセスを起動する

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

バージョン 2.0.2 より前の場合は、`metadata_failure_recovery=true` を先に `fe.conf` に追加してから FE プロセスを起動します。

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. FE が正常に起動したことを確認する

上記の例の `query_port` 19030 を使用し、MySQL クライアントからテスト用 FE に接続します。

```shell
mysql -uroot -P19030 -h127.0.0.1
```

接続できれば、新バージョンは現在のメタデータを正しく読み込めており、メタデータ互換性テストは合格です。

## アップグレードの流れ

アップグレード全体の流れは次のとおりです。手順は必ずこの順序で実行してください。

1. レプリカの修復とバランス調整を無効にする。
2. BE ノードをアップグレードする（複数レプリカのクラスターではカナリアアップグレードが可能）。
3. FE ノードをアップグレードする（Observer/Follower ノードを先に、Master を最後にアップグレード）。
4. レプリカの修復とバランス調整を再び有効にする。

基本原則は**BE を先に、FE を後にアップグレードする**ことです。FE のアップグレードでは、**Observer FE ノードと Follower FE ノードを先にアップグレードし、Master FE ノードを最後にアップグレードします**。

## アップグレード手順

### ステップ 1: レプリカの修復とバランス調整を無効にする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード中のノード再起動によって、不要なクラスターのバランス調整やレプリカの修復が発生する場合があります。まず、次の三つの設定を無効にします。

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

対象となる設定は次のとおりです。

| 設定 | アップグレード前の値 | 効果 |
| --- | --- | --- |
| `disable_balance` | `true` | レプリカのバランス調整を無効にし、ノード再起動によってレプリカが移動するのを防ぎます |
| `disable_colocate_balance` | `true` | Colocate Join テーブルのレプリカのバランス調整を無効にします |
| `disable_tablet_scheduler` | `true` | タブレットのスケジューリングを無効にし、レプリカの修復を防ぎます |

### ステップ 2: BE ノードをアップグレードする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: BE rolling upgrade -->

:::info 注意

データの安全性を確保するため、データを 3 レプリカで保存し、アップグレード中の操作ミスや失敗によるデータ損失を防いでください。

:::

複数レプリカのクラスターでは、一台の BE ノードを選んでカナリアアップグレードを実施できます。検証後、残りのノードを一台ずつアップグレードします。

#### 2.1 アップグレード対象の BE ノードを停止する

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

### ステップ 3: FE ノードをアップグレードする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: FE rolling upgrade -->

FE ノードが複数ある場合は、Master 以外のノード（Observer または Follower）を先にアップグレードし、ほかのノードがすべて完了してから Master ノードを最後にアップグレードします。

#### 3.1 アップグレード対象の FE ノードを停止する

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

### ステップ 4: レプリカの修復とバランス調整を再び有効にする

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Post-upgrade cleanup -->

アップグレードが完了し、すべての BE ノードの `Alive` が true に戻ったら、クラスターのレプリカ修復とバランス調整を再び有効にします。

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## バージョン別のアップグレード時の注意点

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Cross-version upgrade / Confirming post-upgrade behavior changes -->

このセクションでは、特定のバージョンへのアップグレード時に特に注意が必要な動作変更を記載します。変更点の全体については、このセクションに加えて、必ず対象バージョンのリリースノートを読んでください。

### 3.x から 4.0 へのアップグレード時のセッション変数移行

FE は、内部変数 `variable_version` でセッション変数のデフォルト値の移行状況を追跡します。3.x から 4.0 にアップグレードするとき（`variable_version` が 400 未満の場合）、FE は次の変数の**グローバルデフォルト値**を自動的に調整します。

| 変数 | 移行後のデフォルト値 | 説明 |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | 3.x のクエリ構成の動作を維持し、アップグレード後に意味が変わらないようにします |
| `enable_new_type_coercion_behavior` | `false` | 3.x の型変換の動作を維持します |
| `enable_sql_cache` | `true` | SQL Cache を有効にします |
| `enable_nereids_distribute_planner` | `true` | **バージョン 4.0.8 で追加された移行項目**です。以下を参照してください |

移行は `variable_version` が 400 未満から 400 に引き上げられるときに一度だけ実行されます。それ以降にユーザーが明示的に設定した値が上書きされることはありません。

### 4.0.8 へのアップグレード

:::caution Nereids 分散プランナーが有効になります

バージョン 4.0.8 以降、3.x から 4.0 にアップグレードすると Nereids 分散プランナー（`enable_nereids_distribute_planner`）が有効になります。

4.0.8 より前は、クラスターのメタデータイメージに `enable_nereids_distribute_planner=false` が保存されていると、アップグレード後にその値がそのまま復元され、従来の分散プランナーが使われ続けました。バージョン 4.0.8 では、この変数が `variable_version=400` の移行に追加され、アップグレード後に新しい分散プランナーが一貫して有効になります。

クエリプランの分散方法がアップグレード前と異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

4.0.8 へのアップグレードでは、次の変更点にも注意が必要です。

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| メモリ使用量が多いときに Compaction を一時停止しなくなります（BE 設定 `enable_compaction_pause_on_high_memory` のデフォルト値が `true` → `false` に変更） | すべてのデプロイモード | 以前の動作を維持するには `true` に戻します。[BE の設定](../config/be-config)を参照してください |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成されたテーブル | 新しく作成されるパーティションのみが影響を受けます。[データのバケット分割](../../table-design/data-partitioning/data-bucketing)を参照してください |
| BE の `_stream_load_forward` エンドポイントでは、設定の有効化とリクエストの認証が必要になります | 分離モードで Group Commit の BE 転送を利用するデプロイ | `enable_group_commit_streamload_be_forward=true` をすべての `be.conf` に設定し、ロードに使用するアカウントにグローバルな `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |
| ノード管理 API にはグローバルな `ADMIN` 権限が必要になります | `/rest/v2/manager/node/{action}/{be\|fe\|broker}` を呼び出す自動化処理 | 呼び出し元に `ADMIN` アカウントによる認証を追加します。[Node Action](../open-api/fe-http/node-action)を参照してください |
| Stream Load が、実際にリクエストを処理するコンピュートグループへのアカウントのアクセス権を検証します | 分離モードの Stream Load | ロードに使用するアカウントに該当するコンピュートグループへのアクセス権を付与します。[Stream Load](../../data-operate/import/import-way/stream-load-manual)を参照してください |
| 分離モードでは、データサイズが一貫してリモートのサイズとして報告されます | `SHOW TABLETS` または `information_schema.partitions` から容量を計算するスクリプト | 代わりに `REMOTE_DATA_SIZE` を使用します。[partitions](../system-tables/information_schema/partitions)を参照してください |
| Routine Load ジョブの機密性の高い Kafka プロパティは、クエリ結果で `******` にマスクされます | `SHOW ROUTINE LOAD` から認証情報を読み取るスクリプト | 元の値は設定管理システムから取得してください。[SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD)を参照してください |
| ウォームアップのタイムスタンプが `HH:mm:ss` から `yyyy-MM-dd HH:mm:ss` に変わります | ウォームアップジョブのステータスを解析するスクリプト | 時刻の解析形式を調整します。[読み書き分離](../../compute-storage-decoupled/rw/read-write-separation)を参照してください |
| スキャンエラーに `failed to initialize storage reader` というプレフィックスが付かなくなります | このプレフィックスに一致する監視ルール | 代わりにエラーコードと `tablet=` / `backend=` の情報を使用します |

### 4.1.4 へのアップグレード

:::caution Nereids 分散プランナーが有効になります

バージョン 4.1.4 以降、**3.x から 4.1.4 への**アップグレードでは、セッション変数 `enable_nereids_distribute_planner` のグローバルデフォルト値が `true` に更新されます。4.0 系列では 4.0.8 以降、同じ動作になっています。

この更新は、クラスターの `variable_version` が `400` 未満の場合にのみ発生します。そのため、すでに 4.0.x または 4.1.x を実行しているクラスターでは、この変数に保存されている値が維持されます。

クエリプランの分散方法がアップグレード前と異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

:::caution 浮動小数点値の文字列表現が変わります

バージョン 4.1.4 以降、FLOAT / DOUBLE 値を文字列に変換すると、固定桁数の有効数字ではなく、**同じ値に再変換できる最短の文字列**が生成されます。保存されている値は変わりませんが、文字列表現は 4.1.3 と異なる場合があります（例えば、`246.9120025634766` は `246.91200256347656` に、`0.0000123456` は `1.23456e-05` になります）。

この変更は、MySQL プロトコルのクエリ結果、`CAST(... AS STRING)`、複合型 / JSON / VARIANT の表示、`SELECT INTO OUTFILE`、EXPORT、外部テーブルの浮動小数点列に影響します。下流システムが浮動小数点値の文字列表現を厳密に比較する場合は、アップグレード後に調整してください。[浮動小数点型](../../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)を参照してください。

:::

4.1.4 へのアップグレードでは、次の変更点にも注意が必要です。

**削除されたインターフェースと構文**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| `iceberg_meta()` テーブル関数が削除されます | このテーブル関数で Iceberg メタデータを読み取る SQL | 代わりに Iceberg システムテーブル `<table>$<system_table_name>` を使用します。[ICEBERG_META](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta)を参照してください |
| FE の `/api/<ns>/<db>/<tbl>/upload` エンドポイントと FE 設定 `http_load_submitter_max_worker_threads` が削除されます | これらのエンドポイントを使用してロード用の小さなファイルをアップロードするスクリプト | 代わりに Stream Load または S3 / HDFS / LOCAL TVF を使用します。[Upload Action](../open-api/fe-http/upload-action)を参照してください |
| `PLAN REPLAYER PLAY '<file>'` ステートメントが削除されます | minidump を再生するデバッグ手順 | `PLAN REPLAYER DUMP` のみが残ります |
| ワークロードポリシーの `set_session_variable` アクションが削除されます | このアクションを使用するワークロードポリシー | 代わりに `cancel_query` / `move_query_to_group` を使用します |
| BE 設定 `get_stack_trace_tool` が削除され、BE のスレッドスタック HTTP 出力のフィールドが変更されます | BE のスレッドスタックを収集するスクリプト | 新しい出力フィールドを解析するよう変更します |
| 分離モードの BE 設定 `s3_client_retry_slow_down` が削除されます | この設定で S3 のスロットリング時の再試行を制御するデプロイ | 設定は不要です。BE は S3 の 429 / 503 に対して常に再試行し、Recycler は再試行しません |
| クエリプロファイルから `HdfsIO` タイマーとその七つのカウンターが削除されます | プロファイルを解析する自動化処理 | 代わりにほかの IO 関連カウンターを使用します |

**デフォルト値と動作の変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成されたテーブル | 新しく作成されるパーティションのみが影響を受けます。[データのバケット分割](../../table-design/data-partitioning/data-bucketing)を参照してください |
| FE 設定 `default_get_version_from_ms_timeout_second` のデフォルト値が 3 から 30 に変わります | 分離モード | 対応は不要です。Meta Service の揺らぎによるクエリ失敗が減ります |
| BE 設定 `enable_cache_read_from_peer` のデフォルト値が `true` から `false` に変わり、`cache_read_from_peer_expired_seconds` が削除されます | コンピュートグループ間のピアキャッシュ読み取りに依存するデプロイ | 以前の動作を維持するには、`enable_cache_read_from_peer=true` を `be.conf` に明示的に設定します |
| セッション変数 `eager_aggregation_on_join` が削除され、`eager_aggregation_on_broadcast_join`（デフォルト `true`）と `eager_agg_broadcast_row_count`（デフォルト 250000）が追加されます | `eager_aggregation_on_join` を設定するセッション / スクリプト | この変数への代入を削除します |
| `jobs()` テーブル関数では、ストリーミングジョブの列 `Lag` が `LagBytes` に改名され、単位が秒からバイトに変わります。また、`LastSourceEventTimestamp` 列が追加されます | `jobs()` の出力を解析するスクリプト、`streaming_job_per_job_lag` メトリクスに基づく監視 | `LagBytes` 列と `streaming_job_per_job_lag_bytes` メトリクスを使用します。[継続的なロード](../../data-operate/import/import-way/streaming-job/continuous-load-overview)を参照してください |
| Arrow Flight SQL は `DATETIME` / `DATETIMEV2` を**タイムゾーンなし**の Arrow Timestamp として返します（`TIMESTAMPTZ` はタイムゾーン付きのままです） | Arrow Flight SQL で時刻の列を読み取るクライアント | タイムゾーンなしの値として解釈します |
| 引数のいずれかに別の集約関数を含む集約関数は、`aggregate function cannot contain aggregate parameters` を報告するようになります | `group_concat(x ORDER BY sum(k))` などの既存の SQL | 先に集約し、その結果を参照するよう SQL を書き換えます |
| `default.replication_num` または `default.replication_allocation` を変更すると、競合する旧プロパティが削除されるようになります | メタデータに両方のプロパティが残っている古いテーブル | 対応は不要です。`SHOW CREATE TABLE` と実際のレプリカ配置が一致するようになります。**ローリングアップグレード中は**、すべての FE のアップグレードが完了してからこの二つのプロパティを変更してください。そうしないと、新旧の FE で異なるレプリカ設定が適用される可能性があります |
| Paimon の `paimon.table-option.*` カタログプロパティは、七つのキーの許可リストに制限されます | それ以外の `paimon.table-option.*` キーを使用するカタログ | 許可リストにないキーを削除します。[Paimon Catalog](../../lakehouse/catalogs/paimon-catalog)を参照してください |
| ストレージプロパティに予約キー `doris.fs.cache.key` が追加され、暗黙のデフォルト `fs.<schema>.impl.disable.cache=true` は適用されなくなります | 外部ストレージを使用するカタログ / TVF | **FE ノードより先に BE ノードをアップグレードします** |
| 分離モードでは、`ADMIN SET FRONTEND CONFIG` を実行できるユーザーが `root` に制限されます | root 以外のアカウントで実行時に FE 設定を変更するスクリプト | root アカウントを使用するか、代わりに `fe.conf` に設定して FE を再起動します |
| FE 設定 `s3_load_endpoint_white_list`、`jdbc_driver_url_white_list`、`force_sqlserver_jdbc_encrypt_false` は実行時に変更できなくなります | `ADMIN SET FRONTEND CONFIG` でこれらの設定を変更するスクリプト | `fe.conf` に設定して FE を再起動します |
| Routine Load の機密性の高い Kafka プロパティと、暗号化キーの `IV` / `CIPHER` 列（`information_schema`）は、クエリ結果で `******` にマスクされます | これらの結果から認証情報を読み取るスクリプト | 元の値は設定管理システムから取得してください |

**デプロイと設定ファイルの変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| JDK 17 の `JAVA_OPTS` で、`--add-opens=java.base/java.nio=ALL-UNNAMED` を `--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED` に変更する必要があります | `JAVA_OPTS_FOR_JDK_17` を `fe.conf` / `be.conf` でカスタマイズしているデプロイ | 新しいリリースパッケージに含まれる `fe.conf` / `be.conf` からこのオプションを反映します。反映しない場合、Arrow Flight SQL などの Arrow ベースの機能が起動または実行に失敗する可能性があります |
| BE の `_stream_load_forward` エンドポイントでは、設定の有効化とリクエストの認証が必要になります | 分離モードで Group Commit の BE 転送を利用するデプロイ | `enable_group_commit_streamload_be_forward=true` をすべての `be.conf` に設定し、ロードに使用するアカウントにグローバルな `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Upgrade failure / Exception handling -->

### Q: アップグレード後、BE / FE ノードの `Alive` が `false` で、`Version` が旧バージョンのままです。どうすればよいですか？

プロセスが起動していないか、新バージョンの起動に失敗しています。`be.log` / `fe.log` のエラーログを確認し、`/bin` と `/lib` が正しく置き換えられたか確かめてください。

### Q: アップグレード後、メタデータの非互換性エラーによって FE が起動しません。どうすればよいですか？

バージョンを大きく飛び越えてアップグレードしたか、メタデータ互換性テストを実施していません。旧バージョンに戻し、このドキュメントの「メタデータ互換性テスト」の手順でテストを実施してください。必要に応じて段階的にアップグレードします。

### Q: アップグレード後、`custom_lib/` 内の jar ファイルが見つかりません。何が起きたのでしょうか？

誤って `custom_lib/` を上書きした可能性があります。置き換えるのは `/bin` と `/lib` のみで、`custom_lib/` は置き換えないでください。

### Q: アップグレード中に Stream Load タスクが失敗します。なぜですか？

ノードの再起動によってクライアントの接続が中断されるためです。クライアント側に再試行の仕組みを追加してください。Routine Load と Flink/Spark Doris Connector には再試行機能が組み込まれています。

### Q: アップグレード後、レプリカ数が異常になったり、レプリカが頻繁に移動したりします。原因は何ですか？

`disable_balance` / `disable_tablet_scheduler` をアップグレード前に設定しなかったか、アップグレード後に元に戻していない可能性があります。これらの設定をアップグレード前に無効化し、完了後に再び有効化する手順を確認してください。

### Q: マイナーバージョンをまたぐアップグレードに失敗しました。なぜですか？

バージョンを順番にアップグレードしていなかったためです。旧バージョンに戻し、`3.0 to 3.1 to 3.2 to 3.3` のように段階的な経路に従ってください。

### Q: FE が単一ノードのクラスターでアップグレードに失敗し、メタデータが失われました。どうすればよいですか？

メタデータ互換性テストを実施していませんでした。アップグレード前に 3 FE の高可用性構成に拡張するか、開発マシンまたは BE ノードでメタデータ互換性テストを実施してください。
