export default {
  schema: "./utils/schema/**/*.{js,ts}", // ✅ Load all files recursively
    dialect: 'mysql',
    dbCredentials: {
        host: "68.178.163.247",
        user: "devuser_doutya_website_user",
        database: "devuser_mapogram",
        password: "Wowfy#user"
    }
};

// export default {
//   schema: "./utils/schema/**/*.{js,ts}", // ✅ Load all files recursively
//   dialect: "mysql",
//   dbCredentials: {
//     host: "localhost",
//     user: "root",
//     database: "mapogram",
//   },
// };