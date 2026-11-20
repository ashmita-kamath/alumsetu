-- AlumSetu: all government polytechnics under DTE Rajasthan
-- Safe to run more than once. Run it on Neon in the SQL Editor.
-- Fresh databases get the same rows from seed.sql.

BEGIN;

-- Use the official name for the Jaipur polytechnic (profiles keep their link, only the name changes)
UPDATE institutions
SET name = 'Government Ram Chandra Khaitan Polytechnic College, Jaipur'
WHERE name = 'Government Polytechnic College, Jaipur'
  AND NOT EXISTS (SELECT 1 FROM institutions WHERE name = 'Government Ram Chandra Khaitan Polytechnic College, Jaipur');

-- Government polytechnic colleges under the Department of Technical Education,
-- Govt. of Rajasthan (list from dte.rajasthan.gov.in, Nov 2026). Districts use the
-- current district map, so a few towns sit in newer districts (e.g. Balotra, Beawar).
INSERT INTO institutions (name, city, district) VALUES
  ('Government Polytechnic College, Ajmer', 'Ajmer', 'Ajmer'),
  ('Government Polytechnic College, Alwar', 'Alwar', 'Alwar'),
  ('Government Polytechnic College, Bagidora', 'Bagidora', 'Banswara'),
  ('Government Polytechnic College, Banswara', 'Banswara', 'Banswara'),
  ('Government Polytechnic College, Baran', 'Baran', 'Baran'),
  ('Government Polytechnic College, Barmer', 'Barmer', 'Barmer'),
  ('Government Polytechnic College, Bikaner', 'Bikaner', 'Bikaner'),
  ('Shri Gokul Verma Government Polytechnic College, Bharatpur', 'Bharatpur', 'Bharatpur'),
  ('Government Polytechnic College, Bhilwara', 'Bhilwara', 'Bhilwara'),
  ('Government Polytechnic College, Bundi', 'Bundi', 'Bundi'),
  ('Government Polytechnic College, Chittorgarh', 'Chittorgarh', 'Chittorgarh'),
  ('Government Polytechnic College, Churu', 'Churu', 'Churu'),
  ('Rajesh Pilot Government Polytechnic College, Dausa', 'Dausa', 'Dausa'),
  ('Rajesh Pilot Government Polytechnic College, Dholpur', 'Dholpur', 'Dholpur'),
  ('Government Polytechnic College, Dungarpur', 'Dungarpur', 'Dungarpur'),
  ('Government Polytechnic College, Hanumangarh', 'Hanumangarh', 'Hanumangarh'),
  ('Government Polytechnic College, Jalore', 'Jalore', 'Jalore'),
  ('Government Polytechnic College, Jaisalmer', 'Jaisalmer', 'Jaisalmer'),
  ('Government Polytechnic College, Jhalawar', 'Jhalawar', 'Jhalawar'),
  ('Government Polytechnic College, Jhunjhunu', 'Jhunjhunu', 'Jhunjhunu'),
  ('Government Polytechnic College, Karauli', 'Karauli', 'Karauli'),
  ('Government Polytechnic College, Kota', 'Kota', 'Kota'),
  ('Government Polytechnic College, Kelwara', 'Kelwara', 'Rajsamand'),
  ('Government Polytechnic College, Mandore', 'Jodhpur', 'Jodhpur'),
  ('Government Polytechnic College, Nagaur', 'Nagaur', 'Nagaur'),
  ('Government Polytechnic College, Neemrana', 'Neemrana', 'Kotputli-Behror'),
  ('Government Polytechnic College, Pali', 'Pali', 'Pali'),
  ('Government Polytechnic College, Pratapgarh', 'Pratapgarh', 'Pratapgarh'),
  ('Government Polytechnic College, Rajsamand', 'Rajsamand', 'Rajsamand'),
  ('Government Polytechnic College, Sawai Madhopur', 'Sawai Madhopur', 'Sawai Madhopur'),
  ('Government Polytechnic College, Sikar', 'Sikar', 'Sikar'),
  ('SGBB Government Polytechnic College, Sirohi', 'Sirohi', 'Sirohi'),
  ('CMRB Government Polytechnic College, Sri Ganganagar', 'Sri Ganganagar', 'Sri Ganganagar'),
  ('Government Polytechnic College, Tonk', 'Tonk', 'Tonk'),
  ('Government Polytechnic College, Udaipur', 'Udaipur', 'Udaipur'),
  ('Government Women Polytechnic College, Ajmer', 'Ajmer', 'Ajmer'),
  ('Government Women Polytechnic College, Alwar', 'Alwar', 'Alwar'),
  ('Government Women Polytechnic College, Bharatpur', 'Bharatpur', 'Bharatpur'),
  ('Government Women Polytechnic College, Bhilwara', 'Bhilwara', 'Bhilwara'),
  ('Government Women Polytechnic College, Bikaner', 'Bikaner', 'Bikaner'),
  ('Government Women Polytechnic College, Kota', 'Kota', 'Kota'),
  ('Government Women Polytechnic College, Sanganer', 'Jaipur', 'Jaipur'),
  ('Government Women Polytechnic College, Tapukara', 'Tapukara', 'Khairthal-Tijara'),
  ('Government Women Polytechnic College, Udaipur', 'Udaipur', 'Udaipur'),
  ('Government Residential Women Polytechnic College, Jodhpur', 'Jodhpur', 'Jodhpur'),
  ('Government Polytechnic College, Ucchain', 'Ucchain', 'Bharatpur'),
  ('Government Polytechnic College, Nawa', 'Nawa', 'Didwana-Kuchaman'),
  ('Government Polytechnic College, Balotra', 'Balotra', 'Balotra'),
  ('Government Polytechnic College, Bandikui', 'Bandikui', 'Dausa'),
  ('Government Polytechnic College, Beawar', 'Beawar', 'Beawar'),
  ('Government Polytechnic College, Bhiwadi', 'Bhiwadi', 'Khairthal-Tijara'),
  ('Government Polytechnic College, Deeg', 'Deeg', 'Deeg'),
  ('Government Polytechnic College, Gudamalani', 'Gudamalani', 'Barmer'),
  ('Government Polytechnic College, Indergarh', 'Indergarh', 'Bundi'),
  ('Government Polytechnic College, Kanwas', 'Kanwas', 'Kota'),
  ('Government Polytechnic College, Ladpura', 'Ladpura', 'Kota'),
  ('Government Polytechnic College, Marwar Junction', 'Marwar Junction', 'Pali'),
  ('Government Polytechnic College, Merta City', 'Merta City', 'Nagaur'),
  ('Government Polytechnic College, Niwai', 'Niwai', 'Tonk'),
  ('Government Polytechnic College, Phagi', 'Phagi', 'Jaipur'),
  ('Government Polytechnic College, Phalodi', 'Phalodi', 'Phalodi'),
  ('Government Polytechnic College, Ramganj Mandi', 'Ramganj Mandi', 'Kota'),
  ('Government Polytechnic College, Salumbar', 'Salumbar', 'Salumbar'),
  ('Government Polytechnic College, Vallabhnagar', 'Vallabhnagar', 'Udaipur')
ON CONFLICT (name) DO NOTHING;

COMMIT;
