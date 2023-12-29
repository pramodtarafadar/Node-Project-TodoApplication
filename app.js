const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
const { isMatch } = require("date-fns");

const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToCamelCase = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

const checkStatusQuery = (queries) => {
  return queries.status !== undefined;
};

const validateStatusQuery = (status) => {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return true;
  }
  return false;
};

const checkPriorityQuery = (queries) => {
  return queries.priority !== undefined;
};

const validatePriorityQuery = (priority) => {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return true;
  }
  return false;
};

const checkCategoryQuery = (queries) => {
  return queries.category !== undefined;
};

const validateCategoryQuery = (category) => {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return true;
  }
  return false;
};

const validateDateQuery = (queries) => {
  return isMatch(queries.date, "yyyy-MM-dd");
};

// Get ToDos Using Query API 1
app.get("/todos/", async (request, response) => {
  const requestQueries = request.query;
  const { status, priority, search_q = "", category } = requestQueries;
  const requestQueriesLength = Object.keys(requestQueries).length;
  switch (true) {
    case checkStatusQuery(requestQueries) && requestQueriesLength === 1:
      if (validateStatusQuery(status)) {
        const getTodoUSingStatus = `
        SELECT *
        FROM
            todo
        WHERE status LIKE '${status}';`;
        const todoArray = await db.all(getTodoUSingStatus);
        response.send(
          todoArray.map((eachTodo) => {
            return convertToCamelCase(eachTodo);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case checkPriorityQuery(requestQueries) && requestQueriesLength === 1:
      if (validatePriorityQuery(priority)) {
        const getTodoUSingPriority = `
        SELECT *
        FROM
            todo
        WHERE priority LIKE '${priority}';`;
        const todoArray = await db.all(getTodoUSingPriority);
        response.send(
          todoArray.map((eachTodo) => {
            return convertToCamelCase(eachTodo);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case checkPriorityQuery(requestQueries) && checkStatusQuery(requestQueries):
      if (validatePriorityQuery(priority) && validateStatusQuery(status)) {
        const getTodoUSingPriorityAndStatus = `
        SELECT *
        FROM
            todo
        WHERE priority LIKE '${priority}'
            AND status LIKE '${status}';`;
        const todoArray = await db.all(getTodoUSingPriorityAndStatus);
        response.send(
          todoArray.map((eachTodo) => {
            return convertToCamelCase(eachTodo);
          })
        );
      } else {
        let invalidQuery = "";
        if (validatePriorityQuery(priority) === false) {
          invalidQuery = "Priority";
        } else {
          invalidQuery = "Status";
        }
        response.status(400);
        response.send(`Invalid Todo ${invalidQuery}`);
      }
      break;
    case checkCategoryQuery(requestQueries) && checkStatusQuery(requestQueries):
      if (validateCategoryQuery(category) && validateStatusQuery(status)) {
        const getTodoUSingCategoryAndStatus = `
        SELECT *
        FROM
            todo
        WHERE category LIKE '${category}'
            AND status LIKE '${status}';`;
        const todoArray = await db.all(getTodoUSingCategoryAndStatus);
        response.send(
          todoArray.map((eachTodo) => {
            return convertToCamelCase(eachTodo);
          })
        );
      } else {
        let invalidQuery = "";
        if (validateCategoryQuery(category) === false) {
          invalidQuery = "Category";
        } else {
          invalidQuery = "Status";
        }
        response.status(400);
        response.send(`Invalid Todo ${invalidQuery}`);
      }
      break;
    case checkCategoryQuery(requestQueries) && requestQueriesLength === 1:
      console.log(category);
      if (validateCategoryQuery(category)) {
        const getTodoUSingCategory = `
        SELECT *
        FROM
            todo
        WHERE category LIKE '${category}';`;
        const todoArray = await db.all(getTodoUSingCategory);
        response.send(
          todoArray.map((eachTodo) => {
            return convertToCamelCase(eachTodo);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case checkCategoryQuery(requestQueries) &&
      checkPriorityQuery(requestQueries):
      if (validateCategoryQuery(category) && validatePriorityQuery(priority)) {
        const getTodoUSingCategoryAndPriority = `
        SELECT *
        FROM
            todo
        WHERE category LIKE '${category}'
            AND priority LIKE '${priority}';`;
        const todoArray = await db.all(getTodoUSingCategoryAndPriority);
        response.send(
          todoArray.map((eachTodo) => {
            return convertToCamelCase(eachTodo);
          })
        );
      } else {
        let invalidQuery = "";
        if (validateCategoryQuery(category) === false) {
          invalidQuery = "Category";
        } else {
          invalidQuery = "Priority";
        }
        response.status(400);
        response.send(`Invalid Todo ${invalidQuery}`);
      }
      break;
    default:
      const getTodoUSingSearchQuery = `
        SELECT *
        FROM
            todo
        WHERE todo LIKE '%${search_q}%';`;
      const todoArray = await db.all(getTodoUSingSearchQuery);
      response.send(
        todoArray.map((eachTodo) => {
          return convertToCamelCase(eachTodo);
        })
      );
      break;
  }
});

// Get ToDo API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM
        todo
    WHERE
        id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertToCamelCase(todo));
});

// Get agenda API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (validateDateQuery(request.query)) {
    const inputDate = new Date(date);
    const formattedDate = format(inputDate, "yyyy-MM-dd");
    const getDueDateTodosQuery = `
    SELECT *
    FROM todo
    WHERE
        due_date = '${formattedDate}';`;
    const dueDateTodoArray = await db.all(getDueDateTodosQuery);
    response.send(
      dueDateTodoArray.map((eachTodo) => {
        return convertToCamelCase(eachTodo);
      })
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// Post Todo API 4
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (
    validatePriorityQuery(priority) &&
    validateStatusQuery(status) &&
    validateCategoryQuery(category) &&
    isMatch(dueDate, "yyyy-MM-dd")
  ) {
    const inputDate = new Date(todoDetails.dueDate);
    const formattedDate = format(inputDate, "yyyy-MM-dd");
    const addTodoQuery = `
      INSERT INTO todo(id, todo, priority, status, category, due_date)
      VALUES
        (${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${formattedDate}');`;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    if (validatePriorityQuery(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (validateStatusQuery(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (validateCategoryQuery(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (isMatch(dueDate, "yyyy-MM-dd") === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

// Update Todo API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  switch (true) {
    case checkStatusQuery(todoDetails):
      if (validateStatusQuery(todoDetails.status)) {
        const updateTodo = `
        UPDATE todo
        SET status = '${todoDetails.status}'
        WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case checkPriorityQuery(todoDetails):
      if (validatePriorityQuery(todoDetails.priority)) {
        const updateTodo = `
        UPDATE todo
        SET priority = '${todoDetails.priority}'
        WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case checkCategoryQuery(todoDetails):
      if (validateCategoryQuery(todoDetails.category)) {
        const updateTodo = `
        UPDATE todo
        SET category = '${todoDetails.category}'
        WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case todoDetails.dueDate !== undefined:
      if (isMatch(todoDetails.dueDate, "yyyy-MM-dd")) {
        const inputDate = new Date(todoDetails.dueDate);
        const formattedDate = format(inputDate, "yyyy-MM-dd");
        const updateTodo = `
        UPDATE todo
        SET due_date = '${formattedDate}'
        WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      const updateTodo = `
        UPDATE todo
        SET todo = '${todoDetails.todo}'
        WHERE id = ${todoId};`;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;
  }
});

//Delete Todo API 6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
