import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// const connection = await mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   database: "mapogram",
//   password:'',
//   port:'3306'  
// });

const connection = await mysql.createConnection({
  host: "68.178.163.247",
  user: "devuser_doutya_website_user",
  database: "devuser_mapogram",
  password:'Wowfy#user',
  port:'3306',
});

export const db = drizzle(connection);
