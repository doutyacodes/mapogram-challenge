export default {
  schema: "./utils/schema/**/*.{js,ts}", // ✅ Load all files recursively
  dialect: "mysql",
  dbCredentials: {
    host: "68.178.163.247",
    user: "devuser_mapogram_challenges",
    database: "devuser_mapogram_challenges",
    password: "devuser_mapogram_challenges",
  },
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
