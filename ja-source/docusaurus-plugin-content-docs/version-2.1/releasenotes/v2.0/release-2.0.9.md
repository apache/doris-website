---
{
  "title": "リリース 2.0.9",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.9バージョンでは約68の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.9バージョンでは約68の改善とバグ修正が行われました。

- **クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 動作変更

なし

## 2 新機能

- キーと値のmvカラム両方での述語の表示をサポート

- `bitmap_union(bitmap_from_array())`を使用したmvをサポート

- クラスター内のOLAPテーブルの複製割り当てを強制するFE configを追加

- 新しいオプティマイザーNereidsでのタイムゾーン対応date literalをサポート

- 単語間距離を指定するフルテキスト検索`match_phrase`でのslopをサポート

- `SHOW PROC INDEXES`でindex idを表示

## 3 改善と最適化

- NULL値を無視する`first_value` / `last_value`に第2引数を追加

- `LEAD`/ `LAG`関数のoffsetパラメータで0を使用可能

- マテリアライズドビューのマッチルールの優先度を調整

- TopN最適化でパフォーマンス向上のためにlimit数のレコードのみを読み取り

- delete_bitmap get_agg関数のprofileを追加

- パフォーマンス向上のためにMetaキャッシュを改良

- FE config `autobucket_max_buckets`を追加

改善とバグ修正の完全なリストは[GitHub](https://github.com/apache/doris/compare/2.0.8...2.0.9)をご覧ください。

## 謝辞

このリリースに貢献してくださったすべての方々に感謝いたします：

adonis0147, airborne12, amorynan, AshinGau, BePPPower, BiteTheDDDDt, CalvinKirs, cambyzju, csun5285, eldenmoon, englefly, feiniaofeiafei, HHoflittlefish777, htyoung, hust-hhb, jackwener, Jibing-Li, kaijchen, kylinmac, liaoxin01, luwei16, morningman, mrhhsg, qidaye, starocean999, SWJTU-ZhangLei, w41ter, xiaokang, xiedeyantu, xy720, zclllyybb, zhangstar333, zhannngchen, zy-kkk, zzzxl1993
