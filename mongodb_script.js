db.createUser({
  user: "Mike",
  pwd: "teamway",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase"]
}
)