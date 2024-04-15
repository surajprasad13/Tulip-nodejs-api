table "ask_expert_questions_answers" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "category" {
    null = true
    type = varchar(90)
  }
  column "question" {
    null = true
    type = text
  }
  column "answer" {
    null = true
    type = text
  }
  column "is_initial_dataset" {
    null    = false
    type    = bool
    default = 0
  }
  column "is_visible" {
    null    = false
    type    = bool
    default = 0
  }
  column "createdAt" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "updatedAt" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "user_id" {
    null = true
    type = int
  }
  primary_key {
    columns = [column.id]
  }
}
table "blogs" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "category" {
    null = true
    type = varchar(45)
  }
  column "title" {
    null = true
    type = varchar(255)
  }
  column "description" {
    null = true
    type = longtext
  }
  column "views" {
    null = true
    type = int
  }
  column "image" {
    null = true
    type = varchar(255)
  }
  column "published" {
    null = true
    type = varchar(10)
  }
  column "created_at" {
    null = true
    type = datetime
  }
  column "updated_at" {
    null = true
    type = datetime
  }
  column "url" {
    null = true
    type = varchar(255)
  }
  primary_key {
    columns = [column.id]
  }
}
table "contact" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "type" {
    null = true
    type = enum("contact","inquiry")
  }
  column "name" {
    null = true
    type = varchar(45)
  }
  column "email" {
    null = true
    type = varchar(45)
  }
  column "message" {
    null = true
    type = longtext
  }
  column "createdAt" {
    null = true
    type = datetime
  }
  column "updatedAt" {
    null = true
    type = datetime
  }
  column "phone_number" {
    null = true
    type = varchar(45)
  }
  primary_key {
    columns = [column.id]
  }
}
table "doctors" {
  schema = schema.defaultdb
  column "id" {
    null = false
    type = int
  }
  column "type" {
    null = true
    type = varchar(45)
  }
  column "name" {
    null = true
    type = varchar(256)
  }
  column "doctor" {
    null = true
    type = varchar(256)
  }
  column "phone" {
    null = true
    type = varchar(256)
  }
  column "address" {
    null = true
    type = varchar(256)
  }
  primary_key {
    columns = [column.id]
  }
}
table "health_tips" {
  schema = schema.defaultdb
  column "healthtip_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "title" {
    null = true
    type = varchar(256)
  }
  column "description" {
    null = true
    type = varchar(1024)
  }
  column "image" {
    null = true
    type = varchar(512)
  }
  primary_key {
    columns = [column.healthtip_id]
  }
}
table "landing_email" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "email" {
    null = true
    type = varchar(256)
  }
  column "timestamp" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
  index "email_UNIQUE" {
    unique  = true
    columns = [column.email]
  }
}
table "newsletter_template" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "title" {
    null = true
    type = varchar(45)
  }
  column "subject" {
    null = true
    type = varchar(45)
  }
  column "html" {
    null = true
    type = text
  }
  column "status" {
    null = true
    type = enum("new","to_send","sent")
  }
  column "createdAt" {
    null = true
    type = datetime
  }
  column "updatedAt" {
    null = true
    type = datetime
  }
  primary_key {
    columns = [column.id]
  }
}
table "research" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "title" {
    null = true
    type = varchar(255)
  }
  column "description" {
    null = true
    type = longtext
  }
  column "image" {
    null = true
    type = varchar(255)
  }
  column "created_at" {
    null = true
    type = datetime
  }
  column "updated_at" {
    null = true
    type = datetime
  }
  primary_key {
    columns = [column.id]
  }
}
table "settings" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "key" {
    null = false
    type = varchar(255)
  }
  column "data" {
    null = false
    type = json
  }
  primary_key {
    columns = [column.id]
  }
}
table "teams" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = true
    type = varchar(45)
  }
  column "profession" {
    null = true
    type = longtext
  }
  column "image" {
    null = true
    type = varchar(255)
  }
  column "created_at" {
    null = true
    type = datetime
  }
  column "updated_at" {
    null = true
    type = datetime
  }
  column "title" {
    null = true
    type = varchar(255)
  }
  primary_key {
    columns = [column.id]
  }
}
table "testimonials" {
  schema = schema.defaultdb
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = true
    type = varchar(50)
  }
  column "description" {
    null = true
    type = varchar(1000)
  }
  column "profession" {
    null = true
    type = varchar(50)
  }
  column "image" {
    null = true
    type = varchar(100)
  }
  column "date_created" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "date_updated" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "group_id" {
    null = true
    type = int
  }
  column "is_deleted" {
    null    = false
    type    = bool
    default = 0
  }
  column "user_id" {
    null = true
    type = int
  }
  column "location" {
    null = true
    type = varchar(100)
  }
  primary_key {
    columns = [column.id]
  }
  index "id_UNIQUE" {
    unique  = true
    columns = [column.id]
  }
}
schema "defaultdb" {
  charset = "utf8mb4"
  collate = "utf8mb4_0900_ai_ci"
}
