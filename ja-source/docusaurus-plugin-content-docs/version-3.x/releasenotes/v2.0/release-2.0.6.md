---
{
  "title": "リリース 2.0.6",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.6バージョンでは51名の貢献者により約114の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.6バージョンでは51人のコントリビューターによって約114の改善とバグ修正が作成されました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作変更
- なし

## 新機能
- materialized-viewでエイリアスを持つ関数のマッチングをサポート
- backendでtablet replicaを安全に削除するコマンドを追加
- external tableの行数キャッシュを追加
- optimizerの統計収集のためのrollupのanalyzeをサポート

## 改善と最適化
- protobufのシリアライゼーションに決定論的な方法を使用してtablet schema cacheメモリを改善
- show column statsのパフォーマンスを改善
- icebergとpaimonの行数推定をサポート
- JDBC catalogでsqlserverのtimestamp型読み取りをサポート


改善とバグ修正の完全なリストは[github](https://github.com/apache/doris/compare/2.0.5-rc02...2.0.6)をご覧ください。


## クレジット
このリリースに貢献してくださった皆様に感謝いたします：

924060929, AshinGau, BePPPower, BiteTheDDDDt, CalvinKirs, cambyzju, deardeng, DongLiang-0, eldenmoon, englefly, feelshana, feiniaofeiafei, felixwluo, HappenLee, hust-hhb, iwanttobepowerful, ixzc, JackDrogon, Jibing-Li, KassieZ, larshelge, liaoxin01, LiBinfeng-01, liutang123, luennng, morningman, morrySnow, mrhhsg, qidaye, starocean999, TangSiyang2001, wangbo, wsjz, wuwenchi, xiaokang, XieJiann, xuwei0912, xy720, xzj7019, yiguolei, yujun777, Yukang-Lian, Yulei-Yang, zclllyybb, zddr, zhangstar333, zhannngchen, zhiqiang-hhhh, zy-kkk, zzzxl1993
