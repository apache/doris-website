---
{
  "title": "アップグレード",
  "language": "ja",
  "description": "このガイドでは、ストレージ・コンピュート分離アーキテクチャ（Cloud Modeとも呼ばれる）を使用してDorisをアップグレードするための段階的な手順を提供します。"
}
---
## 概要

このガイドでは、ストレージ・コンピュート分離アーキテクチャ（Cloud Modeとも呼ばれる）を使用したDorisのアップグレードについて、段階的な手順を提供します。アップグレードは、クラスターのアップグレードについて本セクションで推奨される手順を使用して実行する必要があります。Dorisクラスターのアップグレードは**ローリングアップグレード**方式を使用して実行できます。これは、アップグレードのためにすべてのクラスターノードをシャットダウンする必要がなく、アプリケーションへの影響を大幅に最小化します。

## Dorisバージョンの説明

Dorisは、ドットで区切られた3つの数字からなるバージョン形式を使用しており、以下のSQLで確認できます：

```sql
MySQL [(none)]> select @@version_comment;
+--------------------------------------------------------+
| @@version_comment                                      |
+--------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode) |
+--------------------------------------------------------+
```
> `3.0.3` の1番目の数字はメジャーバージョン番号を表し、2番目の数字はマイナーバージョン番号を表し、3番目の数字はパッチバージョン番号を表します。場合によっては、バージョン番号が `2.0.2.1` のような4桁形式になることがあり、最後の数字は緊急バグ修正版を示し、通常このパッチバージョンには重大なバグがあることを意味します。
>
> Dorisはバージョン `3.0.0` からクラウドモードでのデプロイをサポートしています。このモードでデプロイされた場合、バージョン番号にはCloud Modeサフィックスが付きます。統合ストレージ・コンピュート（Local）モードで起動した場合、このようなサフィックスは付きません。

DorisをクラウドモードでデプロイしたLuoは、ローカルモードに切り替えることはサポートされていません。同様に、ローカルモードのDorisはクラウドモードに切り替えることはサポートされていません。

原則として、Dorisは低いバージョンから高いバージョンへのアップグレードと、パッチバージョン間でのダウングレードをサポートしています。マイナーバージョンまたはメジャーバージョン間でのダウングレードは許可されていません。

## アップグレード手順

### アップグレード指示

1. Dorisがクラウドモードで起動されていることを確認してください。Dorisの現在のデプロイモードが不明な場合は、[前のセクション](#doris-version-description)の指示を参照してください。
   ローカルモードのDorisについては、アップグレード手順は[Cluster Upgrade](../admin-manual/cluster-management/upgrade)を参照してください。
2. Dorisのデータインポートタスクにリトライ機構があることを確認して、アップグレードプロセス中のノード再起動によるタスク失敗を回避してください。
3. アップグレード前に、すべてのDorisコンポーネント（MetaService、Recycler、Frontend、Backend）のステータスをチェックし、正常に動作しており、例外ログがないことを確認してアップグレードプロセスに影響しないようにすることをお勧めします。

### アップグレードプロセスの概要

1. メタデータバックアップ
2. MetaServiceのアップグレード
3. Recyclerのアップグレード（存在する場合）
4. BEのアップグレード
5. FEのアップグレード
   1. 最初にObserver FEをアップグレード
   2. 次に他の非Master FEをアップグレード
   3. 最後にMaster FEをアップグレード

### アップグレード前作業

1. Master FEのメタデータディレクトリをバックアップします。通常、メタデータディレクトリはFEホームディレクトリ下の `doris-meta` ディレクトリです。このディレクトリが空の場合は、メタデータを保存する別のディレクトリが設定されていることを意味します。FE設定ファイル（conf/fe.conf）で `meta_dir` を検索できます。
2. Doris公式ウェブサイトからパッケージを[ダウンロード](/download)します。パッケージがDorisが提供するものと一致することを確認するため、SHA-512ハッシュを検証することをお勧めします。

### アップグレードプロセス

#### 1. MetaServiceのアップグレード

以下の環境変数を想定します：
- `${MS_HOME}`: MetaServiceの作業ディレクトリ。
- `${MS_PACKAGE_DIR}`: 新しいMetaServiceパッケージを含むディレクトリ。

各MetaServiceインスタンスをアップグレードするには、以下の手順に従ってください。

1.1. 現在のMetaServiceを停止します：

```shell
cd ${MS_HOME}
sh bin/stop.sh
```
1.2. 既存のMetaServiceバイナリをバックアップします：

```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
1.3. 新しいパッケージをデプロイします：

```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```
1.4. 新しいMetaServiceを開始する：

```shell
sh ${MS_HOME}/bin/start.sh --daemon
```
1.5. 新しいMetaServiceのステータスを確認：

新しいMetaServiceが実行されており、`${MS_HOME}/log/doris_cloud.out`に新しいバージョン番号が存在することを確認します。

#### 2. Recyclerのアップグレード（存在する場合）

:::caution
Recyclerコンポーネントを個別にデプロイしていない場合は、この手順をスキップできます。
:::

以下の環境変数を想定：
- `${RECYCLER_HOME}`: Recyclerの作業ディレクトリ
- `${MS_PACKAGE_DIR}`: 新しいMetaServiceパッケージを含むディレクトリ、MetaServiceとRecyclerは同じパッケージを使用します。

以下の手順に従って各Recyclerインスタンスをアップグレードします。

2.1. 現在のRecyclerを停止：

```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```
2.2. 既存のRecyclerバイナリファイルをバックアップする:

```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
2.3. 新しいpackageをデプロイする：

```shell
cp ${RECYCLER_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${RECYCLER_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```
2.4. 新しいRecyclerを開始する：

```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```
2.5. 新しいRecyclerのステータスを確認：

新しいMetaServiceが実行されており、`${RECYCLER_HOME}/log/doris_cloud.out`に新しいバージョン番号が存在することを確認してください。

#### 3. BEのアップグレード

MetaServiceとRecycler（別途インストールされている場合）のすべてのインスタンスがアップグレードされていることを確認してください。

以下の環境変数を想定します：
- `${BE_HOME}`：BEの作業ディレクトリ。
- `${BE_PACKAGE_DIR}`：新しいBEパッケージを含むディレクトリ。

以下の手順に従って各BEインスタンスをアップグレードしてください。

3.1. 現在のBEを停止：

```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```
3.2. 既存のBEバイナリをバックアップする:

```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
3.3. 新しいパッケージをデプロイする：

```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```
3.4. 新しいBEを開始する：

```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```
3.5. 新しいBEのステータスを確認する：

新しいBEが新しいバージョンで実行され、動作していることを確認します。ステータスとバージョンは以下のSQLを使用して取得できます。

```sql
show backends;
```
#### 4. FEのアップグレード

BEのすべてのインスタンスがアップグレードされていることを確認してください。

以下の環境変数を想定しています：
- `${FE_HOME}`：FEの作業ディレクトリ。
- `${FE_PACKAGE_DIR}`：新しいFEパッケージを含むディレクトリ。

Frontend（FE）インスタンスを以下の順序でアップグレードしてください：
1. Observer FEノード
2. 非masterのFEノード
3. Master FEノード

以下の手順に従って、各Frontend（FE）ノードをアップグレードしてください。

4.1. 現在のFEを停止します：

```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```
4.2. 既存のFEバイナリをバックアップする:

```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
4.3. 新しいパッケージをデプロイする：

```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```
4.4. 新しいFEを開始する:

```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```
4.5. 新しいFEのステータスを確認する：

新しいFEが新しいバージョンで実行され、動作していることを確認します。ステータスとバージョンは以下のSQLを使用して取得できます。

```sql
show frontends;
```
## FAQ

1. ローカルモードのDorisは、アップグレード前にレプリカバランス機能をオフにする必要がありますか？また、クラウドモードのクラスターには必要ですか？

いいえ。クラウドモードでは、データはHDFSまたはS3サービスに保存されるため、レプリカバランシングは不要です。

2. 独立したMetaServiceがメタデータサービスを提供している場合、なぜFEのメタデータをバックアップする必要がありますか？

現在、MetaServiceは一部のメタデータを保存し、FEも一部のメタデータを保存しているためです。安全上の理由から、FEのメタデータをバックアップすることを推奨します。
