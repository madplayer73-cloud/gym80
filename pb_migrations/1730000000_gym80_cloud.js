migrate((app) => {
  const users = new Collection({
    name: "users",
    type: "auth",
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    createRule: "",
    updateRule: "id = @request.auth.id",
    deleteRule: "id = @request.auth.id",
    fields: [
      {
        name: "name",
        type: "text",
        required: false
      }
    ],
    passwordAuth: {
      enabled: true,
      identityFields: ["email"]
    }
  });

  app.save(users);

  const userData = new Collection({
    name: "user_data",
    type: "base",
    listRule: "owner = @request.auth.id",
    viewRule: "owner = @request.auth.id",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "owner = @request.auth.id",
    deleteRule: "owner = @request.auth.id",
    fields: [
      {
        name: "owner",
        type: "relation",
        required: true,
        unique: true,
        options: {
          collectionId: users.id,
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: ["email"]
        }
      },
      {
        name: "data",
        type: "json",
        required: true
      }
    ]
  });

  app.save(userData);
}, (app) => {
  const userData = app.findCollectionByNameOrId("user_data");
  app.delete(userData);

  const users = app.findCollectionByNameOrId("users");
  app.delete(users);
});
