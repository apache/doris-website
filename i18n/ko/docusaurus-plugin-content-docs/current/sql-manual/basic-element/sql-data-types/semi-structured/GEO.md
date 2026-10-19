---
{
    "title": "GEO",
    "language": "ko",
    "description": "지리 공간 타입은 데이터베이스에서 지리 공간 데이터를 저장하고 처리하는 데 사용하는 특수 데이터 타입입니다."
}
---

:::info
이 문서에서 설명하는 GEO 타입은 Doris의 실제 데이터 타입이 아니라, String/Varchar 타입을 기반으로 저장하는 특정 데이터 형식과 관련 함수의 사용 방법을 의미합니다.
:::

지리 공간 타입은 데이터베이스에서 지리 공간 데이터를 저장하고 처리하는 데 사용하는 특수 데이터 타입으로, 점, 선, 다각형 등의 기하 객체를 표현할 수 있습니다. 주요 용도는 다음과 같습니다.
- 지리적 위치 정보 저장(예: 경도와 위도).
- 공간 쿼리 지원(예: 거리 계산, 영역 포함 여부, 교차 여부 판정).
- 지리 공간 분석 수행(예: 버퍼 분석, 경로 계획).
지리 정보 시스템은 지도 서비스, 물류 배차, 위치 기반 소셜 네트워킹, 기상 관측 등에 널리 사용됩니다. 핵심 요구 사항은 대규모 공간 데이터를 효율적으로 저장하고 지연 시간이 짧은 공간 연산을 지원하는 것입니다.


## 핵심 인코딩 기술 {#core-encoding-technologies}
### S2 Geometry Library {#s2-geometry-library}
S2 Geometry는 Google이 개발한 구면 기하 인코딩 시스템입니다. 핵심 아이디어는 구면을 평면에 투영하여 전 세계 지리 공간 데이터를 효율적으로 인덱싱하는 것입니다.

#### 핵심 원리 {#core-principles}
- 구면 투영: 지구의 구면을 정육면체의 6개 면에 투영하여 3D 구면 데이터를 2D 평면 데이터로 변환합니다.
- 계층적 격자 분할: 각 면을 사각형 격자(셀)로 재귀적으로 나누고, 각 셀을 다시 4개의 작은 하위 셀로 분할하여 30단계 정밀도의 계층 구조를 형성합니다(단계가 높을수록 셀 면적이 작아지고 정밀도가 높아집니다).
- 64비트 인코딩: 각 셀에 고유한 64비트 ID를 할당합니다. 이 ID로 공간상의 위치를 빠르게 찾고 공간 관계를 판정할 수 있습니다.
- Hilbert 곡선 정렬: Hilbert 공간 채움 곡선으로 셀을 인코딩하여 공간적으로 인접한 셀이 연속된 ID를 갖도록 하고 범위 쿼리 성능을 최적화합니다.

#### 장점 {#advantages}
- 높은 정밀도와 점진적인 전환: 30단계 계층 구조를 통해 전 지구 규모(단계 0)부터 센티미터 수준(단계 30)까지 정밀도를 점진적으로 전환하여 다양한 시나리오의 요구를 충족합니다.
- 전 지구 범위 쿼리의 효율성: 대륙 간, 국가 간 지역 분석과 같은 대규모 공간 쿼리에 적합하며, 성능이 크게 저하되지 않습니다.
- 효율적인 공간 관계 계산: 셀 ID로 포함, 교차 등의 관계를 빠르게 판정하여 복잡한 기하 연산을 피할 수 있습니다.


### GeoHash 인코딩 {#geohash-encoding}
GeoHash는 등거리 원통 도법을 기반으로 하는 지리 인코딩 방식으로, 경도와 위도를 문자열로 변환하여 공간 인덱싱을 구현합니다.

#### 핵심 원리 {#core-principles-1}
- 평면 투영: 지구의 구면을 평면으로 근사하고, 경도와 위도를 이진 분할하여 영역을 재귀적으로 나눕니다.
- 직사각형 격자 분할: 지표면을 정밀도가 서로 다른 직사각형 셀로 나눕니다. 문자열 길이가 정밀도를 결정하며(최대 12자), 문자가 하나 추가될 때마다 정밀도가 약 10배 높아집니다.
- Z-order 곡선 인코딩: 경도와 위도의 이진 비트를 번갈아 취하여 Z-order 곡선을 형성하고, 2D 좌표를 1D 문자열로 변환합니다.

#### 특징 {#features}
- 인덱싱 편의성: 문자열 접두사 매칭으로 인접 영역을 빠르게 쿼리할 수 있습니다(예: 접두사가 같은 GeoHash 코드는 공간적으로 인접한 영역에 해당합니다).
- 한계:
  - 제한된 정밀도 단계: 최대 12단계이며, 단계 간 변화 폭이 커서 정밀도를 점진적으로 높이는 고정밀 분할 요구를 충족하기 어렵습니다.
  - Z-order 곡선의 가변성: 곡선의 도약으로 인해 공간적으로 인접한 영역의 코드가 불연속적일 수 있어 범위 쿼리의 정확도에 영향을 줍니다.
  - 대규모 쿼리의 낮은 효율성: 전 지구 범위를 쿼리할 때 분산된 셀을 대량으로 스캔해야 하므로 성능이 떨어집니다.


### 종합 비교 및 선택 {#comprehensive-comparison-and-selection}
S2 Geometry Library와 GeoHash의 특성을 종합적으로 비교한 결과, 지리 공간 처리를 위한 서드파티 종속성으로 S2 Geometry Library를 선택했습니다. 주요 이유는 다음과 같습니다.
- 전 지구 범위 쿼리에 대한 적합성: S2의 계층적 격자 설계는 대규모 공간 분석에 더 적합한 반면, GeoHash는 여러 지역에 걸친 쿼리에서 성능 병목이 발생합니다.
- 정밀도와 점진적 전환: S2의 30단계 계층 구조는 전 지구 규모부터 센티미터 수준까지 정밀도를 점진적으로 전환하여 다양한 시나리오의 정밀도 요구를 충족하며, GeoHash의 12단계 분할보다 우수합니다.
- 공간적 연속성: Hilbert 곡선은 Z-order 곡선보다 공간적 연속성이 뛰어나 범위 쿼리의 중복 계산을 줄일 수 있습니다.


## WKT 소개 {#introduction-to-wkt}
WKT(Well-Known Text)는 지리 공간 데이터를 표현하는 표준 텍스트 형식입니다.

### 정의 {#definition}
- 텍스트 형식: 텍스트 문자열로 기하 객체의 구조와 좌표를 기술합니다.
- 특징: 사람이 읽기 쉽고 편집하기 쉬우며, 수동 입력이나 간단한 데이터 교환에 적합합니다.

### 구문 구조 {#syntax-structure}
- 기본 형식: GeometryType(CoordinateValues)
- 일반적인 기하 타입:
  - Point: POINT(longitude, latitude)  
    예: POINT(112.46, 45.23)는 한 점의 경도와 위도를 나타냅니다.
  - LineString: LINESTRING(point1, point2)  
    예: LINESTRING(0 0, 1 1)은 두 점을 연결하는 선분을 나타냅니다.
  - Polygon: POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))


## WKB 소개 {#introduction-to-wkb}
WKB(Well-Known Binary)는 지리 공간 데이터를 표현하는 표준 바이너리 데이터 형식입니다.

### 정의 {#definition-1}
- 바이너리 형식: 바이너리 인코딩으로 기하 객체를 표현하며, WKT보다 간결하고 효율적입니다.
- 특징: 컴퓨터의 내부 저장과 전송에 최적화되어 있어 공간을 절약하고 빠르게 파싱할 수 있습니다.

### 인코딩 구조 {#encoding-structure}
WKB는 다음 부분으로 구성됩니다.
- 바이트 순서(1바이트):
  - 0x00: Big Endian(네트워크 바이트 순서)
  - 0x01: Little Endian(Intel/AMD 아키텍처에서 일반적으로 사용)
- 기하 타입(4바이트 정수):
  - 1: Point
  - 2: LineString
  - 3: Polygon
  - ... (기타 타입)
- 좌표값:
  - Point: x, y(또는 x, y, z)
  - LineString: point1의 좌표, point2의 좌표
  - Polygon: point1의 좌표, point2의 좌표...

#### 예제 {#example}
```sql
    01 01 00 00 00 00 00 00 00 00 F0 3F 00 00 00 00 00 00 00 40
    └─┘ └─┘ └───────────────┘ └───────────────┘
    │   │         │               │
    Little Endian Point type     x=1.0           y=2.0
```

## GeoPoint 타입 {#geopoint-type}
1. String 또는 Varchar를 사용하여 WKT 형식 저장

```sql
CREATE TABLE simple_point (  id INT,  wkt STRING) ;
INSERT INTO simple_point VALUES(1,'POINT(121.4737 31.2304)');

create table simple_point(id int, wkt VARCHAR(255));
INSERT INTO simple_point VALUES(1,'POINT(121.4737 31.2304)');
```


WKT 형식 쿼리

```sql
select st_astext(st_geometryfromtext(wkt)) from simple_point;
+-------------------------------------+
| st_astext(st_geometryfromtext(wkt)) |
+-------------------------------------+
| POINT (121.4737 31.2304)            |
+-------------------------------------+
```

2. WKB 형식으로 저장

```sql
CREATE TABLE simple_point (  id INT,  wkb STRING) ;
INSERT INTO simple_point VALUES(1,'\x01010000005f07ce19515e5e4097ff907efb3a3f40');

create table simple_point(id int, wkb VARCHAR(255));
INSERT INTO simple_point VALUES(1,'\x01010000005f07ce19515e5e4097ff907efb3a3f40');

```

WKB 형식 쿼리

```sql
select st_astext(st_geometryfromwkb(wkb)) from simple_point;
+------------------------------------+
| st_astext(st_geometryfromwkb(wkb)) |
+------------------------------------+
| POINT (121.4737 31.2304)           |
+------------------------------------+
```

3. 부동소수점 수로 좌표 저장(x는 위도, y는 경도)

```sql
CREATE TABLE simple_point_double (id INT,x DOUBLE,y DOUBLE) 
INSERT INTO simple_point_double VALUES(0,1,2);
```


부동소수점 형식 쿼리

```sql
select st_astext(st_point(x,y)) from simple_point_double;
+--------------------------+
| st_astext(st_point(x,y)) |
+--------------------------+
| POINT (1 2)              |
+--------------------------+
```


## GeoLine 타입 {#geoline-type}

1. String 또는 Varchar를 사용하여 WKT 형식 저장

```sql
CREATE TABLE simple_line (  id INT,  wkt STRING)
INSERT INTO simple_line VALUES(1,'LINESTRING(116.4074 39.9042, 121.4737 31.2304)');

CREATE TABLE simple_line (  id INT,  wkt VARCHAR(255))
INSERT INTO simple_line VALUES(1,'LINESTRING(116.4074 39.9042, 121.4737 31.2304)');
```


WKT 형식 쿼리

```sql
select st_astext(st_linefromtext(wkt)) from simple_line;
+-------------------------------------------------+
| st_astext(st_linefromtext(wkt))                 |
+-------------------------------------------------+
| LINESTRING (116.4074 39.9042, 121.4737 31.2304) |
+-------------------------------------------------+
```

2. WKB 형식으로 저장

```sql
CREATE TABLE simple_line (  id INT,  wkb STRING)
INSERT INTO simple_line VALUES(1,'\x010200000002000000fc1873d7121a5d4088855ad3bcf343405f07ce19515e5e4097ff907efb3a3f40');

CREATE TABLE simple_line (  id INT,  wkb VARCHAR(255))
INSERT INTO simple_line VALUES(1,'\x010200000002000000fc1873d7121a5d4088855ad3bcf343405f07ce19515e5e4097ff907efb3a3f40');
```

WKB 형식 쿼리

```sql
select st_astext(st_geometryfromwkb(wkb)) from simple_line;
+-------------------------------------------------+
| st_astext(st_geometryfromwkb(wkb))              |
+-------------------------------------------------+
| LINESTRING (116.4074 39.9042, 121.4737 31.2304) |
+-------------------------------------------------+
```

## GeoPolygon 타입 {#geopolygon-type}

1. String 또는 Varchar를 사용하여 WKT 형식 저장

```sql
CREATE TABLE simple_polygon (  id INT,  wkt STRING)
INSERT INTO simple_polygon VALUES(1,'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))');

CREATE TABLE simple_polygon (  id INT,  wkt VARCHAR(255))
INSERT INTO simple_polygon VALUES(1,'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))');
```

WKT 형식 쿼리

```sql
select st_astext(st_polygon(wkt)) from simple_polygon;
+------------------------------------------+
| st_astext(st_polygon(wkt))               |
+------------------------------------------+
| POLYGON ((10 0, 10 10, 0 10, 0 0, 10 0)) |
+------------------------------------------+
```

2. WKB 형식으로 저장

```sql
CREATE TABLE simple_polygon_wkb (  id INT,  wkb STRING)
INSERT INTO simple_polygon_wkb VALUES(1,'\x010300000001000000050000000000000000002440000000000000000000000000000024400000000000002440000000000000000000000000000024400000000000000000000000000000000000000000000024400000000000000000');

CREATE TABLE simple_polygon_wkb (  id INT,  wkb VARCHAR(255))
INSERT INTO simple_polygon_wkb VALUES(1,'\x010300000001000000050000000000000000002440000000000000000000000000000024400000000000002440000000000000000000000000000024400000000000000000000000000000000000000000000024400000000000000000');
```
WKB 형식 쿼리

```sql
select st_astext(st_geometryfromwkb(wkb)) from simple_polygon_wkb;
+------------------------------------------+
| st_astext(st_geometryfromwkb(wkb))       |
+------------------------------------------+
| POLYGON ((10 0, 10 10, 0 10, 0 0, 10 0)) |
+------------------------------------------+
```

## GeoMultiPolygon 타입 {#geomultipolygon-type}


1. String 또는 Varchar를 사용하여 WKT 형식 저장

```sql
CREATE TABLE simple_multipolygon (  id INT,  wkt STRING)
INSERT INTO simple_multipolygon VALUES(1,'MULTIPOLYGON(((0 0, 0 10, 10 10, 10 0, 0 0)),((20 20, 20 30, 30 30, 30 20, 20 20)))');

CREATE TABLE simple_multipolygon (  id INT,  wkt VARCHAR(255))
INSERT INTO simple_multipolygon VALUES(1,'MULTIPOLYGON(((0 0, 0 10, 10 10, 10 0, 0 0)),  -- 第一个多边形((20 20, 20 30, 30 30, 30 20, 20 20))  -- 第二个多边形)');

```


WKT 형식 쿼리

```sql
select st_astext(st_geometryfromtext(wkt)) from simple_multipolygon;
+----------------------------------------------------------------------------------------+
| st_astext(st_geometryfromtext(wkt))                                                    |
+----------------------------------------------------------------------------------------+
| MULTIPOLYGON (((10 0, 10 10, 0 10, 0 0, 10 0)), ((30 20, 30 30, 20 30, 20 20, 30 20))) |
+----------------------------------------------------------------------------------------+
```
참고: GeoMultiPolygon의 WKB 형식 변환은 아직 지원되지 않습니다.

## GeoCircle 타입 {#geocircle-type}

저장 방법(부동소수점 수로 중심 좌표와 반지름 저장)
원은 WKB 및 WKT 형식에 따르지 않으므로 중심 좌표(x, y)와 반지름(R)을 각각 저장하는 데 부동소수점 수 세 개가 필요합니다.

```sql
create table simple_circle(id int, X double,Y double, R double)
INSERT INTO simple_circle VALUES(1,1.0,1.0,2);
```
원 쿼리

```sql
select st_astext(st_circle(X,Y,R)) from simple_circle;
+-----------------------------+
| st_astext(st_circle(X,Y,R)) |
+-----------------------------+
| CIRCLE ((1 1), 2)           |
+-----------------------------+
```

## 제약 사항 {#constraints}
### 인덱스 {#index}
Doris는 Geo 타입을 직접 구현하지 않고 WKT와 WKB를 사용하여 저장하고 변환하므로, 인덱싱 기술로 GEO 타입 쿼리를 가속할 수 없습니다.

WKT를 GEO 출력으로 변환할 때는 13자리 정밀도만 보장됩니다.

```sql
mysql> SELECT ST_AsText(ST_GeometryFromText("POINT (1 3.1415926535897223)"));
+----------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POINT (1 3.1415926535897223)")) |
+----------------------------------------------------------------+
| POINT (1 3.14159265358972)                                     |
+----------------------------------------------------------------+
```


바이너리를 GEO 출력으로 변환할 때는 13자리 정밀도만 보장됩니다.

```sql
mysql> select ST_AsText(ST_GeomFromWKB(ST_AsBinary(ST_Point(24.7,3.141592653589793))));
+--------------------------------------------------------------------------+
| ST_AsText(ST_GeomFromWKB(ST_AsBinary(ST_Point(24.7,3.141592653589793)))) |
+--------------------------------------------------------------------------+
| POINT (24.7 3.1415926535898)                                             |
+--------------------------------------------------------------------------+
```



## Doris에서 Geo 타입의 주요 용도와 사용 방법 {#common-uses-and-methods-of-geo-types-in-doris}
### 지구상의 두 점 사이 거리 계산 {#calculating-distance-between-two-points-on-earth}

베이징에서 상하이까지의 거리
베이징(116.4074, 39.9042)과 상하이(121.4737, 31.2304)의 좌표:

```sql
select ST_DISTANCE_SPHERE(116.4074, 39.9042, 121.4737, 31.2304);
+----------------------------------------------------------+
| ST_DISTANCE_SPHERE(116.4074, 39.9042, 121.4737, 31.2304) |
+----------------------------------------------------------+
|                                       1067311.8461903075 |
+----------------------------------------------------------+
```


![대체 텍스트](/images/BeijingToShanghai.png)


베이징에서 뉴욕까지의 거리
베이징(116.4074, 39.9042)과 뉴욕(-74.0060, 40.7128)의 좌표:

```sql
select ST_DISTANCE_SPHERE(116.4074, 39.9042, -74.0060, 40.7128);
+----------------------------------------------------------+
| ST_DISTANCE_SPHERE(116.4074, 39.9042, -74.0060, 40.7128) |
+----------------------------------------------------------+
|                                       10989107.361809434 |
+----------------------------------------------------------+
```

![대체 텍스트](/images/BeijingToNewyork.png)


### 지구 구면상의 영역 면적 계산 {#calculating-area-of-a-region-on-the-earths-sphere}

뉴욕의 면적 추정
다각형으로 뉴욕 지역의 대략적인 윤곽을 그려 면적을 계산합니다.

```sql
SELECT ST_AREA_SQUARE_KM(
  ST_GeomFromText('POLYGON((
      -74.2591 40.9155, 
      -73.8726 40.9147, 
      -73.7004 40.7506, 
      -73.9442 40.5840, 
      -74.0817 40.6437, 
      -74.1502 40.6110, 
      -74.0984 40.6550, 
      -74.0431 40.7290, 
      -74.0136 40.7903, 
      -73.9352 40.8448, 
      -74.2591 40.9155
    ))'));
    
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ST_AREA_SQUARE_KM(  ST_GeomFromText('POLYGON((-74.2591 40.9155, -73.8726 40.9147, -73.7004 40.7506, -73.9442 40.5840, -74.0817 40.6437,-74.1502 40.6110,-74.0984 40.6550,-74.0431 40.7290,-74.0136 40.7903,  -73.9352 40.8448, -74.2591 40.9155))'  )) |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                                                                                                                      744.3806189617659 |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

![대체 텍스트](/images/Newyork.png)
