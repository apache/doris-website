---
{
    "title": "ストレージ・コンピューティング分離クラスターのアップグレードガイド（ローリングアップグレード）",
    "sidebar_label": "ローリングアップグレードガイド",
    "language": "ja",
    "description": "Doris のストレージ・コンピューティング分離クラスターでローリングアップグレードを行う方法。MetaService、Recycler、BE、FE のアップグレード順序と手順を説明します。",
    "keywords": ["Doris アップグレード", "ストレージ・コンピューティング分離のアップグレード", "ローリングアップグレード", "MetaService アップグレード", "BE アップグレード", "FE アップグレード"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster upgrade / Version migration -->

Doris のストレージ・コンピューティング分離クラスターは、システム全体を停止せずに上流アプリケーションへの影響を抑えられる**ローリングアップグレード**に対応しています。このドキュメントでは、アップグレード前の確認、コンポーネントごとのアップグレード手順、よくある質問を含む、ストレージ・コンピューティング分離モードのアップグレード手順全体を説明します。

ストレージ・コンピューティング統合クラスターのアップグレードについては、[クラスターのアップグレード](../admin-manual/cluster-management/upgrade)を参照してください。

## バージョン番号

<!-- Knowledge type: Configuration parameters -->

Doris のバージョン番号は三つの部分から構成されます（例: `3.0.3`）。現在のバージョンを確認するには、次の SQL を実行します。

```sql
MySQL [(none)]> select @@version_comment;
+----------------------------------------------------------+
| @@version_comment                                        |
+----------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode)  |
+----------------------------------------------------------+
```

バージョン番号の各部分の意味は次のとおりです。

| 位置 | 意味 | 例 |
|------|------|------|
| 最初 | メジャーバージョン | `3` |
| 二番目 | マイナーバージョン | `0` |
| 三番目 | パッチバージョン | `3` |
| 四番目（任意） | パッチバージョンの重大な不具合に対応する緊急修正版 | `2.0.2.1` |

バージョン文字列に付く `Cloud Mode` は、クラスターがストレージ・コンピューティング分離モードで稼働していることを示します。ストレージ・コンピューティング統合モードのクラスターには、この表示は付きません。

**モード切り替えの制限:** ストレージ・コンピューティング分離モードとストレージ・コンピューティング統合モードの間の切り替えは**サポートされていません**。

**ダウングレードの制限:** 下位バージョンから上位バージョンへのアップグレード、およびパッチバージョンのダウングレードはサポートされています。**マイナーバージョンとメジャーバージョンのダウングレードはサポートされていません。**

## 前提条件

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Environment validation -->

アップグレード前に、以下の条件をすべて満たしていることを確認してください。

1. **デプロイモードの確認:** クラスターがストレージ・コンピューティング分離モードで稼働していることを確認します（バージョン文字列に `Cloud Mode` が含まれます）。
2. **インポートの再試行の設定:** アップグレード中のノード再起動によってジョブが失敗しないように、インポートジョブに再試行の仕組みがあることを確認します。
3. **コンポーネントの状態の確認:** MetaService、Recycler、FE、BE がすべて正常に稼働し、エラーログがないことを確認します。
4. **FE メタデータのバックアップ:** Master FE のメタデータディレクトリ（デフォルトでは FE ディレクトリ内の `doris-meta` ディレクトリ）をバックアップします。そのディレクトリが空の場合は、`meta_dir` 設定項目（`conf/fe.conf` 内）で実際のパスを確認してください。
5. **インストールパッケージのダウンロード:** [Doris 公式サイト](https://doris.apache.org/download)から対象バージョンのインストールパッケージをダウンロードし、SHA-512 チェックサムを検証してパッケージの完全性を確認します。

## アップグレードの流れ

<!-- Knowledge type: Operational steps -->

各コンポーネントを次の順序でアップグレードします。

1. MetaService をアップグレード
2. Recycler をアップグレード（個別にデプロイされている場合のみ）
3. BE をアップグレード
4. FE をアップグレード
    1. 最初に Observer FE ノードをアップグレード
    2. 次に Master 以外の FE ノードをアップグレード
    3. 最後に Master FE ノードをアップグレード

## アップグレード手順

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster upgrade / Version migration -->

### ステップ 1: MetaService のアップグレード

各 MetaService インスタンスで以下の操作を行います。このステップで使用する環境変数は次のとおりです。

| 変数 | 意味 |
|------|------|
| `${MS_HOME}` | MetaService の作業ディレクトリ |
| `${MS_PACKAGE_DIR}` | 新しい MetaService インストールパッケージを格納したディレクトリ |

**1. 現在の MetaService を停止する**

```shell
cd ${MS_HOME}
sh bin/stop.sh
```

**2. 既存のバイナリをバックアップする**

```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 新しいインストールパッケージを配置する**

```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

**4. 新しい MetaService を起動する**

```shell
sh ${MS_HOME}/bin/start.sh --daemon
```

**5. アップグレードを確認する**

MetaService プロセスが正常に稼働し、`${MS_HOME}/log/doris_cloud.out` に新しいバージョン番号が表示されることを確認します。

---

### ステップ 2: Recycler のアップグレード（該当する場合）

:::caution
Recycler コンポーネントを個別にデプロイしていない場合は、このステップをスキップしてください。
:::

各 Recycler インスタンスで以下の操作を行います。MetaService と Recycler は同じインストールパッケージを使用します。このステップで使用する環境変数は次のとおりです。

| 変数 | 意味 |
|------|------|
| `${RECYCLER_HOME}` | Recycler の作業ディレクトリ |
| `${MS_PACKAGE_DIR}` | 新しいインストールパッケージを格納したディレクトリ（MetaService と共通） |

**1. 現在の Recycler を停止する**

```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```

**2. 既存のバイナリをバックアップする**

```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 新しいインストールパッケージを配置する**

```shell
cp ${MS_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

**4. 新しい Recycler を起動する**

```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```

**5. アップグレードを確認する**

Recycler プロセスが正常に稼働し、`${RECYCLER_HOME}/log/doris_cloud.out` に新しいバージョン番号が表示されることを確認します。

---

### ステップ 3: BE のアップグレード

:::tip
BE をアップグレードする前に、すべての MetaService インスタンスと Recycler インスタンス（該当する場合）のアップグレードが完了していることを確認してください。
:::

各 BE インスタンスで以下の操作を行います。このステップで使用する環境変数は次のとおりです。

| 変数 | 意味 |
|------|------|
| `${BE_HOME}` | BE の作業ディレクトリ |
| `${BE_PACKAGE_DIR}` | 新しい BE インストールパッケージを格納したディレクトリ |

**1. 現在の BE を停止する**

```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

**2. 既存のバイナリをバックアップする**

```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 新しいインストールパッケージを配置する**

```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

**4. 新しい BE を起動する**

```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

**5. アップグレードを確認する**

次の SQL を実行し、BE のバージョンと状態を確認します。

```sql
show backends;
```

---

### ステップ 4: FE のアップグレード

:::tip
FE をアップグレードする前に、すべての BE インスタンスのアップグレードが完了していることを確認してください。
:::

FE ノードは、**Observer -> Master 以外 -> Master** の順序で一台ずつアップグレードする必要があります。

各 FE インスタンスで以下の操作を行います。このステップで使用する環境変数は次のとおりです。

| 変数 | 意味 |
|------|------|
| `${FE_HOME}` | FE の作業ディレクトリ |
| `${FE_PACKAGE_DIR}` | 新しい FE インストールパッケージを格納したディレクトリ |

**1. 現在の FE を停止する**

```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

**2. 既存のバイナリをバックアップする**

```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 新しいインストールパッケージを配置する**

```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

**4. 新しい FE を起動する**

```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

**5. アップグレードを確認する**

次の SQL を実行し、FE のバージョンと状態を確認します。

```sql
show frontends;
```

## よくある質問

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Troubleshooting -->

**Q1: ストレージ・コンピューティング統合クラスターのアップグレードでは、事前にレプリカの再配置を無効にする必要があります。ストレージ・コンピューティング分離モードでも必要ですか？**

いいえ。ストレージ・コンピューティング分離モードでは、Doris は HDFS またはオブジェクトストレージ（S3）にデータを保存するため、レプリカの再配置に関する要件はありません。この操作は不要です。

**Q2: MetaService が専用のメタデータサービスを提供しているのに、なぜ FE のメタデータもバックアップする必要があるのですか？**

現時点では、MetaService と FE がそれぞれ異なる部分を担当し、共同でメタデータを管理しています。アップグレードを安全に行うため、アップグレード前に FE のメタデータディレクトリをバックアップしてください。
