const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
};

initilizeDBAndServer();

const checkRequestQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;

  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryInArray = categoryArray.includes(category);
    if (categoryInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityInArray = priorityArray.includes(priority);
    if (priorityInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Ivalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "DONE", "IN PROGRESS"];
    const statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);

      const formatedDate = format(new Date(date), "yyyy-mm-dd");
      console.log(formatedDate, "f");
      const result = toDate(
        new date(
          `${myDate.getFullYear()}-${
            myDate.getFullMonth() + 1
          }-${myDate.getFullDate()}`
        )
      );

      console.log(result, "r");
      console.log(new Date(), "new");

      const isValidDate = await isValid(result);
      console.log(isValidDate, "V");
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryInArray = categoryArray.includes(category);
    if (categoryInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityInArray = priorityArray.includes(priority);
    if (priorityInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Ivalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "DONE", "IN PROGRESS"];
    const statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new date(dueDate), "yyyy-mm-dd");
      console.log(formatedDate);

      const result = todate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);

      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todo = todo;
  request.id = id;

  request.todoId = todoId;
  next();
};

//GET todos API 1

app.get("/todos/", checkRequestQueries, async (request, response) => {
  const { status = "", category = "", priority = "", search_q = "" } = request;

  console.log(status, search_q, priority, category);

  const getTodosQuery = `
    SELECT
    id,
    todo,priority, status, category, due_date AS dueDate
    FROM todo
    WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
    AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todosArray = await db.all(getTodosQuery);
  response.send(todosArray);
});

//GET Todo API 2
app.get("/todos/:todoId", checkRequestQueries, async (request, response) => {
  const { todoId } = request;

  const todoQuery = `
    SELECT id, 
    todo, priority, status, category, due_date AS dueDate
    FROM todo
    WHERE id = ${todoId};`;

  const todo = await db.get(todoQuery);
  response.send(todo);
});

//GET Agenda API 3
app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request;
  console.log(date, "a");

  const dueDateQuery = `
    SELECT id, todo, priority, status, category, due_date AS dueDate
    FROM todo WHERE due_date = '${date}';`;

  const todosArray = await db.all(dueDateQuery);
  if (todosArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(todosArray);
  }
});

//Add Todo API 4
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;

  const addTodoQuery = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    Values(
        ${id},
        '${todo}',
        '${prioriy}',
        '${status}',
        '${category}',
        '${dueDate}'
    );`;

  const createUser = await db.run(addTodoQuery);
  console.log(createUser);
  response.send("Todo Successfully Added");
});

//Update Todo API 5
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request;
  const { priority, todo, status, category, dueDate } = request;

  let updateTodoQuery = null;

  console.log(priority, todo, status, category, dueDate);

  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE todo
            SET status = '${status}'
            WHERE id = '${todoID}';`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");

      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE todo 
            SET priority = '${priority}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");

      break;

    case todo !== undefined:
      updateTodoQuery = `
            UPDATE todo 
            SET todo = '${todo}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");

      break;

    case category !== undefined:
      updateTodoQuery = `
            UPDATE todo 
            SET category = '${category}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");

      break;

    case dueDate !== undefined:
      updateTodoQuery = `
            UPDATE todo 
            SET due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");

      break;
  }
});

//Delete Todo API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;

  await db.run(deleteTodoQuery);

  response.send("Todo Deleted");
});

module.exports = app;
