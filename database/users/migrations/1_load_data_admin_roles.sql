DELETE FROM users.admin_roles;
INSERT INTO users.admin_roles (id,name,jwt_claim,description) VALUES
	 (1,'Doctor','DOCTOR','Doctor'),
	 (2,'Admin','ROOT_ADMIN','Master user of admin panel'),
	 (3,'Wellness Advisor','WELLNESS_ADVISOR','Wellness Advisor');
