import {fn, literal, Sequelize} from "sequelize"
import config from "../config"

const DB_USER = config.DB_USER
const DB_PASSWORD = config.DB_PASSWORD
const DB_HOST = config.DB_HOST
const DB_PORT = config.DB_PORT

function createDb(name: string): Sequelize {
    if (DB_HOST === 'memory') {
        return new Sequelize('sqlite::memory:', {logging: false})
    } else {
        return new Sequelize(name, DB_USER, DB_PASSWORD, {
            dialect: "mysql",
            host: DB_HOST,
            port: Number(DB_PORT),
            define: {
                freezeTableName: true,
            },
        })
    }
}

class Databases {
    public decision: Sequelize
    public defaultdb: Sequelize
    public users: Sequelize

    constructor() {
        this.decision = createDb('decision')
        this.defaultdb = createDb('defaultdb')
        this.users = createDb('users')
    }

    public now() {
        if (DB_HOST === 'memory') {
            return literal("(DATETIME('NOW()'))")
        } else {
            return fn('NOW')
        }
    }

    [propName: string]: any;
}

const db: any = new Databases()

export default db
