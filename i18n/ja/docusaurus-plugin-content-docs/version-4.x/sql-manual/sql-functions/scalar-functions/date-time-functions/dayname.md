---
{
    "title": "DAYNAME",
    "language": "ja",
    "description": "DAYNAME 関数は、日付または時刻の式に対応する曜日名（「Tuesday」など）を返します。"
}
---

## 説明

DAYNAME 関数は、日付または時刻の式に対応する曜日名（「Tuesday」など）を文字列として返します。

セッション変数 [lc_time_names](#appendix-lc_time_names-may-be-set-to-any-of-the-following-locale-valuescase-insensitive) を使用して、出力結果の言語を設定できます。デフォルトは `en_US` で、英語で出力されます。

この関数の動作は、MySQL の [dayname 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayname) と同じです。

## 構文

```sql
DAYNAME(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE 型、DATETIME 型、および日時形式の文字列を指定できる、有効な日付式。日時形式と日付形式については、[日時型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付に対応する曜日名を文字列型で返します。

特別な場合：

- `date_or_time_expr` が NULL の場合、NULL を返します。

## 例

```sql

---Calculate day name corresponding to DATETIME type
select dayname('2007-02-03 00:00:00');

+--------------------------------+
| dayname('2007-02-03 00:00:00') |
+--------------------------------+
| Saturday                       |
+--------------------------------+

---Calculate day name corresponding to DATE type

select dayname('2023-10-01');
+-----------------------+
| dayname('2023-10-01') |
+-----------------------+
| Sunday                |
+-----------------------+


---Parameter is NULL, returns NULL
select dayname(NULL);
+---------------+
| dayname(NULL) |
+---------------+
| NULL          |
+---------------+

---Control the output language by setting `lc_time_names`
SET lc_time_names='zh_CN';
select dayname('2023-10-01');
+-----------------------+
| dayname('2023-10-01') |
+-----------------------+
| 星期日                |
+-----------------------+

SET lc_time_names='ar_ae';
select dayname('2023-10-01');
+-----------------------+
| dayname('2023-10-01') |
+-----------------------+
| الأحد                 |
+-----------------------+
```

## 付録：lc_time_names に設定できるロケール値（大文字と小文字は区別されません） {#appendix-lc_time_names-may-be-set-to-any-of-the-following-locale-valuescase-insensitive}

| ロケール値 | 言語・地域 |
| --- | --- |
| ar_AE | アラビア語 - アラブ首長国連邦 |
| ar_BH | アラビア語 - バーレーン |
| ar_DZ | アラビア語 - アルジェリア |
| ar_EG | アラビア語 - エジプト |
| ar_IN | アラビア語 - インド |
| ar_IQ | アラビア語 - イラク |
| ar_JO | アラビア語 - ヨルダン |
| ar_KW | アラビア語 - クウェート |
| ar_LB | アラビア語 - レバノン |
| ar_LY | アラビア語 - リビア |
| ar_MA | アラビア語 - モロッコ |
| ar_OM | アラビア語 - オマーン |
| ar_QA | アラビア語 - カタール |
| ar_SA | アラビア語 - サウジアラビア |
| ar_SD | アラビア語 - スーダン |
| ar_SY | アラビア語 - シリア |
| ar_TN | アラビア語 - チュニジア |
| ar_YE | アラビア語 - イエメン |
| be_BY | ベラルーシ語 - ベラルーシ |
| bg_BG | ブルガリア語 - ブルガリア |
| ca_ES | カタルーニャ語 - スペイン |
| cs_CZ | チェコ語 - チェコ共和国 |
| da_DK | デンマーク語 - デンマーク |
| de_AT | ドイツ語 - オーストリア |
| de_BE | ドイツ語 - ベルギー |
| de_CH | ドイツ語 - スイス |
| de_DE | ドイツ語 - ドイツ |
| de_LU | ドイツ語 - ルクセンブルク |
| el_GR | ギリシャ語 - ギリシャ |
| en_AU | 英語 - オーストラリア |
| en_CA | 英語 - カナダ |
| en_GB | 英語 - イギリス |
| en_IN | 英語 - インド |
| en_NZ | 英語 - ニュージーランド |
| en_PH | 英語 - フィリピン |
| en_US | 英語 - アメリカ合衆国 |
| en_ZA | 英語 - 南アフリカ |
| en_ZW | 英語 - ジンバブエ |
| es_AR | スペイン語 - アルゼンチン |
| es_BO | スペイン語 - ボリビア |
| es_CL | スペイン語 - チリ |
| es_CO | スペイン語 - コロンビア |
| es_CR | スペイン語 - コスタリカ |
| es_DO | スペイン語 - ドミニカ共和国 |
| es_EC | スペイン語 - エクアドル |
| es_ES | スペイン語 - スペイン |
| es_GT | スペイン語 - グアテマラ |
| es_HN | スペイン語 - ホンジュラス |
| es_MX | スペイン語 - メキシコ |
| es_NI | スペイン語 - ニカラグア |
| es_PA | スペイン語 - パナマ |
| es_PE | スペイン語 - ペルー |
| es_PR | スペイン語 - プエルトリコ |
| es_PY | スペイン語 - パラグアイ |
| es_SV | スペイン語 - エルサルバドル |
| es_US | スペイン語 - アメリカ合衆国 |
| es_UY | スペイン語 - ウルグアイ |
| es_VE | スペイン語 - ベネズエラ |
| et_EE | エストニア語 - エストニア |
| eu_ES | バスク語 - スペイン |
| fi_FI | フィンランド語 - フィンランド |
| fo_FO | フェロー語 - フェロー諸島 |
| fr_BE | フランス語 - ベルギー |
| fr_CA | フランス語 - カナダ |
| fr_CH | フランス語 - スイス |
| fr_FR | フランス語 - フランス |
| fr_LU | フランス語 - ルクセンブルク |
| gl_ES | ガリシア語 - スペイン |
| gu_IN | グジャラート語 - インド |
| he_IL | ヘブライ語 - イスラエル |
| hi_IN | ヒンディー語 - インド |
| hr_HR | クロアチア語 - クロアチア |
| hu_HU | ハンガリー語 - ハンガリー |
| id_ID | インドネシア語 - インドネシア |
| is_IS | アイスランド語 - アイスランド |
| it_CH | イタリア語 - スイス |
| it_IT | イタリア語 - イタリア |
| ja_JP | 日本語 - 日本 |
| ko_KR | 韓国語 - 大韓民国 |
| lt_LT | リトアニア語 - リトアニア |
| lv_LV | ラトビア語 - ラトビア |
| mk_MK | マケドニア語 - 北マケドニア |
| mn_MN | モンゴル - モンゴル語 |
| ms_MY | マレー語 - マレーシア |
| nb_NO | ノルウェー語（ブークモール） - ノルウェー |
| nl_BE | オランダ語 - ベルギー |
| nl_NL | オランダ語 - オランダ |
| no_NO | ノルウェー語 - ノルウェー |
| pl_PL | ポーランド語 - ポーランド |
| pt_BR | ポルトガル語 - ブラジル |
| pt_PT | ポルトガル語 - ポルトガル |
| rm_CH | ロマンシュ語 - スイス |
| ro_RO | ルーマニア語 - ルーマニア |
| ru_RU | ロシア語 - ロシア |
| ru_UA | ロシア語 - ウクライナ |
| sk_SK | スロバキア語 - スロバキア |
| sl_SI | スロベニア語 - スロベニア |
| sq_AL | アルバニア語 - アルバニア |
| sr_RS | セルビア語 - セルビア |
| sv_FI | スウェーデン語 - フィンランド |
| sv_SE | スウェーデン語 - スウェーデン |
| ta_IN | タミル語 - インド |
| te_IN | テルグ語 - インド |
| th_TH | タイ語 - タイ |
| tr_TR | トルコ語 - トルコ |
| uk_UA | ウクライナ語 - ウクライナ |
| ur_PK | ウルドゥー語 - パキスタン |
| vi_VN | ベトナム語 - ベトナム |
| zh_CN | 中国語 - 中国 |
| zh_HK | 中国語 - 香港 |
| zh_TW | 中国語 - 台湾 |
