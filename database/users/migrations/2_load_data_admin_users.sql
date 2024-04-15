DELETE FROM users.admin_user;
INSERT INTO users.admin_user (id,name,email,password_hash,designation,profile_image,firebase_uid,push_subscription) VALUES
	 (1,'Admin 1','admin1@meettulip.com','$2b$10$3563wJYDM/w3wA9p7mql9O2D6rQYMLSVrW4ttSD53BsoqcJiiEHB2',NULL,NULL,NULL,NULL),
	 (2,'Gopi','gopi@meettulip.com','$2b$10$st/7jb6Gf5y.8Id0ac11neGk0edIBtavjuIMLOuHt4.hSKLSPCPca',NULL,NULL,NULL,NULL),
	 (4,'Doctor1','doctor1@meettulip.com','$2b$10$EGdkcgKQGhzCI50aVLf51eNGhLkNtARl0WDFCXNdh99WQfuRVZBg.','Therapist','https://doctor-profile.sfo3.digitaloceanspaces.com/4_1660359161856.png',NULL,NULL),
	 (5,'Doctor2','doctor2@meettulip.com','$2b$10$IhRL15iOP4ZHgwJlM.bLiuYcg2mMuM8ky528nezY6hwwbXxBctO7y',NULL,NULL,NULL,NULL),
	 (6,'Doctor 3','doctor3@meettulip.com','$2b$10$BakLvlAH1CkGc1xtAvpYpO9RYQskCsbDdphFX8SACwcqEav0HoPt.',NULL,NULL,NULL,NULL),
	 (7,'Dr. Jock London','jock_london@gmail.com','$2b$10$PleA06owbSmL4AJ3zWT6cuNZC1ujBu2jegWatZ2OqZz5JAcQc5vrW',NULL,NULL,NULL,NULL),
	 (9,'Prita','prita@meettulip.com','$2b$10$YmA2aXhFoHiEzdPOGTknguFDVk4wua.zj9XMhM8JA0ojD/TRaKowm',NULL,NULL,NULL,NULL),
	 (10,'Balaji','balaji@meettulip.com','$2b$10$N2GfKbhiYbXbbY3YabJq.enBpQTjCwwAMZan963r/ZDu2T25eSAFm',NULL,NULL,NULL,NULL),
	 (11,'Suraj Prasad','suraj@meettulip.com','$2b$10$ysT2vQIg/dacKN8zjMhWe.kTqp3QRR.OZ0NuRQNigsJC1BKFQ.dZS',NULL,NULL,NULL,NULL),
	 (12,'Eriberto','eriberto@meettulip.com','$2b$10$rXgpSqFFBvsrjyHsvFB2P.mldVGeMspFhfonxbHa./l.YsBbAMLRa',NULL,NULL,NULL,NULL);
INSERT INTO users.admin_user (id,name,email,password_hash,designation,profile_image,firebase_uid,push_subscription) VALUES
	 (13,'Daniel','daniel@meettulip.com','$2b$10$4BxJQdcjft462v3RXhkXpOU0VfWfsPPK9CQsay80yKuTv70miNCFy',NULL,NULL,NULL,NULL),
	 (14,'Felipe','felipe@meettulip.com','$2b$10$/r/e6a2WH13ZorIqm8bBZ.y8IEHgZs4JOEE5l3y/wkwYCozH7xfd2',NULL,NULL,NULL,NULL),
	 (15,'Admin2','admin2@meettulip.com','$2b$10$YmA2aXhFoHiEzdPOGTknguFDVk4wua.zj9XMhM8JA0ojD/TRaKowm',NULL,NULL,NULL,NULL),
	 (16,'Jennifer Havens','jennifer@meettulip.com','$2b$10$XNJkmGssQBoASfg.rRsi3u7csVTOY2RkYTQGEz9g5bIBGlRUtNl3W',NULL,NULL,NULL,NULL),
	 (17,'Alex','alex@meettulip.com','$2b$10$N2GfKbhiYbXbbY3YabJq.enBpQTjCwwAMZan963r/ZDu2T25eSAFm',NULL,NULL,'3UKp1VmzFNTRTWZwln5izIbdyTj1',NULL),
	 (20,'Wellness1','wellness1@meettulip.com','$2b$10$gP9/NDYLBdP7oy7Ota26pubBTY.RV01kfHgKzQuRcOvbEg/JEVA7K',NULL,NULL,'XASU6bbLj9hmeuMeEa6n0nUsJXR2','{"keys": {"auth": "f-dr1bfLbBI0FeC-tG_6BA", "p256dh": "BFL0KOKL8TKI0TXMzD4EOnVMpfDP42QkUnkukuBoUjX7S7ifOATG40rPIrgCfiEAUj7yMuDsalxvVzMdqG_pxeA"}, "endpoint": "https://fcm.googleapis.com/fcm/send/cT5yvGQSySc:APA91bFb7-xBiHxfWOaUD-4jVLe95bXEjaYqs-dTXPRsTw2U9xzYiZQmRg4avA9wHkJRBlT1Ec-PmWrO4AzrLq-MzSTlqqsywj_THlvbE2sDSFbJVArFIwpnwlAOsyIuO6-leXc-D2xm", "expirationTime": null}'),
	 (22,'Wellness2','wellness2@meettulip.com','$2b$10$R8jnw6u.jp2XofXCMr13duB0TLpmNjFE3oSQm4PeLTOdGpxFzShTC',NULL,NULL,'Qo6xmT7HFQXy6r5ccwkJruE9buK2','{"keys": {"auth": "osYtS123D7OvT9CyeWSRnA", "p256dh": "BN6ZqCtoBVJJkV0qkJcbdh2MOiVwNh0GiOtdxI1vwpWa_KQ-0GEVz5eNODoda5705XAn0UyuIWRtsfyYbmJwTu4"}, "endpoint": "https://fcm.googleapis.com/fcm/send/eE6h3zMQs2o:APA91bF45CwfFMVVnqWEvPxvrswPQ8DUeDIfirjHYwr-gugBMFwbmlT5ZMo4t5vmHpOXKb0hsfek5995G9VRLoAz85D0hVQH-hJJJ9AbretNZ-pSmc3kB5P6eZLi0Nulj70D5RcbooL9", "expirationTime": null}'),
	 (23,'Michael','michael.bemis@meettulip.com','$2b$10$ULzCz9iFN7gU/iC08N.oR.wDnVAAU7W8AXLoYqwXaLvlFsv7rbegq',NULL,NULL,'DDKJHlZbXWN8EJ6DOlxDsku2Tta2',NULL);
