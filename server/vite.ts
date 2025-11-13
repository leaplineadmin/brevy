import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try multiple possible paths for the build directory
  const possiblePaths = [
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "public"),
    path.resolve(__dirname, "..", "client", "dist"),
    path.resolve(__dirname, "..", "client", "public")
  ];

  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      console.log('✅ Found build directory:', distPath);
      break;
    }
  }

  if (!distPath) {
    console.error('❌ No build directory found. Tried paths:');
    possiblePaths.forEach(p => console.error('  -', p));
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(', ')}`,
    );
  }

  // List files in the directory for debugging
  try {
    const files = fs.readdirSync(distPath);
    console.log('📂 Files in build directory:', files.slice(0, 10), files.length > 10 ? '...' : '');
  } catch (error) {
    console.error('❌ Error reading build directory:', error);
  }

  // Serve static files with explicit MIME type handling
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      console.log('🔍 Serving file:', filePath);
      
      // Force correct MIME types for JavaScript files
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        console.log('✅ Set JS MIME type for:', filePath);
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        console.log('✅ Set CSS MIME type for:', filePath);
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache');
        console.log('✅ Set HTML MIME type for:', filePath);
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
        console.log('✅ Set JSON MIME type for:', filePath);
      }
    }
  }));

  // Special handler for JavaScript files to ensure they're never served as HTML
  app.get('*.js', (req, res, next) => {
    const filePath = path.join(distPath, req.path);
    console.log('🎯 JS file requested:', req.path, '->', filePath);
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      console.log('✅ Serving JS file with correct MIME type:', req.path);
      res.sendFile(filePath);
    } else {
      console.error('❌ JS file not found:', filePath);
      res.status(404).send('JavaScript file not found');
    }
  });

  // Special middleware to prevent JS files from being served as HTML
  app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
      const filePath = path.join(distPath, req.path);
      console.log('🚨 JS file fallback detected:', req.path);
      
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        console.log('✅ Force serving JS file:', req.path);
        return res.sendFile(filePath);
      } else {
        console.error('❌ JS file not found in fallback:', filePath);
        return res.status(404).send('JavaScript file not found');
      }
    }
    next();
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    console.log('🔄 Fallback to index.html for:', req.originalUrl);
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('❌ index.html not found at:', indexPath);
      res.status(404).send('Page not found');
    }
  });
}