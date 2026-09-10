-- Shared city columns for either installation path; no place rows are deleted.
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS name_zh_hans TEXT;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS name_zh_hant TEXT;
INSERT INTO public.cities (code,name_ko,name_en,name_ja,name_zh_hans,name_zh_hant,lat,lng) VALUES
('seoul','서울','Seoul','ソウル','首尔','首爾',37.5665,126.978),
('incheon','인천','Incheon','仁川','仁川','仁川',37.4563,126.7052),
('suwon','수원','Suwon','水原','水原','水原',37.2636,127.0286),
('sokcho','속초','Sokcho','束草','束草','束草',38.2044,128.5912),
('gangneung','강릉','Gangneung','江陵','江陵','江陵',37.7519,128.8761),
('daejeon','대전','Daejeon','大田','大田','大田',36.3504,127.3845),
('andong','안동','Andong','安東','安东','安東',36.5684,128.7294),
('daegu','대구','Daegu','大邱','大邱','大邱',35.8714,128.6014),
('busan','부산','Busan','釜山','釜山','釜山',35.1796,129.0756),
('gyeongju','경주','Gyeongju','慶州','庆州','慶州',35.8562,129.2132),
('ulsan','울산','Ulsan','蔚山','蔚山','蔚山',35.5384,129.3114),
('jeonju','전주','Jeonju','全州','全州','全州',35.8242,127.148),
('namwon','남원','Namwon','南原','南原','南原',35.4164,127.3904),
('gwangju','광주','Gwangju','光州','光州','光州',35.1595,126.8526),
('mokpo','목포','Mokpo','木浦','木浦','木浦',34.8118,126.3922),
('yeosu','여수','Yeosu','麗水','丽水','麗水',34.7604,127.6622),
('tongyeong','통영','Tongyeong','統営','统营','統營',34.8544,128.4332),
('jeju','제주','Jeju','済州','济州','濟州',33.4996,126.5312)
ON CONFLICT (code) DO NOTHING;
