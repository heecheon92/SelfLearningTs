const routes: Record<string, {}> = {
  "/": {},
  "/users": {},
  "/admin/users": {},
};

/* No error!
  someRandomField is assumed to be a valid member of routes
  as routes is a Record<string, {}> type in which
  any undefined member can be accessed as {}.
*/
routes.someRandomField;

const routes2 = {
  "/": {},
  "/users": {},
  "/admin/users": {},
} satisfies Record<string, {}>;

/* Error!
  someRandomField is not assumed to be a valid member of routes2
  as routes2 is a not a type of Record<string, {}> type.
  
  routes2 is a type of { [x: string]: {} } type or object literal.
  To be more specific, routes2 is a type of:

  const routes2: {
    "/": {};
    "/users": {};
    "/admin/users": {};
  }

  which does not have a member named someRandomField.
*/
routes2.someRandomField;
