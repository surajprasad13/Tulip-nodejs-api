table "allergies" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "allergy_id" {
    null = false
    type = int
  }
  column "allergy_type" {
    null = false
    type = text
  }
  column "name" {
    null = false
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "constitutions_main" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "constitution_id" {
    null = false
    type = int
  }
  column "constitution" {
    null = false
    type = text
  }
  column "information_to_show" {
    null = false
    type = text
  }
  column "id_group" {
    null = true
    type = int
  }
  column "foods_to_increase" {
    null = true
    type = text
  }
  column "foods_to_decrease" {
    null = true
    type = text
  }
  column "shopping_list" {
    null = true
    type = text
  }
  column "preset_id" {
    null = true
    type = int
  }
  primary_key {
    columns = [column.id]
  }
}
table "dashboard_reference" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = false
    type = int
  }
  column "health_number" {
    null = true
    type = text
  }
  column "id_question" {
    null = false
    type = int
  }
  column "answer_value" {
    null = true
    type = text
  }
  column "question_type" {
    null = true
    type = text
  }
  column "survey_bubbles" {
    null = true
    type = text
  }
  column "preset_ids" {
    null = true
    type = varchar(30)
  }
  column "root_cause" {
    null = true
    type = text
  }
  column "mad_libs_root_cause" {
    null = true
    type = text
  }
  column "health_score" {
    null = true
    type = text
  }
  column "mad_libs_suboptimal" {
    null = true
    type = text
  }
  column "constitution_id_insights" {
    null = true
    type = int
  }
  column "tcm_root_cause" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "dynamic_content" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "id_section" {
    null = true
    type = int
  }
  column "content" {
    null = true
    type = text
  }
  column "sectionName" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "medications" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "drug_class" {
    null = true
    type = text
  }
  column "drug_sub_class" {
    null = true
    type = text
  }
  column "brand_name" {
    null = true
    type = text
  }
  column "generic_name" {
    null = true
    type = text
  }
  column "nutrients_depleted" {
    null = true
    type = text
  }
  column "cm" {
    null = true
    type = int
  }
  column "supplement_contraindications" {
    null = true
    type = text
  }
  column "food_contraindications" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "nutritions" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "preset_ids" {
    null = true
    type = text
  }
  column "introduction" {
    null = true
    type = text
  }
  column "madlibs" {
    null = true
    type = text
  }
  column "food_list" {
    null = true
    type = text
  }
  column "recipe" {
    null = true
    type = text
  }
  column "breakfast" {
    null = true
    type = text
  }
  column "lunch" {
    null = true
    type = text
  }
  column "dinner" {
    null = true
    type = text
  }
  column "snacks" {
    null = true
    type = text
  }
  column "desserts" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "plans" {
  schema = schema.decision
  column "id" {
    null = false
    type = varchar(45)
  }
  column "group_id" {
    null = true
    type = int
  }
  column "name" {
    null = true
    type = varchar(45)
  }
  column "description" {
    null = true
    type = varchar(45)
  }
  column "image" {
    null = true
    type = varchar(200)
  }
  column "price" {
    null = true
    type = varchar(45)
  }
  column "priceLabel" {
    null = true
    type = varchar(45)
  }
  column "start_date" {
    null = true
    type = varchar(45)
  }
  column "end_date" {
    null = true
    type = varchar(45)
  }
  column "type" {
    null = true
    type = varchar(45)
  }
  column "coupon_code" {
    null = true
    type = json
  }
  column "url" {
    null = true
    type = varchar(45)
  }
  primary_key {
    columns = [column.id]
  }
}
table "presets" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "preset_id" {
    null = false
    type = int
  }
  column "id_group" {
    null = false
    type = int
  }
  column "remedy_type" {
    null = false
    type = text
  }
  column "remedy_id" {
    null = false
    type = int
  }
  primary_key {
    columns = [column.id]
  }
}
table "question_grammar" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "health_number" {
    null = true
    type = text
  }
  column "id_question" {
    null = true
    type = int
  }
  column "answer_value" {
    null = true
    type = text
  }
  column "populate" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "question_remedies" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "id_question" {
    null = true
    type = int
  }
  column "answer_value" {
    null = true
    type = text
  }
  column "exception" {
    null = true
    type = text
  }
  column "remedy_type" {
    null = true
    type = text
  }
  column "remedy_id" {
    null = true
    type = int
  }
  column "weight" {
    null = true
    type = int
  }
  primary_key {
    columns = [column.id]
  }
}
table "questions" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "group_id" {
    null    = false
    type    = int
    default = 1
  }
  column "id_question" {
    null = false
    type = int
  }
  column "id_tree" {
    null = true
    type = int
  }
  column "type" {
    null = true
    type = varchar(8)
  }
  column "question" {
    null = true
    type = text
  }
  column "options" {
    null = true
    type = json
  }
  column "tags" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
  index "id_unique" {
    columns = [column.group_id, column.id_question]
  }
}
table "remedies" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = false
    type = int
  }
  column "name" {
    null = false
    type = text
  }
  column "options" {
    null = true
    type = json
  }
  column "remedy_type" {
    null = false
    type = text
  }
  column "brand" {
    null = true
    type = text
  }
  column "link_coupon_code" {
    null = true
    type = text
  }
  column "remedy_id" {
    null = false
    type = int
  }
  column "image_url" {
    null = true
    type = text
  }
  column "allergy_id" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "remedies_exceptions" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "exception_type" {
    null = true
    type = text
  }
  column "exception_rule" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "remedy_alternatives" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = false
    type = int
  }
  column "name" {
    null = false
    type = text
  }
  column "options" {
    null = true
    type = json
  }
  column "remedy_type" {
    null = false
    type = text
  }
  column "brand" {
    null = true
    type = text
  }
  column "link_coupon_code" {
    null = true
    type = text
  }
  column "remedy_id" {
    null = false
    type = int
  }
  column "allergy_id" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "root_cause_insights" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "group_id" {
    null = false
    type = int
  }
  column "title" {
    null = true
    type = text
  }
  column "description" {
    null = true
    type = text
  }
  column "studies" {
    null = true
    type = json
  }
  column "image_url" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "root_cause_insights_2" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "health_number" {
    null = true
    type = text
  }
  column "id_question" {
    null = true
    type = int
  }
  column "answer_value" {
    null = true
    type = text
  }
  column "root_cause" {
    null = true
    type = text
  }
  column "tcm_diagnosis" {
    null = true
    type = text
  }
  column "health_score" {
    null = true
    type = int
  }
  column "mad_libs" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "survey_configuration" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "group_id" {
    null = false
    type = int
  }
  column "sentiment" {
    null = true
    type = text
  }
  column "template" {
    null = false
    type = text
  }
  column "date_created" {
    null    = true
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "GPT3_responses" {
    null = true
    type = json
  }
  column "key" {
    null = false
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "symptom_tracker" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_item" {
    null = true
    type = int
  }
  column "category" {
    null = true
    type = text
  }
  column "name" {
    null = true
    type = text
  }
  column "health_tip_title" {
    null = true
    type = text
  }
  column "health_tip_description" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "symptoms" {
  schema = schema.decision
  column "id" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "id_group" {
    null = true
    type = int
  }
  column "id_question" {
    null = true
    type = int
  }
  column "answer_value" {
    null = true
    type = text
  }
  column "key_phrases" {
    null = true
    type = text
  }
  column "main_symptom" {
    null = true
    type = text
  }
  column "sub_symptoms" {
    null = true
    type = text
  }
  column "frequency" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
}
table "tree" {
  schema = schema.decision
  column "id_tree" {
    null           = false
    type           = int
    auto_increment = true
  }
  column "name" {
    null = true
    type = varchar(45)
  }
  primary_key {
    columns = [column.id_tree]
  }
}
schema "decision" {
  charset = "utf8mb3"
  collate = "utf8mb3_bin"
}
