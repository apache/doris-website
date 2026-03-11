---
{
  "title": "アップグレード",
  "language": "ja",
  "description": "このガイドでは、ストレージ・コンピュート分離アーキテクチャ（Cloud Modeとも呼ばれる）を使用してDorisをアップグレードするための段階的な手順を提供します。"
}
---
## 概要

このガイドでは、ストレージとコンピューティングの分離アーキテクチャ（Cloud Mode とも呼ばれる）を使用した Doris のアップグレードについて、ステップバイステップの手順を説明します。アップグレードは、クラスターアップグレードのために本セクションで推奨される手順を使用して実行する必要があります。Doris クラスターのアップグレードは**ローリングアップグレード**方式を使用して実行でき、この方式ではアップグレードのためにすべてのクラスターノードをシャットダウンする必要がなく、アプリケーションへの影響を大幅に最小化できます。

## Doris バージョン説明

Doris はドットで区切られた3つの数字のバージョン形式を使用しており、以下の SQL を使用して確認できます：

```sql
MySQL [(none)]> select @@version_comment;
+--------------------------------------------------------+
| @@version_comment                                      |
+--------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode) |
+--------------------------------------------------------+
```
> `3.0.3`の1番目の数字はメジャーバージョン番号、2番目の数字はマイナーバージョン番号、3番目の数字はパッチバージョン番号を表します。場合によっては、バージョン番号が`2.0.2.1`のような4つの数字形式になることがあり、最後の数字は緊急バグ修正バージョンを示し、通常このパッチバージョンに重大なバグがあることを意味します。
>
> Dorisはバージョン`3.0.0`からクラウドモードでのデプロイメントをサポートしています。このモードでデプロイした場合、バージョン番号にCloud Modeサフィックスが付きます。統合ストレージ・コンピュート（別名Local）モードで起動した場合、そのようなサフィックスは付きません。

DorisをCloud Modeでデプロイした場合、Localモードに戻すことはサポートされていません。同様に、LocalモードのDorisはCloud Modeに切り替えることはサポートされていません。

原則として、Dorisは低いバージョンから高いバージョンへのアップグレードと、パッチバージョン間でのダウングレードをサポートしています。マイナーバージョンやメジャーバージョン間でのダウングレードは許可されていません。

## アップグレード手順

### アップグレード説明

1. DorisがCloud Modeで起動していることを確認してください。Dorisの現在のデプロイメントモードが不明な場合は、[前のセクション](#doris-version-description)の説明を参照してください。
   LocalモードのDorisの場合は、アップグレード手順について[Cluster Upgrade](../admin-manual/cluster-management/upgrade)を参照してください。
2. アップグレードプロセス中のノード再起動によるタスク失敗を避けるため、Dorisデータインポートタスクにリトライメカニズムがあることを確認してください。
3. アップグレード前に、すべてのDorisコンポーネント（MetaService、Recycler、Frontend、Backend）のステータスを確認し、正常に動作しており例外ログがないことを確認して、アップグレードプロセスに影響を与えないようにすることを推奨します。

### アップグレードプロセスの概要

1. メタデータバックアップ
2. MetaServiceのアップグレード
3. Recyclerのアップグレード（ある場合）
4. BEのアップグレード
5. FEのアップグレード
   1. まずObserver FEをアップグレード
   2. 次に他の非Master FEをアップグレード
   3. 最後にMaster FEをアップグレード

### アップグレード前作業

1. Master FEのメタデータディレクトリをバックアップします。通常、メタデータディレクトリはFEホームディレクトリ下の`doris-meta`ディレクトリです。このディレクトリが空の場合、メタデータを保存するために別のディレクトリを設定していることを意味します。FE設定ファイル（conf/fe.conf）で`meta_dir`を検索できます。
2. Doris公式ウェブサイトからパッケージを[Download](/download)します。パッケージがDorisによって提供されたものと一致することを確認するため、SHA-512ハッシュを検証することを推奨します。

### アップグレードプロセス

#### 1. MetaServiceのアップグレード

以下の環境変数を仮定します：
- `${MS_HOME}`: MetaServiceの作業ディレクトリ。
- `${MS_PACKAGE_DIR}`: 新しいMetaServiceパッケージが含まれているディレクトリ。

各MetaServiceインスタンスをアップグレードするには、以下の手順に従ってください。

1.1. 現在のMetaServiceを停止：

```shell
cd ${MS_HOME}
sh bin/stop.sh
```
1.2. 既存のMetaServiceバイナリをバックアップします：

```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
1.3. 新しいpackageをデプロイする：

```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```
1.4. 新しい MetaService を開始する：

```shell
sh ${MS_HOME}/bin/start.sh --daemon
```
1.5. 新しいMetaServiceのステータスを確認：

新しいMetaServiceが実行されており、`${MS_HOME}/log/doris_cloud.out`に新しいバージョン番号が存在することを確認してください。

#### 2. Recyclerのアップグレード（該当する場合）

:::caution
Recyclerコンポーネントを個別にデプロイしていない場合は、この手順をスキップできます。
:::

以下の環境変数を想定：
- `${RECYCLER_HOME}`：Recyclerの作業ディレクトリ
- `${MS_PACKAGE_DIR}`：新しいMetaServiceパッケージが含まれているディレクトリ、MetaServiceとRecyclerは同じパッケージを使用します。

以下の手順に従って各Recyclerインスタンスをアップグレードしてください。

2.1. 現在のRecyclerを停止：

```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```
2.2. 既存のRecyclerバイナリファイルをバックアップする：

```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
2.3. 新しいpackageをデプロイする：

```shell
cp ${RECYCLER_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${RECYCLER_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```
2.4. 新しいRecyclerを開始する:

```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```
2.5. 新しいRecyclerのステータスを確認する：

新しいMetaServiceが実行されていること、および`${RECYCLER_HOME}/log/doris_cloud.out`に新しいバージョン番号が存在することを確認してください。

#### 3. BEのアップグレード

MetaServiceとRecycler（別途インストールされている場合）のすべてのインスタンスがアップグレードされていることを確認してください。

以下の環境変数を前提とします：
- `${BE_HOME}`：BEの作業ディレクトリ。
- `${BE_PACKAGE_DIR}`：新しいBEパッケージを含むディレクトリ。

以下の手順に従って各BEインスタンスをアップグレードしてください。

3.1. 現在のBEを停止する：

```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```
3.2. 既存のBEバイナリをバックアップします:

```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
3.3. 新しいパッケージをデプロイする：

```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```
3.4. 新しいBEを開始する:

```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```
3.5. 新しいBEのステータスを確認:

新しいBEが新しいバージョンで稼働し、操作可能であることを確認してください。ステータスとバージョンは以下のSQLを使用して取得できます。

```sql
show backends;
```
#### 4. FEのアップグレード

BEのすべてのインスタンスがアップグレードされていることを確認してください。

以下の環境変数を想定しています：
- `${FE_HOME}`: FEの作業ディレクトリ。
- `${FE_PACKAGE_DIR}`: 新しいFEパッケージを含むディレクトリ。

Frontend (FE) インスタンスを以下の順序でアップグレードしてください：
1. Observer FEノード
2. 非masterのFEノード
3. Master FEノード

以下の手順に従って各Frontend (FE) ノードをアップグレードしてください。

4.1. 現在のFEを停止します：

```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```
4.2. 既存のFEバイナリをバックアップする：

```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```
4.3. 新しいpackageをデプロイする：

```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```
4.4. 新しいFEを開始する:

```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```
4.5. 新しいFEのステータス確認:

新しいFEが新しいバージョンで稼働し、動作していることを確認してください。ステータスとバージョンは以下のSQLを使用して取得できます。

```sql
show frontends;
```
## FAQ

1. ローカルモードのDorisはアップグレード前にレプリカバランス機能をオフにする必要がありますか？クラウドモードのクラスターでは必要ですか？

いいえ。クラウドモードでは、データはHDFSまたはS3サービスに保存されるため、レプリカバランシングは必要ありません。

2. 独立したMetaServiceがメタデータサービスを提供しているのに、なぜFEのメタデータをバックアップする必要があるのですか？

現在、MetaServiceが一部のメタデータを保存し、FEも一部のメタデータを保存しているためです。安全上の理由から、FEのメタデータをバックアップすることを推奨します。
