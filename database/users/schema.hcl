table "admin_roles" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = false
    type = varchar(128)
  }
  column "jwt_claim" {
    null = false
    type = varchar(64)
  }
  column "description" {
    null = false
    type = varchar(512)
  }
  primary_key {
    columns = [column.id]
  }
  index "jwt_claim_INDEX" {
    columns = [column.jwt_claim]
  }
}
table "admin_user" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = false
    type = varchar(512)
  }
  column "email" {
    null = false
    type = varchar(512)
  }
  column "password_hash" {
    null = false
    type = varchar(512)
  }
  column "designation" {
    null = true
    type = varchar(512)
  }
  column "profile_image" {
    null = true
    type = varchar(512)
  }
  column "firebase_uid" {
    null = true
    type = varchar(512)
  }
  column "push_subscription" {
    null = true
    type = json
  }
  primary_key {
    columns = [column.id]
  }
  index "admin_user_UN" {
    unique  = true
    columns = [column.email]
  }
  index "email_INDEX" {
    columns = [column.email]
  }
}
table "admin_user_roles" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "admin_user_id" {
    null = false
    type = int
  }
  column "admin_role_id" {
    null = false
    type = int
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "admin_user_roles_FK" {
    columns     = [column.admin_role_id]
    ref_columns = [table.admin_roles.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "admin_user_roles_FK_1" {
    columns     = [column.admin_user_id]
    ref_columns = [table.admin_user.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "admin_role_id_INDEX" {
    columns = [column.admin_role_id]
  }
  index "admin_user_id_INDEX" {
    columns = [column.admin_user_id]
  }
}
table "atlas_schema_revisions" {
  schema  = schema.users
  charset = "utf8mb4"
  collate = "utf8mb4_bin"
  column "version" {
    null = false
    type = varchar(255)
  }
  column "description" {
    null = false
    type = varchar(255)
  }
  column "type" {
    null     = false
    type     = bigint
    default  = 2
    unsigned = true
  }
  column "applied" {
    null    = false
    type    = bigint
    default = 0
  }
  column "total" {
    null    = false
    type    = bigint
    default = 0
  }
  column "executed_at" {
    null = false
    type = timestamp
  }
  column "execution_time" {
    null = false
    type = bigint
  }
  column "error" {
    null = true
    type = longtext
  }
  column "error_stmt" {
    null = true
    type = longtext
  }
  column "hash" {
    null = false
    type = varchar(255)
  }
  column "partial_hashes" {
    null = true
    type = json
  }
  column "operator_version" {
    null = false
    type = varchar(255)
  }
  primary_key {
    columns = [column.version]
  }
}
table "clinical_question_groups" {
  schema = schema.users
  column "clinical_question_groups_id" {
    null = false
    type = int
  }
  column "clinical_study_id" {
    null = false
    type = int
  }
  column "group_id" {
    null = false
    type = int
  }
  primary_key {
    columns = [column.clinical_question_groups_id]
  }
}
table "clinical_study" {
  schema = schema.users
  column "clinical_study_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = false
    type = varchar(64)
  }
  column "title_html" {
    null = false
    type = text
  }
  column "description_html" {
    null = false
    type = text
  }
  column "footnote_html" {
    null = false
    type = text
  }
  primary_key {
    columns = [column.clinical_study_id]
  }
}
table "doctor_chat" {
  schema = schema.users
  column "doctor_chat_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "client_id" {
    null = false
    type = int
  }
  column "last_client_message_sent_at" {
    null = true
    type = datetime
  }
  column "last_doctor_message_sent_at" {
    null = true
    type = datetime
  }
  column "doctor_unread_messages" {
    null    = false
    type    = int
    default = 0
  }
  column "doctor_id" {
    null = true
    type = int
  }
  column "doctor_unreplied_messages" {
    null    = true
    type    = int
    default = 0
  }
  column "client_unread_messages" {
    null    = true
    type    = int
    default = 0
  }
  primary_key {
    columns = [column.doctor_chat_id]
  }
  foreign_key "doctor_chat_FK" {
    columns     = [column.doctor_id]
    ref_columns = [table.admin_user.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "client_id_INDEX" {
    columns = [column.client_id]
  }
  index "doctor_chat_FK" {
    columns = [column.doctor_id]
  }
  index "doctor_unread_messages_INDEX" {
    columns = [column.doctor_unread_messages]
  }
}
table "doctor_chat_messages" {
  schema  = schema.users
  charset = "utf8mb4"
  collate = "utf8mb4_0900_ai_ci"
  column "doctor_chat_message_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "doctor_chat_id" {
    null = false
    type = int
  }
  column "text" {
    null = true
    type = mediumtext
  }
  column "attachment" {
    null = true
    type = varchar(512)
  }
  column "sent_at" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "doctor_id" {
    null = true
    type = int
  }
  column "replied_to" {
    null = true
    type = int
  }
  column "read" {
    null    = true
    type    = tinyint
    default = 0
  }
  column "replied" {
    null    = true
    type    = tinyint
    default = 0
  }
  primary_key {
    columns = [column.doctor_chat_message_id]
  }
  foreign_key "doctor_chat_messages_FK" {
    columns     = [column.doctor_id]
    ref_columns = [table.admin_user.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "doctor_chat_messages_FK_1" {
    columns     = [column.doctor_chat_id]
    ref_columns = [table.doctor_chat.column.doctor_chat_id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "doctor_chat_messages_FK_2" {
    columns     = [column.replied_to]
    ref_columns = [table.doctor_chat_messages.column.doctor_chat_message_id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "doctor_chat_id_INDEX" {
    columns = [column.doctor_chat_id]
  }
  index "doctor_chat_messages_FK_2" {
    columns = [column.replied_to]
  }
  index "doctor_id_INDEX" {
    columns = [column.doctor_id]
  }
}
table "health_tips_subscription" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "email" {
    null = true
    type = varchar(45)
  }
  column "user_id" {
    null = true
    type = varchar(45)
  }
  column "active" {
    null    = true
    type    = tinyint
    default = 0
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
table "kb_ask_history" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = int
  }
  column "question" {
    null = false
    type = varchar(500)
  }
  column "answer" {
    null = false
    type = varchar(10383)
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
}
table "lead" {
  schema = schema.users
  column "lead_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "email" {
    null = false
    type = varchar(512)
  }
  column "firstname" {
    null = false
    type = varchar(512)
  }
  column "status" {
    null = false
    type = varchar(20)
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "is_subscription" {
    null    = true
    type    = char(1)
    default = "F"
  }
  primary_key {
    columns = [column.lead_id]
  }
  index "email_INDEX" {
    columns = [column.email]
  }
  index "status_INDEX" {
    columns = [column.status]
  }
}
table "newsletter_subscription" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "email" {
    null = true
    type = varchar(45)
  }
  column "user_id" {
    null = true
    type = varchar(45)
  }
  column "lead_id" {
    null = true
    type = varchar(45)
  }
  column "active" {
    null    = true
    type    = tinyint
    default = 0
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
table "notifications" {
  schema = schema.users
  column "notification_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = false
    type = varchar(64)
  }
  column "title_html" {
    null = false
    type = text
  }
  column "description_html" {
    null = false
    type = text
  }
  column "URL" {
    null    = true
    type    = varchar(512)
    default = ""
  }
  primary_key {
    columns = [column.notification_id]
  }
}
table "physician" {
  schema = schema.users
  column "physician_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "firstname" {
    null = true
    type = varchar(45)
  }
  column "lastname" {
    null = true
    type = varchar(45)
  }
  column "suffix" {
    null = true
    type = varchar(45)
  }
  column "credentials" {
    null = true
    type = varchar(512)
  }
  column "phone" {
    null = true
    type = varchar(45)
  }
  column "email" {
    null = true
    type = varchar(512)
  }
  column "state" {
    null = true
    type = varchar(45)
  }
  column "focus" {
    null = true
    type = varchar(512)
  }
  column "referred_hours" {
    null = true
    type = varchar(45)
  }
  column "response_time" {
    null = true
    type = varchar(45)
  }
  column "wait_time" {
    null = true
    type = varchar(45)
  }
  column "comments" {
    null = true
    type = varchar(1024)
  }
  primary_key {
    columns = [column.physician_id]
  }
  index "email_index" {
    columns = [column.email]
  }
  index "email_UNIQUE" {
    unique  = true
    columns = [column.email]
  }
}
table "question_group" {
  schema = schema.users
  column "group_id" {
    null = false
    type = int
  }
  column "name" {
    null = false
    type = varchar(256)
  }
  column "title" {
    null = true
    type = text
  }
  column "subtitle" {
    null = true
    type = text
  }
  column "description" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.group_id]
  }
}
table "research_subscription" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "first_name" {
    null = true
    type = varchar(45)
  }
  column "last_name" {
    null = true
    type = varchar(45)
  }
  column "email" {
    null = true
    type = varchar(45)
  }
  column "details" {
    null = true
    type = text
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
table "user" {
  schema = schema.users
  column "user_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "stripe_user_id" {
    null = true
    type = varchar(100)
  }
  column "email" {
    null = false
    type = varchar(512)
  }
  column "active" {
    null = true
    type = int
  }
  column "otp" {
    null = true
    type = varchar(10)
  }
  column "last_login" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "ip_address" {
    null = true
    type = varchar(45)
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "password_hash" {
    null    = true
    type    = varchar(512)
    default = ""
  }
  column "clinical_trial" {
    null    = true
    type    = varchar(8)
    default = ""
  }
  column "user_type" {
    null    = true
    type    = varchar(8)
    default = "OTP"
  }
  column "email_code" {
    null    = true
    type    = varchar(8)
    default = ""
  }
  column "email_verified" {
    null    = true
    type    = int
    default = 0
  }
  column "oura_token" {
    null = true
    type = json
  }
  column "admin" {
    null    = true
    type    = int
    default = 0
  }
  column "user_survey_status" {
    null    = true
    type    = enum("NOT-STARTED","INCOMPLETE","COMPLETED")
    default = "NOT-STARTED"
  }
  column "lead_id" {
    null = true
    type = int
  }
  column "attempts" {
    null    = false
    type    = int
    default = 0
  }
  primary_key {
    columns = [column.user_id]
  }
  index "email_INDEX" {
    columns = [column.email]
  }
  index "email_UNIQUE" {
    unique  = true
    columns = [column.email]
  }
}
table "user_answers" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = true
    type = int
  }
  column "group_id" {
    null = true
    type = int
  }
  column "last_question" {
    null = true
    type = int
  }
  column "device_token" {
    null = true
    type = longtext
  }
  column "time" {
    null    = true
    type    = timestamp
    default = sql("CURRENT_TIMESTAMP")
  }
  column "data" {
    null = true
    type = json
  }
  column "lead_id" {
    null = true
    type = int
  }
  column "bubble_counters" {
    null = true
    type = json
  }
  primary_key {
    columns = [column.id]
  }
  index "time" {
    columns = [column.time]
  }
}
table "user_contra_defi" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = true
    type = int
  }
  column "data" {
    null = true
    type = json
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
table "user_followup" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = int
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
  column "date_sent" {
    null = true
    type = datetime
  }
  column "date_responded" {
    null = true
    type = datetime
  }
  column "followup_type_id" {
    null = false
    type = int
  }
  primary_key {
    columns = [column.id]
  }
}
table "user_followup_response" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "date_created" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "user_followup_id" {
    null = false
    type = int
  }
  column "response" {
    null = false
    type = varchar(500)
  }
  primary_key {
    columns = [column.id]
  }
}
table "user_followup_type" {
  schema = schema.users
  column "id" {
    null = false
    type = int
  }
  column "description" {
    null = false
    type = int
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
  primary_key {
    columns = [column.id]
  }
}
table "user_image" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "user_id" {
    null = false
    type = int
  }
  column "object_key" {
    null = true
    type = text
  }
  column "image_type" {
    null = true
    type = text
  }
  column "is_deleted" {
    null = false
    type = bool
  }
  primary_key {
    columns = [column.id]
  }
}
table "user_notification" {
  schema = schema.users
  column "user_notification_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "notification_id" {
    null = false
    type = int
  }
  column "user_id" {
    null = false
    type = int
  }
  column "status" {
    null    = true
    type    = enum("READ","UNREAD")
    default = "UNREAD"
  }
  column "time" {
    null    = true
    type    = timestamp
    default = sql("CURRENT_TIMESTAMP")
  }
  column "notification_type" {
    null = true
    type = enum("email","sms","push")
  }
  column "lead_id" {
    null = true
    type = int
  }
  primary_key {
    columns = [column.user_notification_id]
  }
  index "notification_index" {
    columns = [column.notification_id]
  }
  index "unique" {
    unique  = true
    columns = [column.notification_id, column.user_id]
  }
  index "user_index" {
    columns = [column.user_id]
  }
}
table "user_orders" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "product_id" {
    null = true
    type = varchar(45)
  }
  column "user_id" {
    null = true
    type = int
  }
  column "amount" {
    null = true
    type = float
  }
  column "stripeId" {
    null = true
    type = text
  }
  column "subscription" {
    null = true
    type = varchar(100)
  }
  column "url" {
    null = true
    type = longtext
  }
  column "status" {
    null = true
    type = enum("success","fail","wait","paid","unpaid","no_payment_required","open","canceled")
  }
  column "start_date" {
    null = true
    type = datetime
  }
  column "end_date" {
    null = true
    type = datetime
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
table "user_plan_cache" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = int
  }
  column "plan_id" {
    null = false
    type = int
  }
  column "plan_order_id" {
    null = false
    type = int
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "precomputed_requests" {
    null = false
    type = json
  }
  primary_key {
    columns = [column.id]
  }
}
table "user_profile" {
  schema = schema.users
  column "user_profile_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = int
  }
  column "first_name" {
    null = true
    type = varchar(50)
  }
  column "last_name" {
    null = true
    type = varchar(50)
  }
  column "dob" {
    null = true
    type = date
  }
  column "sex" {
    null = true
    type = enum("M","F")
  }
  column "phone" {
    null = true
    type = varchar(10)
  }
  column "address_line1" {
    null = true
    type = varchar(100)
  }
  column "address_line2" {
    null = true
    type = varchar(50)
  }
  column "address_city" {
    null = true
    type = varchar(50)
  }
  column "address_zip" {
    null = true
    type = varchar(45)
  }
  column "address_state" {
    null = true
    type = varchar(45)
  }
  column "address_country" {
    null = true
    type = varchar(45)
  }
  column "country_code" {
    null = true
    type = varchar(45)
  }
  column "communication_preference" {
    null = true
    type = varchar(45)
  }
  column "timezone" {
    null = true
    type = varchar(45)
  }
  column "time" {
    null    = true
    type    = timestamp
    default = sql("CURRENT_TIMESTAMP")
  }
  column "device_tokens" {
    null = true
    type = varchar(1000)
  }
  column "profile_image" {
    null = true
    type = varchar(1000)
  }
  column "data" {
    null = true
    type = json
  }
  column "isLabUser" {
    null    = false
    type    = bool
    default = 0
  }
  primary_key {
    columns = [column.user_profile_id]
  }
  index "user_id" {
    columns = [column.user_id]
  }
}
table "user_question_group" {
  schema = schema.users
  column "user_question_group_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "question_group_id" {
    null = false
    type = int
  }
  column "user_id" {
    null = false
    type = int
  }
  column "time" {
    null    = true
    type    = timestamp
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.user_question_group_id]
  }
  index "study_index" {
    columns = [column.question_group_id]
  }
  index "unique" {
    unique  = true
    columns = [column.question_group_id, column.user_id]
  }
  index "user_index" {
    columns = [column.user_id]
  }
}
table "user_tracker" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = true
    type = int
  }
  column "symptom" {
    null = true
    type = int
  }
  column "start_date" {
    null = true
    type = datetime
  }
  column "duration" {
    null = true
    type = int
  }
  column "severity" {
    null = true
    type = int
  }
  column "triggers" {
    null = true
    type = text
  }
  column "treatments" {
    null = true
    type = json
  }
  column "medications" {
    null = true
    type = text
  }
  column "stress_level" {
    null = true
    type = int
  }
  column "notes" {
    null = true
    type = text
  }
  column "treatments_tried" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
  index "start_date" {
    columns = [column.start_date]
  }
  index "user_id" {
    columns = [column.user_id]
  }
}
table "user_wearable_analysis" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = true
    type = int
  }
  column "time" {
    null    = true
    type    = timestamp
    default = sql("CURRENT_TIMESTAMP")
  }
  column "data" {
    null = true
    type = json
  }
  primary_key {
    columns = [column.id]
  }
}
table "user_wearable_data" {
  schema = schema.users
  column "user_wearable_data_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_wearables_id" {
    null = false
    type = int
  }
  column "date" {
    null = false
    type = date
  }
  column "sleep" {
    null = true
    type = json
  }
  column "activity" {
    null = true
    type = json
  }
  column "readiness" {
    null = true
    type = json
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "breathing" {
    null = true
    type = json
  }
  column "heart" {
    null = true
    type = json
  }
  column "spo2" {
    null = true
    type = json
  }
  column "temp_skin" {
    null = true
    type = json
  }
  column "temp_core" {
    null = true
    type = json
  }
  primary_key {
    columns = [column.user_wearable_data_id]
  }
  foreign_key "user_wearable_data_FK" {
    columns     = [column.user_wearables_id]
    ref_columns = [table.user_wearables.column.user_wearables_id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "date_INDEX" {
    columns = [column.date]
  }
  index "user_wearables_id_INDEX" {
    columns = [column.user_wearables_id]
  }
}
table "user_wearable_data2" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = int
  }
  column "date_created" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "date_request_start" {
    null = false
    type = datetime
  }
  column "date_request_end" {
    null = false
    type = datetime
  }
  column "raw_data" {
    null = true
    type = json
  }
  column "wearable_id" {
    null = false
    type = int
  }
  primary_key {
    columns = [column.id]
  }
}
table "user_wearables" {
  schema = schema.users
  column "user_wearables_id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = int
  }
  column "wearable_id" {
    null = false
    type = int
  }
  column "wearable_status" {
    null    = true
    type    = enum("NOT-CONNECTED","CONNECTED")
    default = "NOT-CONNECTED"
  }
  column "token" {
    null = true
    type = varchar(500)
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "user_info" {
    null = true
    type = json
  }
  column "fitbit_base_64_encode" {
    null = true
    type = varchar(500)
  }
  column "fitbit_code_verifier" {
    null = true
    type = varchar(500)
  }
  column "fitbit_code_challenge" {
    null = true
    type = varchar(500)
  }
  column "fitbit_user_id" {
    null = true
    type = varchar(500)
  }
  column "date_updated" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.user_wearables_id]
  }
}
table "waitlist_subscription" {
  schema = schema.users
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = true
    type = text
  }
  column "email" {
    null = true
    type = varchar(45)
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
schema "users" {
  charset = "utf8mb3"
  collate = "utf8mb3_bin"
}
