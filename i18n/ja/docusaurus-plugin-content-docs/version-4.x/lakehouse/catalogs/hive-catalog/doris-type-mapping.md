---
{
    "title": "Hive から Doris へのデータ型マッピング",
    "sidebar_label": "Doris のデータ型マッピング",
    "description": "データ型、精度、ネストした型、サポートされない型を扱う Doris 4.2 の Hive 型マッピングのリファレンス。"
}
---

次の表は、Doris 4.2（`branch-4.2`）が Hive 外部テーブルのスキーマを読み取る際の型マッピングを示します。書き込み時には、対象のスキーマとサポートされる書き込み操作も関係します。読み取り時のマッピングを逆にたどっても、書き込み時のマッピングが自動的に決まるわけではありません。

| Hive の型     | Doris の型    | 備考                                        |
| ------------- | ------------- | ---------------------------------------------- |
| boolean       | boolean       |                                                |
| tinyint       | tinyint       |                                                |
| smallint      | smallint      |                                                |
| int           | int           |                                                |
| bigint        | bigint        |                                                |
| date          | date          |                                                |
| timestamp     | datetime(6)   | 精度 6 の datetime にマッピングされます。            |
| float         | float         |                                                |
| double        | double        |                                                |
| decimal(P, S) | decimal(P, S) | 精度を指定しない場合、デフォルトは decimal(9, 0) です。 |
| char(N)       | char(N)       |                                                |
| varchar(N)    | varchar(N)    |                                                |
| string        | string        |                                                |
| binary | VARBINARY | 4.1.5 以降、この型は常に `VARBINARY` にマッピングされます。 |
| timestamp with local time zone | TIMESTAMPTZ(6) | 4.1.5 以降、この型は常に `TIMESTAMPTZ(6)` にマッピングされます。精度の上限は 6 で、それを超える精度は失われます。 |
| array         | array         |                                                |
| map           | map           |                                                |
| struct        | struct        |                                                |
| other         | unsupported   |                                                |

## 使用上の注意 {#usage-notes}

複合型の子フィールドにも、同じマッピングが再帰的に適用されます。`TIMESTAMPTZ` は、セッションの `time_zone` に従って表示される時点を表します。

Hive Catalog は、Hive Metastore の型文字列からスキーマを導出します。`timestamp` は `DATETIME(6)` にマッピングされます。基になるファイルにナノ秒精度のデータが含まれていても、マッピングが自動的に `TIMESTAMP_NS` に変わることはありません。`uniontype` を含め、サポート対象として記載されていない型はサポートされません。

実装の参照先：[HiveMetaStoreClientHelper.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/hive/HiveMetaStoreClientHelper.java)（`branch-4.2`）。
