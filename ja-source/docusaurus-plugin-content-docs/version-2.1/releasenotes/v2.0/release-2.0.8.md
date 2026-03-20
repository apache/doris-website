---
{
  "title": "リリース 2.0.8",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.8バージョンでは約65の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.8バージョンでは約65の改善とバグ修正が行われました。

- **クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)



## 1 動作変更

`ADMIN SHOW`文は高バージョンのMySQL 8.x jdbcドライバーでは実行できません。そのため、これらの文の名前を変更し、`ADMIN`キーワードを削除しました。

- https://github.com/apache/doris/pull/29492

```sql
ADMIN SHOW CONFIG -> SHOW CONFIG
ADMIN SHOW REPLICA -> SHOW REPLICA
ADMIN DIAGNOSE TABLET -> SHOW TABLET DIAGNOSIS
ADMIN SHOW TABLET -> SHOW TABLET
```
## 2 新機能

N/A



## 3 改善と最適化

- NereidsでTopN optとInverted Indexが連携するよう修正

- BE メモリ使用量を制御するため、列統計収集時の最大文字列長を1024に制限

- JDBCクライアントが空でない場合のJDBC Catalogクローズ

- すべてのIcebergデータベースを受け入れ、データベースの名前形式をチェックしないよう変更

- キャッシュミスと不安定なクエリプランを避けるため、外部テーブルの行数を非同期でリフレッシュ

- Hadoop メトリクスの過多を避けるため、hive外部テーブルのisSplitableメソッドを簡素化

改善とバグ修正の完全なリストは[GitHub](https://github.com/apache/doris/compare/2.0.7...2.0.8)をご覧ください。

## 4 謝辞

このリリースに貢献いただいたすべての方に感謝いたします：

924060929,  AcKing-Sam, amorynan, AshinGau, BePPPower, BiteTheDDDDt, ByteYue, cambyzju,  dongsilun, eldenmoon, feiniaofeiafei, gnehil, Jibing-Li, liaoxin01, luwei16,  morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, platoneko,  starocean999, SWJTU-ZhangLei, wuwenchi, xiaokang, xinyiZzz, Yukang-Lian,  Yulei-Yang, zclllyybb, zddr, zhangstar333, zhiqiang-hhhh, ziyanTOP, zy-kkk,  zzzxl1993
