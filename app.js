const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());
const format = require("date-fns/format");
const parse = require("date-fns/parse");
const isValid = require("date-fns/isValid");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const containStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const containPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const containPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const containCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const containCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const containCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const validStatus = (status) => {
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  return statusArray.includes(status);
};

const validPriority = (priority) => {
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  return priorityArray.includes(priority);
};

const validCategory = (category) => {
  const categoryArray = ["WORK", "HOME", "LEARNING"];
  return categoryArray.includes(category);
};

const convertJsonToObjectResponse = (jsonObject) => {
  return {
    id: jsonObject.id,
    todo: jsonObject.todo,
    priority: jsonObject.priority,
    category: jsonObject.category,
    status: jsonObject.status,
    dueDate: jsonObject.due_date,
  };
};

//GET Todo API

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let getTodoQuery = "";
  let data = null;
  let hasCategoty = false;
  let hasPriority = false;
  let hasStatus = false;
  //const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  //const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  //const categoryArray = ["WORK", "HOME", "LEARNING"];
  switch (true) {
    case containStatusProperty(request.query):
      if (validStatus(status)) {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' AND todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case containPriorityProperty(request.query):
      if (validPriority(priority)) {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case containCategoryAndStatusProperties(request.query):
      //hasCategory = categoryArray.includes(category);
      //hasStatus = statusArray.includes(status);
      if (validCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (validStatus(status)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}' AND todo LIKE '%${search_q}%';`;
      }
      break;
    case containPriorityAndStatusProperties(request.query):
      if (validPriority(priority) && validStatus(status)) {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}' AND todo LIKE '%${search_q}%';`;
      } else if (validStatus(status)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (validPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case containCategoryProperty(request.query):
      if (validCategory(category)) {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case containCategoryAndPriorityProperties(request.query):
      //hasCategory = categoryArray.includes(category);
      //hasPriority = priorityArray.includes(priority);
      if (validCategory(category) && validPriority(priority)) {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}' AND todo LIKE '%${search_q}';`;
      } else if (validPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (validCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data.map((todo) => convertJsonToObjectResponse(todo)));
});
//GET Todo API
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoArray = await db.get(getTodoQuery);
  response.send(convertJsonToObjectResponse(todoArray));
});
//GET Todo API On Date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateObj = new Date(date);
  //console.log(dateObj);
  //console.log(typeof dateObj);
  //

  //console.log(formattedDate);
  //console.log(typeof formattedDate);
  //console.log(isValid(dateObj));
  //const isValidDate = isValid(formattedDate);
  //console.log(isValidDate);
  if (isValid(dateObj)) {
    const formattedDate = format(dateObj, "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${formattedDate}';`;
    const todoArray = await db.all(getTodoQuery);
    response.send(convertJsonToObjectResponse(todoArray));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//POST Todo API
app.post("/todos/", async (request, response) => {
  const newTodo = request.body;
  const { id, todo, priority, status, category, dueDate } = newTodo;
  const date = new Date(dueDate);
  if (validStatus(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (validPriority(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (validCategory(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(date) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const postTodoQuery = `INSERT INTO todo (id,todo,category,priority,status,due_date)
        VALUES (
            ${id},
            '${todo}',
            '${category}',
            '${priority}',
            '${status}',
            '${dueDate}'
            );`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  }
});
//PUT Todo API
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const newTodo = request.body;
  let updateColumn = "";
  if (newTodo.status !== undefined) {
    updateColumn = "Status";
  } else if (newTodo.priority !== undefined) {
    updateColumn = "Priority";
  } else if (newTodo.todo !== undefined) {
    updateColumn = "Todo";
  } else if (newTodo.category !== undefined) {
    updateColumn = "Category";
  } else if (newTodo.dueDate !== undefined) {
    updateColumn = "Due Date";
  }
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodoArray = await db.get(getTodoQuery);
  const {
    todo = previousTodoArray.todo,
    status = previousTodoArray.status,
    priority = previousTodoArray.priority,
    category = previousTodoArray.category,
    dueDate = previousTodoArray.due_date,
  } = request.body;
  if (validStatus(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (validPriority(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (validCategory(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(newTodo.dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const updateTodoQuery = `
    UPDATE todo
    SET 
       todo='${todo}',
       status='${status}',
       priority='${priority}',
       category='${category}',
       due_date='${dueDate}'
    WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
});
//DELETE Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
