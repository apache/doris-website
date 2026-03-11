---
{
  "title": "リリース 2.0.5",
  "language": "ja",
  "description": "コミュニティのユーザーと開発者のおかげで、Doris 2.0.5バージョンでは約217の改善とバグ修正が行われました。"
}
---
コミュニティのユーザーと開発者の皆様のおかげで、Doris 2.0.5バージョンでは約217の改善とバグ修正が行われました。

**クイックダウンロード：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作変更
- char関数の動作を変更：`select char(0) = '\0'`がMySQLと同様にtrueを返すように
  - https://github.com/apache/doris/pull/30034
- 空データのエクスポートを許可
  - https://github.com/apache/doris/pull/30703

## 新機能
- `is null`条件を持つleft outer joinの除去
- タブレットIDのバッチ分析のための`show-tablets-belong`文を追加
- InferPredicatesがInをサポート、例：`a = b & a in [1, 2] -> b in [1, 2]`
- 列統計が利用できない場合のプラン最適化
- rollup列統計を使用したプラン最適化
- マテリアライズドビューの分析をサポート
- ShowProcessStmt全FE接続の表示をサポート

## 改善と最適化
- 列統計が利用できない場合のクエリプラン最適化
- rollup列統計を使用したクエリプラン最適化
- ユーザーが自動分析を閉じた後、分析を迅速に停止
- 列統計読み込み例外をキャッチし、fe.outへの過度なスタック情報出力を回避
- SQLでビュー名を指定してマテリアライズドビューを選択
- 自動分析の最大テーブル幅のデフォルト値を100に変更
- JDBC カタログでのrecovery predicate pushdownにおける列の文字エスケープ
- JDBC MYSQL カタログ `to_date`関数pushdownを修正
- JDBCクライアントのクローズロジックを最適化
- JDBC接続プールパラメータ設定を最適化
- HMSのAPIを通じてhudiパーティション情報を取得
- routine loadジョブのエラーメッセージとメモリを最適化
- 最大許可オプションが0に設定されている場合、すべてのbackup/restoreジョブをスキップ

改善とバグ修正の完全なリストは[github](https://github.com/apache/doris/compare/2.0.4-rc06...2.0.5-rc02)でご確認ください。


## クレジット
このリリースに貢献してくださった皆様に感謝いたします：

airborne12, alexxing662, amorynan, AshinGau, BePPPower, bingquanzhao, BiteTheDDDDt, ByteYue, caiconghui, cambyzju, catpineapple, dataroaring, eldenmoon, Emor-nj, englefly, felixwluo, GoGoWen, HappenLee, hello-stephen, HHoflittlefish777, HowardQin, JackDrogon, jacktengg, jackwener, Jibing-Li, KassieZ, LemonLiTree, liaoxin01, liugddx, LuGuangming, morningman, morrySnow, mrhhsg, Mryange, mymeiyi, nextdreamblue, qidaye, ryanzryu, seawinde,starocean999, TangSiyang2001, vinlee19, w41ter, wangbo, wsjz, wuwenchi, xiaokang, XieJiann, xingyingone, xy720,xzj7019, yujun777, zclllyybb, zhangstar333, zhannngchen, zhiqiang-hhhh, zxealous, zy-kkk, zzzxl1993
