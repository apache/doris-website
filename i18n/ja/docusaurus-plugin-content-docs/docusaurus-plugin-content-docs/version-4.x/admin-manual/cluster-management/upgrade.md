---
{
  "title": "クラスターのアップグレード",
  "language": "ja",
  "description": "Dorisは段階的なアップグレード機能を提供し、FEおよびBEノードの段階的なアップグレードを可能にして、ダウンタイムを最小限に抑えます。"
}
---
Dorisは、FEおよびBEノードの段階的なアップグレードを可能にするローリングアップグレード機能を提供し、ダウンタイムを最小化し、アップグレードプロセス中もシステムが稼働し続けることを保証します。

## バージョン互換性

Dorisのバージョニングは3つのコンポーネントで構成されています：最初の桁はメジャーマイルストーンバージョン、2番目の桁は機能バージョン、3番目の桁はバグ修正に対応しています。バグ修正バージョンでは新機能は導入されません。例えば、Dorisバージョン2.1.3では、「2」は2番目のマイルストーンバージョンを示し、「1」はこのマイルストーンにおける機能バージョンを表し、「3」はこの機能バージョンの3番目のバグ修正を表します。

バージョンアップグレード時には、以下のルールが適用されます：

- **3桁バージョン：** 最初の2桁が同じバージョンは、3桁バージョン間で直接アップグレードできます。例えば、バージョン2.1.3は直接バージョン2.1.7にアップグレードできます。

- **2桁および1桁バージョン：** 互換性の懸念により、2桁バージョンのクロスバージョンアップグレードは推奨されません。各2桁バージョンを順次アップグレードすることを推奨します。例えば、バージョン3.0から3.3へのアップグレードは、3.0 -> 3.1 -> 3.2 -> 3.3の順序に従う必要があります。

詳細なバージョン情報は[versioning rules](https://doris.apache.org/community/release-versioning)で確認できます。

## アップグレード時の注意事項

アップグレードを実行する際は、以下に注意してください：

- **バージョン間の動作変更：** アップグレード前にRelease Notesを確認して、互換性の問題を特定してください。

- **クラスター内のタスクにリトライメカニズムを追加：** アップグレード中はノードが順次再起動されます。タスクの失敗を避けるため、クエリタスクやStream Loadインポートジョブにリトライメカニズムが配置されていることを確認してください。flink-doris-connectorやspark-doris-connectorを使用するRoutine Loadジョブは、既にコードにリトライメカニズムが含まれており、追加のロジックは不要です。

- **レプリカ修復およびバランス機能を無効化：** アップグレードプロセス中はこれらの機能を無効化してください。アップグレードの結果に関係なく、アップグレード完了後にこれらの機能を再有効化してください。

## メタデータ互換性テスト

:::caution Note

本番環境では、高可用性のために少なくとも3つのFEノードを設定することを推奨します。FEノードが1つしかない場合は、アップグレード前にメタデータ互換性テストを実行する必要があります。メタデータ互換性は重要で、非互換性によりアップグレードの失敗やデータ損失が発生する可能性があります。各アップグレード前にメタデータ互換性テストを実施することを推奨し、以下の点に留意してください：

- FEノードの使用を避けるため、可能な限り開発マシンまたはBEノードでメタデータ互換性テストを実行してください。

- FEノードでテストを実行する必要がある場合は、非Masterノードを使用し、元のFEプロセスを停止してください。

:::

アップグレード前に、メタデータ非互換性による失敗を防ぐためメタデータ互換性テストを実施してください。

1. **メタデータ情報のバックアップ：**

   アップグレードを開始する前に、Master FEノードのメタデータをバックアップしてください。

   `show frontends`コマンドを使用し、`IsMaster`列を参照してMaster FEノードを特定してください。FEメタデータは、FEノードを停止することなくホットバックアップできます。デフォルトでは、FEメタデータは`fe/doris-meta`ディレクトリに保存されます。これは`fe.conf`設定ファイルの`meta_dir`パラメータで確認できます。

2. **テストFEノードの`fe.conf`設定ファイルを修正：**

   ```bash
   vi ${DORIS_NEW_HOME}/conf/fe.conf
   ```
以下のポート情報を変更し、すべてのポートが本番環境のものと異なることを確認して、`clusterID`パラメータを更新してください：

   ```
   ...
   ## modify port
   http_port = 18030
   rpc_port = 19020
   query_port = 19030
   arrow_flight_sql_port = 19040
   edit_log_port = 19010

   ## modify clusterID
   clusterId=<a_new_clusterID, such as 123456>
   ...
   ```
3. バックアップされたMaster FEメタデータを新しい互換性テスト環境にコピーします。

   ```bash
   cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
   ```
4. コピーしたメタデータディレクトリの`VERSION`ファイルを編集して、`cluster_id`を新しいクラスターIDに更新します。例えば、以下の例に示すように`123456`に変更します：

   ```bash
   vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
   clusterId=123456
   ```
5. テスト環境でFEプロセスを開始します。

   ```bash
   sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
   ```
2.0.2より前のバージョンでは、FEプロセスを開始する前に`fe.conf`ファイルに`metadata_failure_recovery`パラメータを追加してください：

   ```bash
   echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
   sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon 
   ```
6. 上記で言及したクエリポート`19030`を使用するなど、MySQLコマンドを使用して現在のFEに接続することで、FEプロセスが正常に開始されたことを確認します。

   ```bash
   mysql -uroot -P19030 -h127.0.0.1
   ```
## アップグレード手順

アップグレードの詳細なプロセスは以下の通りです：

1. レプリカ修復とバランス機能を無効化する

2. BEノードをアップグレードする

3. FEノードをアップグレードする

4. レプリカ修復とバランス機能を有効化する

アップグレードプロセス中は、BEノードを最初にアップグレードし、その後FEノードをアップグレードするという原則に従う必要があります。FEをアップグレードする際は、Observer FEとFollower FEノードを最初にアップグレードし、その後Master FEノードをアップグレードします。

:::caution 注意

一般的に、FEディレクトリ下の`/bin`と`/lib`ディレクトリ、およびBEディレクトリ下の`/bin`と`/lib`ディレクトリのみをアップグレードする必要があります。

バージョン2.0.2以降では、FEとBEのデプロイメントパス下に`custom_lib/`ディレクトリが追加されています（存在しない場合は手動で作成できます）。`custom_lib/`ディレクトリは、`hadoop-lzo-*.jar`、`orai18n.jar`などのユーザー定義のサードパーティjarファイルを格納するために使用されます。このディレクトリはアップグレード中に置き換える必要がありません。

:::

### ステップ1：レプリカ修復とバランス機能を無効化する

アップグレードプロセス中は、ノードが再起動され、不要なクラスターバランシングとレプリカ修復ロジックが発生する可能性があります。以下のコマンドを使用して、これらの機能を最初に無効化します：

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```
### Step 2: BEノードのアップグレード

:::info 注意:

データの安全性を確保するため、アップグレードのミスや失敗によるデータ損失を回避するために、3つのレプリカを使用してデータを保存してください。
:::
1. マルチレプリカクラスターでは、1つのBEノードでプロセスを停止し、段階的なアップグレードを実行することを選択できます：

   ```bash
   sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
   ```
2. BEディレクトリ内の`/bin`と`/lib`ディレクトリの名前を変更します：

   ```bash
   mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
   mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
   ```
3. 新しいバージョンの `/bin` と `/lib` ディレクトリを元のBEディレクトリにコピーします：

   ```bash
   cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
   cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
   ```
4. BE ノードを開始します:

   ```bash
   sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
   ```
5. クラスターに接続してノード情報を確認します：

   ```sql
   show backends\G
   ```
BE ノードの `alive` ステータスが `true` で、`Version` 値が新しいバージョンである場合、ノードのアップグレードは正常に完了しています。

### ステップ 3: FE ノードのアップグレード

1. マルチ FE ノード構成では、アップグレード対象として非 Master ノードを選択し、最初にそれを停止します：

   ```bash
   sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
   ```
2. FEディレクトリ内の`/bin`、`/lib`、`/mysql_ssl_default_certificate`ディレクトリの名前を変更します：

   ```bash
   mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
   mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
   mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
   ```
3. 新しいバージョンの`/bin`、`/lib`、および`/mysql_ssl_default_certificate`ディレクトリを元のFEディレクトリにコピーします：

   ```bash
   cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
   cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
   cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
   ```
4. FEノードを開始します：

   ```sql
   sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
   ```
5. クラスターに接続してノード情報を確認します：

   ```sql
   show frontends\G
   ```
FE ノードの `alive` ステータスが `true` で、`Version` 値が新しいバージョンである場合、そのノードのアップグレードは正常に完了しています。

6. 他の FE ノードを順次アップグレードし、最後に Master ノードをアップグレードします。

### ステップ 4: レプリカ修復とバランス機能の有効化

アップグレードが完了し、すべての BE ノードのステータスが `Alive` になったら、クラスタのレプリカ修復とバランス機能を有効にします：

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```
