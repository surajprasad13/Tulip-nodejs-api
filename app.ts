process.env.TZ = "Etc/Universal"

import "./src/config"

import Server from "./src/server"
import "./src/jobs"
import { sendEmailNotification } from "./src/helpers/sendEmail"
import { EmailCondition } from "./src/interfaces/email"

//sendEmailNotification("Animesh", "animesh@meettulip.com", EmailCondition.PlanExpire)

const server = new Server()

server.listen()
