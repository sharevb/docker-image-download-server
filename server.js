import express from "express";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import cors from "cors";

const app = express();
const CORS = process.env.CORS || "*"; 
const HOST = process.env.HOST || "0.0.0.0"; 
const PORT = parseInt(process.env.PORT || "3000", 10); 

const VALID_PLATFORMS = new Set([
  "linux/amd64",
  "linux/arm64",
  "linux/arm/v7",
  "linux/arm/v6",
  "linux/ppc64le",
  "linux/s390x",
  "windows/amd64"
]);

// Parse env vars
function parseList(value, fallback) {
  if (!value) return fallback;
  if (value === "*") return "*";
  return value.split(",").map(v => v.trim());
}

// --- CORS configuration ---
app.use(cors({
  origin: parseList(CORS, "*"),
  methods: ["GET"],         // your service only exposes GET /download
  allowedHeaders: ["*"],    // allow all headers
  exposedHeaders: ["Content-Disposition"], // needed so browser can read filename
}));


app.get("/download", async (req, res) => {
  const image = req.query.image;
  const platform = req.query.platform;
  const registry = req.query.registry; // optional
  const username = req.query.username;
  const password = req.query.password;
  const clean = req.query.clean;

  if (!image) {
    res.status(400).send("Missing ?image=<name:tag>");
    return;
  }

  if (platform && !VALID_PLATFORMS.has(platform)) {
    res.status(400).send("Invalid platform");
    return;
  }

  const id = randomUUID();
  const tarPath = path.join("/tmp", `docker-image-${id}.tar`);

  try {
    // Optional: login
    if (username && password) {
      const loginArgs = ["login", "-u", username, "--password-stdin"];
      if (registry) loginArgs.push(registry);

      await runCommandWithInput("docker", loginArgs, password + "\n");
    }

    // Pull
    const pullArgs = ["pull"];
    if (platform) pullArgs.push("--platform", platform);
    pullArgs.push(image);

    await runCommand("docker", pullArgs);

    // Save
    await runCommand("docker", ["save", "-o", tarPath, image]);

    // Stream tarball
    res.setHeader("Content-Type", "application/x-tar");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${image.replace(/[/:]/g, "_")}.tar"`
    );

    const stream = fs.createReadStream(tarPath);
    stream.pipe(res);

    stream.on("close", async () => {
      // Cleanup tarball
      fs.unlink(tarPath, () => {});

      if (clean) {
        // Remove the image
        await runCommand("docker", ["image", "rm", image]);

        // Prune dangling layers
        await runCommand("docker", ["image", "prune", "-f"]);
      }

      // Optional: logout
      if (username && password) {
        await runCommand("docker", ["logout", registry || ""]);
      }
    });
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
});

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);

    child.stdout.on("data", (data) => process.stdout.write(data));
    child.stderr.on("data", (data) => process.stderr.write(data));

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function runCommandWithInput(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);

    child.stdin.write(input);
    child.stdin.end();

    child.stdout.on("data", (data) => process.stdout.write(data));
    child.stderr.on("data", (data) => process.stderr.write(data));

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
