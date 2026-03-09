---
{
  "title": "リリース 2.0.5",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.5バージョンでは約217の改善とバグ修正が行われました。"
}
---
コミュニティのユーザーと開発者のおかげで、Doris 2.0.5 バージョンでは約217の改善とバグ修正が行われました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作変更
- char関数の動作を変更：`select char(0) = '\0'` がMySQLと同様にtrueを返すように
  - https://github.com/apache/doris/pull/30034
- 空データのエクスポートを許可
  - https://github.com/apache/doris/pull/30703

## 新機能
- `is null`条件でのleft outer joinの除去
- tablet-idのバッチ分析用の`show-tablets-belong`文を追加
- InferPredicatesがInをサポート：`a = b & a in [1, 2] -> b in [1, 2]`など
- 列統計が利用できない場合のプラン最適化
- rollup列統計を使用したプランの最適化
- materialized viewの分析をサポート
- ShowProcessStmt ですべてのFE接続を表示することをサポート

## 改善と最適化
- 列統計が利用できない場合のクエリプランの最適化
- rollup列統計を使用したクエリプランの最適化
- ユーザーがauto analyzeを終了した後の分析の迅速な停止
- load列統計の例外をキャッチし、fe.outへの大量のスタック情報出力を回避
- SQLでビュー名を指定してmaterialized viewを選択
- auto analyzeのmax table widthのデフォルト値を100に変更
- JDBC CatalogでのRecovery predicate pushdown用の列文字のエスケープ
- JDBC MYSQL Catalogの`to_date`関数pushdownを修正
- JDBCクライアントのclose処理を最適化
- JDBC接続プールのパラメータ設定を最適化
- HMSのAPIを通じたhudiパーティション情報の取得
- routine loadジョブのエラーメッセージとメモリを最適化
- max allowedオプションが0に設定されている場合、すべてのbackup/restoreジョブをスキップ

改善とバグ修正の完全なリストは[github](https://github.com/apache/doris/compare/2.0.4-rc06...2.0.5-rc02)をご覧ください。


## 謝辞
このリリースに貢献いただいたすべての方に感謝いたします：

airborne12, alexxing662, amorynan, AshinGau, BePPPower, bingquanzhao, BiteTheDDDDt, ByteYue, caiconghui, cambyzju, catpineapple, dataroaring, eldenmoon, Emor-nj, englefly, felixwluo, GoGoWen, HappenLee, hello-stephen, HHoflittlefish777, HowardQin, JackDrogon, jacktengg, jackwener, Jibing-Li, KassieZ, LemonLiTree, liaoxin01, liugddx, LuGuangming, morningman, morrySnow, mrhhsg, Mryange, mymeiyi, nextdreamblue, qidaye, ryanzryu, seawinde,starocean999, TangSiyang2001, vinlee19, w41ter, wangbo, wsjz, wuwenchi, xiaokang, XieJiann, xingyingone, xy720,xzj7019, yujun777, zclllyybb, zhangstar333, zhannngchen, zhiqiang-hhhh, zxealous, zy-kkk, zzzxl1993
