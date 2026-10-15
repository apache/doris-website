---
{
    "title": "MySQL Dump",
    "language": "ja",
    "description": "mysqldump ツールを使用して Apache Doris のテーブルスキーマとデータをエクスポートする方法を説明します。開発、テスト、小規模なデータ移行に適しています。",
    "keywords": [
        "mysqldump",
        "Doris エクスポート",
        "スキーマのエクスポート",
        "データのエクスポート",
        "no-tablespaces",
        "source によるインポート"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Development and testing / Small-scale export and import / Schema backup -->

`mysqldump` は MySQL が提供する公式の論理エクスポートツールです。Apache Doris は **バージョン 0.15** 以降、`mysqldump` と互換性があります。テーブルのスキーマ（DDL）またはデータ（DML）をエクスポートし、`source` コマンドで Doris に再インポートできます。

### 適用シナリオ

| シナリオ | 推奨度 | 説明 |
| --- | --- | --- |
| 開発・テスト環境でのデータ移行 | 推奨 | 操作が簡単で、ツールを入手しやすい |
| スキーマのバックアップと移行 | 推奨 | `--no-data` を指定して DDL のみをエクスポートします |
| 小規模なデータのエクスポート | 推奨 | 数 MB から数百 MB 程度 |
| 本番環境での大規模なデータのエクスポート | **非推奨** | 性能と安定性に制約があります。代わりに `EXPORT` または `OUTFILE` を使用してください |

## 前提条件

- Doris のバージョンが 0.15 以降であること
- クライアント環境に `mysqldump` がインストールされていること
- 対象のデータベースとテーブルに対する読み取り権限があること（FE の MySQL プロトコルのデフォルトポートは `9030`）

## 使用例

### データまたはスキーマのエクスポート

以下の例はいずれも `127.0.0.1:9030` の FE に `root` アカウントで接続します。`--no-tablespaces` オプションを必ず指定してください（理由は後述の「注意事項」を参照してください）。

1. **指定したテーブルのスキーマとデータをエクスポートする**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1
    ```

2. **指定したテーブルのスキーマのみをエクスポートする（データは含めない）**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1 --no-data
    ```

3. **複数のデータベースに含まれるすべてのテーブルをエクスポートする**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test1 test2
    ```

4. **すべてのデータベースとテーブルをエクスポートする**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --all-databases
    ```

その他のオプションについては、[MySQL 公式の mysqldump マニュアル](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)を参照してください。

### エクスポートした結果を Doris にインポートする

`mysqldump` の出力を `.sql` ファイルにリダイレクトし、Doris クライアントで `source` コマンドを実行してインポートできます。

```shell
# 1. Export to a file
mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
    --databases test --tables table1 > table1.sql

# 2. Log in to Doris and run source to import
mysql -h127.0.0.1 -P9030 -uroot
```

```sql
source table1.sql;
```

## 注意事項

1. **`--no-tablespaces` オプションは必須です**：Doris は MySQL のテーブルスペースという概念に対応していません。このオプションを指定しないと、エクスポートは失敗します。
2. **開発、テスト、または小規模なデータの処理にのみ適しています**：`mysqldump` はシングルスレッドの論理エクスポートツールです。大量のデータを扱う際の性能と安定性は十分ではありません。**本番環境で大規模なデータを扱う場合は使用しないでください。**本番環境でデータをエクスポートする場合は、次のいずれかの方法を使用してください。
    - [`EXPORT` 文](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)：オブジェクトストレージまたは HDFS へ非同期でエクスポートします
    - [`SELECT INTO OUTFILE`](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md)：クエリ結果をファイルへ同期的にエクスポートします
