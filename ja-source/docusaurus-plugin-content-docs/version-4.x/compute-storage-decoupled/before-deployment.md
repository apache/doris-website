---
{
  "title": "Doris Compute-Storage分離デプロイメントの準備",
  "language": "ja",
  "description": "この文書では、Apache Dorisのコンピュート・ストレージ分離モードのデプロイメント準備作業について説明します。"
}
---
## 1. 概要

このドキュメントでは、Apache Dorisのcompute-storage分離モードのデプロイメント準備作業について説明します。分離アーキテクチャは、システムのスケーラビリティとパフォーマンスの向上を目的とし、大規模なデータ処理シナリオに適しています。

## 2. アーキテクチャコンポーネント

Dorisのcompute-storage分離アーキテクチャは、3つの主要モジュールで構成されています：

1. **Frontend (FE)**: ユーザーリクエストを処理し、メタデータを管理します。
2. **Backend (BE)**: クエリタスクを実行するステートレスなコンピュートノードです。
3. **Meta Service (MS)**: メタデータ操作とデータリカバリを管理します。

## 3. システム要件

### 3.1 ハードウェア要件

- 最小構成: 3台のサーバー
- 推奨構成: 5台以上のサーバー

### 3.2 ソフトウェア依存関係

- FoundationDB (FDB) バージョン7.1.38以上
- OpenJDK 17

## 4. デプロイメント計画

### 4.1 テスト環境でのデプロイメント

すべてのモジュールを1台のマシンにデプロイします。本番環境には適していません。

### 4.2 本番環境でのデプロイメント

- FDBを3台以上のマシンにデプロイ
- FEとMeta Serviceを3台以上のマシンにデプロイ
- BEを3台以上のマシンにデプロイ

マシンの構成が高い場合は、FDB、FE、Meta Serviceを混在させることを検討できますが、ディスクは混在させないでください。

## 5. インストール手順

### 5.1 FoundationDBのインストール

このセクションでは、提供されたスクリプト`fdb_vars.sh`と`fdb_ctl.sh`を使用して、FoundationDB (FDB)サービスを構成、デプロイ、および開始する手順を説明します。[Dorisリリースパッケージをダウンロード](https://doris.apache.org/download)した後、これらのスクリプトは`tools/fdb`ディレクトリで見つけることができます。

:::tip
Dorisは現在、デフォルトでFDBバージョン7.1.xに依存しています。すでにFDBを別途インストールしている場合は、バージョン7.1.xであることを確認してください。そうでなければ、Meta Serviceの開始に失敗します。
:::

#### 5.1.1 マシン要件

通常、SSDを搭載した少なくとも3台のマシンが、二重データレプリカを持つFoundationDBクラスターを形成し、単一マシンの障害に対応するために必要です。
SSDが利用できない場合は、データストレージに標準的なクラウドディスクまたは標準のPOSIX準拠ファイルシステムを持つローカルディスクを少なくとも使用する必要があります。そうでなければ、FoundationDBは正常に動作しない可能性があります - 例えば、JuiceFSなどのストレージソリューションはFoundationDBの基盤ストレージとして使用すべきではありません。

:::tip
開発/テスト目的のみであれば、単一マシンで十分です。
:::

#### 5.1.2 `fdb_vars.sh`の設定

##### 必須のカスタム設定

| パラメータ | 説明 | タイプ | 例 | 注意事項 |
|-----------|------|------|-----|----------|
| `DATA_DIRS` | FoundationDBストレージのデータディレクトリを指定 | 絶対パスのカンマ区切りリスト | `/mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3` | - スクリプト実行前にディレクトリを作成することを確認<br/>- 本番環境ではSSDと個別のディレクトリを推奨 |
| `FDB_CLUSTER_IPS` | クラスターIPを定義 | 文字列（カンマ区切りIPアドレス） | `172.200.0.2,172.200.0.3,172.200.0.4` | - 本番クラスターには少なくとも3つのIPアドレス<br/>- 最初のIPがcoordinatorとして使用される<br/>- 高可用性のため、マシンを異なるラックに配置 |
| `FDB_HOME` | FoundationDBのメインディレクトリを定義 | 絶対パス | `/fdbhome` | - デフォルトパスは/fdbhome<br/>- このパスが絶対パスであることを確認 |
| `FDB_CLUSTER_ID` | クラスターIDを定義 | 文字列 | `SAQESzbh` | - 各クラスターIDは一意である必要がある<br/>- `mktemp -u XXXXXXXX`を使用して生成可能 |
| `FDB_CLUSTER_DESC` | FDBクラスターの説明を定義 | 文字列 | `dorisfdb` | - デプロイメントにとって意味のある名前に変更することを推奨 |

##### オプションのカスタム設定

| パラメータ | 説明 | タイプ | 例 | 注意事項 |
|-----------|------|------|-----|----------|
| `MEMORY_LIMIT_GB` | FDBプロセスのメモリ制限をGBで定義 | 整数 | `MEMORY_LIMIT_GB=16` | 利用可能なメモリリソースとFDBプロセス要件に基づいてこの値を調整 |
| `CPU_CORES_LIMIT` | FDBプロセスのCPUコア制限を定義 | 整数 | `CPU_CORES_LIMIT=8` | 利用可能なCPUコア数とFDBプロセス要件に基づいてこの値を設定 |

#### 5.1.3 FDBクラスターのデプロイ

`fdb_vars.sh`で環境を設定した後、`fdb_ctl.sh`スクリプトを使用して各ノードでFDBクラスターをデプロイできます。

```bash
./fdb_ctl.sh deploy
```
このコマンドはFDBクラスターのデプロイメントプロセスを開始します。

### 5.1.4 FDBサービスの開始

FDBクラスターがデプロイされると、`fdb_ctl.sh`スクリプトを使用して各ノードでFDBサービスを開始できます。

```bash
./fdb_ctl.sh start
```
このコマンドはFDBサービスを開始し、クラスターを運用可能にして、MetaServiceの設定に使用できるFDBクラスター接続文字列を取得します。

### 5.2 OpenJDK 17のインストール

1. [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)をダウンロードする
2. 展開して環境変数JAVA_HOMEを設定する

## 6. 次のステップ

上記の準備が完了したら、以下のドキュメントを参照してデプロイメントを続けてください：

1. [Deployment](./compilation-and-deployment.md)
2. [Managing Compute Group](./managing-compute-cluster.md)
3. [Managing Storage Vault](./managing-storage-vault.md)

## 7. 注意事項

- 全てのノードで時刻同期を確実に行う
- FoundationDBデータを定期的にバックアップする
- 実際の負荷に基づいてFoundationDBとDorisの設定パラメータを調整する
- データストレージには標準のクラウドディスクまたはPOSIX準拠のファイルシステムを持つローカルディスクを使用する。そうでなければ、FoundationDBが正常に動作しない可能性があります。
	* 例えば、JuiceFSのようなストレージソリューションはFoundationDBのストレージバックエンドとして使用すべきではありません。

## 8. 参考資料

- [FoundationDB Official Documentation](https://apple.github.io/foundationdb/index.html)
- [Apache Doris Official Website](https://doris.apache.org/)
