DELETE FROM decision.plans;
INSERT INTO decision.plans (id,group_id,name,description,image,price,priceLabel,start_date,end_date,`type`,coupon_code,url) VALUES
	 ('prod_Ll7zaKkXJxE7af',101,'Sleep','this is sleep product plan','https://files.stripe.com/links/MDB8YWNjdF8xTDM1Z3FMaVF3b3o1U092fGZsX3Rlc3RfTE9JZE5ybVdlUkVhZ0Q4NW5DTkdlMXM200L0hwDi13','price_1M2v1eLiQwoz5SOvBVJxzQxp','89',NULL,NULL,'service','[]',NULL),
	 ('prod_Llaa2pjNuQRrK1',102,'Fatique','this is fatique plan description','https://files.stripe.com/links/MDB8YWNjdF8xTDM1Z3FMaVF3b3o1U092fGZsX3Rlc3RfcUgybEFoMHhReVZobzA0UkI3WEY1SVpr00aCl2cMdy','price_1M2v0oLiQwoz5SOv8oy18jIt','89',NULL,NULL,'service','["KJdz25Zw"]',NULL),
	 ('prod_M5MnGCSrNSrlFK',103,'Blood Sugar','This is blood sugar plan','https://files.stripe.com/links/MDB8YWNjdF8xTDM1Z3FMaVF3b3o1U092fGZsX3Rlc3RfUGN6a2tYa0ZpbTBUcXQ2cnZTRE14bGRo00bx5nVrsT','price_1M2uzWLiQwoz5SOv6MoxcXtQ','89',NULL,NULL,'service','["KJdz25Zw"]',NULL),
	 ('prod_MO2qdcXs3NbuHw',100,'Knowledge Base access','Monthly subscription plan','https://tulip-cdn.sfo3.digitaloceanspaces.com/CaptureTulip.PNG','price_1M2XspLiQwoz5SOvOOs0E7SM','9',NULL,NULL,'service',NULL,NULL),
	 ('prod_NJqBHDYdIPvcgk',104,'Long Covid','This is the Long Covid custom plan','https://files.stripe.com/links/MDB8YWNjdF8xTDM1Z3FMaVF3b3o1U092fGZsX3Rlc3RfUGN6a2tYa0ZpbTBUcXQ2cnZTRE14bGRo00bx5nVrsT','price_1MZCVKLiQwoz5SOv73WyNQpm','89',NULL,NULL,'service','["KJdz25Zw"]',NULL);

DELETE FROM decision.tree;
INSERT INTO decision.tree (name) VALUES
	 ('Initial Onboarding'),
	 ('Autoimmune'),
	 ('Metabolic Syndrome'),
	 ('Wellness/Preventative');
