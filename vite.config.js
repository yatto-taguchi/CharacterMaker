import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export default defineConfig({
  plugins: [
    {
      name: 'ai-integration-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/save-state' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                // Save the received state to workspace_state.json
                const filePath = path.resolve(__dirname, 'workspace_state.json');
                fs.writeFileSync(filePath, body);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                console.error('Error saving state:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url === '/api/save-full-state' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const filePath = path.resolve(__dirname, 'full_state.json');
                fs.writeFileSync(filePath, body);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                console.error('Error saving full state:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url === '/api/create-char-folder' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const { folderName } = JSON.parse(body);
                const dirPath = path.resolve(__dirname, 'references', folderName);
                if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, folderPath: `references/${folderName}/` }));
              } catch (err) {
                console.error(err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url === '/api/upload-ref' && req.method === 'POST') {
            let body = '';
            // For large images, we need to handle potential chunking properly, but for simple base64 JSON, string appending works if not too huge.
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const { folderName, fileName, base64Data } = JSON.parse(body);
                const dirPath = path.resolve(__dirname, 'references', folderName);
                if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                }
                const filePath = path.resolve(dirPath, fileName);
                
                // Remove data:image/png;base64, prefix
                const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
                fs.writeFileSync(filePath, base64, 'base64');
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, filePath: `references/${folderName}/${fileName}` }));
              } catch (err) {
                console.error(err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url === '/api/latest-images' && req.method === 'GET') {
            try {
              const refsDir = path.resolve(__dirname, 'references');
              let images = [];
              
              function walkDir(dir) {
                if (!fs.existsSync(dir)) return;
                const files = fs.readdirSync(dir);
                for (const file of files) {
                  const fullPath = path.join(dir, file);
                  const stat = fs.statSync(fullPath);
                  if (stat.isDirectory()) {
                    walkDir(fullPath);
                  } else if (/\.(png|jpg|jpeg|webp)$/i.test(file)) {
                    // Make path relative to workspace root with forward slashes
                    const relPath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
                    images.push({
                      path: relPath,
                      mtime: stat.mtimeMs
                    });
                  }
                }
              }
              
              walkDir(refsDir);
              
              // Sort by descending modified time and limit to 20
              images.sort((a, b) => b.mtime - a.mtime);
              images = images.slice(0, 20);
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, images }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else if (req.url === '/api/open-folder' && req.method === 'POST') {
            try {
              const refsDir = path.resolve(__dirname, 'references');
              // Windows specific command to open folder
              exec(`start "" "${refsDir}"`);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              console.error('Failed to open folder:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ]
});
