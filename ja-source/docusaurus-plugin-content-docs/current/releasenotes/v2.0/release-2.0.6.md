---
{
  "title": "リリース 2.0.6",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.6バージョンでは51名のコントリビューターによって約114の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.6バージョンでは51名のコントリビューターによって約114の改善とバグ修正が行われました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作変更
- なし

## 新機能
- materialized-viewでエイリアス付き関数のマッチングをサポート
- backendでtabletレプリカを安全に削除するコマンドを追加
- external tableの行数キャッシュを追加
- オプティマイザー用の統計情報収集のためのrollup分析をサポート

## 改善と最適化
- protobufの確定的なシリアライゼーション方式を使用してtabletスキーマキャッシュメモリを改善
- show column statsのパフォーマンスを改善
- icebergとpaimonの行数推定をサポート
- JDBC catalogでsqlserverのtimestamp型読み取りをサポート


改善とバグ修正の完全なリストは[github](https://github.com/apache/doris/compare/2.0.5-rc02...2.0.6)をご覧ください。


## 謝辞
このリリースにコントリビューションいただいた全ての方に感謝します：

924060929, AshinGau, BePPPower, BiteTheDDDDt, CalvinKirs, cambyzju, deardeng, DongLiang-0, eldenmoon, englefly, feelshana, feiniaofeiafei, felixwluo, HappenLee, hust-hhb, iwanttobepowerful, ixzc, JackDrogon, Jibing-Li, KassieZ, larshelge, liaoxin01, LiBinfeng-01, liutang123, luennng, morningman, morrySnow, mrhhsg, qidaye, starocean999, TangSiyang2001, wangbo, wsjz, wuwenchi, xiaokang, XieJiann, xuwei0912, xy720, xzj7019, yiguolei, yujun777, Yukang-Lian, Yulei-Yang, zclllyybb, zddr, zhangstar333, zhannngchen, zhiqiang-hhhh, zy-kkk, zzzxl1993
