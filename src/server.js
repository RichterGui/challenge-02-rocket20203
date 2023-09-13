import express from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());

const users = [];

const payload = { userId: 123 };
const secretKey = "secret123";
const fixToken = jwt.sign(payload, secretKey, { expiresIn: "1h" });

//middleware
function verifyToken(req, res, next) {
  // Obtenha o token do cabeçalho da solicitação
  const token = fixToken;

  // Verifique se o token está presente
  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  // Verifique e decodifique o token JWT
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido" });
    }

    // O token é válido, você pode armazenar os dados do usuário no objeto req para uso posterior, se necessário
    req.user = decoded;
    next();
  });
}

//api

app.post("/user", verifyToken, (req, res) => {
  const { name, email } = req.body;

  const user = {
    id: crypto.randomUUID(),
    name: name,
    email: email,
    diet: [],
  };

  users.push(user);
  return res.json(user).status(201);
});

app.get("/user/:id", verifyToken, (req, res) => {
  const id = req.params.id;

  const user = users.find((e) => e.id === id);

  if (user) {
    return res.json(user);
  } else {
    return res.sendStatus(404);
  }
});

app.get("/users", verifyToken, (req, res) => {
  return res.json(users);
});

app.post("/user/:id/diet", verifyToken, (req, res) => {
  const { name, description, time, onDiet } = req.body;

  const meal = {
    mealId: crypto.randomUUID(),
    name: name,
    description: description,
    time: time,
    onDiet: onDiet,
  };

  const id = req.params.id;

  const user = users.find((e) => e.id === id);

  user.diet.push(meal);

  return res.json(meal).sendStatus(201);
});

app.get("/user/:id/diet", verifyToken, (req, res) => {
  const id = req.params.id;

  const user = users.find((e) => e.id === id);

  if (user) {
    return res.json(user.diet).sendStatus(200);
  } else {
    return res.send("user not found").status(404);
  }
});

app.put("/user/:id/diet/:mealId", verifyToken, (req, res) => {
  const { name, description, time, onDiet } = req.body;
  const id = req.params.id;
  const mealId = req.params.mealId;

  const user = users.find((e) => e.id === id);

  if (user) {
    const meal = user.diet.find((e) => e.mealId === mealId);

    if (!meal) {
      return send("Meal id not found").status(404);
    }

    if (meal) {
      if (name != null || name != undefined) {
        meal.name = name;
      }
      if (description != null || description != undefined) {
        meal.description = description;
      }
      if (time != null || time != undefined) {
        meal.time = time;
      }
      if (onDiet != null || onDiet != undefined) {
        meal.onDiet = onDiet;
      }
      return res.json(meal).status(200);
    }
  } else {
    return send("User not found").status(404);
  }
});

app.delete("/user/:id/diet/:mealId", verifyToken, (req, res) => {
  const id = req.params.id;
  const mealId = req.params.mealId;

  const user = users.find((e) => e.id === id);

  const table = user.diet;

  const index = table.indexOf(table.find((e) => e.mealId === mealId));

  table.splice(index, 1);

  return res.send("successfully deleted").status(200);
});

app.get("/user/:id/diet/:mealId", verifyToken, (req, res) => {
  const id = req.params.id;
  const mealId = req.params.mealId;

  const user = users.find((e) => e.id === id);

  const table = user.diet;

  const mealById = table.find((e) => e.mealId === mealId);

  if (mealById) {
    return res.json(mealById).status(200);
  } else {
    return res.send("Not Found").status(404);
  }
});

app.get("/user/:id/metrics", verifyToken, (req, res) => {
  const id = req.params.id;
  const user = users.find((e) => e.id === id);

  const table = user.diet;

  const metrics = getMetrics(table);

  return res.json(metrics).status(200);
});

function getMetrics(array) {
  let numberOfMeals = array.length;
  let numberOfMealsOnDiet = 0;
  let numberOfMealsOffDiet = 0;
  let currentSequence = 0;
  let bestSequence = 0;

  for (let i = 0; i < array.length; i++) {
    if (array[i].onDiet) {
      numberOfMealsOnDiet++;
      currentSequence++;
      bestSequence = Math.max(bestSequence, currentSequence);
    } else {
      numberOfMealsOffDiet++;
      currentSequence = 0;
    }
  }

  const metrics = {
    numberOfMeals: numberOfMeals,
    numberOfMealsOnDiet: numberOfMealsOnDiet,
    numberOfMealsOffDiet: numberOfMealsOffDiet,
    bestSequence: bestSequence,
  };

  return metrics;
}

app.listen(3333, () => console.log("listening on 3333"));
