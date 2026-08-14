migrate((app) => {
  const collection = new Collection({
    name: "single_app_data",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: null,
    fields: [
      {
        name: "key",
        type: "text",
        required: true,
        unique: true
      },
      {
        name: "data",
        type: "json",
        required: true
      }
    ]
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("single_app_data");
  app.delete(collection);
});
