// Node lädt TypeScript seit v22 direkt (Typen werden beim Laden entfernt),
// besteht in ESM aber auf Dateiendungen. Unser Quellcode importiert wie in
// Next üblich ohne Endung ("./serviceFee"). Dieser Hook ergänzt sie — nur
// für die Tests, der Build läuft weiter über Next.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      import { existsSync } from "node:fs";
      import { fileURLToPath } from "node:url";
      export async function resolve(specifier, context, next) {
        if (specifier.startsWith("./") || specifier.startsWith("../")) {
          try {
            return await next(specifier, context);
          } catch (err) {
            if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err;
            for (const ext of [".ts", ".tsx", "/index.ts"]) {
              const candidate = new URL(specifier + ext, context.parentURL);
              if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
            }
            throw err;
          }
        }
        return next(specifier, context);
      }
    `),
  pathToFileURL("./")
);
