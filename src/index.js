const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const storedUser = users.find(user => user.username === username);

  if (!storedUser) {
    return response.status(400).json({ error: 'User not found.'})
  }

  request.user = storedUser;

  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const isUsernameTaken = users.some(user => user.username === username);

  if (isUsernameTaken) {
    return response.status(400).json({ error: `Username ${username} is taken.`})
  }

  const newUser = {
    name, 
    username,
    id: uuidv4(),
    todos: []
  }

  users.push(newUser);

  response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    title,
    deadline: new Date(deadline),
    done: false,
    id: uuidv4(),
    created_at: new Date()
  }

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);

});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = user.todos.find(todo => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: 'Todo not found'})
  }

  todo.title = title;
  todo.deadline = deadline;

  response.status(201).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find(todo => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: 'Todo not found.'})
  }

  todo.done = true;

  return response.status(201).json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  if (todoIndex < 0) {
    return response.status(404).json({ error: 'Todo not found.'})
  }

  user.todos.splice(todoIndex, 1)

  return response.status(204).send();
});

module.exports = app;