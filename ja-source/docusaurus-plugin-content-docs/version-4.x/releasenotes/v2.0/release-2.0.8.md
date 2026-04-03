---
{
  "title": "リリース 2.0.8",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.8バージョンでは約65件の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.8 バージョンでは約65の改善とバグ修正が行われました。

- **クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)



## 1 動作変更

`ADMIN SHOW` ステートメントは、MySQL 8.x jdbc driver の高バージョンでは実行できません。そのため、これらのステートメントの名前を変更し、`ADMIN` キーワードを削除します。

- https://github.com/apache/doris/pull/29492

```sql
ADMIN SHOW CONFIG -> SHOW CONFIG
ADMIN SHOW REPLICA -> SHOW REPLICA
ADMIN DIAGNOSE TABLET -> SHOW TABLET DIAGNOSIS
ADMIN SHOW TABLET -> SHOW TABLET
```
## 2 新機能

該当なし



## 3 改善と最適化

- Inverted Index を Nereids の TopN opt で動作するように修正

- カラム統計収集時の最大文字列長を 1024 に制限して BE メモリ使用量を制御

- JDBC client が空でない場合の JDBC Catalog クローズ

- すべての Iceberg database を受け入れ、database の名前形式チェックを行わない

- 外部テーブルの rowcount を非同期でリフレッシュしてキャッシュミスと不安定なクエリプランを回避

- hive 外部テーブルの isSplitable メソッドを簡素化して過剰な hadoop metrics を回避

改善とバグ修正の完全なリストは [GitHub](https://github.com/apache/doris/compare/2.0.7...2.0.8) を参照してください。

## 4 クレジット

このリリースに貢献いただいたすべての方々に感謝いたします:

924060929,  AcKing-Sam, amorynan, AshinGau, BePPPower, BiteTheDDDDt, ByteYue, cambyzju,  dongsilun, eldenmoon, feiniaofeiafei, gnehil, Jibing-Li, liaoxin01, luwei16,  morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, platoneko,  starocean999, SWJTU-ZhangLei, wuwenchi, xiaokang, xinyiZzz, Yukang-Lian,  Yulei-Yang, zclllyybb, zddr, zhangstar333, zhiqiang-hhhh, ziyanTOP, zy-kkk,  zzzxl1993
