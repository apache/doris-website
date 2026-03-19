---
{
  "title": "Doris Compute-Storage分離デプロイメント準備",
  "language": "ja",
  "description": "この文書では、Apache Dorisの計算とストレージ分離モードのデプロイメント準備作業について説明します。"
}
---
## 1. 概要

このドキュメントでは、Apache Dorisのコンピュート・ストレージ分離モードの展開準備作業について説明します。分離アーキテクチャは、システムのスケーラビリティとパフォーマンスの向上を目的としており、大規模データ処理シナリオに適しています。

## 2. アーキテクチャコンポーネント

Dorisのコンピュート・ストレージ分離アーキテクチャは、3つの主要モジュールで構成されます：

1. **Frontend (FE)**: ユーザーリクエストを処理し、メタデータを管理します。
2. **Backend (BE)**: クエリタスクを実行するステートレスなコンピュートノード。
3. **Meta Service (MS)**: メタデータ操作とデータ復旧を管理します。

## 3. システム要件

### 3.1 ハードウェア要件

- 最小構成：3台のサーバー
- 推奨構成：5台以上のサーバー

### 3.2 ソフトウェア依存関係

- FoundationDB (FDB) バージョン7.1.38以上
- OpenJDK 17

## 4. 展開計画

### 4.1 テスト環境での展開

すべてのモジュールを単一のマシンに展開。本番環境には適していません。

### 4.2 本番環境での展開

- FDBを3台以上のマシンに展開
- FEとMeta Serviceを3台以上のマシンに展開
- BEを3台以上のマシンに展開

マシンの構成が高い場合は、FDB、FE、Meta Serviceの混在を検討しますが、ディスクは混在させないでください。

## 5. インストール手順

### 5.1 FoundationDBのインストール

このセクションでは、提供されたスクリプト`fdb_vars.sh`と`fdb_ctl.sh`を使用してFoundationDB (FDB)サービスを設定、展開、開始するためのステップバイステップガイドを提供します。[Dorisリリースパッケージをダウンロード](https://doris.apache.org/download)後、これらのスクリプトは`tools/fdb`ディレクトリにあります。

:::tip
Dorisは現在、デフォルトでFDBバージョン7.1.xに依存しています。FDBを別途インストール済みの場合は、バージョン7.1.xであることを確認してください。そうでなければ、Meta Serviceの開始に失敗します。
:::

#### 5.1.1 マシン要件

通常、SSDを搭載した少なくとも3台のマシンが必要で、データの二重レプリカを持つFoundationDBクラスターを形成し、単一マシンの障害に対応できます。
SSDが利用できない場合、少なくとも標準的なクラウドディスクまたは標準的なPOSIX準拠ファイルシステムを持つローカルディスクをデータストレージに使用する必要があります。そうでなければ、FoundationDBが正常に動作しない可能性があります。例えば、JuiceFSのようなストレージソリューションはFoundationDBの基盤ストレージとして使用すべきではありません。

:::tip
開発/テスト目的のみであれば、単一マシンで十分です。
:::

#### 5.1.2 `fdb_vars.sh`設定

##### 必須カスタム設定

| パラメータ | 説明 | 型 | 例 | 備考 |
|-----------|-------------|------|---------|-------|
| `DATA_DIRS` | FoundationDBストレージのデータディレクトリを指定 | カンマ区切りの絶対パスリスト | `/mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3` | - スクリプト実行前にディレクトリが作成されていることを確認<br/>- 本番環境ではSSDと個別ディレクトリを推奨 |
| `FDB_CLUSTER_IPS` | クラスターIPを定義 | 文字列（カンマ区切りIPアドレス） | `172.200.0.2,172.200.0.3,172.200.0.4` | - 本番クラスターには少なくとも3つのIPアドレス<br/>- 最初のIPがコーディネーターとして使用される<br/>- 高可用性のため、マシンを異なるラックに配置 |
| `FDB_HOME` | FoundationDBのメインディレクトリを定義 | 絶対パス | `/fdbhome` | - デフォルトパスは/fdbhome<br/>- このパスが絶対パスであることを確認 |
| `FDB_CLUSTER_ID` | クラスターIDを定義 | 文字列 | `SAQESzbh` | - 各クラスターIDは一意である必要がある<br/>- `mktemp -u XXXXXXXX`を使用して生成可能 |
| `FDB_CLUSTER_DESC` | FDBクラスターの説明を定義 | 文字列 | `dorisfdb` | - 展開にとって意味のあるものに変更することを推奨 |

##### オプションカスタム設定

| パラメータ | 説明 | 型 | 例 | 備考 |
|-----------|-------------|------|---------|-------|
| `MEMORY_LIMIT_GB` | FDBプロセスのメモリ制限をGBで定義 | 整数 | `MEMORY_LIMIT_GB=16` | 利用可能なメモリリソースとFDBプロセス要件に基づいてこの値を調整 |
| `CPU_CORES_LIMIT` | FDBプロセスのCPUコア制限を定義 | 整数 | `CPU_CORES_LIMIT=8` | 利用可能なCPUコア数とFDBプロセス要件に基づいてこの値を設定 |

#### 5.1.3 FDBクラスターの展開

`fdb_vars.sh`で環境を設定した後、`fdb_ctl.sh`スクリプトを使用して各ノードにFDBクラスターを展開できます。

```bash
./fdb_ctl.sh deploy
```
このコマンドはFDBクラスターのデプロイメントプロセスを開始します。

### 5.1.4 FDBサービスの開始

FDBクラスターがデプロイされた後、`fdb_ctl.sh`スクリプトを使用して各ノードでFDBサービスを開始できます。

```bash
./fdb_ctl.sh start
```
このコマンドはFDBサービスを開始し、クラスターを運用可能な状態にし、MetaServiceの設定に使用できるFDBクラスター接続文字列を取得します。

### 5.2 OpenJDK 17のインストール

1. [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)をダウンロード
2. 展開し、環境変数JAVA_HOMEを設定

## 6. 次のステップ

上記の準備が完了したら、以下のドキュメントを参照してデプロイを続行してください：

1. [Deployment](./compilation-and-deployment.md)
2. [Managing Compute Group](./managing-compute-cluster.md)
3. [Managing Storage Vault](./managing-storage-vault.md)

## 7. 注意事項

- 全ノード間での時刻同期を確保してください
- FoundationDBデータを定期的にバックアップしてください
- 実際の負荷に基づいてFoundationDBとDorisの設定パラメータを調整してください
- データストレージにはPOSIX準拠のファイルシステムを持つ標準クラウドディスクまたはローカルディスクを使用してください。そうでなければ、FoundationDBが正常に機能しない可能性があります。
	* たとえば、JuiceFSなどのストレージソリューションはFoundationDBのストレージバックエンドとして使用すべきではありません。

## 8. 参考資料

- [FoundationDB Official Documentation](https://apple.github.io/foundationdb/index.html)
- [Apache Doris Official Website](https://doris.apache.org/)
