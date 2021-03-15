const express = require('express');
const cors = require('cors');

const { v4: uuid } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(user => user.username === username);
  if (!username) {
    return response.status(400).json({ error: 'Invalid username' });
  }
  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }
  request.username = username;
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const findUser = users.some(user => user.username === username);
  if (findUser) {
    return response.status(400).json({ error: 'User already exists' });
  }
  const user = { id: uuid(), name, username, todos: [] }
  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const user = users.find(user => user.username === username);
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request;
  if (!title && !deadline) {
    return response.status(400).json({ error: 'Title and deadline are required' });
  }

  const user = users.find(user => user.username === username);
  const newTodo = { id: uuid(), title, done: false, deadline, created_at: new Date() }
  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { username } = request;
  if (!title && !deadline && !id) {
    return response.status(400).json({ error: 'Id, title and deadline are required' });
  }

  const { todos } = users.find(user => user.username === username);
  const todo = todos.find(todo => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: `Todo doesn't exist` })
  }
  todo.title = title;
  todo.deadline = deadline;
  return response.status(200).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request;
  if (!id) {
    return response.status(400).json({ error: 'Id is required' });
  }

  const user = users.find(user => user.username === username);
  const todo = user.todos.find(todo => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: `Todo doesn't exist` })
  }
  todo.done = true;
  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request;
  if (!id) {
    return response.status(400).json({ error: 'Id is required' });
  }
  const user = users.find(user => user.username === username);
  const todo = user.todos.find(todo => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: `Todo doesn't exist` })
  }
  user.todos.splice(todo, 1);
  return response.status(204).send();
});

module.exports = app;